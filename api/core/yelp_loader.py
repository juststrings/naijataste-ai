import json
import re
from collections import Counter
from pathlib import Path
from typing import Optional

import pandas as pd

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

_DATA_DIR = (
    Path(__file__).resolve().parents[2]
    / "Yel-JSON"
    / "Yelp JSON"
    / "yelp_dataset"
)
_REVIEW_FILE = _DATA_DIR / "yelp_academic_dataset_review.json"
_BUSINESS_FILE = _DATA_DIR / "yelp_academic_dataset_business.json"

_MAX_REVIEWS = 100_000

# ---------------------------------------------------------------------------
# Module-level cache (lazy-loaded)
# ---------------------------------------------------------------------------

_user_reviews: Optional[dict[str, list[dict]]] = None
_business_lookup: Optional[dict[str, dict]] = None

# ---------------------------------------------------------------------------
# Stopwords for keyword extraction
# ---------------------------------------------------------------------------

_STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "is", "was", "are", "were", "be", "been", "have", "has",
    "had", "do", "does", "did", "will", "would", "could", "should", "may",
    "might", "can", "i", "we", "you", "he", "she", "they", "it", "my",
    "our", "your", "his", "her", "their", "its", "this", "that", "these",
    "those", "not", "no", "so", "if", "as", "by", "from", "up", "out",
    "about", "into", "than", "more", "also", "very", "just", "all", "get",
    "got", "go", "went", "come", "came", "back", "said", "one", "two",
    "three", "there", "here", "when", "then", "what", "which", "who", "how",
    "me", "him", "us", "them", "really", "place", "food", "time", "good",
    "great", "nice", "like", "love", "even", "much", "too", "well", "over",
    "only", "its", "been", "some", "they", "their", "here", "dont",
}

# ---------------------------------------------------------------------------
# Internal loader
# ---------------------------------------------------------------------------


def _load_data() -> None:
    global _user_reviews, _business_lookup

    if _user_reviews is not None:
        return  # already loaded

    if not _REVIEW_FILE.exists():
        raise FileNotFoundError(
            f"Yelp review file not found.\n"
            f"  Expected: {_REVIEW_FILE}\n"
            f"  Ensure the Yelp dataset folder is at: {_DATA_DIR}"
        )
    if not _BUSINESS_FILE.exists():
        raise FileNotFoundError(
            f"Yelp business file not found.\n"
            f"  Expected: {_BUSINESS_FILE}\n"
            f"  Ensure the Yelp dataset folder is at: {_DATA_DIR}"
        )

    # --- reviews (JSONL: one JSON object per line) ---
    rows: list[dict] = []
    with open(_REVIEW_FILE, "r", encoding="utf-8") as fh:
        for i, line in enumerate(fh):
            if i >= _MAX_REVIEWS:
                break
            line = line.strip()
            if line:
                rows.append(json.loads(line))

    # Build user_reviews index
    _user_reviews = {}
    for row in rows:
        uid = row.get("user_id", "")
        if uid:
            _user_reviews.setdefault(uid, []).append(row)

    # --- businesses ---
    businesses: list[dict] = []
    with open(_BUSINESS_FILE, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                businesses.append(json.loads(line))

    _business_lookup = {b["business_id"]: b for b in businesses}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _extract_keywords(texts: list[str], top_n: int = 10) -> list[str]:
    word_re = re.compile(r"[a-z]{3,}")
    counter: Counter = Counter()
    for text in texts:
        words = word_re.findall(text.lower())
        counter.update(w for w in words if w not in _STOPWORDS)
    return [word for word, _ in counter.most_common(top_n)]


def _infer_price_sensitivity(user_id: str) -> str:
    reviews = _user_reviews.get(user_id, [])
    price_ranges: list[int] = []
    for r in reviews:
        biz = _business_lookup.get(r.get("business_id", ""))
        if biz:
            attrs = biz.get("attributes") or {}
            pr = attrs.get("RestaurantsPriceRange2")
            if pr is not None and str(pr).strip().isdigit():
                price_ranges.append(int(str(pr).strip()))
    if not price_ranges:
        return "medium"
    avg_price = sum(price_ranges) / len(price_ranges)
    if avg_price <= 1.5:
        return "high"
    if avg_price >= 3.0:
        return "low"
    return "medium"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def PersonaEncoder(user_id: str) -> dict:
    """Return a persona profile for a Yelp user_id."""
    _load_data()

    reviews = _user_reviews.get(user_id)
    if not reviews:
        return {
            "user_id": user_id,
            "avg_rating": 0.0,
            "rating_tendency": "balanced",
            "price_sensitivity": "medium",
            "tone_keywords": [],
            "total_reviews": 0,
            "sample_reviews": [],
        }

    ratings = [r["stars"] for r in reviews]
    avg_rating = round(sum(ratings) / len(ratings), 2)

    if avg_rating > 4.0:
        rating_tendency = "generous"
    elif avg_rating < 3.0:
        rating_tendency = "harsh"
    else:
        rating_tendency = "balanced"

    sorted_reviews = sorted(
        reviews, key=lambda r: r.get("date", ""), reverse=True
    )
    sample_reviews = [r["text"] for r in sorted_reviews[:3] if r.get("text")]

    texts = [r["text"] for r in reviews if r.get("text")]
    tone_keywords = _extract_keywords(texts)
    price_sensitivity = _infer_price_sensitivity(user_id)

    return {
        "user_id": user_id,
        "avg_rating": avg_rating,
        "rating_tendency": rating_tendency,
        "price_sensitivity": price_sensitivity,
        "tone_keywords": tone_keywords,
        "total_reviews": len(reviews),
        "sample_reviews": sample_reviews,
    }


def get_user_reviews() -> dict[str, list[dict]]:
    _load_data()
    return _user_reviews


def get_business_lookup() -> dict[str, dict]:
    _load_data()
    return _business_lookup
