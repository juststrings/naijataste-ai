import os

from fastapi import BackgroundTasks, FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from routers import task_a, task_b

app = FastAPI(title="DSN Bluechip API", version="1.0.0")

origins = [
    "http://localhost:3000",
    "https://naijataste.up.railway.app",        # Railway
    "https://naijataste-frontend.onrender.com", # Render
    "https://naijataste-ai.onrender.com",       # Render
    "https://naijataste-api.onrender.com",      # Render
    "https://*.onrender.com",                   # Render wildcard
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(task_a.router, tags=["Task A - Review Simulation"])
app.include_router(task_b.router, tags=["Task B - Recommendations"])


@app.api_route("/health", methods=["GET", "HEAD"])
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {"status": "ok", "message": "DSN Bluechip API is running"}


@app.get("/cache/stats")
def cache_stats():
    from cache_manager import _load_cache
    cache = _load_cache()
    # Skip place_details entries — they have a different structure
    restaurant_entries = [v for v in cache.values() if "restaurants" in v]
    return {
        "total_cached_queries": len(restaurant_entries),
        "queries": [
            {
                "query": v["query"],
                "location": v["location"],
                "restaurants": len(v["restaurants"]),
                "cached_at": v["cached_at"],
            }
            for v in restaurant_entries
        ],
    }


@app.get("/places/top-picks")
async def get_top_picks(
    lat: float | None = None,
    lng: float | None = None,
    persona: str = "Curious Taster",
):
    from places_client import search_real_restaurants

    has_coords = lat is not None and lng is not None
    restaurants = search_real_restaurants(
        "Nigerian restaurant",
        location="near me" if has_coords else "Lagos",
        limit=10,
        user_lat=lat if has_coords else None,
        user_lng=lng if has_coords else None,
    )

    p = persona.lower()
    if "oracle" in p:
        ranked = sorted(restaurants, key=lambda r: (-(r.get("price_level") or 2) >= 3, -r.get("rating", 0)))
    elif "connoisseur" in p:
        ranked = sorted(restaurants, key=lambda r: (-(2 <= (r.get("price_level") or 2) <= 3), -r.get("rating", 0)))
    else:
        ranked = sorted(restaurants, key=lambda r: -r.get("rating", 0))

    api_key = os.getenv("GOOGLE_PLACES_API_KEY", "")
    result = []
    for r in ranked[:6]:
        photo_ref = r.get("photo_reference")
        photo_url = (
            f"https://maps.googleapis.com/maps/api/place/photo"
            f"?maxwidth=400&photo_reference={photo_ref}&key={api_key}"
            if (photo_ref and api_key) else None
        )
        result.append({
            "name": r.get("name"),
            "vicinity": r.get("address"),
            "rating": r.get("rating"),
            "price_level": r.get("price_level"),
            "place_id": r.get("place_id"),
            "types": r.get("types", []),
            "photo_url": photo_url,
        })

    return result


@app.get("/place-details/{place_id}")
async def get_place_details(place_id: str):
    """Fetch full details for a place from Google Places API, cached."""
    import googlemaps
    from cache_manager import _load_cache, _save_cache
    from datetime import datetime

    cache = _load_cache()
    cache_key = f"place_details_{place_id}"
    if cache_key in cache:
        print(f"[CACHE HIT] place details {place_id}")
        return cache[cache_key]["data"]

    api_key = os.getenv("GOOGLE_PLACES_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Google Places API key not configured")

    try:
        gmaps = googlemaps.Client(key=api_key)
        result = gmaps.place(
            place_id=place_id,
            fields=[
                "name", "formatted_address", "formatted_phone_number",
                "opening_hours", "rating", "user_ratings_total",
                "price_level", "website", "photos", "url", "geometry",
            ],
        )
        place = result.get("result", {})

        photos = []
        for photo in place.get("photos", [])[:3]:
            ref = photo.get("photo_reference")
            if ref:
                photos.append(
                    f"https://maps.googleapis.com/maps/api/place/photo"
                    f"?maxwidth=600&photo_reference={ref}&key={api_key}"
                )

        data = {
            "name": place.get("name"),
            "address": place.get("formatted_address"),
            "phone": place.get("formatted_phone_number"),
            "rating": place.get("rating"),
            "total_ratings": place.get("user_ratings_total"),
            "price_level": place.get("price_level"),
            "website": place.get("website"),
            "google_maps_url": place.get("url"),
            "photos": photos,
            "opening_hours": place.get("opening_hours", {}).get("weekday_text", []),
            "is_open_now": place.get("opening_hours", {}).get("open_now"),
            "lat": place.get("geometry", {}).get("location", {}).get("lat"),
            "lng": place.get("geometry", {}).get("location", {}).get("lng"),
        }

        cache[cache_key] = {"data": data, "cached_at": datetime.utcnow().isoformat()}
        _save_cache(cache)
        return data

    except HTTPException:
        raise
    except Exception as e:
        print(f"[PLACE DETAILS ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# WhatsApp webhook (Twilio)
# ---------------------------------------------------------------------------

# Per-user conversation state: phone → {city, preferred_food, price_range}
_whatsapp_sessions: dict[str, dict] = {}


def _format_whatsapp_recommendations(items: list[dict], intro_message: str) -> str:
    import urllib.parse

    lines = [intro_message, ""]
    for i, item in enumerate(items, 1):
        name = item.get("item_name", "")
        rating = item.get("predicted_rating", "")
        reason = item.get("reason", "")
        place_id = item.get("business_id")

        if place_id:
            maps_url = f"https://maps.google.com/?cid={place_id}"
        else:
            q = urllib.parse.quote(name)
            maps_url = f"https://maps.google.com/maps?q={q}"

        lines.append(f"{i}. *{name}* ⭐ {rating}")
        if reason:
            lines.append(f"   {reason}")
        lines.append(f"   🗺️ {maps_url}")
        lines.append("")
    lines.append("Reply with your next craving or ask for something else!")
    return "\n".join(lines)


def _process_whatsapp_message(user_message: str, user_phone: str, session: dict) -> None:
    """Background task: call Gemini and send result via Twilio REST API."""
    from twilio.rest import Client
    from routers.task_b import get_recommendations_from_gemini

    try:
        result = get_recommendations_from_gemini(
            query=user_message,
            cold_start_signals=session,
        )

        intent = result["intent"]
        message = result["message"]
        items = result["items"]

        if intent == "FOOD_QUERY" and items:
            bot_reply = _format_whatsapp_recommendations(items, message)
        else:
            bot_reply = message or "I'm here to help you find great Nigerian food! What are you craving?"
    except Exception as e:
        print(f"[WHATSAPP] Gemini processing failed: {e}")
        bot_reply = "E be like network wahala. Try again small time!"

    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_number = os.getenv("TWILIO_WHATSAPP_NUMBER")
    if twilio_sid and twilio_token and twilio_number:
        try:
            Client(twilio_sid, twilio_token).messages.create(
                from_=twilio_number,
                to=user_phone,
                body=bot_reply,
            )
        except Exception as e:
            print(f"[WHATSAPP] reply send failed: {e}")


@app.post("/whatsapp/webhook")
async def whatsapp_webhook(
    background_tasks: BackgroundTasks,
    Body: str = Form(...),
    From: str = Form(...),
):
    from twilio.twiml.messaging_response import MessagingResponse

    user_message = Body.strip()
    user_phone = From.strip()

    session = _whatsapp_sessions.setdefault(
        user_phone,
        {"city": "Lagos", "preferred_food": "Nigerian food", "price_range": "mid"},
    )

    print(f"[WHATSAPP] from={user_phone} msg={user_message!r}")

    background_tasks.add_task(_process_whatsapp_message, user_message, user_phone, session)

    # Return thinking message immediately to satisfy Twilio's 15s timeout
    twiml = MessagingResponse()
    twiml.message("🔍 Dey find am for you, chill small...")
    return Response(content=str(twiml), media_type="application/xml")
