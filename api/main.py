from fastapi import FastAPI
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


@app.get("/")
def root():
    return {"status": "ok", "message": "DSN Bluechip API is running"}


@app.get("/cache/stats")
def cache_stats():
    from cache_manager import _load_cache
    cache = _load_cache()
    return {
        "total_cached_queries": len(cache),
        "queries": [
            {
                "query": v["query"],
                "location": v["location"],
                "restaurants": len(v["restaurants"]),
                "cached_at": v["cached_at"],
            }
            for v in cache.values()
        ],
    }
