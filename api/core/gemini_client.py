import json
import os
import re
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load .env from the api/ directory (one level above core/)
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

# ---------------------------------------------------------------------------
# Model fallback chain
# ---------------------------------------------------------------------------

_MODEL_CHAIN: list[str] = [
    "models/gemini-2.5-flash",
    "models/gemini-2.0-flash",
    "models/gemini-2.0-flash-lite",
]

# ---------------------------------------------------------------------------
# Load all available API keys (GEMINI_API_KEY_1, _2, _3, ...)
# ---------------------------------------------------------------------------

_keys: list[str] = []
for _i in range(1, 20):  # support up to 19 keys
    _val = os.getenv(f"GEMINI_API_KEY_{_i}")
    if _val and _val.strip():
        _keys.append(_val.strip())

if not _keys:
    # Fallback to bare GEMINI_API_KEY if no numbered keys exist
    _single = os.getenv("GEMINI_API_KEY", "").strip()
    if _single:
        _keys.append(_single)

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _http_code(exc: Exception) -> int | None:
    """Extract HTTP status code from a google-genai exception."""
    # Prefer structured attribute (google.genai >=0.5)
    for attr in ("code", "status_code", "http_status"):
        val = getattr(exc, attr, None)
        if isinstance(val, int):
            return val
    # Fall back to parsing the string representation
    msg = str(exc)
    for code in (429, 503, 500, 400, 401, 403):
        if str(code) in msg:
            return code
    return None


def _strip_fences(text: str) -> str:
    """Remove markdown code fences (``` or ```json etc.)."""
    lines = [ln for ln in text.splitlines() if not ln.strip().startswith("```")]
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Public: generate
# ---------------------------------------------------------------------------


def generate(prompt: str, temperature: float = 0.8, max_tokens: int = 4000) -> str:
    """
    Try each API key in order. For each key, walk the model chain.
    - 429 (rate limit)   → skip remaining models, move to next key immediately
    - 503 (unavailable)  → skip this model, try next model on same key
    - other error        → skip this model, try next model on same key
    """
    if not _keys:
        raise RuntimeError(
            "No Gemini API keys found. Add GEMINI_API_KEY_1 (and optionally "
            "GEMINI_API_KEY_2, GEMINI_API_KEY_3) to api/.env"
        )

    attempts: list[str] = []

    for key_idx, api_key in enumerate(_keys):
        client = genai.Client(api_key=api_key)
        label = f"key-{key_idx + 1}"

        for model in _MODEL_CHAIN:
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=temperature,
                        max_output_tokens=max_tokens,
                    ),
                )
                print(f"[gemini] ok   {label} / {model}")
                return response.text

            except Exception as exc:
                code = _http_code(exc)
                short = str(exc)[:120].replace("\n", " ")

                if code == 429:
                    print(f"[gemini] 429  {label} / {model} — rate limited, trying next key")
                    attempts.append(f"{label}/{model}: 429 rate-limited")
                    break  # stop trying models on this key

                elif code == 503:
                    print(f"[gemini] 503  {label} / {model} — unavailable, trying next model")
                    attempts.append(f"{label}/{model}: 503 unavailable")
                    # continue to next model

                else:
                    print(f"[gemini] err  {label} / {model} — {short}")
                    attempts.append(f"{label}/{model}: {short}")
                    # continue to next model

    raise RuntimeError(
        "All Gemini API keys and models exhausted.\n"
        "Attempts:\n" + "\n".join(f"  {a}" for a in attempts)
    )


# ---------------------------------------------------------------------------
# Public: generate_json
# ---------------------------------------------------------------------------


def _clean_json_str(s: str) -> str:
    s = re.sub(r',\s*\]', ']', s)
    s = re.sub(r',\s*\}', '}', s)
    if s.strip().startswith('[') and not s.strip().endswith(']'):
        s = s.rstrip().rstrip(',') + ']'
    if s.strip().startswith('{') and not s.strip().endswith('}'):
        s = s.rstrip().rstrip(',') + '}'
    return s


def generate_json(
    prompt: str, temperature: float = 0.8, max_tokens: int = 4000
) -> Any:
    """
    Call generate(), strip markdown fences, extract the first JSON
    array or object, and return the parsed Python value.
    Raises ValueError (with the raw response) if parsing fails.
    """
    raw = generate(prompt, temperature=temperature, max_tokens=max_tokens)
    text = _strip_fences(raw).strip()

    # Determine whether to look for an array or object first
    array_pos  = text.find("[")
    object_pos = text.find("{")

    if array_pos == -1 and object_pos == -1:
        raise ValueError(f"No JSON found in Gemini response:\n{raw}")

    # Pick the delimiter that appears first in the text
    if array_pos != -1 and (object_pos == -1 or array_pos < object_pos):
        opener, closer = "[", "]"
        start, end = array_pos, text.rfind("]") + 1
    else:
        opener, closer = "{", "}"
        start, end = object_pos, text.rfind("}") + 1

    # end <= start means the closing delimiter is missing (truncated response)
    json_str = text[start:] if end <= start else text[start:end]
    json_str = _clean_json_str(json_str)

    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        # Attempt repair: append the missing closing delimiter
        repaired = _clean_json_str(json_str + closer)
        try:
            return json.loads(repaired)
        except json.JSONDecodeError as exc:
            try:
                objects = re.findall(r'\{[^{}]+\}', json_str, re.DOTALL)
                if objects:
                    salvaged = []
                    for obj_str in objects:
                        try:
                            salvaged.append(json.loads(obj_str))
                        except Exception:
                            continue
                    if salvaged:
                        return salvaged
            except Exception:
                pass

            raise ValueError(
                f"JSON parse error: {exc}\nExtracted string:\n{json_str}"
            ) from exc
