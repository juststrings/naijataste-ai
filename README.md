# NaijaTaste 🍛
> Correct taste, every time.

**DSN × Bluechip Technologies LLM Agent Challenge, Hackathon 3.0**

An intelligent Nigerian user behaviour modelling and recommendation system that understands how Nigerians write, what they value, and what they will choose next. Features implicit learning — review style improves automatically from your behaviour.

**Live Demo:** https://naijataste-ai.onrender.com  
**API Base URL:** https://naijataste-api.onrender.com  
**Interactive Docs:** https://naijataste-api.onrender.com/docs  
**Team:** NaijaTaste

---

## What It Does

NaijaTaste is a unified agent system powered by one shared brain: the **Nigerian Persona Engine**. It drives two core abilities:

**Task A: Review Simulator**  
Given a user persona and a restaurant, the agent predicts exactly how that user would review it: star rating, written review text, tone, and language patterns. Reviews come out in authentic Nigerian Pidgin English. An implicit learning engine observes every interaction and silently shapes future reviews to match the user's taste.

**Task B: Recommendation Engine**  
Given a user persona (or cold-start signals for new users), the agent recommends real Nigerian restaurants the user would genuinely enjoy, ranked by predicted preference, with cultural context attached to each pick. When location access is granted, the system uses the user's actual GPS coordinates to search Google Places within a 5km radius, returning restaurants that are literally nearby, not just in the same city.

---

## Implicit Learning Engine

NaijaTaste learns your review style silently over time without asking you to set preferences.

Every interaction is a signal:

| Signal | What it teaches |
|--------|----------------|
| Saving a review | You liked that style and tone |
| Regenerating a review | That style did not match your taste |
| Copying a review | You approved the content |
| Adjusting a review | Explicit preference captured and remembered |

Over time the system learns:
- Your preferred rating range
- Your preferred tone (Pidgin-heavy, formal, casual)
- How detailed you like your reviews
- Which restaurant types you rate harder or easier
- Your writing style preferences

These patterns are extracted from your interaction history and injected silently into the Gemini prompt on every new generation. The model applies them automatically — no setup required, no settings page. The more you use NaijaTaste, the more accurate your review simulations become.

**How it works technically:**
- Every save, regenerate, copy, and adjust action is persisted to Postgres via `/api/adjustments`
- On each review generation, the last 50 signals are fetched and passed to the backend as `past_adjustments`
- `_extract_patterns()` in `task_a.py` scans the signal history for recurring patterns:
  - Feedback keywords (shorter, less hype, lower rating, more detail) with frequency thresholds
  - Saved review rating averages
  - Tone save and regenerate tallies
  - Restaurant type regeneration counts
  - Copy-without-save behaviour
- Matched patterns are appended to the Gemini prompt before generation

---

## WhatsApp Agent 📱

NaijaTaste is available on WhatsApp! Get restaurant recommendations and
simulate reviews directly from your WhatsApp chat.

### Features on WhatsApp
- Restaurant recommendations in any Nigerian language
- Conversational AI that understands Pidgin, Yoruba, Hausa, Igbo and English
- Multilingual responses — chat in your language, get answers in your language

### How to test (Sandbox)
1. Save +1 415 523 8886 to your contacts
2. Send `join dress-newspaper` to that number on WhatsApp
3. Start chatting! Try: "Best suya in Abuja" or "Mo fe je amala"

### Coming Soon
Full WhatsApp Business API integration with a dedicated Nigerian number —
no join code needed. Users will message NaijaTaste directly.

---

## Nigerian Advantage

The competition brief awards marks for agents that behave and sound like Nigerians. This is our primary differentiator.

| Signal | What the agent does |
|--------|-------------------|
| Pidgin English and code-switching | Generates reviews that naturally mix English and Pidgin as real users do |
| Value-for-money culture | Factors price sensitivity into tone, rating, and recommendations |
| Lagos vs Abuja sensibility | Adjusts vocabulary and expectations based on user city context |
| Local food references | Understands suya, buka, jollof, pepper soup culturally, not just as keywords |
| Occasion and time context | Adjusts review tone for date spots, quick lunches, and late-night stops |
| Real restaurant data | Google Places API returns actual Nigerian restaurants, no hallucinated spots |

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
│   │   ├── gemini_client.py         # LLM client: 3-key rotation + model fallback
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

| Component | Technology | Platform |
|-----------|-----------|----------|
| LLM | Gemini 2.5 Flash + 2.5 Flash Lite + 3.5 Flash + 3.1 Flash Lite (6-key × 4-model rotation = 24 attempts) | Google AI Studio |
| Restaurant Data | Google Places API (real-time, geolocation-aware) | Google Cloud |
| Cache | MD5-keyed JSON (places_cache.json) | Persistent storage |
| Backend | FastAPI (Python 3.11) | Render (primary) + Railway (secondary) |
| Frontend | Next.js 15, TypeScript, Tailwind CSS | Render |
| Database | PostgreSQL via Prisma | Render Postgres |
| Auth | NextAuth.js + Google OAuth + Email/Password | Render |
| WhatsApp Bot | Twilio Sandbox + FastAPI webhook | Render |
| Uptime | UptimeRobot (5-min ping, never sleeps) | External |

**Live Demo:** https://naijataste-ai.onrender.com  
**API Docs:** https://naijataste-api.onrender.com/docs  
**WhatsApp:** Send `join dress-newspaper` to +1 415 523 8886

---

## API Reference

### POST /simulate-review: Task A

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

### POST /recommend: Task B

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
Returns all cached Google Places queries. Shows API calls saved.

### GET /health
Health check. Returns `{"status": "ok"}`.

---

## Dataset & Disclosure

