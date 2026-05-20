# NaijaTaste AI 🍛
> Correct taste, every time.

**DSN × Bluechip Technologies LLM Agent Challenge — Hackathon 3.0**

An intelligent Nigerian user behaviour modelling and recommendation system that understands how Nigerians write, what they value, and what they will choose next.

**Live Demo:** https://naijataste-ai.onrender.com  
**API Base URL:** https://naijataste-api.onrender.com  
**Interactive Docs:** https://naijataste-api.onrender.com/docs  
**Team:** NaijaTaste

---

## What It Does

NaijaTaste AI is a unified agent system powered by one shared brain — the **Nigerian Persona Engine** — that drives two core abilities:

**Task A — Review Simulator**  
Given a user persona and a restaurant, the agent predicts exactly how that user would review it — star rating, written review text, tone, and language patterns. Reviews come out in authentic Nigerian Pidgin English.

**Task B — Recommendation Engine**  
Given a user persona (or cold-start signals for new users), the agent recommends real Nigerian restaurants the user would genuinely enjoy — ranked by predicted preference, with cultural context attached to each pick.

---

## Nigerian Advantage

The competition brief awards marks for agents that behave and sound like Nigerians. This is our primary differentiator.

| Signal | What the agent does |
|--------|-------------------|
| Pidgin English and code-switching | Generates reviews that naturally mix English and Pidgin as real users do |
| Value-for-money culture | Factors price sensitivity into tone, rating, and recommendations |
| Lagos vs Abuja sensibility | Adjusts vocabulary and expectations based on user city context |
| Local food references | Understands suya, buka, jollof, pepper soup culturally — not just as keywords |
| Occasion and time context | Adjusts review tone for date spots, quick lunches, and late-night stops |
| Real restaurant data | Google Places API returns actual Nigerian restaurants — no hallucinated spots |

---

## Architecture

```
User Persona + Item Details  →  Nigerian Persona Engine  →  Task A: Review Simulator
User Persona Only            →  Nigerian Persona Engine  →  Task B: Recommendation Engine
```

**Recommendation request flow:**
```
User query → Extract location → Check JSON cache
    → [HIT]  Return cached restaurants instantly
    → [MISS] Google Places API → Store in cache → Return
    → [FAIL] Hardcoded Nigerian restaurant fallback
    → Gemini: rank + explain from real list only
    → Response with Pidgin cultural notes
```

