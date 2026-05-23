"""
NaijaTaste — Dual-Mode Task A Evaluation
Compares: Full System (with Nigerian Voice Layer) vs Neutral (no Voice Layer)
          + Multilingual mode (6 personas, language compliance check)

Bug fixes applied vs earlier eval scripts:
  Fix 1: rating_tendency → tone mapping (harsh→pidgin-heavy/formal, etc.)
          applied server-side via TENDENCY_TO_TONE in voice.py
  Fix 2: Nigerian test personas — no Yelp US data, no US city names
  Fix 3: skip_voice_layer=True in neutral mode bypasses few-shots + Pidgin rule
  Fix 4: tone_keywords derived per persona, not hardcoded
"""

import json
import math
import re
import time
from pathlib import Path

import requests

API_BASE = "https://naijataste-api-vcp4.onrender.com"
DELAY = 3

# ── Language markers ────────────────────────────────────────────────────────

PIDGIN_MARKERS = [
    "na", "dey", "abeg", "sha", "abi", "wahala", "chop",
    "correct", "die", "no cap", "o", "sabi", "wetin",
    "oga", "pepper", "sweet", "nor",
]
YORUBA_MARKERS = ["ni", "ti", "mo", "je", "wa", "lo", "fun", "ati", "si", "bi"]
HAUSA_MARKERS  = ["na", "mai", "da", "ba", "shi", "ita", "mu", "su", "ne", "ce"]
IGBO_MARKERS   = ["na", "nke", "ya", "ha", "ka", "di", "nwa", "ebe", "isi"]

LANG_MARKER_MAP: dict[str, list[str]] = {
    "yo":  YORUBA_MARKERS,
    "pcm": PIDGIN_MARKERS,
    "ha":  HAUSA_MARKERS,
    "ig":  IGBO_MARKERS,
}

# ── 20 Nigerian test personas ────────────────────────────────────────────────

