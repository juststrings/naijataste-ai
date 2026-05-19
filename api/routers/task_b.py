import random
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.gemini_client import generate_json
from core.voice import build_recommendation_prompt
from core.yelp_loader import PersonaEncoder, get_business_lookup

router = APIRouter()

_CANDIDATE_POOL_SIZE = 15


class RecommendRequest(BaseModel):
    user_id: Optional[str] = None
    cold_start_signals: Optional[dict] = None


class RecommendedItem(BaseModel):
    item_name: str
    business_id: Optional[str] = None
    reason: str
    predicted_rating: float
    cultural_note: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_PRICE_RANGE_MAP = {
    "budget": "high",
    "cheap": "high",
    "affordable": "high",
    "mid": "medium",
    "moderate": "medium",
    "premium": "low",
    "luxury": "low",
    "expensive": "low",
    "high": "low",
}


def _persona_from_cold_start(signals: dict) -> dict:
    """Build a minimal persona dict from cold-start signals."""
    raw_price = str(signals.get("price_range", "")).lower().strip()
    price_sensitivity = _PRICE_RANGE_MAP.get(raw_price, "medium")

    food_pref = signals.get("preferred_food", "")
    tone_keywords = [w for w in str(food_pref).lower().split() if len(w) > 2]

    return {
        "user_id": "cold_start",
        "avg_rating": 3.5,
        "rating_tendency": "balanced",
        "price_sensitivity": price_sensitivity,
        "tone_keywords": tone_keywords,
        "total_reviews": 0,
        "sample_reviews": [],
        # carry city through so build_recommendation_prompt can use it
        "_city": signals.get("city", ""),
    }


def _sample_candidates(persona: dict, cold_start_signals: Optional[dict]) -> list[dict]:
    """
    Sample up to _CANDIDATE_POOL_SIZE businesses from the Yelp lookup.
    Filters by city when we have a city signal.
    """
    business_lookup = get_business_lookup()
    all_businesses = list(business_lookup.values())

    # Determine city filter
    city_hint = ""
    if cold_start_signals:
        city_hint = str(cold_start_signals.get("city", "")).lower().strip()
    elif persona.get("_city"):
        city_hint = str(persona["_city"]).lower().strip()

    if city_hint:
        city_filtered = [
            b for b in all_businesses
            if city_hint in str(b.get("city", "")).lower()
        ]
        pool = city_filtered if city_filtered else all_businesses
    else:
        pool = all_businesses

    k = min(_CANDIDATE_POOL_SIZE, len(pool))
    return random.sample(pool, k)


def _attach_business_ids(items: list[dict], candidates: list[dict]) -> list[dict]:
    """
    Gemini returns item_name strings. Resolve each back to its business_id
    using a case-insensitive name lookup over the candidates we sent it.
    """
    name_to_id: dict[str, str] = {
        b.get("name", "").lower(): b.get("business_id", "")
        for b in candidates
    }
    for item in items:
        name_key = item.get("item_name", "").lower()
        item["business_id"] = name_to_id.get(name_key)
    return items


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post("/recommend", response_model=list[RecommendedItem])
def recommend(body: RecommendRequest):
    # Resolve persona
    if body.user_id:
        persona = PersonaEncoder(body.user_id)
    elif body.cold_start_signals:
        persona = _persona_from_cold_start(body.cold_start_signals)
    else:
        raise HTTPException(
            status_code=422,
            detail="Provide either user_id or cold_start_signals.",
        )

    candidates = _sample_candidates(persona, body.cold_start_signals)

    if not candidates:
        raise HTTPException(
            status_code=503,
            detail="Business data is unavailable or empty.",
        )

    prompt = build_recommendation_prompt(persona, candidates)

    prompt += (
        "\n\nCRITICAL: Return ONLY a raw JSON array of exactly 5 objects. "
        "No markdown. No explanation. Start with [ end with ].\n"
        "Each field must be very short:\n"
        "- item_name: business name only, max 5 words\n"
        "- reason: max 10 words\n"
        "- predicted_rating: float between 1.0 and 5.0\n"
        "- cultural_note: max 8 words\n"
    )

    result = generate_json(prompt, max_tokens=4000)

    # Normalise: Gemini occasionally returns a dict with a nested list
    if isinstance(result, dict):
        for v in result.values():
            if isinstance(v, list):
                result = v
                break

    if not isinstance(result, list):
        raise HTTPException(
            status_code=502,
            detail=f"Unexpected response shape from Gemini: {type(result).__name__}",
        )

    result = _attach_business_ids(result, candidates)

    return [
        RecommendedItem(
            item_name=str(r.get("item_name", "")),
            business_id=r.get("business_id"),
            reason=str(r.get("reason", "")),
            predicted_rating=float(r.get("predicted_rating", 3.0)),
            cultural_note=str(r.get("cultural_note", "")),
        )
        for r in result[:5]
    ]
