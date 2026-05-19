"""
sample_yelp.py  —  Run once to build a small deployable Yelp sample.

Usage (from inside api/):
    python scripts/sample_yelp.py
"""

import json
from collections import defaultdict
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths  (script lives at api/scripts/, so parents[2] = project root)
# ---------------------------------------------------------------------------

_SCRIPT_DIR = Path(__file__).resolve().parent
_DATASET_DIR = _SCRIPT_DIR.parents[1] / "Yel-JSON" / "Yelp JSON" / "yelp_dataset"
_OUT_DIR     = _SCRIPT_DIR.parents[1] / "prompts"

REVIEW_FILE   = _DATASET_DIR / "yelp_academic_dataset_review.json"
BUSINESS_FILE = _DATASET_DIR / "yelp_academic_dataset_business.json"

OUT_REVIEWS    = _OUT_DIR / "yelp_sample_reviews.json"
OUT_BUSINESSES = _OUT_DIR / "yelp_sample_businesses.json"

MIN_REVIEWS_PER_USER = 5
MAX_REVIEWS_PER_USER = 3
TARGET_USERS         = 500

# ---------------------------------------------------------------------------
# Step 1: first pass — count reviews per user
# ---------------------------------------------------------------------------

print("Pass 1: counting reviews per user …")

user_review_count: dict[str, int] = defaultdict(int)

with open(REVIEW_FILE, "r", encoding="utf-8") as fh:
    for line in fh:
        line = line.strip()
        if not line:
            continue
        r = json.loads(line)
        user_review_count[r["user_id"]] += 1

qualifying_users = {
    uid for uid, cnt in user_review_count.items()
    if cnt >= MIN_REVIEWS_PER_USER
}
print(f"  {len(user_review_count):,} total users, "
      f"{len(qualifying_users):,} with ≥{MIN_REVIEWS_PER_USER} reviews")

# ---------------------------------------------------------------------------
# Step 2: second pass — collect up to MAX_REVIEWS_PER_USER per qualifying user
#          stop once TARGET_USERS users are collected
# ---------------------------------------------------------------------------

print(f"Pass 2: sampling up to {MAX_REVIEWS_PER_USER} reviews "
      f"for {TARGET_USERS} users …")

user_buckets: dict[str, list[dict]] = defaultdict(list)
sampled_users: set[str] = set()

with open(REVIEW_FILE, "r", encoding="utf-8") as fh:
    for line in fh:
        line = line.strip()
        if not line:
            continue

        r = json.loads(line)
        uid = r["user_id"]

        if uid not in qualifying_users:
            continue
        if uid in sampled_users and len(user_buckets[uid]) >= MAX_REVIEWS_PER_USER:
            continue

        user_buckets[uid].append({
            "review_id":   r.get("review_id", ""),
            "user_id":     uid,
            "business_id": r.get("business_id", ""),
            "stars":       r.get("stars", 0),
            "text":        r.get("text", ""),
        })

        sampled_users.add(uid)

        if len(user_buckets[uid]) >= MAX_REVIEWS_PER_USER:
            # User bucket is full — check if we've hit TARGET_USERS
            if len(sampled_users) >= TARGET_USERS:
                break

# Flatten to a single list
sampled_reviews: list[dict] = [
    review
    for reviews in user_buckets.values()
    for review in reviews
]

referenced_business_ids = {r["business_id"] for r in sampled_reviews}

print(f"  Collected {len(sampled_reviews):,} reviews "
      f"from {len(sampled_users):,} users, "
      f"referencing {len(referenced_business_ids):,} businesses")

# ---------------------------------------------------------------------------
# Step 3: load only the businesses referenced by the sampled reviews
# ---------------------------------------------------------------------------

print("Pass 3: loading referenced businesses …")

sampled_businesses: dict[str, dict] = {}

with open(BUSINESS_FILE, "r", encoding="utf-8") as fh:
    for line in fh:
        line = line.strip()
        if not line:
            continue
        b = json.loads(line)
        bid = b.get("business_id", "")
        if bid not in referenced_business_ids:
            continue
        sampled_businesses[bid] = {
            "business_id": bid,
            "name":        b.get("name", ""),
            "city":        b.get("city", ""),
            "state":       b.get("state", ""),
            "categories":  b.get("categories", ""),
            "stars":       b.get("stars", 0),
            "attributes":  b.get("attributes"),
        }
        if len(sampled_businesses) == len(referenced_business_ids):
            break  # found all we need

print(f"  Loaded {len(sampled_businesses):,} businesses")

# ---------------------------------------------------------------------------
# Step 4: write output
# ---------------------------------------------------------------------------

_OUT_DIR.mkdir(parents=True, exist_ok=True)

with open(OUT_REVIEWS, "w", encoding="utf-8") as fh:
    json.dump(sampled_reviews, fh, ensure_ascii=False, indent=2)

with open(OUT_BUSINESSES, "w", encoding="utf-8") as fh:
    json.dump(sampled_businesses, fh, ensure_ascii=False, indent=2)

# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

print("\nDone.")
print(f"  Reviews saved  : {OUT_REVIEWS}  ({len(sampled_reviews):,} records)")
print(f"  Businesses saved: {OUT_BUSINESSES}  ({len(sampled_businesses):,} records)")
avg = len(sampled_reviews) / len(sampled_users) if sampled_users else 0
print(f"  Avg reviews/user: {avg:.1f}")
