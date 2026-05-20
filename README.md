# NaijaTaste AI 🍛

> Correct taste, every time.

AI-powered food recommendation and review simulation engine built for the Nigerian palate. NaijaTaste AI predicts how any Nigerian food persona would review a restaurant, and recommends real spots that match your taste — spice, smoke, and soul.

**Live Demo:** https://naijataste-ai.onrender.com  
**API:** https://naijataste-api.onrender.com  
**Team:** NaijaTaste

---

## What It Does

**Review Simulator**  
Input a reviewer persona (name, rating habits, price sensitivity) and a restaurant. Get a culturally-grounded AI review written in Nigerian Pidgin English — predicting how that persona would actually experience the spot.

**Flavor Finder / Recommendations**  
Tell us what you're craving. Our engine searches real Nigerian restaurants via Google Places API, then uses Gemini to rank and explain the best matches for your taste profile. Every result is grounded in real data — no hallucinated spots.

**Persona Engine**  
Users build a flavor profile over time. The system tracks review history, derives taste traits (Spicy tolerance, Local preference, Adventurousness), and upgrades your persona from Curious Taster → Flavor Seeker → Taste Connoisseur → Flavor Oracle.

**Cross-Domain Taste**  
Nigerian books and culture recommendations that match your food energy. Because how you eat says something about how you read.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   NaijaTaste AI                      │
├─────────────────┬───────────────────────────────────┤
│   Frontend      │   Backend                         │
│   Next.js 15    │   FastAPI (Python)                │
│   TypeScript    │   Gemini 2.5 Flash                │
│   Tailwind CSS  │   Google Places API               │
│   Vercel/Render │   JSON Cache Layer                │
│                 │   Multi-key Rotation              │
└─────────────────┴───────────────────────────────────┘
```

**Request flow for /recommend:**
```
User query → Extract location → Check JSON cache
    → [HIT]  Return cached restaurants
    → [MISS] Google Places API → Store in cache
    → [FAIL] Hardcoded Nigerian fallback list
    → Gemini: rank + explain from real list only
    → Response with Pidgin cultural notes
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.11 |
| AI Engine | Google Gemini 2.5 Flash |
| Restaurant Data | Google Places API |
| Cache | JSON file cache (MD5-keyed) |
| Deployment | Render (primary), Railway (secondary) |
| Uptime | UptimeRobot (5-min ping interval) |
| Auth | localStorage (Phase 1) |

---

## API Endpoints

### POST /simulate-review
Simulate how a persona would review a restaurant.

**Request:**
```json
{
  "reviewer_name": "Emeka",
  "rating_habits": "Balanced realist (avg 3.5 stars)",
  "price_sensitivity": "Budget",
  "restaurant_name": "Yellow Chilli",
  "location": "Victoria Island, Lagos",
  "restaurant_type": "Restaurant",
  "features": "nice ambience, great seafood okra"
}
```

**Response:**
```json
{
  "review_text": "Yellow Chilli na correct spot...",
  "predicted_rating": 4.2,
  "persona_match_score": 87
}
```

### POST /recommend
Get real Nigerian restaurant recommendations for a craving.

**Request:**
```json
{
  "query": "Best suya spots in Abuja",
  "persona": "Budget conscious, loves street food",
  "location": "Abuja"
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "name": "Yahuza Suya Spot Nigeria Limited",
      "rating": 4.2,
      "address": "Abuja, Nigeria",
      "match_reason": "Most popular Abuja suya spot with excellent rating",
      "cultural_note": "Their suya na fire! Don't dull."
    }
  ]
}
```

### GET /cache/stats
Returns cached query statistics — shows how many Google Places API calls have been avoided.

### GET /health
Health check endpoint. Returns `{"status": "ok"}`.

---

## Running Locally

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker (optional)

### Backend
```bash
cd api
pip install -r requirements.txt
cp .env.example .env  # add your API keys
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local  # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

### Docker (full stack)
```bash
docker build -t naijataste-api .
docker run -p 8000:8000 --env-file .env naijataste-api
```

---

## Environment Variables

### Backend (api/.env)
```
GEMINI_API_KEY_1=your_gemini_key
GEMINI_API_KEY_2=your_gemini_key_2
GEMINI_API_KEY_3=your_gemini_key_3
GOOGLE_PLACES_API_KEY=your_places_key
```

### Frontend (frontend/.env.local)
```
NEXT_PUBLIC_API_URL=https://naijataste-api.onrender.com
```

---

## Key Design Decisions

**Why Google Places API over scraped data?**  
Real-time accuracy. Restaurant data changes — new spots open, old ones close. Scraping gives a static snapshot; Places API gives live data with ratings and reviews counts.

**Why cache Google Places results?**  
Cost control and speed. The same query (e.g. "suya Abuja") gets asked repeatedly. Caching means one API call serves thousands of users. Cold cache → Places API → warm cache → zero API cost.

**Why Gemini for both simulate and recommend?**  
Cultural grounding. Gemini's training includes Nigerian context that generic models miss. Combined with explicit Nigerian Pidgin prompting and real restaurant data as context, responses feel authentic rather than generic.

**Why multi-key Gemini rotation?**  
Free tier rate limits. Three API keys in round-robin rotation means 3x the quota before hitting limits — critical for hackathon demo traffic.

---

## Roadmap

- [ ] Real authentication — NextAuth + Google OAuth
- [ ] Neon Postgres — persist reviews and profiles across devices  
- [ ] Real persona engine on backend — derive taste traits from review history
- [ ] Yelp and Goodreads API integration
- [ ] Mobile app (React Native)
- [ ] Expand beyond Lagos/Abuja — Accra, Nairobi, London diaspora

---

*Built with 🍛 by Team NaijaTaste*