**Core components:**
```
naijataste-ai/
├── Dockerfile
├── api/
│   ├── main.py                      # FastAPI entry point
│   ├── requirements.txt
│   ├── places_client.py             # Google Places API + cache integration
│   ├── cache_manager.py             # MD5-keyed JSON cache layer
│   ├── cache/places_cache.json      # Persisted query cache
│   ├── routers/
│   │   ├── task_a.py                # POST /simulate-review
│   │   └── task_b.py                # POST /recommend
│   ├── core/
│   │   ├── persona.py               # PersonaEncoder
│   │   ├── voice.py                 # Nigerian Voice Layer
│   │   ├── gemini_client.py         # LLM client — 3-key rotation + model fallback
│   │   └── yelp_loader.py           # Dataset loader
│   └── scripts/
│       └── sample_yelp.py           # Yelp dataset sampler
├── frontend/                        # Next.js 15 frontend
│   ├── src/app/                     # App router pages
│   ├── src/contexts/AuthContext.tsx # Persona + review state
│   └── src/components/             # UI components
└── prompts/
    ├── few_shot_master.json         # 144 Nigerian review samples
    ├── yelp_sample_reviews.json     # 1,042 sampled Yelp reviews
    └── yelp_sample_businesses.json  # 842 sampled businesses
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| LLM | Gemini 2.5 Flash / 2.0 Flash (Google AI Studio) |
| Backend | FastAPI (Python 3.11) |
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Restaurant Data | Google Places API (real-time) |
| Cache | JSON file cache (MD5-keyed, zero repeat API calls) |
| Containerisation | Docker |
| Deployment | Render (primary), Railway (secondary) |
| Uptime Monitoring | UptimeRobot (5-min ping — never sleeps) |
| Data Processing | Pandas, Python |

---

## API Reference

### POST /simulate-review — Task A

```json
{
  "persona": {
    "user_id": "optional_yelp_user_id",
    "avg_rating": 3.2,
    "rating_tendency": "harsh",
    "price_sensitivity": "high",
    "tone_keywords": ["jollof", "service", "price", "portion"],
    "total_reviews": 45,
    "sample_reviews": ["The food was okay but too expensive for the portion size"]
  },
  "item_name": "Yellow Chilli Victoria Island",
  "item_type": "restaurant",
  "location": "Lagos",
  "features": ["expensive", "nice ambience", "average food", "fast service"]
}
```

**Response:**
```json
{
  "rating": 2,
  "review_text": "The ambience correct sha, but for this price? Abeg. Food no reach expectation at all. My wallet dey cry.",
  "tone_label": "pidgin-heavy"
}
```

### POST /recommend — Task B

**Existing user:**
```json
{ "user_id": "yelp_user_id_here" }
```

**Cold start (new user):**
```json
{
  "cold_start_signals": {
    "city": "Lagos",
    "preferred_food": "local Nigerian buka amala",
    "price_range": "budget"
  }
}
```

**Response:**
```json
[
  {
    "item_name": "Mama Cass Restaurant",
    "reason": "Affordable local Nigerian food matching budget preference",
    "predicted_rating": 4.2,
    "cultural_note": "Best for weekday lunch, avoid weekend rush"
  }
]
```

### GET /cache/stats
Returns all cached Google Places queries — shows API calls saved.

### GET /health
Health check. Returns `{"status": "ok"}`.

---

## Dataset & Disclosure

| Dataset | Source | Usage |
|---------|--------|-------|
| Yelp Academic Dataset | yelp.com/dataset | Primary training data for persona engine |
| Nigerian Google Maps Reviews | Outscraper API | 500 real Nigerian restaurant reviews as cultural anchors |
| Naijaweb corpus | HuggingFace — saheedniyi/naijaweb | Reference for Nigerian language patterns |
| Synthesized Reviews | Gemini 2.5 Flash | 144 structured Nigerian review samples from real data |

---

## Quick Start (Local)

**Prerequisites:** Python 3.11+, Node.js 20+, Docker

```bash
# Clone
git clone https://github.com/juststrings/naijataste-ai.git
cd naijataste-ai

# Backend
cd api
pip install -r requirements.txt
cp .env.example .env  # add Gemini + Google Places keys
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local  # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

**Docker:**
```bash
docker build -t naijataste-api .
docker run -p 8000:8000 --env-file api/.env naijataste-api
```

---

## Environment Variables

**Backend (api/.env):**
```
GEMINI_API_KEY_1=your_key
GEMINI_API_KEY_2=your_key
GEMINI_API_KEY_3=your_key
GOOGLE_PLACES_API_KEY=your_key
```

**Frontend (frontend/.env.local):**
```
NEXT_PUBLIC_API_URL=https://naijataste-api.onrender.com
```

---

## Key Design Decisions

**Why Google Places API over scraped data?**  
Real-time accuracy. Restaurant data changes constantly. Places API gives live ratings and reviews — scraping gives a static snapshot that goes stale.

**Why cache Places results?**  
Cost and speed. The same query (e.g. "suya Abuja") gets asked repeatedly. One API call serves all future users. Cold cache → Places API → warm cache → zero cost.

**Why Gemini for both tasks?**  
Cultural grounding. Combined with explicit Nigerian Pidgin prompting and real restaurant data as context, responses feel authentic rather than generic.

**Why multi-key rotation?**  
Free tier rate limits. Three API keys in round-robin means 3x the quota — critical for demo traffic during judging.

---

## Roadmap

- [ ] Real authentication — NextAuth + Google OAuth
- [ ] Neon Postgres — persist reviews and profiles across devices
- [ ] Real persona engine on backend — derive taste traits from review history
- [ ] Yelp and Goodreads live integration
- [ ] Expand beyond Nigeria — diaspora cities (London, Houston, Toronto)

---

*Built with 🍛 by Team NaijaTaste — DSN × Bluechip Technologies Hackathon 3.0*