NIGERIAN_TEST_PERSONAS: list[dict] = [
    {
        "user_id": "NG_A001", "restaurant": "Yellow Chilli Victoria Island",
        "city": "Lagos", "restaurant_type": "fine dining",
        "avg_rating": 2.5, "rating_tendency": "harsh", "price_sensitivity": "high",
        "actual_rating": 2,
        "tone_keywords": ["expensive", "overrated", "service", "price"],
        "sample_reviews": [
            "This place too expensive for what they offer abeg",
            "Service slow, food cold. Not worth the hype at all",
        ],
    },
    {
        "user_id": "NG_A002", "restaurant": "Buka Hut Yaba",
        "city": "Lagos", "restaurant_type": "local buka",
        "avg_rating": 4.5, "rating_tendency": "generous", "price_sensitivity": "low",
        "actual_rating": 5,
        "tone_keywords": ["correct", "sweet", "cheap", "local"],
        "sample_reviews": [
            "Na here correct food dey! The amala sweet die",
            "Best buka for Yaba hands down. Value for money",
        ],
    },
    {
        "user_id": "NG_A003", "restaurant": "Nkoyo Restaurant Maitama",
        "city": "Abuja", "restaurant_type": "fine dining",
        "avg_rating": 4.2, "rating_tendency": "generous", "price_sensitivity": "low",
        "actual_rating": 4,
        "tone_keywords": ["ambience", "service", "quality", "professional"],
        "sample_reviews": [
            "Lovely ambience and great service. Worth every naira",
            "Top notch restaurant in Abuja. Highly recommended",
        ],
    },
    {
        "user_id": "NG_A004", "restaurant": "Yahuza Suya Spot Abuja",
        "city": "Abuja", "restaurant_type": "street food",
        "avg_rating": 4.8, "rating_tendency": "generous", "price_sensitivity": "low",
        "actual_rating": 5,
        "tone_keywords": ["suya", "fresh", "correct", "pepper"],
        "sample_reviews": [
            "Guy this suya na the best for Abuja no cap",
            "Fresh suya every night. The yaji pepper dey pepper well",
        ],
    },
    {
        "user_id": "NG_A005", "restaurant": "Mama Cass Garki",
        "city": "Abuja", "restaurant_type": "local buka",
        "avg_rating": 3.8, "rating_tendency": "balanced", "price_sensitivity": "medium",
        "actual_rating": 4,
        "tone_keywords": ["food", "okay", "decent", "local"],
        "sample_reviews": [
            "Food decent enough. Nothing special but satisfying",
            "Good local food at reasonable prices. Will return",
        ],
    },
    {
        "user_id": "NG_A006", "restaurant": "The Place Restaurant Lekki",
        "city": "Lagos", "restaurant_type": "restaurant",
        "avg_rating": 4.1, "rating_tendency": "balanced", "price_sensitivity": "medium",
        "actual_rating": 4,
        "tone_keywords": ["jollof", "rice", "portions", "value"],
        "sample_reviews": [
            "The jollof rice here correct o. Portion size good",
            "Consistent quality. Always reliable for a good meal",
        ],
    },
    {
        "user_id": "NG_A007", "restaurant": "Cilantro Lagos",
        "city": "Lagos", "restaurant_type": "fine dining",
        "avg_rating": 3.2, "rating_tendency": "harsh", "price_sensitivity": "high",
        "actual_rating": 3,
        "tone_keywords": ["expensive", "small", "portion", "overpriced"],
        "sample_reviews": [
            "Too expensive for the portion size. I no go return",
            "Overrated. Food okay but not worth the price at all",
        ],
    },
    {
        "user_id": "NG_A008", "restaurant": "Wakkis Grill Abuja",
        "city": "Abuja", "restaurant_type": "grills",
        "avg_rating": 4.4, "rating_tendency": "generous", "price_sensitivity": "medium",
        "actual_rating": 4,
        "tone_keywords": ["grilled", "chicken", "smoky", "correct"],
        "sample_reviews": [
            "Best grilled chicken for Abuja. Always consistent",
            "Smoky flavour correct die. The suya chicken too sweet",
        ],
    },
    {
        "user_id": "NG_A009", "restaurant": "KFC Palms Lekki",
        "city": "Lagos", "restaurant_type": "fast food",
        "avg_rating": 3.5, "rating_tendency": "harsh", "price_sensitivity": "high",
        "actual_rating": 3,
        "tone_keywords": ["slow", "service", "queue", "expensive"],
        "sample_reviews": [
            "Queue too long. Service too slow for fast food abeg",
            "Chicken good but waiting time ridiculous. 3 stars",
        ],
    },
    {
        "user_id": "NG_A010", "restaurant": "Sky Restaurant Bodija Ibadan",
        "city": "Ibadan", "restaurant_type": "restaurant",
        "avg_rating": 4.3, "rating_tendency": "generous", "price_sensitivity": "low",
        "actual_rating": 4,
        "tone_keywords": ["view", "ambience", "food", "rooftop"],
        "sample_reviews": [
            "Beautiful view from the top. Food also correct",
            "Best restaurant in Ibadan. The ambience too nice",
        ],
    },
    {
        "user_id": "NG_A011", "restaurant": "Dominos Pizza Victoria Island",
        "city": "Lagos", "restaurant_type": "fast food",
        "avg_rating": 3.8, "rating_tendency": "balanced", "price_sensitivity": "medium",
        "actual_rating": 4,
        "tone_keywords": ["pizza", "delivery", "quick", "consistent"],
        "sample_reviews": [
            "Pizza always consistent. Delivery could be faster",
            "Good pizza for Lagos. Reliable when you need quick food",
        ],
    },
    {
        "user_id": "NG_A012", "restaurant": "Zinnia Transcorp Hilton Abuja",
        "city": "Abuja", "restaurant_type": "fine dining",
        "avg_rating": 4.6, "rating_tendency": "generous", "price_sensitivity": "low",
        "actual_rating": 5,
        "tone_keywords": ["luxury", "excellent", "service", "premium"],
        "sample_reviews": [
            "World class service and food. Worth every kobo",
            "The best fine dining in Abuja without question",
        ],
    },
    {
        "user_id": "NG_A013", "restaurant": "Iya Basira Buka Mushin",
        "city": "Lagos", "restaurant_type": "local buka",
        "avg_rating": 4.7, "rating_tendency": "generous", "price_sensitivity": "low",
        "actual_rating": 5,
        "tone_keywords": ["correct", "local", "cheap", "authentic"],
        "sample_reviews": [
            "Real correct buka. The eba and egusi sweet die",
            "Authentic Lagos buka experience. Cheap and filling",
        ],
    },
    {
        "user_id": "NG_A014", "restaurant": "Chicken Republic Wuse 2",
        "city": "Abuja", "restaurant_type": "fast food",
        "avg_rating": 3.3, "rating_tendency": "harsh", "price_sensitivity": "high",
        "actual_rating": 3,
        "tone_keywords": ["chicken", "dry", "overpriced", "disappointing"],
        "sample_reviews": [
            "Chicken dry and overpriced. I expected better honestly",
            "Gone downhill. Not what it used to be. Disappointing",
        ],
    },
    {
        "user_id": "NG_A015", "restaurant": "Craftgrill Lekki",
        "city": "Lagos", "restaurant_type": "grills",
        "avg_rating": 4.4, "rating_tendency": "generous", "price_sensitivity": "medium",
        "actual_rating": 4,
        "tone_keywords": ["craft", "grill", "flavour", "nice"],
        "sample_reviews": [
            "The grilled fish here correct o. Nice ambience too",
            "Great spot for grills in Lekki. Will definitely return",
        ],
    },
    {
        "user_id": "NG_A016", "restaurant": "Suya Spot Opebi",
        "city": "Lagos", "restaurant_type": "street food",
        "avg_rating": 4.5, "rating_tendency": "generous", "price_sensitivity": "low",
        "actual_rating": 5,
        "tone_keywords": ["suya", "fresh", "night", "correct"],
        "sample_reviews": [
            "Best suya spot for Opebi no cap. Always fresh",
            "Late night suya here na the move. Correct pepper",
        ],
    },
    {
        "user_id": "NG_A017", "restaurant": "Sage Restaurant VI",
        "city": "Lagos", "restaurant_type": "fine dining",
        "avg_rating": 4.0, "rating_tendency": "balanced", "price_sensitivity": "medium",
        "actual_rating": 4,
        "tone_keywords": ["continental", "okay", "decent", "ambience"],
        "sample_reviews": [
            "Decent continental food. Ambience nice but food average",
            "Good restaurant but nothing exceptional. 4 stars fair",
        ],
    },
    {
        "user_id": "NG_A018", "restaurant": "Ofada Spot Agege",
        "city": "Lagos", "restaurant_type": "local buka",
        "avg_rating": 4.6, "rating_tendency": "generous", "price_sensitivity": "low",
        "actual_rating": 5,
        "tone_keywords": ["ofada", "local", "authentic", "correct"],
        "sample_reviews": [
            "The ofada rice here correct die. Best for Agege area",
            "Authentic ofada spot. The ayamase stew too correct",
        ],
    },
    {
        "user_id": "NG_A019", "restaurant": "Barcelos Abuja",
        "city": "Abuja", "restaurant_type": "fast food",
        "avg_rating": 4.1, "rating_tendency": "balanced", "price_sensitivity": "medium",
        "actual_rating": 4,
        "tone_keywords": ["chicken", "peri-peri", "nice", "consistent"],
        "sample_reviews": [
            "Peri-peri chicken correct. Consistent quality always",
            "Good fast food option in Abuja. Value for money",
        ],
    },
    {
        "user_id": "NG_A020", "restaurant": "Yakoyo Restaurant Abuja",
        "city": "Abuja", "restaurant_type": "local buka",
        "avg_rating": 4.5, "rating_tendency": "generous", "price_sensitivity": "low",
        "actual_rating": 5,
        "tone_keywords": ["local", "correct", "authentic", "abuja"],
        "sample_reviews": [
            "Best local food restaurant in Abuja. Always consistent",
            "Real authentic Nigerian food here. Correct die",
        ],
    },
]

