import json
import requests
import math
from pathlib import Path

API_BASE = "https://naijataste-api.onrender.com"

# Nigerian test personas — manually crafted ground truth
NIGERIAN_TEST_CASES_TASK_A = [
    {
        "persona": {
            "avg_rating": 2.5,
            "rating_tendency": "harsh",
            "price_sensitivity": "high",
            "tone_keywords": ["overpriced", "small portion", "slow service"],
            "total_reviews": 23,
            "sample_reviews": [
                "The food no worth the price at all. Abeg make them reduce am.",
                "Service slow like tortoise. I won't be coming back."
            ]
        },
        "item_name": "Yellow Chilli Victoria Island",
        "location": "Lagos",
        "features": ["expensive", "fine dining", "small portions"],
        "expected_rating_range": [1, 2],
        "expected_tone": "pidgin-heavy"
    },
    {
        "persona": {
            "avg_rating": 4.5,
            "rating_tendency": "generous",
            "price_sensitivity": "low",
            "tone_keywords": ["amazing", "correct", "must visit"],
            "total_reviews": 67,
            "sample_reviews": [
                "This place sweet die! Everything correct from start to finish.",
                "Best jollof in Lagos, no cap. The vibes too correct."
            ]
        },
        "item_name": "Mama Cass Restaurant",
        "location": "Lagos",
        "features": ["affordable", "local food", "busy", "authentic"],
        "expected_rating_range": [4, 5],
        "expected_tone": "positive-pidgin"
    },
    {
        "persona": {
            "avg_rating": 3.2,
            "rating_tendency": "balanced",
            "price_sensitivity": "medium",
            "tone_keywords": ["decent", "okay", "could be better"],
            "total_reviews": 12,
            "sample_reviews": [
                "Food was okay but nothing special. Service decent enough.",
                "Average experience. Won't rush back but won't avoid either."
            ]
        },
        "item_name": "Chicken Republic",
        "location": "Abuja",
        "features": ["fast food", "consistent", "affordable", "busy"],
        "expected_rating_range": [3, 4],
        "expected_tone": "neutral"
    },
    {
        "persona": {
            "avg_rating": 1.8,
            "rating_tendency": "very_harsh",
            "price_sensitivity": "very_high",
            "tone_keywords": ["waste of money", "terrible", "never again"],
            "total_reviews": 45,
            "sample_reviews": [
                "E be like say dem wan collect my money by force. Rubbish!",
                "I don chop better food for roadside than this. Total waste."
            ]
        },
        "item_name": "Nkoyo Restaurant",
        "location": "Abuja",
        "features": ["very expensive", "fine dining", "upscale"],
        "expected_rating_range": [1, 2],
        "expected_tone": "angry-pidgin"
    },
    {
        "persona": {
            "avg_rating": 4.8,
            "rating_tendency": "very_generous",
            "price_sensitivity": "low",
            "tone_keywords": ["perfect", "5 stars", "exceptional"],
            "total_reviews": 89,
            "sample_reviews": [
                "Every time I come here e dey better than the last time. Pure excellence.",
                "The chef understand assignment. Nigerian food elevated to the max."
            ]
        },
        "item_name": "Terra Kulture Restaurant",
        "location": "Lagos",
        "features": ["cultural dining", "upscale", "authentic Nigerian", "art gallery"],
        "expected_rating_range": [4, 5],
        "expected_tone": "enthusiastic"
    }
]

NIGERIAN_TEST_CASES_TASK_B = [
    {
        "query": "Best suya spots in Abuja",
        "cold_start": {"city": "Abuja", "preferred_food": "suya grilled meat", "price_range": "budget"},
        "expected_keywords": ["suya", "abuja", "grilled"],
        "description": "Suya lover in Abuja"
    },
    {
        "query": "Affordable buka for amala and gbegiri in Lagos",
        "cold_start": {"city": "Lagos", "preferred_food": "amala gbegiri local buka", "price_range": "budget"},
        "expected_keywords": ["amala", "buka", "local", "lagos"],
        "description": "Budget local food lover Lagos"
    },
    {
        "query": "Fine dining restaurants Victoria Island Lagos",
        "cold_start": {"city": "Lagos", "preferred_food": "fine dining continental", "price_range": "premium"},
        "expected_keywords": ["victoria island", "lagos", "dining"],
        "description": "Premium diner Victoria Island"
    },
    {
        "query": "Best jollof rice spots in Lagos",
        "cold_start": {"city": "Lagos", "preferred_food": "jollof rice nigerian", "price_range": "mid-range"},
        "expected_keywords": ["jollof", "lagos", "rice"],
        "description": "Jollof rice enthusiast Lagos"
    },
    {
        "query": "Street food pepper soup in Port Harcourt",
        "cold_start": {"city": "Port Harcourt", "preferred_food": "pepper soup street food", "price_range": "budget"},
        "expected_keywords": ["pepper soup", "port harcourt", "street"],
        "description": "Street food lover Port Harcourt"
    }
]


