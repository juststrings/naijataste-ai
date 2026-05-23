"""
NaijaTaste — Nigerian Grounded Evaluation Suite

Uses real Nigerian review data from prompts/ rather than Yelp US personas.

Data sources:
  prompts/few_shot_master.json   — 144 entries with city/tone/price/restaurant_type
  prompts/few_shot_reviews.json  — 30 real named Nigerian restaurants + user profiles

Ground truth is author-constructed from real Nigerian restaurant data.
No public Nigerian restaurant interaction dataset currently exists.
"""

import json
import math
import time
from collections import Counter
from pathlib import Path

import requests

# ── Paths ──────────────────────────────────────────────────────────────────
REPO_ROOT = Path(__file__).parent.parent.parent
MASTER_PATH = REPO_ROOT / "prompts" / "few_shot_master.json"
REVIEWS_PATH = REPO_ROOT / "prompts" / "few_shot_reviews.json"

API_BASE = "https://naijataste-api-vcp4.onrender.com"

NIGERIAN_CITIES_KW = {
    "lagos", "abuja", "port harcourt", "ibadan", "kano",
    "enugu", "lekki", "victoria island", "warri", "benin",
    "surulere", "yaba", "maitama", "wuse", "garki",
}

# ── Related types map ──────────────────────────────────────────────────────
RELATED_TYPES_MAP: dict[str, list[str]] = {
    "local buka":          ["mama put", "local", "nigerian", "buka", "swallow", "amala"],
    "fast food":           ["quick service", "takeaway", "chicken", "burger", "fast food"],
    "fine dining":         ["upscale", "continental", "premium", "restaurant", "fine dining"],
    "suya spot":           ["suya", "grills", "bbq", "street", "local", "night"],
    "amala joint":         ["swallow", "amala", "local", "buka", "nigerian"],
    "pepper soup joint":   ["pepper soup", "local", "nigerian", "buka"],
    "grilled fish spot":   ["fish", "seafood", "fresh", "ocean", "prawns", "grilled"],
    "seafood restaurant":  ["fish", "seafood", "fresh", "ocean", "prawns"],
    "chinese restaurant":  ["asian", "chinese", "noodles", "fried rice", "international"],
    "rooftop bar and grill": ["lounge", "bar", "night", "drinks", "social", "grill"],
    "restaurant":          ["nigerian", "food", "local", "dining"],
}

PRICE_SENSITIVITY_TO_RANGE = {"high": "budget", "medium": "mid", "low": "premium"}

CITY_ALIASES: dict[str, str] = {
    "lagos island": "Lagos",
    "lagos mainland": "Lagos",
    "lagos": "Lagos",
    "abuja": "Abuja",
    "port harcourt": "Port Harcourt",
    "ibadan": "Ibadan",
    "kano": "Kano",
    "warri": "Warri",
    "benin city": "Benin City",
    "benin": "Benin City",
    "enugu": "Enugu",
}


def normalize_city(text: str) -> str:
    t = text.lower().strip()
    for alias, canonical in sorted(CITY_ALIASES.items(), key=lambda x: -len(x[0])):
        if alias in t:
            return canonical
    return "Lagos"


# ── Part 1: Derive personas from few_shot_master.json ──────────────────────

def derive_personas(master: list[dict]) -> list[dict]:
    # Drop the 10 handcrafted entries that have no restaurant_type
    valid = [d for d in master if d.get("restaurant_type")]

    # Group by (city, restaurant_type)
    groups: dict[tuple, list] = {}
    for d in valid:
        key = (d["city"], d["restaurant_type"])
        groups.setdefault(key, []).append(d)

    all_types = list(RELATED_TYPES_MAP.keys())
    personas: list[dict] = []

    for i, ((city, rtype), entries) in enumerate(sorted(groups.items())):
        if len(entries) < 3:
            continue

        avg_rating = sum(d["rating"] for d in entries) / len(entries)
        if avg_rating < 3.5:
            rating_tendency = "harsh"
        elif avg_rating > 4.2:
            rating_tendency = "generous"
        else:
            rating_tendency = "balanced"

        price_counter = Counter(d.get("price_sensitivity", "medium") for d in entries)
        most_common_price = price_counter.most_common(1)[0][0]
        price_range = PRICE_SENSITIVITY_TO_RANGE.get(most_common_price, "mid")

        tone_counter = Counter(d.get("tone", "mixed") for d in entries)
        most_common_tone = tone_counter.most_common(1)[0][0]

        sample_reviews = [d["review"][:200] for d in entries[:3]]

        relevant_types: list[str] = [rtype] + RELATED_TYPES_MAP.get(rtype, [])
        # Irrelevant keywords: from types that are NOT this persona's relevant group
        irrelevant_kw: list[str] = []
        for t in all_types:
            if t not in relevant_types:
                irrelevant_kw.extend(RELATED_TYPES_MAP.get(t, []))
        # Remove keywords that overlap with relevant types (avoid false negatives)
        irrelevant_kw = [kw for kw in irrelevant_kw if kw not in relevant_types]

        personas.append({
            "persona_id": f"{city[:3].upper()}-{rtype[:3].upper()}-{i:02d}",
            "city": city,
            "preferred_food": rtype,
            "price_range": price_range,
            "avg_rating": round(avg_rating, 2),
            "rating_tendency": rating_tendency,
            "tone": most_common_tone,
            "sample_reviews": sample_reviews,
            "relevant_types": relevant_types,
            "irrelevant_types": irrelevant_kw,
            "n_entries": len(entries),
        })

    return personas