# ── Multilingual overrides (Mode 3) ─────────────────────────────────────────

MULTILINGUAL_OVERRIDES: dict[str, dict] = {
    "NG_A001": {
        "preferred_language": "yo",
        "item_name": "Yellow Chilli Victoria Island, Eko, ile onje ti o gbowon",
    },
    "NG_A002": {
        "preferred_language": "pcm",
        "item_name": "Buka Hut Yaba, correct local chop house",
    },
    "NG_A004": {
        "preferred_language": "yo",
        "item_name": "Yahuza Suya Spot, Abuja, aaye suya ti o dara",
    },
    "NG_A008": {
        "preferred_language": "ha",
        "item_name": "Wakkis Grill Abuja, gidan abinci mai kyau",
    },
    "NG_A013": {
        "preferred_language": "pcm",
        "item_name": "Iya Basira Buka Mushin, correct mama put",
    },
    "NG_A018": {
        "preferred_language": "ig",
        "item_name": "Ofada Spot Agege, ebe oriri nri",
    },
}


# ── Language detection ───────────────────────────────────────────────────────

def detect_language(text: str) -> str:
    words = set(re.findall(r"\b\w+\b", text.lower()))
    scores = {
        lang: sum(1 for m in markers if m in words or m in text.lower())
        for lang, markers in LANG_MARKER_MAP.items()
    }
    best_lang = max(scores, key=lambda k: scores[k])
    return best_lang if scores[best_lang] > 0 else "en"


