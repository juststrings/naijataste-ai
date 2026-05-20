import os
import googlemaps
from cache_manager import get_cached_restaurants, store_restaurants

CITY_COORDS = {
    "lagos": {"lat": 6.5244, "lng": 3.3792},
    "abuja": {"lat": 9.0765, "lng": 7.3986},
    "ph": {"lat": 4.8156, "lng": 7.0498},
    "port harcourt": {"lat": 4.8156, "lng": 7.0498},
    "ibadan": {"lat": 7.3775, "lng": 3.9470},
    "kano": {"lat": 12.0022, "lng": 8.5920},
}

FALLBACK_RESTAURANTS = [
    {"name": "Yellow Chilli", "rating": 4.3, "address": "Victoria Island, Lagos", "price_level": 2},
    {"name": "Bukka Hut", "rating": 4.2, "address": "Lekki, Lagos", "price_level": 1},
    {"name": "Chicken Republic", "rating": 4.0, "address": "Multiple locations", "price_level": 1},
    {"name": "Mama Cass", "rating": 4.1, "address": "Lagos Island", "price_level": 1},
    {"name": "Terra Kulture", "rating": 4.4, "address": "Victoria Island, Lagos", "price_level": 3},
    {"name": "Nkoyo", "rating": 4.5, "address": "Maitama, Abuja", "price_level": 3},
    {"name": "Craft Grill", "rating": 4.3, "address": "Wuse 2, Abuja", "price_level": 2},
    {"name": "The Place Restaurant", "rating": 4.2, "address": "Gbagada, Lagos", "price_level": 2},
    {"name": "Grills 360", "rating": 4.1, "address": "Lekki Phase 1, Lagos", "price_level": 2},
    {"name": "Cactus Restaurant", "rating": 4.0, "address": "Victoria Island, Lagos", "price_level": 2},
]


def search_real_restaurants(
    query: str,
    location: str = "Lagos",
    limit: int = 10,
    user_lat: float | None = None,
    user_lng: float | None = None,
):
    # Cache key includes exact coords when provided for precise "near me" results
    cache_location = f"{user_lat:.5f},{user_lng:.5f}" if (user_lat and user_lng) else location
    cached = get_cached_restaurants(query, cache_location)
    if cached:
        return cached

    # Try Google Places API
    api_key = os.getenv("GOOGLE_PLACES_API_KEY")
    if api_key:
        try:
            gmaps = googlemaps.Client(key=api_key)

            if user_lat and user_lng:
                coords = {"lat": user_lat, "lng": user_lng}
                radius = 5000  # 5 km — "near me" search
                search_query = f"{query} restaurant"
            else:
                city_key = location.lower().split(",")[0].strip()
                coords = CITY_COORDS.get(city_key, {"lat": 6.5244, "lng": 3.3792})
                radius = 50000
                search_query = f"{query} restaurant {location} Nigeria"

            places_result = gmaps.places(
                query=search_query,
                location=coords,
                radius=radius,
                type="restaurant",
            )

            restaurants = []
            for place in places_result.get("results", [])[:limit]:
                restaurants.append({
                    "name": place["name"],
                    "rating": place.get("rating", 4.0),
                    "address": place.get("formatted_address", location),
                    "place_id": place["place_id"],
                    "price_level": place.get("price_level", 2),
                    "user_ratings_total": place.get("user_ratings_total", 0),
                })

            if restaurants:
                store_restaurants(query, cache_location, restaurants)
                return restaurants
        except Exception as e:
            print(f"[PLACES API ERROR] {e} — using fallback")

    # Fallback
    print("[FALLBACK] Using hardcoded Nigerian restaurants")
    return FALLBACK_RESTAURANTS
