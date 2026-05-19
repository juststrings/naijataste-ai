import json
import os
import hashlib
from datetime import datetime

CACHE_FILE = os.path.join(os.path.dirname(__file__), "cache", "places_cache.json")


def _load_cache():
    os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
    if not os.path.exists(CACHE_FILE):
        return {}
    with open(CACHE_FILE) as f:
        return json.load(f)


def _save_cache(cache):
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=2)


def make_cache_key(query, location):
    normalized = f"{query.lower().strip()}|{location.lower().strip()}"
    return hashlib.md5(normalized.encode()).hexdigest()


def get_cached_restaurants(query, location):
    cache = _load_cache()
    key = make_cache_key(query, location)
    if key in cache:
        print(f"[CACHE HIT] {query} @ {location}")
        return cache[key]["restaurants"]
    print(f"[CACHE MISS] {query} @ {location}")
    return None


def store_restaurants(query, location, restaurants):
    cache = _load_cache()
    key = make_cache_key(query, location)
    cache[key] = {
        "query": query,
        "location": location,
        "restaurants": restaurants,
        "cached_at": datetime.utcnow().isoformat(),
        "hit_count": cache.get(key, {}).get("hit_count", 0) + 1,
    }
    _save_cache(cache)
    print(f"[CACHE STORED] {len(restaurants)} restaurants for '{query} @ {location}'")