# ── Part 2: Ground truth from few_shot_reviews.json ───────────────────────

def _city_from_profile(profile: str) -> str:
    first_segment = profile.split(",")[0].strip()
    return normalize_city(first_segment)


def build_ground_truth(
    reviews_30: list[dict], personas: list[dict]
) -> dict[str, dict[str, int]]:
    """Returns {persona_id: {restaurant_name: relevance_score (0/1/2)}}."""
    ground_truths: dict[str, dict[str, int]] = {}

    for persona in personas:
        gt: dict[str, int] = {}

        for entry in reviews_30:
            restaurant = entry["item"]
            restaurant_city = _city_from_profile(entry["user_profile"])
            combined = (entry["review"] + " " + restaurant).lower()

            same_city = restaurant_city == persona["city"]
            relevant_hits = sum(1 for t in persona["relevant_types"] if t in combined)
            irrelevant_hits = sum(1 for t in persona["irrelevant_types"] if t in combined)

            if same_city and relevant_hits > 0:
                gt[restaurant] = 2
            elif relevant_hits > 0:
                gt[restaurant] = 1
            elif irrelevant_hits > relevant_hits:
                gt[restaurant] = 0
            else:
                gt[restaurant] = 0

        ground_truths[persona["persona_id"]] = gt

    return ground_truths


# ── Part 3: Relevance scoring ──────────────────────────────────────────────

def score_recommendation(rec: dict, persona: dict) -> int:
    rec_text = " ".join([
        rec.get("item_name", ""),
        rec.get("reason", ""),
        rec.get("cultural_note", ""),
        " ".join(rec.get("types", [])),
    ]).lower()

    # Named ground-truth match takes priority
    for real_restaurant, gt_score in persona.get("ground_truth", {}).items():
        if real_restaurant.lower() in rec_text:
            return gt_score

    relevant_hits = sum(1 for t in persona["relevant_types"] if t in rec_text)
    irrelevant_hits = sum(1 for t in persona["irrelevant_types"] if t in rec_text)

    if irrelevant_hits > relevant_hits:
        return 0
    elif relevant_hits >= 2:
        return 2
    elif relevant_hits >= 1:
        return 1
    return 0


# ── Part 4: NDCG and Hit Rate ─────────────────────────────────────────────

def dcg_at_k(relevances: list[int], k: int) -> float:
    return sum(rel / math.log2(i + 2) for i, rel in enumerate(relevances[:k]))


def ndcg_at_k(relevances: list[int], k: int) -> float:
    ideal = sorted(relevances, reverse=True)
    ideal_dcg = dcg_at_k(ideal, k)
    return 0.0 if ideal_dcg == 0 else dcg_at_k(relevances, k) / ideal_dcg


def hit_rate_at_k(relevances: list[int], k: int) -> float:
    return 1.0 if any(r > 0 for r in relevances[:k]) else 0.0


# ── Part 5: Main evaluation loop ──────────────────────────────────────────