def has_pidgin(text: str) -> bool:
    words = set(re.findall(r"\b\w+\b", text.lower()))
    hits = sum(1 for m in PIDGIN_MARKERS if m in words or m in text.lower())
    return hits >= 3


# ── Metrics ──────────────────────────────────────────────────────────────────

def compute_metrics(results: list[dict]) -> dict:
    if not results:
        return {}
    errors = [r["error"] for r in results]
    abs_errors = [abs(e) for e in errors]
    n = len(results)
    rmse = math.sqrt(sum(e ** 2 for e in errors) / n)
    mae = sum(abs_errors) / n
    within_1  = sum(1 for e in abs_errors if e <= 1.0) / n
    within_05 = sum(1 for e in abs_errors if e <= 0.5) / n
    pidgin_rate = sum(1 for r in results if r["pidgin"]) / n
    return {
        "n": n,
        "rmse":           round(rmse, 4),
        "mae":            round(mae, 4),
        "within_1_star":  round(within_1, 4),
        "within_0_5_star": round(within_05, 4),
        "pidgin_usage":   round(pidgin_rate, 4),
    }


# ── Payload builder ──────────────────────────────────────────────────────────

def build_payload(persona: dict, mode: str) -> dict:
    p = persona
    payload: dict = {
        "persona": {
            "avg_rating":       round(p["avg_rating"], 2),
            "rating_tendency":  p["rating_tendency"],
            "price_sensitivity": p["price_sensitivity"],
            "tone_keywords":    p["tone_keywords"],
            "total_reviews":    len(p["sample_reviews"]),
            "sample_reviews":   [] if mode == "neutral" else p["sample_reviews"],
        },
        "item_name": p["restaurant"],
        "item_type": p["restaurant_type"],
        "location":  p["city"],
        "features":  [p["restaurant_type"]],
    }
    if mode == "neutral":
        payload["skip_voice_layer"] = True
    if mode == "multilingual":
        override = MULTILINGUAL_OVERRIDES.get(p["user_id"], {})
        if override:
            payload["preferred_language"] = override["preferred_language"]
            payload["item_name"] = override["item_name"]
    return payload


# ── API call ─────────────────────────────────────────────────────────────────

def call_api(payload: dict) -> dict | None:
    time.sleep(DELAY)
    try:
        resp = requests.post(f"{API_BASE}/simulate-review", json=payload, timeout=45)
        if resp.status_code != 200:
            print(f"    HTTP {resp.status_code}: {resp.text[:120]}")
            return None
        return resp.json()
    except Exception as exc:
        print(f"    Exception: {exc}")
        return None


# ── Mode runner ───────────────────────────────────────────────────────────────

