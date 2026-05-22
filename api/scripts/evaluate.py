import json
import math
import requests
import numpy as np
from pathlib import Path

API_BASE = "https://naijataste-api.onrender.com"  # change to localhost for local runs

# ── Load Yelp sample data ──────────────────────────────────────────────────
REVIEWS_PATH = Path(__file__).parent.parent.parent / "prompts" / "yelp_sample_reviews.json"
BUSINESSES_PATH = Path(__file__).parent.parent.parent / "prompts" / "yelp_sample_businesses.json"

with open(REVIEWS_PATH) as f:
    reviews = json.load(f)

with open(BUSINESSES_PATH) as f:
    biz_lookup = json.load(f)  # already keyed by business_id

# ── Task A — RMSE Evaluation ───────────────────────────────────────────────
def evaluate_task_a(sample_size: int = 50):
    """
    For each sampled review:
    1. Build persona from that user's OTHER reviews (leave-one-out)
    2. Call /simulate-review
    3. Compare predicted rating vs actual rating
    4. Compute RMSE
    """
    print(f"\n{'='*50}")
    print("TASK A — Rating Accuracy (RMSE)")
    print(f"{'='*50}")

    # Group reviews by user
    user_reviews = {}
    for r in reviews:
        uid = r.get("user_id", "unknown")
        user_reviews.setdefault(uid, []).append(r)

    # Only use users with 2+ reviews (need history + test item)
    eligible = {uid: revs for uid, revs in user_reviews.items() if len(revs) >= 2}

    # Sample users
    sampled_users = list(eligible.keys())[:sample_size]

    errors = []
    results = []

    for uid in sampled_users:
        user_revs = eligible[uid]

        # Leave-one-out: use all but last review as history, predict last
        history = user_revs[:-1]
        test_review = user_revs[-1]

        actual_rating = test_review.get("stars", 3)
        biz_id = test_review.get("business_id", "")
        biz = biz_lookup.get(biz_id, {})

        # Build persona from history
        avg_rating = sum(r.get("stars", 3) for r in history) / len(history)
        sample_texts = [r.get("text", "")[:200] for r in history[:3]]

        persona = {
            "user_id": uid,
            "avg_rating": round(avg_rating, 2),
            "rating_tendency": "harsh" if avg_rating < 3 else "generous" if avg_rating > 4 else "balanced",
            "price_sensitivity": "high" if avg_rating < 3 else "medium",
            "tone_keywords": ["food", "service", "price"],
            "total_reviews": len(history),
            "sample_reviews": sample_texts,
        }

        payload = {
            "persona": persona,
            "item_name": biz.get("name", "Restaurant"),
            "item_type": "restaurant",
            "location": biz.get("city", "Lagos"),
            "features": biz.get("categories", "").split(",")[:4] if biz.get("categories") else [],
        }

        try:
            resp = requests.post(f"{API_BASE}/simulate-review", json=payload, timeout=30)
            if resp.status_code == 200:
                predicted = resp.json().get("rating", 3)
                error = (predicted - actual_rating) ** 2
                errors.append(error)
                results.append({
                    "user_id": uid,
                    "actual": actual_rating,
                    "predicted": predicted,
                    "error": abs(predicted - actual_rating),
                })
                print(f"  ✓ User {uid[:8]}... | Actual: {actual_rating} | Predicted: {predicted}")
            else:
                print(f"  ✗ User {uid[:8]}... | API error: {resp.status_code}")
        except Exception as e:
            print(f"  ✗ User {uid[:8]}... | Exception: {e}")

    if errors:
        rmse = math.sqrt(sum(errors) / len(errors))
        mae = sum(r["error"] for r in results) / len(results)
        print(f"\n{'─'*40}")
        print(f"  Samples evaluated : {len(errors)}")
        print(f"  RMSE              : {rmse:.4f}")
        print(f"  MAE               : {mae:.4f}")
        print(f"  Target RMSE       : < 1.0 (good), < 0.8 (excellent)")
        print(f"{'─'*40}")
        return {"rmse": rmse, "mae": mae, "samples": len(errors), "results": results}
    else:
        print("  No successful evaluations")
        return None


# ── Task B — NDCG@10 Evaluation ───────────────────────────────────────────
def dcg_at_k(relevances: list, k: int = 10) -> float:
    relevances = relevances[:k]
    return sum(rel / math.log2(i + 2) for i, rel in enumerate(relevances))


def ndcg_at_k(predicted: list, ground_truth: list, k: int = 10) -> float:
    relevances = [1 if item in ground_truth else 0 for item in predicted[:k]]
    ideal = sorted(relevances, reverse=True)
    dcg = dcg_at_k(relevances, k)
    idcg = dcg_at_k(ideal, k)
    return dcg / idcg if idcg > 0 else 0.0


