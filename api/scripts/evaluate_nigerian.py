"""
NaijaTaste — Nigerian Evaluation Suite
Streams test cases from the full Yelp dataset (NDJSON, line-by-line).
Falls back to the sample JSON files if the full dataset is not found.

Full dataset paths (relative to repo root):
  Yel-JSON/Yelp JSON/yelp_dataset/yelp_academic_dataset_review.json
  Yel-JSON/Yelp JSON/yelp_dataset/yelp_academic_dataset_business.json

Dataset note: Yelp is US/Canada-based. Task B geographical mismatch is
expected and documented. Nigerian grounding rate measures cultural accuracy
of our recommendations.
"""

import json
import math
import random
import re
import sys
from pathlib import Path

import time

import requests

# ── Paths ──────────────────────────────────────────────────────────────────
REPO_ROOT = Path(__file__).parent.parent.parent

FULL_REVIEWS_PATH = (
    REPO_ROOT / "Yel-JSON" / "Yelp JSON" / "yelp_dataset"
    / "yelp_academic_dataset_review.json"
)
FULL_BUSINESSES_PATH = (
    REPO_ROOT / "Yel-JSON" / "Yelp JSON" / "yelp_dataset"
    / "yelp_academic_dataset_business.json"
)

SAMPLE_REVIEWS_PATH = REPO_ROOT / "prompts" / "yelp_sample_reviews.json"
SAMPLE_BUSINESSES_PATH = REPO_ROOT / "prompts" / "yelp_sample_businesses.json"

API_BASE = "https://naijataste-api-vcp4.onrender.com"

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


# ── Streaming loaders (full dataset) ──────────────────────────────────────

def stream_reviews(path: Path, max_users: int = 500, min_reviews: int = 3) -> dict:
    """Stream NDJSON reviews; stop once max_users qualified users collected."""
    user_reviews: dict[str, list] = {}
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                review = json.loads(line)
                uid = review.get("user_id")
                if uid:
                    user_reviews.setdefault(uid, []).append({
                        "review_id": review.get("review_id", ""),
                        "stars": review.get("stars"),
                        "text": review.get("text", "")[:300],
                        "business_id": review.get("business_id"),
                        "user_id": uid,
                    })
            except Exception:
                continue
            qualified = sum(1 for revs in user_reviews.values() if len(revs) >= min_reviews)
            if qualified >= max_users:
                break
    return user_reviews


def stream_businesses(path: Path, business_ids: set) -> dict:
    """Stream NDJSON businesses; keep only those in business_ids."""
    businesses: dict = {}
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                biz = json.loads(line)
                bid = biz.get("business_id")
                if bid in business_ids:
                    businesses[bid] = {
                        "name": biz.get("name"),
                        "city": biz.get("city"),
                        "state": biz.get("state"),
                        "categories": biz.get("categories", ""),
                        "stars": biz.get("stars"),
                    }
            except Exception:
                continue
    return businesses


# ── Sample loaders (fallback) ──────────────────────────────────────────────

def load_sample_data() -> tuple[dict, dict]:
    with open(SAMPLE_REVIEWS_PATH, encoding="utf-8") as f:
        review_list = json.load(f)
    with open(SAMPLE_BUSINESSES_PATH, encoding="utf-8") as f:
        biz_lookup = json.load(f)

    user_reviews: dict[str, list] = {}
    for r in review_list:
        user_reviews.setdefault(r["user_id"], []).append(r)
    return user_reviews, biz_lookup


# ── Data loader — picks full or sample ────────────────────────────────────

def load_data() -> tuple[dict, dict]:
    """Returns (user_reviews dict, biz_lookup dict)."""
    if FULL_REVIEWS_PATH.exists() and FULL_BUSINESSES_PATH.exists():
        print(f"[INFO] Streaming full Yelp dataset from {FULL_REVIEWS_PATH.parent}")
        print("       Collecting 500 users with 3+ reviews — this may take a few minutes...")
        user_reviews = stream_reviews(FULL_REVIEWS_PATH, max_users=500, min_reviews=3)
        all_biz_ids = {
            r["business_id"]
            for revs in user_reviews.values()
            for r in revs
            if r.get("business_id")
        }
        print(f"       Fetched {len(user_reviews)} users | {len(all_biz_ids)} unique businesses")
        print("       Streaming businesses file...")
        biz_lookup = stream_businesses(FULL_BUSINESSES_PATH, all_biz_ids)
        print(f"       Loaded {len(biz_lookup)} businesses. Dataset ready.")
        return user_reviews, biz_lookup
    else:
        print("[WARN] Full dataset not found, falling back to sample files")
        print(f"       (Expected: {FULL_REVIEWS_PATH})")
        return load_sample_data()