| Dataset | Source | Usage |
|---------|--------|-------|
| Yelp Academic Dataset | yelp.com/dataset | Primary training data for persona engine |
| Nigerian Google Maps Reviews | Outscraper API | 500 real Nigerian restaurant reviews as cultural anchors |
| Naijaweb corpus | HuggingFace, saheedniyi/naijaweb | Reference for Nigerian language patterns |
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
Real-time accuracy. Restaurant data changes constantly. Places API gives live ratings and reviews. Scraping gives a static snapshot that goes stale.

**Why cache Places results?**  
Cost and speed. The same query (e.g. "suya Abuja") gets asked repeatedly. One API call serves all future users. Cold cache → Places API → warm cache → zero cost.

**Why Gemini for both tasks?**  
Cultural grounding. Combined with explicit Nigerian Pidgin prompting and real restaurant data as context, responses feel authentic rather than generic.

**Why multi-key rotation?**  
Free tier rate limits. Three API keys in round-robin means 3x the quota, critical for demo traffic during judging.

**Why geolocation over city-based search?**  
City-center coordinates (Lagos: 6.52°N 3.38°E) can be 20+ km from where a user actually is. A user in Ajah searching for suya should not get results from Ikeja. Browser geolocation with 5km radius returns results that are actually walkable or driveable, making recommendations immediately actionable, not just informative.

---

## Evaluation

Run the evaluation suite against the live API:

```bash
cd api
pip install -r requirements.txt
python scripts/evaluate.py
```

Results are saved to `api/evaluation_results.json`.

### Task A — Review Simulation Metrics

| Metric | Score | Notes |
|--------|-------|-------|
| RMSE | 1.63 | Yelp dataset (n=30); inflated by US-Nigerian domain mismatch |
| MAE | 1.13 | Average absolute error on 5-point scale |
| Within 1 Star | 70.0% | Majority of predictions within acceptable range |
| Nigerian Rating Accuracy | 100% | Nigerian-specific evaluation (n=10) |
| Pidgin Usage Rate | 100% | Nigerian evaluation — every review has Pidgin markers |
| Avg Rating Error | 0.50 stars | Half-star average deviation on Nigerian test suite |

### Ablation Study — Nigerian Voice Layer

| Condition | Pidgin Usage | Rating Accuracy |
|-----------|-------------|-----------------|
| Full system (144 few-shot samples) | 100% | 100% |
| Zero-shot baseline (no few-shot) | 20% | 80% |

The Nigerian Voice Layer contributes 80 percentage points to Pidgin usage and 20 percentage points to rating accuracy.

### Task B — Recommendation Metrics

| Metric | Score | Notes |
|--------|-------|-------|
| Coverage Rate | 100% | All queries returned 3+ recommendations |
| Nigerian Grounding Rate | 100% | All results grounded in Nigerian city context |
| Category Relevance | 36.8% | Gemini reasons reference user food category |
| NDCG@10 (Yelp) | 0.00 | Expected: Yelp ground truth is US restaurants; ours are Nigerian |
| Nigerian Cold-Start Coverage | 100% | All 5 Nigerian scenarios returned accurate results |

**Note on NDCG@10:** The 0.00 score reflects structural domain mismatch — Yelp ground truth contains US restaurants (Tim Hortons, Philadelphia cheesesteaks) while NaijaTaste recommends Nigerian restaurants (Nkoyo Abuja, Mama Cass Lagos). There is no overlap by design. A meaningful NDCG evaluation requires a Nigerian restaurant dataset that does not currently exist publicly.

### Agent Reasoning Flow (ReAct Framework)

NaijaTaste uses a ReAct-inspired (Reason + Act + Observe) framework where the agent reasons about language, intent, location and persona before acting and returning structured recommendations.

```
USER QUERY: "Mo fe je amala for Lagos"

THOUGHT: User is writing in Yoruba. They want Amala in Lagos.
         This is a local Nigerian dish — prioritize bukas and local spots.
         User persona is Curious Taster (Level 1) — budget-friendly preferred.

ACTION 1 — Detect language: "yo" (Yoruba via Gemini detection)
ACTION 2 — Classify intent: FOOD_QUERY
ACTION 3 — Resolve location: Lagos → GPS coords (6.5244, 3.3792)
ACTION 4 — Cache lookup: MD5("amala lagos|6.5244,3.3792") → MISS
ACTION 5 — Google Places API: search "amala restaurant Lagos" within 5km radius
ACTION 6 — Gemini ranking: rank by persona fit, generate Yoruba match reasons
ACTION 7 — Cache store: save results for future identical queries

OBSERVATION: Found 6 real places. Top match: Just Amala (4.5★, budget, Surulere)
             Deduplicated — 1 duplicate removed
             All match_reason and cultural_note fields in Yoruba

OUTPUT: {
  intent: "FOOD_QUERY",
  detected_language: "yo",
  items: [...ranked Nigerian restaurants with Yoruba explanations],
  message: "Mo ri 5 ibi fun e! Wo awon ibi isale 👇"
}
```

---

## Roadmap

- [x] Geolocation-based search: 5km radius from user's actual position
- [x] Real authentication: NextAuth + Google OAuth
- [x] Postgres: persist reviews and profiles across devices (Render Postgres + Prisma)
- [x] Implicit learning engine: derive style preferences from interaction signals
- [x] WhatsApp bot: multilingual recommendations via Twilio
- [ ] Real persona engine on backend: derive taste traits from full review history
- [ ] Yelp and Goodreads live integration
- [ ] Expand beyond Nigeria: diaspora cities (London, Houston, Toronto)

---

*Built with 🍛 by Team NaijaTaste, DSN × Bluechip Technologies Hackathon 3.0*