def evaluate_task_b(sample_size: int = 30):
    """
    For each sampled user:
    1. Get their actual highly-rated businesses (4+ stars) as ground truth
    2. Call /recommend with their persona
    3. Compare recommended items vs ground truth
    4. Compute NDCG@10 and Hit Rate
    """
    print(f"\n{'='*50}")
    print("TASK B — Recommendation Quality (NDCG@10)")
    print(f"{'='*50}")

    # Group reviews by user
    user_reviews = {}
    for r in reviews:
        uid = r.get("user_id", "unknown")
        user_reviews.setdefault(uid, []).append(r)

    eligible = {uid: revs for uid, revs in user_reviews.items() if len(revs) >= 3}
    sampled_users = list(eligible.keys())[:sample_size]

    ndcg_scores = []
    hit_rates = []
    results = []

    for uid in sampled_users:
        user_revs = eligible[uid]

        # Ground truth: businesses user rated 4+ stars
        ground_truth_ids = [
            r.get("business_id") for r in user_revs if r.get("stars", 0) >= 4
        ]
        ground_truth_names = [
            biz_lookup.get(bid, {}).get("name", "") for bid in ground_truth_ids
        ]

        if not ground_truth_names:
            continue

        # Build cold-start signals from user history
        avg_rating = sum(r.get("stars", 3) for r in user_revs) / len(user_revs)
        top_biz = biz_lookup.get(user_revs[0].get("business_id", ""), {})

        payload = {
            "cold_start_signals": {
                "city": top_biz.get("city", "Lagos"),
                "preferred_food": top_biz.get("categories", "Nigerian food"),
                "price_range": "budget" if avg_rating < 3.5 else "mid-range",
            }
        }

        try:
            resp = requests.post(f"{API_BASE}/recommend", json=payload, timeout=30)
            if resp.status_code == 200:
                recs = resp.json()
                # Handle both list response and dict with recommendations key
                if isinstance(recs, list):
                    rec_names = [r.get("item_name", r.get("name", "")) for r in recs]
                else:
                    rec_names = [
                        r.get("item_name", r.get("name", ""))
                        for r in recs.get("recommendations", [])
                    ]

                ndcg = ndcg_at_k(rec_names, ground_truth_names, k=10)
                hit = 1 if any(name in ground_truth_names for name in rec_names) else 0

                ndcg_scores.append(ndcg)
                hit_rates.append(hit)
                results.append({
                    "user_id": uid,
                    "ndcg": ndcg,
                    "hit": hit,
                    "recommended": rec_names[:3],
                    "ground_truth": ground_truth_names[:3],
                })
                print(f"  ✓ User {uid[:8]}... | NDCG@10: {ndcg:.4f} | Hit: {hit}")
            else:
                print(f"  ✗ User {uid[:8]}... | API error: {resp.status_code}")
        except Exception as e:
            print(f"  ✗ User {uid[:8]}... | Exception: {e}")

    if ndcg_scores:
        avg_ndcg = sum(ndcg_scores) / len(ndcg_scores)
        avg_hit = sum(hit_rates) / len(hit_rates)
        print(f"\n{'─'*40}")
        print(f"  Samples evaluated : {len(ndcg_scores)}")
        print(f"  NDCG@10           : {avg_ndcg:.4f}")
        print(f"  Hit Rate@10       : {avg_hit:.4f}")
        print(f"  Target NDCG@10    : > 0.3 (good), > 0.5 (excellent)")
        print(f"{'─'*40}")
        return {
            "ndcg_at_10": avg_ndcg,
            "hit_rate": avg_hit,
            "samples": len(ndcg_scores),
            "results": results,
        }
    else:
        print("  No successful evaluations")
        return None


# ── Save results ───────────────────────────────────────────────────────────
def save_results(task_a_results, task_b_results):
    output = {
        "evaluation_date": "2026-05-20",
        "api_base": API_BASE,
        "task_a": task_a_results,
        "task_b": task_b_results,
    }
    output_path = Path(__file__).parent.parent / "evaluation_results.json"
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"\n✅ Results saved to evaluation_results.json")


# ── Main ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("NaijaTaste — Evaluation Suite")
    print("Running against:", API_BASE)

    task_a = evaluate_task_a(sample_size=50)
    task_b = evaluate_task_b(sample_size=30)

    if task_a or task_b:
        save_results(task_a, task_b)

    print("\n✅ Evaluation complete.")