def evaluate() -> None:
    with open(MASTER_PATH, encoding="utf-8") as f:
        master: list[dict] = json.load(f)
    with open(REVIEWS_PATH, encoding="utf-8") as f:
        reviews_30: list[dict] = json.load(f)

    print("NaijaTaste — Nigerian Grounded Evaluation Suite")
    print(f"API: {API_BASE}")
    print(f"Loaded {len(master)} master entries, {len(reviews_30)} named restaurant reviews")

    personas = derive_personas(master)
    print(f"Derived {len(personas)} personas (groups with 3+ master entries)")

    ground_truths = build_ground_truth(reviews_30, personas)
    for p in personas:
        p["ground_truth"] = ground_truths[p["persona_id"]]

    print(f"\n{'='*60}")
    print("Persona summary:")
    for p in personas:
        gt_relevant = sum(1 for v in p["ground_truth"].values() if v > 0)
        print(
            f"  {p['persona_id']:25s} n={p['n_entries']:2d} | "
            f"avg_rating={p['avg_rating']:.1f} | "
            f"price={p['price_range']:7s} | gt_relevant={gt_relevant}/30"
        )

    print(f"\n{'='*60}")
    print(f"Running {len(personas)} API calls (3s delay each)...")
    print(f"{'='*60}\n")

    results: list[dict] = []
    coverage_hits = 0
    nigerian_hits = 0
    total = len(personas)

    for i, persona in enumerate(personas):
        query = f"Best {persona['preferred_food']} in {persona['city']}"
        payload = {
            "cold_start_signals": {
                "city": persona["city"],
                "preferred_food": persona["preferred_food"],
                "price_range": persona["price_range"],
            },
            "query": query,
        }

        try:
            print(f"[{i+1:02d}/{total}] {persona['persona_id']} — {query!r} (3s delay)")
            time.sleep(3)
            resp = requests.post(f"{API_BASE}/recommend", json=payload, timeout=45)

            if resp.status_code != 200:
                print(f"  HTTP {resp.status_code} — skipping")
                continue

            data = resp.json()
            recs: list[dict] = data.get("items", [])
            intent: str = data.get("intent", "FOOD_QUERY")
            lang: str = data.get("detected_language", "en")

            if intent != "FOOD_QUERY":
                print(f"  intent={intent} — no food results, skipping")
                continue

            has_coverage = len(recs) >= 3
            if has_coverage:
                coverage_hits += 1

            all_text = " ".join(
                f"{r.get('item_name','')} {r.get('reason','')} {r.get('cultural_note','')}"
                for r in recs
            ).lower()
            is_nigerian = any(kw in all_text for kw in NIGERIAN_CITIES_KW)
            if is_nigerian:
                nigerian_hits += 1

            relevances = [score_recommendation(r, persona) for r in recs]
            ndcg = ndcg_at_k(relevances, 10)
            hit = hit_rate_at_k(relevances, 5)

            rec_names = [r.get("item_name", "") for r in recs]
            print(
                f"  intent={intent} lang={lang} n={len(recs)} | "
                f"NDCG@10={ndcg:.3f} Hit@5={hit:.1f} | "
                f"{'Nigerian' if is_nigerian else 'non-Nigerian'}"
            )
            print(f"  relevances={relevances}")
            safe_recs = ", ".join(r.encode("ascii", "replace").decode("ascii") for r in rec_names[:5])
            print(f"  recs: {safe_recs}")

            results.append({
                "persona_id": persona["persona_id"],
                "city": persona["city"],
                "preferred_food": persona["preferred_food"],
                "price_range": persona["price_range"],
                "tone": persona["tone"],
                "rating_tendency": persona["rating_tendency"],
                "n_master_entries": persona["n_entries"],
                "n_recommendations": len(recs),
                "coverage": has_coverage,
                "is_nigerian": is_nigerian,
                "detected_language": lang,
                "relevances": relevances,
                "ndcg_at_10": round(ndcg, 4),
                "hit_rate_at_5": round(hit, 4),
                "top_recs": rec_names[:5],
            })

        except Exception as exc:
            print(f"  Exception: {exc}")

    if not results:
        print("\nNo successful evaluations.")
        return

    # ── Part 6: Aggregate report ───────────────────────────────────────────
    n = len(results)
    mean_ndcg = sum(r["ndcg_at_10"] for r in results) / n
    mean_hit = sum(r["hit_rate_at_5"] for r in results) / n
    coverage_rate = coverage_hits / n
    nigerian_rate = nigerian_hits / n

    print(f"\n{'='*60}")
    print("AGGREGATE RESULTS")
    print(f"{'='*60}")
    print(f"  Personas evaluated       : {n}")
    print(f"  Mean NDCG@10             : {mean_ndcg:.4f}")
    print(f"  Mean Hit Rate@5          : {mean_hit:.4f}")
    print(f"  Coverage Rate (3+ recs)  : {coverage_rate:.1%}")
    print(f"  Nigerian Grounding Rate  : {nigerian_rate:.1%}")
    print("-" * 60)

    city_groups: dict[str, list] = {}
    for r in results:
        city_groups.setdefault(r["city"], []).append(r)
    print("\nBreakdown by city:")
    for city, grp in sorted(city_groups.items()):
        avg = sum(r["ndcg_at_10"] for r in grp) / len(grp)
        print(f"  {city:20s}  n={len(grp):2d}  NDCG@10={avg:.3f}")

    type_groups: dict[str, list] = {}
    for r in results:
        type_groups.setdefault(r["preferred_food"], []).append(r)
    print("\nBreakdown by restaurant type:")
    for rtype, grp in sorted(type_groups.items()):
        avg = sum(r["ndcg_at_10"] for r in grp) / len(grp)
        print(f"  {rtype:25s}  n={len(grp):2d}  NDCG@10={avg:.3f}")

    out_path = Path(__file__).parent.parent / "evaluation_results_nigerian_grounded.json"
    output = {
        "disclaimer": (
            "Ground truth derived from prompts/few_shot_reviews.json (30 real Nigerian "
            "restaurants, author-labeled) and prompts/few_shot_master.json (144 synthesized "
            "reviews from 500 real Google Maps reviews via Outscraper API). Relevance labels "
            "are author-constructed; no public Nigerian restaurant interaction dataset "
            "currently exists."
        ),
        "api_base": API_BASE,
        "n_personas_evaluated": n,
        "aggregate": {
            "mean_ndcg_at_10": round(mean_ndcg, 4),
            "mean_hit_rate_at_5": round(mean_hit, 4),
            "coverage_rate": round(coverage_rate, 4),
            "nigerian_grounding_rate": round(nigerian_rate, 4),
        },
        "results": results,
    }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nResults saved to {out_path}")
    print("Evaluation complete.")


if __name__ == "__main__":
    evaluate()
