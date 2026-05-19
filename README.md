# NaijaTaste AI
### DSN × Bluechip Technologies LLM Agent Challenge — Hackathon 3.0

> An intelligent Nigerian user behaviour modelling and recommendation system that understands how Nigerians write, what they value, and what they will choose next.

---

## Live Demo
**API Base URL:** https://naijataste-ai-production.up.railway.app  
**Interactive Docs:** https://naijataste-ai-production.up.railway.app/docs

---

## What It Does

NaijaTaste AI is a unified agent system with one shared brain — the **Nigerian Persona Engine** — that powers two abilities:

**Task A — Review Simulator**  
Given a user persona and a business/item, the agent predicts exactly how that user would review it — including the star rating and the written review text in their voice, tone, and language patterns.

**Task B — Recommendation Engine**  
Given a user persona (or cold-start signals for new users), the agent recommends items the user would genuinely enjoy — ranked by predicted preference, with Nigerian cultural context attached to each recommendation.

---

## Nigerian Advantage

The competition brief awards additional marks for agents that behave and sound like Nigerians. This is our primary differentiator.

Most systems build culturally generic agents. NaijaTaste AI goes further:

| Signal | What the agent does |
|--------|-------------------|
| Pidgin English and code-switching | Generates reviews that naturally mix English and Pidgin as real users do |
| Value-for-money culture | Factors price sensitivity into tone, rating, and recommendations |
| Lagos vs Abuja sensibility | Adjusts vocabulary and expectations based on user city context |
| Local food references | Understands suya, buka, jollof, pepper soup culturally not just as keywords |
| Occasion and time context | Adjusts review tone for date spots, quick lunches, and late-night stops |

---

## Architecture

```
User Persona + Item Details  →  Nigerian Persona Engine  →  Task A: Review Simulator
User Persona Only            →  Nigerian Persona Engine  →  Task B: Recommendation Engine
```

**Core Components:**
- `core/persona.py` — PersonaEncoder: builds behavioural profile from Yelp review history
- `core/voice.py` — Nigerian Voice Layer: injects culturally grounded few-shot examples into prompts
- `core/gemini_client.py` — Gemini API client with 3-key rotation and model fallback chain
- `core/yelp_loader.py` — Yelp dataset loader (full local / sampled for deployment)
- `routers/task_a.py` — POST /simulate-review endpoint
- `routers/task_b.py` — POST /recommend endpoint

**Data Pipeline:**
1. 500 real Nigerian Google Maps reviews collected via Outscraper
2. 144 structured samples synthesized using Gemini 2.5 Flash, grounded in authentic Nigerian speech patterns
3. 1,027 Yelp user personas sampled for recommendation candidates
4. All data used as few-shot context — no fine-tuning required

---

## API Reference

### Task A — Simulate Review
**POST** `/simulate-review`

```json
{
  "persona": {
    "user_id": "optional_yelp_user_id",
    "avg_rating": 3.2,
    "rating_tendency": "harsh",
    "price_sensitivity": "high",
    "tone_keywords": ["jollof", "service", "price", "portion"],
    "total_reviews": 45,
    "sample_reviews": [
      "The food was okay but too expensive for the portion size"
    ]
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
  "review_text": "The ambience correct sha, but for this price? Abeg. Food no reach expectation at all. Service fast at least, I go give dem that. My wallet dey cry.",
  "tone_label": "pidgin-heavy"
}
```

---

### Task B — Get Recommendations
**POST** `/recommend`

**With existing user:**
```json
{
  "user_id": "yelp_user_id_here"
}
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
    "business_id": "abc123",
    "reason": "Affordable local Nigerian food matching budget preference",
    "predicted_rating": 4.2,
    "cultural_note": "Best for weekday lunch, avoid weekend rush"
  }
]
```

---

## Sample Yelp User IDs for Testing

These user IDs are included in the deployed dataset and can be used to test persona-based reviews and recommendations:

Run this to get sample IDs:
```bash
python -c "
import json
with open('prompts/yelp_sample_reviews.json') as f:
    reviews = json.load(f)
users = list(set(r['user_id'] for r in reviews))[:10]
for u in users:
    print(u)
"
```

---

## Quick Start (Local)

**Prerequisites:** Python 3.11+, Docker

```bash
# Clone the repo
git clone https://github.com/juststrings/naijataste-ai.git
cd naijataste-ai

# Set up environment
cp api/.env.example api/.env
# Add your Gemini API keys to api/.env

# Run with Docker
docker compose -f api/docker-compose.yml up --build

# Or run directly
cd api
pip install -r requirements.txt
uvicorn main:app --reload
```

API will be available at `http://localhost:8000/docs`

---

## Dataset & Disclosure

| Dataset | Source | Usage |
|---------|--------|-------|
| Yelp Academic Dataset | yelp.com/dataset | Primary training data for persona engine and Task A/B |
| Nigerian Google Maps Reviews | Outscraper API | 500 real Nigerian restaurant reviews as cultural style anchors |
| Naijaweb (Nairaland corpus) | HuggingFace — saheedniyi/naijaweb | Reference for Nigerian language patterns |
| Synthesized Reviews | Gemini 2.5 Flash | 144 structured Nigerian review samples generated from real data |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| LLM | Gemini 2.5 Flash / 2.0 Flash (via Google AI Studio free tier) |
| Backend | FastAPI (Python 3.11) |
| Containerisation | Docker |
| Deployment | Railway |
| Data Processing | Pandas, Python |
| Version Control | GitHub |

---

## Project Structure

```
naijataste-ai/
├── Dockerfile                    # Production Docker build
├── api/
│   ├── main.py                   # FastAPI app entry point
│   ├── requirements.txt
│   ├── routers/
│   │   ├── task_a.py             # POST /simulate-review
│   │   └── task_b.py             # POST /recommend
│   ├── core/
│   │   ├── persona.py            # PersonaEncoder
│   │   ├── voice.py              # Nigerian Voice Layer
│   │   ├── gemini_client.py      # LLM client with key rotation
│   │   └── yelp_loader.py        # Dataset loader
│   └── scripts/
│       └── sample_yelp.py        # Yelp dataset sampler
└── prompts/
    ├── few_shot_master.json      # 144 Nigerian review samples
    ├── yelp_sample_reviews.json  # 1,042 sampled Yelp reviews
    └── yelp_sample_businesses.json # 842 sampled businesses
```

---

## Team

**Abdulsalam Lawal** — BI Analyst & Data Scientist  
Obafemi Awolowo University · Lagos, Nigeria  
GitHub: [@juststrings](https://github.com/juststrings)

---

*Built for DSN × BCT LLM Agent Challenge Hackathon 3.0 — May 2026*