def run_mode(mode_name: str) -> list[dict]:
    personas = (
        [p for p in NIGERIAN_TEST_PERSONAS if p["user_id"] in MULTILINGUAL_OVERRIDES]
        if mode_name == "multilingual"
        else NIGERIAN_TEST_PERSONAS
    )
    total = len(personas)
    results: list[dict] = []

    for i, persona in enumerate(personas, 1):
        payload = build_payload(persona, mode_name)
        print(f"  [{i:02d}/{total}] {persona['user_id']} — {persona['restaurant']!r}")
        data = call_api(payload)
        if data is None:
            continue

        predicted = data.get("rating", 0)
        review_text = data.get("review_text", "")
        tone_label  = data.get("tone_label", "")
        actual      = persona["actual_rating"]
        error       = predicted - actual
        pidgin      = has_pidgin(review_text)

        row: dict = {
            "user_id":          persona["user_id"],
            "restaurant":       persona["restaurant"],
            "city":             persona["city"],
            "restaurant_type":  persona["restaurant_type"],
            "rating_tendency":  persona["rating_tendency"],
            "predicted_rating": predicted,
            "actual_rating":    actual,
            "error":            error,
            "tone_label":       tone_label,
            "pidgin":           pidgin,
            "review_snippet":   review_text[:120],
        }

        if mode_name == "multilingual":
            override = MULTILINGUAL_OVERRIDES[persona["user_id"]]
            detected = detect_language(review_text)
            lang_match = detected == override["preferred_language"]
            row["preferred_language"] = override["preferred_language"]
            row["detected_language"]  = detected
            row["language_match"]     = lang_match
            print(
                f"    pred={predicted} actual={actual} err={error:+d} "
                f"pidgin={pidgin} lang_req={override['preferred_language']} "
                f"detected={detected} match={lang_match}"
            )
        else:
            print(
                f"    pred={predicted} actual={actual} err={error:+d} "
                f"pidgin={pidgin} tone={tone_label}"
            )

        results.append(row)

    return results


# ── Report ────────────────────────────────────────────────────────────────────

def print_comparison(full_agg: dict, neutral_agg: dict, multi_agg: dict) -> None:
    full_lang_match    = "N/A"
    neutral_lang_match = "N/A"

    multi_results_with_lang = [
        r for r in _multi_results_global if "language_match" in r
    ]
    if multi_results_with_lang:
        lang_match_rate = sum(1 for r in multi_results_with_lang if r["language_match"]) / len(multi_results_with_lang)
        multi_lang_match = f"{lang_match_rate:.0%}"
    else:
        multi_lang_match = "N/A"

    def pct(val: float) -> str:
        return f"{val:.0%}"

    def fmt(val: float, decimals: int = 4) -> str:
        return f"{val:.{decimals}f}"

    header = f"{'Metric':<22} | {'Full System':>12} | {'Neutral':>12} | {'Multilingual':>12}"
    sep    = "-" * len(header)
    rows   = [
        ("RMSE",            fmt(full_agg["rmse"]),            fmt(neutral_agg["rmse"]),            fmt(multi_agg.get("rmse", float("nan")))),
        ("MAE",             fmt(full_agg["mae"]),             fmt(neutral_agg["mae"]),             fmt(multi_agg.get("mae",  float("nan")))),
        ("Within 1 Star",   pct(full_agg["within_1_star"]),  pct(neutral_agg["within_1_star"]),   pct(multi_agg.get("within_1_star",  0))),
        ("Within 0.5 Star", pct(full_agg["within_0_5_star"]), pct(neutral_agg["within_0_5_star"]), pct(multi_agg.get("within_0_5_star", 0))),
        ("Pidgin/Lang Use", pct(full_agg["pidgin_usage"]),   pct(neutral_agg["pidgin_usage"]),    pct(multi_agg.get("pidgin_usage", 0))),
        ("Language Match",  full_lang_match,                   neutral_lang_match,                   multi_lang_match),
        ("n",               str(full_agg["n"]),               str(neutral_agg["n"]),               str(multi_agg.get("n", 0))),
    ]

    print(f"\n{'='*60}")
    print("COMPARISON TABLE")
    print(f"{'='*60}")
    print(header)
    print(sep)
    for label, full_v, neutral_v, multi_v in rows:
        print(f"{label:<22} | {full_v:>12} | {neutral_v:>12} | {multi_v:>12}")
    print(sep)


