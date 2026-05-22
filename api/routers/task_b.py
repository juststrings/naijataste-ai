import json
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
    intent: str
    message: str
    items: list[RecommendedItem]
    detected_language: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


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


def _build_conversational_prompt(
    query: str, location: str, persona: dict, real_restaurants: list[dict]
) -> str:
    price_sensitivity = persona.get("price_sensitivity", "medium")
    keywords_str = ", ".join(persona.get("tone_keywords", [])) or "Nigerian cuisine"

    restaurants_section = (
        json.dumps(real_restaurants, indent=2)
        if real_restaurants
        else "No restaurants loaded for this query."
    )

    return (
        f"You are NaijaTaste AI, an intelligent Nigerian food recommendation chatbot.\n\n"
        f"You can understand any message in English, Pidgin, Yoruba, Hausa, or Igbo.\n\n"
        f"INTENT HANDLING:\n"
        f"- If the user is greeting you, respond warmly and ask what they are craving. Return empty items [].\n"
        f"- If the user is making small talk, respond naturally and guide them toward food recommendations. Return empty items [].\n"
        f"- If the user asks what you can do, explain your capabilities naturally. Return empty items [].\n"
        f"- If the user is asking for food/restaurant recommendations, do the full recommendation flow and return items.\n"
        f"- If the message is ambiguous, ask a clarifying question. Return empty items [].\n\n"
        f"Always respond in the same language the user wrote in.\n"
        f"Never return restaurant recommendations for non-food messages.\n"
        f"Be warm, culturally Nigerian, and conversational at all times.\n\n"
        f'User message: "{query}"\n'
        f"Location context: {location}\n\n"
        f"## User Taste Profile\n"
        f"- Price sensitivity: {price_sensitivity} "
        f'({"budget-conscious" if price_sensitivity == "high" else "premium spender" if price_sensitivity == "low" else "moderate budget"})\n'
        f"- Food preferences: {keywords_str}\n\n"
        f"## Available Restaurants (from Google Maps)\n"
        f"{restaurants_section}\n\n"
        f"If this is a FOOD_QUERY, recommend up to 5 best matches from Available Restaurants above.\n"
        f"ONLY recommend restaurants from that list — NEVER invent new ones.\n"
        f"Each item needs: item_name (exact name from list, max 6 words), "
        f"reason (max 12 words, in detected_language), "
        f"predicted_rating (float 1.0-5.0), "
        f"cultural_note (max 10 words, in detected_language).\n\n"
        f"Return ONLY this raw JSON. No markdown. No explanation:\n"
        f'{{\n'
        f'  "intent": "GREETING" | "CHITCHAT" | "HELP" | "FOOD_QUERY" | "CLARIFY",\n'
        f'  "message": "your conversational response here",\n'
        f'  "detected_language": "en" | "yo" | "ha" | "ig" | "pcm",\n'
        f'  "items": [] or [{{"item_name":"...","reason":"...","predicted_rating":4.0,"cultural_note":"..."}}]\n'
        f'}}'
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
    location = _extract_location(query, body.cold_start_signals)

    # Fetch real restaurants — empty list is OK; Gemini handles non-food intents gracefully
    real_restaurants = search_real_restaurants(
        query, location, user_lat=body.user_lat, user_lng=body.user_lng
    )

    display_location = (
        f"near the user's current location ({body.user_lat:.4f}, {body.user_lng:.4f})"
        if body.user_lat and body.user_lng
        else location
    )
    prompt = _build_conversational_prompt(query, display_location, persona, real_restaurants)
    result = generate_json(prompt, max_tokens=4000)

    # Extract all fields from Gemini's conversational response
    if isinstance(result, dict):
        intent = str(result.get("intent", "FOOD_QUERY"))
        message = str(result.get("message", ""))
        detected_language = str(result.get("detected_language", "en"))
        items_list = result.get("items", [])
        if not isinstance(items_list, list):
            items_list = []
    elif isinstance(result, list):
        # Gemini ignored the wrapper format — treat as a flat recommendation list
        intent = "FOOD_QUERY"
        message = ""
        detected_language = "en"
        items_list = result
    else:
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
        intent=intent,
        message=message,
        items=[
            RecommendedItem(
                item_name=str(r.get("item_name", "")),
                business_id=place_id_map.get(r.get("item_name", "").lower()),
                reason=str(r.get("reason", "")),
                predicted_rating=float(r.get("predicted_rating", 3.0)),
                cultural_note=str(r.get("cultural_note", "")),
            )
            for r in items_list[:5]
        ],
        detected_language=detected_language,
    )
