"""
NaijaTaste AI — Nigerian Evaluation Suite
Mines test cases from the Yelp sample dataset (no hardcoded cases).

Dataset note: Yelp sample is US/Canada-based, ~1 review per user.
Task A uses leave-one-out on the 14 users with 2+ reviews (the maximum
available). Task B uses cold-start signals derived from each user's
highest-rated business category.
"""

import json
import math
import random
import re
import sys
from pathlib import Path

import requests

# ── Paths ──────────────────────────────────────────────────────────────────
REPO_ROOT = Path(__file__).parent.parent.parent
REVIEWS_PATH = REPO_ROOT / "prompts" / "yelp_sample_reviews.json"
BUSINESSES_PATH = REPO_ROOT / "prompts" / "yelp_sample_businesses.json"

API_BASE = "https://naijataste-api.onrender.com"

# ── Constants ──────────────────────────────────────────────────────────────
PIDGIN_MARKERS = [
    "na", "dey", "abeg", "sha", "abi", "wahala",
    "correct", "chop", "dem", "e be", "wetin",
    "sabi", "oga", "no be", "kuku", "joor", "ehen",
]

STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "was", "are", "were", "be", "been",
    "have", "has", "had", "do", "did", "will", "would", "could", "should",
    "i", "we", "you", "he", "she", "it", "they", "my", "our", "your",
    "his", "her", "its", "their", "this", "that", "these", "those",
    "not", "no", "so", "as", "up", "out", "if", "about", "more", "very",
    "just", "also", "there", "here", "when", "where", "what", "how",
    "all", "any", "both", "each", "few", "most", "other", "some", "such",
    "than", "then", "too", "can", "get", "got", "back", "go", "s", "t",
    "place", "food", "restaurant", "service", "great", "good", "nice",
    "really", "time", "came", "come", "went", "like", "well",
}

GENERIC_CATEGORIES = {
    "Restaurants", "Food", "Bars", "Nightlife",
    "Event Planning & Services", "Shopping", "Local Services",
}

NIGERIAN_CITIES = {
    "lagos", "abuja", "port harcourt", "ph", "ibadan",
    "kano", "nigeria", "enugu", "benin", "lekki", "victoria island",
}


# ── Helpers ────────────────────────────────────────────────────────────────

def load_data():
    with open(REVIEWS_PATH) as f:
        reviews = json.load(f)
    with open(BUSINESSES_PATH) as f:
        biz_lookup = json.load(f)
    return reviews, biz_lookup


def extract_tone_keywords(texts: list[str]) -> list[str]:
    words = []
    for t in texts:
        words.extend(re.findall(r"[a-z]+", t.lower()))
    freq = {}
    for w in words:
        if w not in STOPWORDS and len(w) > 3:
            freq[w] = freq.get(w, 0) + 1
    return [w for w, _ in sorted(freq.items(), key=lambda x: -x[1])[:4]]


def build_persona(history: list[dict]) -> dict:
    avg = sum(r["stars"] for r in history) / len(history)
    texts = [r.get("text", "")[:200] for r in history[:3]]
    return {
        "avg_rating": round(avg, 2),
        "rating_tendency": "harsh" if avg < 3 else "generous" if avg > 4 else "balanced",
        "price_sensitivity": "high" if avg < 3 else "low" if avg > 4 else "medium",
        "sample_reviews": texts,
        "tone_keywords": extract_tone_keywords([r.get("text", "") for r in history]),
        "total_reviews": len(history),
    }


def count_pidgin(text: str) -> int:
    t = text.lower()
    return sum(1 for m in PIDGIN_MARKERS if m in t)


def pidgin_distribution(texts: list[str]) -> dict:
    counts = [count_pidgin(t) for t in texts]
    n = len(counts)
    return {
        "mean_markers": round(sum(counts) / n, 2) if n else 0,
        "fluent_pct": round(sum(1 for c in counts if c >= 3) / n, 4) if n else 0,
        "light_pct": round(sum(1 for c in counts if 1 <= c <= 2) / n, 4) if n else 0,
        "formal_pct": round(sum(1 for c in counts if c == 0) / n, 4) if n else 0,
    }


# ── Task A ─────────────────────────────────────────────────────────────────

