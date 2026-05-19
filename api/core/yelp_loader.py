import json
import re
from collections import Counter
from pathlib import Path
from typing import Optional

import pandas as pd

# ---------------------------------------------------------------------------
# Path resolution (works locally and inside Docker at /app)
# ---------------------------------------------------------------------------


def _find_yelp_files() -> tuple[Path, Path]:
    """
    Return (review_file, business_file), preferring the pre-sampled JSON
    files in prompts/ over the full JSONL dataset in Yel-JSON/.
    """
    _root_local  = Path(__file__).resolve().parents[2]
    _root_docker = Path("/app")

    candidates: list[tuple[Path, Path]] = [
        # Sampled files (small, preferred for Docker)
        (
            _root_docker / "prompts" / "yelp_sample_reviews.json",
            _root_docker / "prompts" / "yelp_sample_businesses.json",
        ),
        (
            _root_local / "prompts" / "yelp_sample_reviews.json",
            _root_local / "prompts" / "yelp_sample_businesses.json",
        ),
        # Full dataset (local dev only)
        (
            _root_local / "Yel-JSON" / "Yelp JSON" / "yelp_dataset"
            / "yelp_academic_dataset_review.json",
            _root_local / "Yel-JSON" / "Yelp JSON" / "yelp_dataset"
            / "yelp_academic_dataset_business.json",
        ),
    ]

    for review_path, business_path in candidates:
        if review_path.exists() and business_path.exists():
            return review_path, business_path

    tried = "\n".join(
        f"  reviews: {r}\n  businesses: {b}" for r, b in candidates
    )
    raise FileNotFoundError(
        f"Yelp data files not found. Tried:\n{tried}"
    )


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


def _read_json_or_jsonl(path: Path, max_rows: int = 0) -> list[dict]:
    """Read either a JSON array file or a JSONL file."""
    with open(path, "r", encoding="utf-8") as fh:
        first = fh.read(1)
    if first == "[":
        with open(path, "r", encoding="utf-8") as fh:
            return json.load(fh)
    # JSONL
    rows: list[dict] = []
    with open(path, "r", encoding="utf-8") as fh:
        for i, line in enumerate(fh):
            if max_rows and i >= max_rows:
                break
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def _load_data() -> None:
    global _user_reviews, _business_lookup

    if _user_reviews is not None:
        return  # already loaded

    review_file, business_file = _find_yelp_files()
    print(f"[yelp_loader] loading reviews from  {review_file}")
    print(f"[yelp_loader] loading businesses from {business_file}")

    # --- reviews ---
    rows = _read_json_or_jsonl(review_file, max_rows=_MAX_REVIEWS)

    _user_reviews = {}
    for row in rows:
        uid = row.get("user_id", "")
        if uid:
            _user_reviews.setdefault(uid, []).append(row)

    # --- businesses (may be a dict {business_id: {...}} or a list) ---
    with open(business_file, "r", encoding="utf-8") as fh:
        raw = json.load(fh) if business_file.suffix == ".json" else None

    if raw is None:
        businesses = _read_json_or_jsonl(business_file)
        _business_lookup = {b["business_id"]: b for b in businesses}
    elif isinstance(raw, dict):
        _business_lookup = raw
    else:
        _business_lookup = {b["business_id"]: b for b in raw}


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