def evaluate_task_a_nigerian():
    print(f"\n{'='*55}")
    print("TASK A — Nigerian Persona Evaluation")
    print(f"{'='*55}")

    results = []
    rating_errors = []
    tone_hits = 0

    for i, test in enumerate(NIGERIAN_TEST_CASES_TASK_A):
        print(f"\n  Test {i+1}: {test['item_name']} ({test['location']})")
        print(f"  Persona: avg_rating={test['persona']['avg_rating']}, tendency={test['persona']['rating_tendency']}")

        payload = {
            "persona": test["persona"],
            "item_name": test["item_name"],
            "item_type": "restaurant",
            "location": test["location"],
            "features": test["features"],
        }

        try:
            resp = requests.post(f"{API_BASE}/simulate-review", json=payload, timeout=30)
            if resp.status_code == 200:
                result = resp.json()
                predicted_rating = result.get("rating", 3)
                review_text = result.get("review_text", "")

                low, high = test["expected_rating_range"]
                in_range = low <= predicted_rating <= high

                pidgin_markers = ["na", "dey", "abeg", "sha", "abi", "wahala",
                                  "correct", "chop", "dem", "e be"]
                has_pidgin = any(m in review_text.lower() for m in pidgin_markers)

                if in_range:
                    tone_hits += 1

                error = abs(predicted_rating - (low + high) / 2)
                rating_errors.append(error)

                results.append({
                    "test": test["item_name"],
                    "predicted_rating": predicted_rating,
                    "expected_range": test["expected_rating_range"],
                    "in_range": in_range,
                    "has_pidgin": has_pidgin,
                    "review_snippet": review_text[:100],
                })

                status = "✓" if in_range else "✗"
                pidgin_status = "Pidgin detected" if has_pidgin else "No Pidgin"
                print(f"  {status} Predicted: {predicted_rating} | Expected: {low}-{high} | {pidgin_status}")
                print(f"  Preview: \"{review_text[:80]}...\"")
            else:
                print(f"  ✗ API error: {resp.status_code}")
        except Exception as e:
            print(f"  ✗ Exception: {e}")

    if results:
        accuracy = tone_hits / len(results)
        avg_error = sum(rating_errors) / len(rating_errors)
        pidgin_rate = sum(1 for r in results if r["has_pidgin"]) / len(results)

        print(f"\n{'─'*45}")
        print(f"  Tests run          : {len(results)}")
        print(f"  Rating accuracy    : {accuracy:.1%} (predictions in expected range)")
        print(f"  Avg rating error   : {avg_error:.2f} stars")
        print(f"  Pidgin usage rate  : {pidgin_rate:.1%}")
        print(f"{'─'*45}")
        return {
            "tests": len(results),
            "rating_accuracy": accuracy,
            "avg_rating_error": avg_error,
            "pidgin_rate": pidgin_rate,
            "results": results,
        }


def evaluate_task_b_nigerian():
    print(f"\n{'='*55}")
    print("TASK B — Nigerian Recommendation Evaluation")
    print(f"{'='*55}")

    results = []
    relevance_scores = []

    for i, test in enumerate(NIGERIAN_TEST_CASES_TASK_B):
        print(f"\n  Test {i+1}: {test['description']}")

        payload = {"cold_start_signals": test["cold_start"]}

        try:
            resp = requests.post(f"{API_BASE}/recommend", json=payload, timeout=30)
            if resp.status_code == 200:
                recs = resp.json()
                rec_list = recs if isinstance(recs, list) else recs.get("recommendations", [])

                rec_names = [r.get("item_name", r.get("name", "")).lower() for r in rec_list]
                rec_addresses = [r.get("address", "").lower() for r in rec_list]

                all_text = " ".join(rec_names + rec_addresses)
                keyword_hits = sum(
                    1 for kw in test["expected_keywords"] if kw.lower() in all_text
                )
                relevance = keyword_hits / len(test["expected_keywords"])
                relevance_scores.append(relevance)

                nigerian_cities = ["lagos", "abuja", "port harcourt", "ph",
                                   "ibadan", "kano", "nigeria"]
                is_nigerian = any(city in all_text for city in nigerian_cities)

                results.append({
                    "test": test["description"],
                    "relevance": relevance,
                    "is_nigerian": is_nigerian,
                    "top_recs": [r.get("item_name", r.get("name", "")) for r in rec_list[:3]],
                })

                status = "✓" if relevance > 0 else "✗"
                nigerian_status = "Nigerian results" if is_nigerian else "Non-Nigerian results"
                print(f"  {status} Relevance: {relevance:.0%} | {nigerian_status}")
                print(f"  Top recs: {', '.join(r.get('item_name', r.get('name', '')) for r in rec_list[:3])}")
            else:
                print(f"  ✗ API error: {resp.status_code}")
        except Exception as e:
            print(f"  ✗ Exception: {e}")

    if results:
        avg_relevance = sum(relevance_scores) / len(relevance_scores)
        nigerian_rate = sum(1 for r in results if r["is_nigerian"]) / len(results)

        print(f"\n{'─'*45}")
        print(f"  Tests run          : {len(results)}")
        print(f"  Avg relevance      : {avg_relevance:.1%}")
        print(f"  Nigerian accuracy  : {nigerian_rate:.1%}")
        print(f"{'─'*45}")
        return {
            "tests": len(results),
            "avg_relevance": avg_relevance,
            "nigerian_accuracy": nigerian_rate,
            "results": results,
        }


if __name__ == "__main__":
    import sys
    API_BASE = sys.argv[1] if len(sys.argv) > 1 else "https://naijataste-api.onrender.com"

    print("NaijaTaste AI — Nigerian Evaluation Suite")
    print(f"API: {API_BASE}")

    task_a = evaluate_task_a_nigerian()
    task_b = evaluate_task_b_nigerian()

    output = {
        "evaluation_type": "Nigerian-specific evaluation",
        "note": "Standard Yelp evaluation shows RMSE=1.6583 due to US/Nigerian dataset mismatch. This evaluation uses culturally-grounded Nigerian test cases.",
        "task_a": task_a,
        "task_b": task_b,
    }

    output_path = Path(__file__).parent.parent.parent / "api" / "evaluation_results_nigerian.json"
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"\n✅ Nigerian evaluation results saved.")
    print("\n✅ Evaluation complete.")