# ── Helpers ────────────────────────────────────────────────────────────────

def extract_tone_keywords(texts: list[str]) -> list[str]:
    words = []
    for t in texts:
        words.extend(re.findall(r"[a-z]+", t.lower()))
    freq: dict[str, int] = {}
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

def evaluate_task_a(user_reviews: dict, biz_lookup: dict) -> dict | None:
    print(f"\n{'='*55}")
    print("TASK A — Review Simulation (leave-one-out, Yelp-mined)")
    print(f"{'='*55}")

    eligible = {uid: revs for uid, revs in user_reviews.items() if len(revs) >= 2}
    print(f"  Dataset: {sum(len(v) for v in user_reviews.values())} reviews | "
          f"{len(user_reviews)} unique users")
    print(f"  Users with 2+ reviews (eligible): {len(eligible)}")

    rng = random.Random(42)
    sampled = rng.sample(list(eligible.keys()), min(30, len(eligible)))

    sq_errors: list[float] = []
    abs_errors: list[float] = []
    review_texts: list[str] = []
    results: list[dict] = []

    total = len(sampled)
    for i, uid in enumerate(sampled):
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
            print(f"  [{i+1}/{total}] Calling /simulate-review... (3s delay)")
            time.sleep(3)
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

                tick = "OK" if err <= 1 else "XX"
                print(f"  [{tick}] {uid[:8]}... | actual={actual:.0f} predicted={predicted:.0f} "
                      f"err={err:.1f} | {biz.get('name', '')[:28]}")
            else:
                print(f"  [--] {uid[:8]}... | HTTP {resp.status_code}")
        except Exception as e:
            print(f"  [!!] {uid[:8]}... | {e}")

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

def evaluate_task_b(user_reviews: dict, biz_lookup: dict) -> dict | None:
    print(f"\n{'='*55}")
    print("TASK B — Recommendations (cold-start, Yelp-mined)")
    print(f"{'='*55}")
    print("  Note: Yelp dataset is US/Canada-based. Task B geographical")
    print("  mismatch is expected and documented. Nigerian grounding rate")
    print("  measures cultural accuracy of our recommendations.")

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

    total = len(sampled)
    for i, uid in enumerate(sampled):
        user_revs = user_reviews[uid]
        liked = [r for r in user_revs if r["stars"] >= 4]

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

        cat_keywords = {
            w for w in re.findall(r"[a-z]+", preferred.lower())
            if w not in STOPWORDS and len(w) > 3
        }

        try:
            print(f"  [{i+1}/{total}] Calling /recommend... (3s delay)")
            time.sleep(3)
            resp = requests.post(f"{API_BASE}/recommend", json=payload, timeout=30)
            if resp.status_code == 200:
                recs = resp.json()
                rec_list = recs if isinstance(recs, list) else recs.get("recommendations", [])

                has_results = len(rec_list) > 0
                if has_results:
                    coverage_hits += 1

                all_text = " ".join(
                    f"{r.get('item_name','')} {r.get('cultural_note','')} {r.get('reason','')}"
                    for r in rec_list
                ).lower()
                is_nigerian = any(city_kw in all_text for city_kw in NIGERIAN_CITIES)
                if is_nigerian:
                    nigerian_hits += 1

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

                tick = "OK" if has_results else "--"
                grounding = "Nigerian" if is_nigerian else "non-Nigerian"
                print(f"  [{tick}] {uid[:8]}... | {preferred[:22]:22s} | {grounding}")
                print(f"     Recs: {', '.join(r.get('item_name','') for r in rec_list[:3])}")
            else:
                print(f"  [--] {uid[:8]}... | HTTP {resp.status_code}")
        except Exception as e:
            print(f"  [!!] {uid[:8]}... | {e}")

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

    print("NaijaTaste — Nigerian Evaluation Suite")
    print(f"API: {API_BASE}")

    user_reviews, biz_lookup = load_data()
    task_a = evaluate_task_a(user_reviews, biz_lookup)
    task_b = evaluate_task_b(user_reviews, biz_lookup)

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
    print(f"\nResults saved to {out_path}")
    print("Evaluation complete.")
