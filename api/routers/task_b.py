import json
import re
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.gemini_client import generate_json
from places_client import search_real_restaurants

router = APIRouter()

# ---------------------------------------------------------------------------
# City keyword → canonical name (used for location extraction from query text)
# ---------------------------------------------------------------------------

_CITY_KEYWORDS: dict[str, str] = {
    "lagos": "Lagos",
    "lekki": "Lagos",
    "victoria island": "Lagos",
    "ikeja": "Lagos",
    "surulere": "Lagos",
    "yaba": "Lagos",
    "abuja": "Abuja",
    "maitama": "Abuja",
    "wuse": "Abuja",
    "garki": "Abuja",
    "port harcourt": "Port Harcourt",
    " ph ": "Port Harcourt",
    "ibadan": "Ibadan",
    "kano": "Kano",
}

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


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class RecommendRequest(BaseModel):
    user_id: Optional[str] = None
    cold_start_signals: Optional[dict] = None
    query: Optional[str] = None  # explicit search query; falls back to preferred_food
    user_lat: Optional[float] = None
    user_lng: Optional[float] = None


class RecommendedItem(BaseModel):
    item_name: str
    business_id: Optional[str] = None
    reason: str
    predicted_rating: float
    cultural_note: str


class RecommendResponse(BaseModel):
    items: list[RecommendedItem]
    detected_language: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _detect_language(query: str) -> str:
    """Server-side language detection from query text."""
    lower = query.lower()
    if re.search(r'\b(jẹ|ká|àwọn|mo\s*fẹ|bẹẹni|o\s*dara|ibẹ|isale|mofe|ewa\b|ra\b|fẹ\b)\b', query, re.I):
        return "yo"
    if re.search(r'\b(mai\s*kyau|ina\s*neman|abinci|bari\s*mu|sannu|nagode|yana\s*da)\b', lower):
        return "ha"
    if re.search(r'\b(ọ\s*dị|ka\s*anyị|nwetara|rie\s*nri|dịmma|n\'okpuru|ebe\s*maka)\b', lower):
        return "ig"
    if re.search(r'\b(dey|wetin|abeg|oga|naija|chop|wahala|no\s*be|na\s*so|ehen|correct)\b', lower):
        return "pidgin"
    return "en"


def _persona_from_cold_start(signals: dict) -> dict:
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
        "_city": signals.get("city", ""),
    }


def _extract_location(query: str, cold_start_signals: Optional[dict]) -> str:
    """Prefer cold_start city, then scan the query string for known city keywords."""
    if cold_start_signals:
        city = cold_start_signals.get("city", "").strip()
        if city:
            return city
    # Pad with spaces so word-boundary checks work on keywords like " ph "
    padded = f" {query.lower()} "
    for keyword, canonical in _CITY_KEYWORDS.items():
        if keyword in padded:
            return canonical
    return "Lagos"


def _build_places_prompt(
    query: str, location: str, persona: dict, real_restaurants: list[dict]
) -> str:
    price_sensitivity = persona.get("price_sensitivity", "medium")
    tone = persona.get("rating_tendency", "balanced")
    keywords_str = ", ".join(persona.get("tone_keywords", [])) or "Nigerian cuisine"

    return (
        f'You are a Nigerian food recommendation AI. '
        f'A user is looking for: "{query}" in {location}.\n\n'
        f"LANGUAGE RULE:\n"
        f"The user's message may be in English, Nigerian Pidgin, Yoruba, Hausa, Igbo, "
        f"or any other language.\n"
        f"Automatically detect what language the user wrote in.\n"
        f"Respond ENTIRELY in that same language — including the reason and "
        f"cultural_note fields in your JSON response.\n"
        f"Do not default to English or Pidgin. Match the user's language exactly.\n"
        f"If you cannot detect the language, default to Nigerian Pidgin.\n\n"
        f"## User Profile\n"
        f"- Price sensitivity: {price_sensitivity} "
        f'({"budget-conscious" if price_sensitivity == "high" else "premium spender" if price_sensitivity == "low" else "moderate budget"})\n'
        f"- Rating tendency: {tone}\n"
        f"- Food keywords: {keywords_str}\n\n"
        f"## REAL Restaurants from Google Maps\n"
        f"{json.dumps(real_restaurants, indent=2)}\n\n"
        f"## Your Task\n"
        f"Recommend the 5 best matches from the list above for this user's query.\n"
        f"ONLY recommend restaurants from the list above — NEVER invent new ones.\n\n"
        f"CRITICAL: Return ONLY a raw JSON array of exactly 5 objects. "
        f"No markdown. No explanation. Start with [ end with ].\n"
        f"Each object must have:\n"
        f"- item_name: exact restaurant name from the list above (max 6 words)\n"
        f"- reason: why it matches this query, IN THE DETECTED LANGUAGE (max 12 words)\n"
        f"- predicted_rating: float 1.0–5.0\n"
        f"- cultural_note: short cultural tip IN THE DETECTED LANGUAGE (max 10 words)\n"
    )


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post("/recommend", response_model=RecommendResponse)
def recommend(body: RecommendRequest):
    # Resolve persona
    if body.user_id:
        from core.yelp_loader import PersonaEncoder
        persona = PersonaEncoder(body.user_id)
    elif body.cold_start_signals:
        persona = _persona_from_cold_start(body.cold_start_signals)
    else:
        raise HTTPException(
            status_code=422,
            detail="Provide either user_id or cold_start_signals.",
        )

    # Determine search query and location
    query = (
        body.query
        or (body.cold_start_signals or {}).get("preferred_food", "")
        or " ".join(persona.get("tone_keywords", []))
        or "Nigerian restaurant"
    )
    detected_language = _detect_language(query)
    location = _extract_location(query, body.cold_start_signals)

    # Fetch real restaurants: cache → Google Places → hardcoded fallback
    real_restaurants = search_real_restaurants(
        query, location, user_lat=body.user_lat, user_lng=body.user_lng
    )

    if not real_restaurants:
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve restaurant data.",
        )

    display_location = (
        f"near the user's current location ({body.user_lat:.4f}, {body.user_lng:.4f})"
        if body.user_lat and body.user_lng
        else location
    )
    prompt = _build_places_prompt(query, display_location, persona, real_restaurants)
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

    # Map place_id → business_id for API compatibility
    place_id_map = {
        r.get("name", "").lower(): r.get("place_id")
        for r in real_restaurants
    }

    return RecommendResponse(
        items=[
            RecommendedItem(
                item_name=str(r.get("item_name", "")),
                business_id=place_id_map.get(r.get("item_name", "").lower()),
                reason=str(r.get("reason", "")),
                predicted_rating=float(r.get("predicted_rating", 3.0)),
                cultural_note=str(r.get("cultural_note", "")),
            )
            for r in result[:5]
        ],
        detected_language=detected_language,
    )
