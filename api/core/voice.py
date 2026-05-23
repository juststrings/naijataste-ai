import json
import random
from pathlib import Path
from typing import Optional

# ---------------------------------------------------------------------------
# Tone mapping: rating_tendency values → few_shot_master.json tone values
# Fixes: build_review_prompt() was passing rating_tendency ("harsh"/"balanced"/
# "generous") directly as the tone filter, but few_shot_master.json stores
# tone as "pidgin-heavy"/"formal"/"mixed"/"casual" — those never matched.
# ---------------------------------------------------------------------------

TENDENCY_TO_TONE: dict[str, list[str]] = {
    "harsh":     ["pidgin-heavy", "formal"],
    "balanced":  ["mixed", "casual"],
    "generous":  ["mixed", "casual"],
}

# ---------------------------------------------------------------------------
# Path resolution (works locally and inside Docker at /app)
# ---------------------------------------------------------------------------


def _find_few_shots_file() -> Path:
    candidates = [
        Path(__file__).resolve().parents[2] / "prompts" / "few_shot_master.json",
        Path("/app/prompts/few_shot_master.json"),
        Path(__file__).resolve().parent.parent.parent / "prompts" / "few_shot_master.json",
    ]
    for p in candidates:
        if p.exists():
            return p
    raise FileNotFoundError(
        "Few-shot file not found. Tried:\n" +
        "\n".join(str(p) for p in candidates)
    )


# ---------------------------------------------------------------------------
# Module-level cache
# ---------------------------------------------------------------------------

_few_shots: Optional[list[dict]] = None

# ---------------------------------------------------------------------------
# Internal loader
# ---------------------------------------------------------------------------


def _load_few_shots() -> list[dict]:
    global _few_shots
    if _few_shots is not None:
        return _few_shots
    path = _find_few_shots_file()
    with open(path, "r", encoding="utf-8") as fh:
        _few_shots = json.load(fh)
    return _few_shots


# ---------------------------------------------------------------------------
# Parsing helpers — extract structured signals from free-text user_profile
# ---------------------------------------------------------------------------

# Recognised city tokens (first comma-delimited segment of user_profile)
_CITY_ALIASES: dict[str, list[str]] = {
    "lagos": ["lagos island", "lagos mainland", "lagos", "lekki", "vi", "yaba",
              "ikeja", "surulere", "opebi", "mushin"],
    "abuja": ["abuja", "maitama", "wuse", "garki"],
    "port harcourt": ["port harcourt"],
    "kano": ["kano"],
    "ibadan": ["ibadan"],
    "enugu": ["enugu"],
    "warri": ["warri"],
    "benin city": ["benin city", "benin"],
}

_HIGH_PRICE_KEYWORDS = {"price-sensitive", "budget", "very price", "student", "budget conscious"}
_LOW_PRICE_KEYWORDS  = {"executive", "high standards", "professional", "business"}
_GENEROUS_KEYWORDS   = {"generous rater", "generous"}
_HARSH_KEYWORDS      = {"harsh rater", "harsh", "blunt"}


def _canonical_city(user_profile: str) -> str:
    """Return the canonical city name from the first segment of user_profile."""
    first = user_profile.split(",")[0].strip().lower()
    for canonical, aliases in _CITY_ALIASES.items():
        if any(alias in first for alias in aliases):
            return canonical
    return first


def _profile_price_sensitivity(user_profile: str) -> str:
    p = user_profile.lower()
    if any(kw in p for kw in _HIGH_PRICE_KEYWORDS):
        return "high"
    if any(kw in p for kw in _LOW_PRICE_KEYWORDS):
        return "low"
    return "medium"


def _profile_tone(user_profile: str, rating: int) -> str:
    p = user_profile.lower()
    if any(kw in p for kw in _GENEROUS_KEYWORDS):
        return "generous"
    if any(kw in p for kw in _HARSH_KEYWORDS):
        return "harsh"
    # Fall back to star rating
    if rating >= 4:
        return "generous"
    if rating <= 2:
        return "harsh"
    return "balanced"


# ---------------------------------------------------------------------------
# Formatting
# ---------------------------------------------------------------------------