def evaluate_task_a(reviews: list, biz_lookup: dict) -> dict | None:
    print(f"\n{'='*55}")
    print("TASK A — Review Simulation (leave-one-out, Yelp-mined)")
    print(f"{'='*55}")

    user_reviews: dict[str, list] = {}
    for r in reviews:
        user_reviews.setdefault(r["user_id"], []).append(r)

    # Need at least 2 reviews: 1 for persona history, 1 as ground truth
    eligible = {uid: revs for uid, revs in user_reviews.items() if len(revs) >= 2}
    print(f"  Dataset: {len(reviews)} reviews | {len(user_reviews)} unique users")
    print(f"  Users with 2+ reviews (eligible): {len(eligible)}")

    rng = random.Random(42)
    sampled = rng.sample(list(eligible.keys()), min(30, len(eligible)))

    sq_errors: list[float] = []
    abs_errors: list[float] = []
    review_texts: list[str] = []
    results: list[dict] = []

    for uid in sampled:
        # Sort by review_id for stable ordering
        user_revs = sorted(eligible[uid], key=lambda r: r.get("review_id", ""))
        history = user_revs[:-1]
        test = user_revs[-1]

        actual = float(test["stars"])
        biz_id = test.get("business_id", "")
        biz = biz_lookup.get(biz_id, {})

        persona = build_persona(history)
        features = [c.strip() for c in biz.get("categories", "").split(",") if c.strip()][:4]

        payload = {
            "persona": persona,
            "item_name": biz.get("name", "Restaurant"),
            "item_type": "restaurant",
            "location": biz.get("city", "Lagos"),
            "features": features,
        }

        try:
            resp = requests.post(f"{API_BASE}/simulate-review", json=payload, timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                predicted = float(data.get("rating", 3))
                text = data.get("review_text", "")
                review_texts.append(text)

                err = abs(predicted - actual)
                sq_errors.append(err ** 2)
                abs_errors.append(err)

                results.append({
                    "user_id": uid,
                    "business": biz.get("name", biz_id),
                    "actual": actual,
                    "predicted": predicted,
                    "error": round(err, 2),
                    "within_1_star": err <= 1.0,
                    "within_half_star": err <= 0.5,
                    "pidgin_marker_count": count_pidgin(text),
                    "review_snippet": text[:120],
                })

                tick = "✓" if err <= 1 else "✗"
                print(f"  {tick} {uid[:8]}... | actual={actual:.0f} predicted={predicted:.0f} "
                      f"err={err:.1f} | {biz.get('name', '')[:28]}")
            else:
                print(f"  ✗ {uid[:8]}... | HTTP {resp.status_code}")
        except Exception as e:
            print(f"  ✗ {uid[:8]}... | {e}")

    if not results:
        print("  No successful evaluations.")
        return None

    n = len(results)
    rmse = math.sqrt(sum(sq_errors) / n)
    mae = sum(abs_errors) / n
    within_1 = sum(1 for r in results if r["within_1_star"]) / n
    within_half = sum(1 for r in results if r["within_half_star"]) / n
    pidgin = pidgin_distribution(review_texts)

    print(f"\n{'─'*45}")
    print(f"  Samples evaluated       : {n}")
    print(f"  RMSE                    : {rmse:.4f}")
    print(f"  MAE                     : {mae:.4f}")
    print(f"  Within 1 star           : {within_1:.1%}")
    print(f"  Within 0.5 stars        : {within_half:.1%}")
    print(f"  Mean Pidgin markers     : {pidgin['mean_markers']:.2f}")
    print(f"  Fluent Pidgin  (3+)     : {pidgin['fluent_pct']:.1%}")
    print(f"  Light code-switch (1-2) : {pidgin['light_pct']:.1%}")
    print(f"  Formal English  (0)     : {pidgin['formal_pct']:.1%}")
    print(f"{'─'*45}")

    return {
        "n": n,
        "rmse": round(rmse, 4),
        "mae": round(mae, 4),
        "within_1_star_pct": round(within_1, 4),
        "within_half_star_pct": round(within_half, 4),
        "pidgin": pidgin,
        "results": results,
    }


# ── Task B ─────────────────────────────────────────────────────────────────

def evaluate_task_b(reviews: list, biz_lookup: dict) -> dict | None:
    print(f"\n{'='*55}")
    print("TASK B — Recommendations (cold-start, Yelp-mined)")
    print(f"{'='*55}")
    print("  Note: Yelp dataset is US/Canada-based. Task B geographical")
    print("  mismatch is expected and documented. Nigerian grounding rate")
    print("  measures cultural accuracy of our recommendations.")

    user_reviews: dict[str, list] = {}
    for r in reviews:
        user_reviews.setdefault(r["user_id"], []).append(r)

    # Need at least one 4+ star review to have meaningful ground truth
    candidates = [
        uid for uid, revs in user_reviews.items()
        if any(r["stars"] >= 4 for r in revs)
    ]

    rng = random.Random(42)
    sampled = rng.sample(candidates, min(20, len(candidates)))

    results: list[dict] = []
    coverage_hits = 0
    nigerian_hits = 0
    relevance_hits = 0

    for uid in sampled:
        user_revs = user_reviews[uid]
        liked = [r for r in user_revs if r["stars"] >= 4]

        # Use their highest-rated business as the taste signal
        top_review = max(liked, key=lambda r: r["stars"])
        top_biz = biz_lookup.get(top_review["business_id"], {})
        city = top_biz.get("city", "Lagos")

        raw_cats = top_biz.get("categories", "")
        meaningful_cats = [
            c.strip() for c in raw_cats.split(",")
            if c.strip() and c.strip() not in GENERIC_CATEGORIES
        ]
        preferred = meaningful_cats[0] if meaningful_cats else (raw_cats.split(",")[0].strip() or "local food")

        avg = sum(r["stars"] for r in user_revs) / len(user_revs)
        price_range = "budget" if avg < 3 else "premium" if avg > 4 else "mid-range"

        payload = {
            "cold_start_signals": {
                "city": city,
                "preferred_food": preferred,
                "price_range": price_range,
            }
        }

        # Keywords to test category relevance in returned reasons
        cat_keywords = {
            w for w in re.findall(r"[a-z]+", preferred.lower())
            if w not in STOPWORDS and len(w) > 3
        }

        try:
            resp = requests.post(f"{API_BASE}/recommend", json=payload, timeout=30)
            if resp.status_code == 200:
                recs = resp.json()
                rec_list = recs if isinstance(recs, list) else recs.get("recommendations", [])

                has_results = len(rec_list) > 0
                if has_results:
                    coverage_hits += 1

                # Nigerian grounding: do names/notes/reasons mention Nigerian places?
                all_text = " ".join(
                    f"{r.get('item_name','')} {r.get('cultural_note','')} {r.get('reason','')}"
                    for r in rec_list
                ).lower()
                is_nigerian = any(city_kw in all_text for city_kw in NIGERIAN_CITIES)
                if is_nigerian:
                    nigerian_hits += 1

                # Category relevance: does any match_reason echo user's food preference?
                reasons = " ".join(r.get("reason", "") for r in rec_list).lower()
                has_relevance = bool(cat_keywords) and any(kw in reasons for kw in cat_keywords)
                if has_relevance:
                    relevance_hits += 1

                results.append({
                    "user_id": uid,
                    "city": city,
                    "preferred": preferred,
                    "price_range": price_range,
                    "returned_results": len(rec_list),
                    "is_nigerian": is_nigerian,
                    "has_relevance": has_relevance,
                    "cat_keywords": list(cat_keywords),
                    "top_recs": [r.get("item_name", "") for r in rec_list[:3]],
                })

                tick = "✓" if has_results else "✗"
                grounding = "Nigerian" if is_nigerian else "non-Nigerian"
                print(f"  {tick} {uid[:8]}... | {preferred[:22]:22s} | {grounding}")
                print(f"     Recs: {', '.join(r.get('item_name','') for r in rec_list[:3])}")
            else:
                print(f"  ✗ {uid[:8]}... | HTTP {resp.status_code}")
        except Exception as e:
            print(f"  ✗ {uid[:8]}... | {e}")

    if not results:
        print("  No successful evaluations.")
        return None

    n = len(results)
    coverage = coverage_hits / n
    nigerian_rate = nigerian_hits / n
    relevance = relevance_hits / n

    print(f"\n{'─'*45}")
    print(f"  Samples evaluated      : {n}")
    print(f"  Coverage rate          : {coverage:.1%}  (queries that returned results)")
    print(f"  Nigerian grounding     : {nigerian_rate:.1%}  (results in Nigerian context)")
    print(f"  Category relevance     : {relevance:.1%}  (reasons echo user food prefs)")
    print(f"{'─'*45}")

    return {
        "n": n,
        "coverage_rate": round(coverage, 4),
        "nigerian_grounding_rate": round(nigerian_rate, 4),
        "category_relevance_rate": round(relevance, 4),
        "results": results,
    }


# ── Main ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    API_BASE = sys.argv[1] if len(sys.argv) > 1 else API_BASE

    print("NaijaTaste AI — Nigerian Evaluation Suite (Yelp-mined)")
    print(f"API: {API_BASE}")

    reviews, biz_lookup = load_data()
    task_a = evaluate_task_a(reviews, biz_lookup)
    task_b = evaluate_task_b(reviews, biz_lookup)

    output = {
        "note": (
            "Note: Yelp dataset is US/Canada-based. Task B geographical mismatch "
            "is expected and documented. Nigerian grounding rate measures cultural "
            "accuracy of our recommendations."
        ),
        "task_a": task_a,
        "task_b": task_b,
    }

    out_path = Path(__file__).parent.parent / "evaluation_results_nigerian.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"\n✅ Results saved to {out_path}")
    print("✅ Evaluation complete.")
