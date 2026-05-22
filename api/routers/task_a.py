from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.gemini_client import generate_json
from core.voice import build_review_prompt
from core.yelp_loader import PersonaEncoder

router = APIRouter()


class SimulateReviewRequest(BaseModel):
    user_id: Optional[str] = None
    persona: Optional[dict] = None
    item_name: str
    item_type: str
    location: str
    features: list[str]
    preferred_language: Optional[str] = None
    past_adjustments: list[dict] = []


class SimulateReviewResponse(BaseModel):
    rating: int
    review_text: str
    tone_label: str


class AdjustReviewRequest(BaseModel):
    original_review: str
    feedback: str
    original_persona: dict = {}


def _extract_patterns(adjustments: list[dict]) -> str:
    if not adjustments:
        return ""

    patterns: list[str] = []

    # ── Explicit adjustment feedback keywords ──────────────────────────────
    feedbacks = [
        (a.get("feedback") or "").lower()
        for a in adjustments
        if a.get("signalType") == "adjusted"
    ]
    combined = " ".join(feedbacks)

    shorter_hits = combined.count("shorter") + combined.count("short") + combined.count("brief")
    if shorter_hits >= 3:
        patterns.append("User prefers concise reviews")

    hype_hits = combined.count("less hype") + combined.count("less hyp") + combined.count("understated") + combined.count("toned down")
    if hype_hits >= 2:
        patterns.append("User prefers understated tone")

    low_rating_hits = combined.count("lower rating") + combined.count("drop the rating") + combined.count("reduce rating")
    if low_rating_hits >= 2:
        patterns.append("User tends to rate conservatively")

    detail_hits = combined.count("more detail") + combined.count("detailed") + combined.count("elaborate")
    if detail_hits >= 2:
        patterns.append("User prefers detailed reviews")

    # ── Saved review patterns ─────────────────────────────────────────────
    saved = [a for a in adjustments if a.get("signalType") == "saved"]
    if len(saved) >= 3:
        ratings = [float(a["reviewRating"]) for a in saved if a.get("reviewRating") is not None]
        if ratings:
            avg = sum(ratings) / len(ratings)
            if 3.8 <= avg <= 4.7:
                patterns.append("User tends to save reviews rated 4.0-4.5 stars")

    saved_tones = [
        (a.get("reviewTone") or "").lower()
        for a in saved
        if a.get("reviewTone")
    ]
    if saved_tones.count("pidgin-heavy") >= 3:
        patterns.append("User prefers Pidgin-heavy tone")
    if saved_tones.count("casual") >= 3:
        patterns.append("User prefers casual tone")

    # ── Regeneration patterns ─────────────────────────────────────────────
    regen = [a for a in adjustments if a.get("signalType") == "regenerated"]
    regen_tones = [
        (a.get("reviewTone") or "").lower()
        for a in regen
        if a.get("reviewTone")
    ]
    if regen_tones.count("formal") >= 3:
        patterns.append("User dislikes formal tone — avoid it")

    regen_types = [
        (a.get("restaurantType") or "").lower()
        for a in regen
        if a.get("restaurantType")
    ]
    for rtype in set(regen_types):
        if regen_types.count(rtype) >= 3:
            patterns.append(f"User is harder to please for {rtype} — set expectations accurately")

    # ── Copy-without-save pattern ─────────────────────────────────────────
    copied = [a for a in adjustments if a.get("signalType") == "copied"]
    if len(copied) >= 2 and len(saved) == 0:
        patterns.append("User copies reviews but rarely saves — keep quality high every time")

    return "\n".join(f"- {p}" for p in patterns)


@router.post("/simulate-review", response_model=SimulateReviewResponse)
def simulate_review(body: SimulateReviewRequest):
    # Resolve persona
    if body.user_id:
        persona = PersonaEncoder(body.user_id)
    elif body.persona:
        persona = body.persona
    else:
        raise HTTPException(
            status_code=422,
            detail="Provide either user_id (to look up from Yelp data) or a persona dict directly.",
        )

    item = {
        "item_name": body.item_name,
        "item_type": body.item_type,
        "location": body.location,
        "features": body.features,
    }

    prompt = build_review_prompt(persona, item)

    # Silently apply learned style preferences
    patterns = _extract_patterns(body.past_adjustments)
    if patterns:
        prompt += (
            "\n\nSTYLE PREFERENCES (learned from this user's past behaviour, apply automatically):\n"
            + patterns
            + "\n\nApply these preferences without being told. Do not mention them in the review."
        )

    # Append language rule
    prompt += (
        "\n\nLANGUAGE RULE:\n"
        "You are writing this review as a Nigerian user. Detect the language from the "
        "restaurant name, location, and features provided.\n"
        "If the context contains Yoruba words, write the review in Yoruba.\n"
        "If Hausa, write in Hausa. If Igbo, write in Igbo. If Pidgin, write in Pidgin.\n"
        "If English only, write in English. If unclear, default to Nigerian Pidgin.\n"
        "If preferred_language is explicitly provided, use that language regardless "
        "of auto-detection.\n"
        "The review_text must be entirely in one language. Do not mix languages."
    )
    if body.preferred_language:
        prompt += f"\nWrite this review in {body.preferred_language} only."

    # Append strict output instruction so Gemini doesn't stray from the schema
    prompt += (
        "\n\nIMPORTANT: Return ONLY this JSON object — no explanation, no markdown:\n"
        '{"rating": <integer 1-5>, "review_text": "<review>", '
        '"tone_label": "<pidgin-heavy|mixed|formal|casual>"}'
    )

    result = generate_json(prompt)

    return SimulateReviewResponse(
        rating=int(result["rating"]),
        review_text=str(result["review_text"]),
        tone_label=str(result["tone_label"]),
    )


@router.post("/adjust-review", response_model=SimulateReviewResponse)
def adjust_review(body: AdjustReviewRequest):
    persona = body.original_persona
    tone_hint = persona.get("rating_tendency", "balanced")

    prompt = (
        f'Here is a simulated restaurant review written by a {tone_hint} Nigerian reviewer:\n'
        f'"{body.original_review}"\n\n'
        f"The user wants these adjustments: {body.feedback}\n\n"
        "Rewrite the review incorporating the feedback while keeping the same Nigerian voice and persona style.\n\n"
        "IMPORTANT: Return ONLY this JSON object — no explanation, no markdown:\n"
        '{"rating": <integer 1-5>, "review_text": "<review>", '
        '"tone_label": "<pidgin-heavy|mixed|formal|casual>"}'
    )

    result = generate_json(prompt)

    return SimulateReviewResponse(
        rating=int(result["rating"]),
        review_text=str(result["review_text"]),
        tone_label=str(result["tone_label"]),
    )