# ── Per-language breakdown (Mode 3) ──────────────────────────────────────────

def print_language_breakdown(multi_results: list[dict]) -> None:
    rows = [r for r in multi_results if "language_match" in r]
    if not rows:
        return
    print("\nLanguage Match Breakdown (Mode 3):")
    by_lang: dict[str, list[bool]] = {}
    for r in rows:
        lang = r["preferred_language"]
        by_lang.setdefault(lang, []).append(r["language_match"])
    for lang, matches in sorted(by_lang.items()):
        rate = sum(matches) / len(matches)
        detected = [r["detected_language"] for r in rows if r["preferred_language"] == lang]
        print(f"  {lang:4s}  match={rate:.0%}  detected={detected}")


# ── Main ──────────────────────────────────────────────────────────────────────

_multi_results_global: list[dict] = []


def main() -> None:
    global _multi_results_global

    print("NaijaTaste — Dual-Mode Task A Evaluation")
    print(f"API: {API_BASE}")
    print(f"Personas: {len(NIGERIAN_TEST_PERSONAS)} (Mode 1 & 2), "
          f"{len(MULTILINGUAL_OVERRIDES)} (Mode 3)")
    print(f"Delay: {DELAY}s between calls")

    print(f"\n{'='*60}")
    print("MODE 1: Full System (with Nigerian Voice Layer)")
    print(f"{'='*60}")
    full_results = run_mode("full")
    full_agg = compute_metrics(full_results)
    print(f"  Aggregate: RMSE={full_agg['rmse']} MAE={full_agg['mae']} "
          f"Within1={full_agg['within_1_star']:.0%} Pidgin={full_agg['pidgin_usage']:.0%}")

    print(f"\n{'='*60}")
    print("MODE 2: Neutral (no Voice Layer — skip_voice_layer=True, sample_reviews=[])")
    print(f"{'='*60}")
    neutral_results = run_mode("neutral")
    neutral_agg = compute_metrics(neutral_results)
    print(f"  Aggregate: RMSE={neutral_agg['rmse']} MAE={neutral_agg['mae']} "
          f"Within1={neutral_agg['within_1_star']:.0%} Pidgin={neutral_agg['pidgin_usage']:.0%}")

    print(f"\n{'='*60}")
    print("MODE 3: Multilingual (6 personas, language compliance)")
    print(f"{'='*60}")
    multi_results = run_mode("multilingual")
    _multi_results_global = multi_results
    multi_agg = compute_metrics(multi_results)
    print_language_breakdown(multi_results)
    if multi_agg:
        print(f"  Aggregate: RMSE={multi_agg['rmse']} MAE={multi_agg['mae']} "
              f"Within1={multi_agg['within_1_star']:.0%} Pidgin={multi_agg['pidgin_usage']:.0%}")

    print_comparison(full_agg, neutral_agg, multi_agg)

    out_path = Path(__file__).parent.parent / "evaluation_results_dual_mode.json"
    output = {
        "api_base": API_BASE,
        "disclaimer": (
            "Ground truth (actual_rating) is author-constructed from real Nigerian "
            "restaurant knowledge. 20 personas cover Lagos, Abuja, and Ibadan across "
            "fine dining, local buka, fast food, grills, and street food categories."
        ),
        "mode_1_full_system": {
            "description": "Full Nigerian Voice Layer: few-shots (tone-fixed) + Pidgin rule",
            "aggregate": full_agg,
            "results": full_results,
        },
        "mode_2_neutral": {
            "description": "No Voice Layer: skip_voice_layer=True, sample_reviews=[]",
            "aggregate": neutral_agg,
            "results": neutral_results,
        },
        "mode_3_multilingual": {
            "description": "6 personas with preferred_language + linguistic context in item_name",
            "aggregate": multi_agg,
            "results": multi_results,
        },
    }
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(output, fh, indent=2, ensure_ascii=False)

    print(f"\nResults saved to {out_path}")
    print("Evaluation complete.")


if __name__ == "__main__":
    main()
