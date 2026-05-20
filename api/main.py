import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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