def _format_shot(shot: dict) -> str:
    return (
        f"City: {shot.get('city', 'Unknown')}\n"
        f"Price sensitivity: {shot.get('price_sensitivity', 'medium')}\n"
        f"Tone: {shot.get('tone', 'mixed')}\n"
        f"Restaurant type: {shot.get('restaurant_type', 'restaurant')}\n"
        f"Rating: {shot.get('rating', 3)}/5\n"
        f"Review: {shot.get('review', '')}"
    )


# ---------------------------------------------------------------------------
# Public: get_few_shots
# ---------------------------------------------------------------------------


def get_few_shots(city: str, price_sensitivity: str, tone: "str | list[str]", n: int = 3) -> str:
    """
    Return n few-shot examples as a formatted string ready for prompt injection.

    tone may be a string or a list of acceptable tone values (use TENDENCY_TO_TONE
    to map rating_tendency → list before calling this).

    Filtering priority:
      1. city match + price_sensitivity match + tone match
      2. city match + price_sensitivity match
      3. city match
      4. price_sensitivity match (any city)
      5. random from full pool
    """
    shots = _load_few_shots()
    city_lower = city.strip().lower()

    def city_matches(s: dict) -> bool:
        canon = s.get("city", "").lower()
        return city_lower in canon or canon in city_lower

    def ps_matches(s: dict) -> bool:
        return s.get("price_sensitivity", "") == price_sensitivity

    def tone_matches(s: dict) -> bool:
        t = s.get("tone", "")
        if isinstance(tone, list):
            return t in tone
        return t == tone

    # Build candidate pool with progressive fallback
    pool: list[dict] = []
    for predicate_combo in [
        lambda s: city_matches(s) and ps_matches(s) and tone_matches(s),
        lambda s: city_matches(s) and ps_matches(s),
        lambda s: city_matches(s),
        lambda s: ps_matches(s),
    ]:
        pool = [s for s in shots if predicate_combo(s)]
        if pool:
            break

    if not pool:
        pool = shots  # last-resort: use everything

    selected = random.sample(pool, min(n, len(pool)))

    # Pad with random extras if pool was smaller than n
    if len(selected) < n:
        selected_ids = {id(s) for s in selected}
        extras = [s for s in shots if id(s) not in selected_ids]
        selected += random.sample(extras, min(n - len(selected), len(extras)))

    return "\n\n---\n\n".join(_format_shot(s) for s in selected)


# ---------------------------------------------------------------------------
# Public: build_review_prompt
# ---------------------------------------------------------------------------


def build_review_prompt(persona: dict, item: dict, skip_voice_layer: bool = False) -> str:
    """
    Build a Gemini-ready prompt that asks it to simulate a Nigerian user review.

    persona          — output of PersonaEncoder
    item             — {item_name, item_type, location, features: list[str]}
    skip_voice_layer — when True, omit cultural few-shots (neutral evaluation mode)
    """
    city              = item.get("location", "Nigeria")
    price_sensitivity = persona.get("price_sensitivity", "medium")
    rating_tendency   = persona.get("rating_tendency", "balanced")
    tone_filter       = TENDENCY_TO_TONE.get(rating_tendency, ["mixed", "casual"])
    if skip_voice_layer:
        few_shots = "(no style examples — neutral evaluation mode)"
    else:
        few_shots = get_few_shots(city, price_sensitivity, tone_filter, n=3)

    features_str = ", ".join(item.get("features", []))
    sample_reviews = persona.get("sample_reviews", [])
    sample_str = (
        "\n".join(f'  - "{r}"' for r in sample_reviews)
        if sample_reviews
        else "  (no prior reviews available)"
    )
    keywords_str = ", ".join(persona.get("tone_keywords", [])) or "not available"

    prompt = f"""You are simulating an authentic Nigerian user writing a review.

## User Persona
- User ID: {persona.get("user_id", "unknown")}
- Average rating they give: {persona.get("avg_rating", 3.0)}/5
- Rating tendency: {tone} ({"gives mostly 4-5 stars" if tone == "generous" else "gives mostly 1-2 stars" if tone == "harsh" else "gives a balanced spread of ratings"})
- Price sensitivity: {price_sensitivity} ({"very cost-conscious, frequently mentions value for money" if price_sensitivity == "high" else "not concerned by price, focuses on quality/experience" if price_sensitivity == "low" else "moderate, mentions price when it stands out"})
- Characteristic words from their reviews: {keywords_str}
- Total reviews written: {persona.get("total_reviews", 0)}

Sample of this user's past reviews:
{sample_str}

## Item Being Reviewed
- Name: {item.get("item_name", "Unknown")}
- Type: {item.get("item_type", "restaurant")}
- Location: {city}
- Key features: {features_str}

## Few-Shot Examples (same city / similar profile)

{few_shots}

---

## Your Task
Write a single authentic review that this user would write about **{item.get("item_name")}** in **{city}**.

Rules:
- Match the user's rating tendency and price sensitivity
- Use the tone and vocabulary style shown in their past reviews and the few-shot examples
- Nigerian Pidgin, local slang, or code-switching is appropriate if the persona suggests it
- Be specific about the features listed above
- Do NOT copy the few-shot reviews — use them only for style reference

Respond with valid JSON only, in this exact format:
{{
  "rating": <integer 1-5>,
  "review_text": "<the full review text>",
  "tone_label": "<one of: positive, negative, neutral, mixed>"
}}"""

    return prompt


# ---------------------------------------------------------------------------
# Public: build_recommendation_prompt
# ---------------------------------------------------------------------------


def build_recommendation_prompt(persona: dict, candidates: list[dict]) -> str:
    """
    Build a Gemini-ready prompt that asks it to rank and explain 10 recommendations.

    persona    — output of PersonaEncoder
    candidates — list of business/item dicts from Yelp (or any source)
    """
    city              = candidates[0].get("city", "Nigeria") if candidates else "Nigeria"
    price_sensitivity = persona.get("price_sensitivity", "medium")
    rating_tendency   = persona.get("rating_tendency", "balanced")
    tone_filter       = TENDENCY_TO_TONE.get(rating_tendency, ["mixed", "casual"])
    few_shots         = get_few_shots(city, price_sensitivity, tone_filter, n=1)

    keywords_str = ", ".join(persona.get("tone_keywords", [])) or "not available"

    candidate_lines = []
    for i, b in enumerate(candidates[:10], 1):
        name = b.get("name", "Unknown")
        category = b.get("categories", "restaurant")
        if isinstance(category, list):
            category = category[0] if category else "restaurant"
        candidate_lines.append(f"{i}. {name} ({category})")

    candidates_str = "\n".join(candidate_lines)

    prompt = f"""You are a personalised recommendation engine for Nigerian food and lifestyle venues.

## User Persona
- User ID: {persona.get("user_id", "unknown")}
- Average rating they give: {persona.get("avg_rating", 3.0)}/5
- Rating tendency: {tone}
- Price sensitivity: {price_sensitivity}
- Characteristic words from their reviews: {keywords_str}
- Total reviews written: {persona.get("total_reviews", 0)}

## Style Reference (few-shot examples from similar users in {city})

{few_shots}

---

## Candidate Items
{candidates_str}

---

## Your Task
Select and rank the **10 best** items from the candidate list for this specific user.

For each recommendation explain:
1. Why it suits THIS user's taste profile and price sensitivity
2. What predicted rating they would give it (1–5, be specific to their tendencies)
3. One cultural note relevant to a Nigerian diner (a local tip, dish name, ordering advice, etc.)

Respond with valid JSON only — a list of exactly 10 objects:
[
  {{
    "item_name": "<exact name from candidate list>",
    "reason": "<personalised reason, 1-2 sentences>",
    "predicted_rating": <float 1.0-5.0>,
    "cultural_note": "<one culturally relevant tip>"
  }},
  ...
]

IMPORTANT: Keep each field SHORT to avoid truncation:
- reason: maximum 15 words
- cultural_note: maximum 10 words
- item_name: exact business name only

Return ONLY a raw JSON array of exactly 10 objects with no extra text."""

    return prompt
