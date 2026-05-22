"""
NaijaTaste - Nigerian Review Dataset Generator
Uses Gemini 2.0 Flash to synthesize structured Nigerian restaurant reviews
grounded in real Outscraper Google Maps data + handcrafted samples.

Setup:
    pip install google-genai pandas
    Create a .env file with: GEMINI_API_KEY=your_key_here

Usage:
    python generate_nigerian_reviews.py
    python generate_nigerian_reviews.py --output my_output.json

Output:
    few_shot_master.json - structured Nigerian reviews
"""

import json
import time
import argparse
import random
import os
from google import genai
from google.genai import types


# --- Load .env file ----------------------------------------------------------

def load_env(path=".env"):
    if os.path.exists(path):
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()


# --- Real Outscraper reviews (style anchors) ---------------------------------

REAL_REVIEWS = [
    {"restaurant": "Mama Cass Abuja", "rating": 3.0,
     "review": "Tasty jollof but please they have to do something about the interior design"},
    {"restaurant": "Kilimanjaro Restaurant Ozumba Mbadiwe", "rating": 3.0,
     "review": "Meals here are relatively inexpensive. The location is premium, so one wonders how they manage to keep their prices on such a tight leash."},
    {"restaurant": "Kilimanjaro Restaurant Ozumba Mbadiwe", "rating": 4.0,
     "review": "Centrally positioned at Oniru busstop Ozumba and serve a great deal of people in that neighbourhood. Their meals are affordable and quality."},
    {"restaurant": "Yellow Chilli Victoria Island Lagos", "rating": 5.0,
     "review": "This place was so beautiful and aesthetic with beautiful views and the food is wonderful"},
    {"restaurant": "Tantalizers", "rating": 1.0,
     "review": "Old, dirty and unkempt. Lights were out for almost 15 minutes when I was there. The air conditioners were not functional."},
    {"restaurant": "Tantalizers", "rating": 2.0,
     "review": "Ambience is nothing to write home about"},
    {"restaurant": "Tantalizers", "rating": 3.0,
     "review": "Good old Tantalizers, they are always there to serve several tasty delicacies to customers. I visit regularly for that oven fresh and hot bread. Its quiet in there in recent times so those who don't like rowdy eatery can make it their choice. However, there's need to step up their game so they're not left behind."},
    {"restaurant": "Wakkis Food", "rating": 5.0,
     "review": "Food is excellent and the service superb"},
    {"restaurant": "The Place Restaurant", "rating": 3.0,
     "review": "Dine in, take out and yeah it was okay"},
    {"restaurant": "Nkoyo", "rating": 4.0,
     "review": "Decent spot. The decor could be better, service was great and they serve great seafood dishes."},
    {"restaurant": "Nkoyo", "rating": 5.0,
     "review": "They make really nice meals here. Their fresh pineapple juice is a banger. I enjoyed every moment spent here."},
    {"restaurant": "Nkoyo", "rating": 5.0,
     "review": "Great cooking, premium service. Loved the ambience in the outdoor restaurant"},
    {"restaurant": "Nkoyo", "rating": 5.0,
     "review": "I love the Naija specials menu and good customer services"},
]


# --- Handcrafted samples -----------------------------------------------------

HANDCRAFTED = [
    {"rating": 2, "city": "Lagos", "price_sensitivity": "high", "tone": "pidgin-heavy",
     "review": "Abeg make I be honest. The place fine, AC dey, ambience correct. But for this price? Tueh. N8500 for small chicken wey no even reach my hand properly. Food taste average at best. I don chop better for buka for half the price. Service slow like NEPA restoring light. I no go return."},
    {"rating": 5, "city": "Abuja", "price_sensitivity": "low", "tone": "formal",
     "review": "This place is everything. From the moment you enter, you feel the class. The catfish pepper soup was rich and well-spiced, not that watery one wey some places serve. Service was attentive without being annoying. Yes it is pricey but you are paying for an experience and they delivered. Highly recommend for date night or client dinner."},
    {"rating": 3, "city": "Port Harcourt", "price_sensitivity": "high", "tone": "mixed",
     "review": "E still dey manage. The meat pie still dey hit different when e fresh from oven. But the service sef don fall. Waited 15 minutes just to order. For fast food? That one no make sense. Price reasonable sha, I go give them that. Nothing premium, nothing terrible."},
    {"rating": 4, "city": "Lagos", "price_sensitivity": "medium", "tone": "formal",
     "review": "If you want authentic Lagos buka experience without the stress, this is your spot. Amala was soft and stretchy the way God intended. Ewedu fresh, gbegiri balanced. Only issue is the seating, plastic chairs for this heat? They need to upgrade. But the food itself? No complaints."},
    {"rating": 3, "city": "Abuja", "price_sensitivity": "medium", "tone": "formal",
     "review": "Consistent as always. That's both the compliment and the problem. Nothing has changed in 5 years, same taste, same packaging, same slightly-too-slow service for a quick lunch spot. For a busy workday it works. Don't go expecting anything exciting."},
    {"rating": 4, "city": "Lagos", "price_sensitivity": "low", "tone": "casual",
     "review": "Okay the aesthetic alone deserves 4 stars. Very Instagrammable, lighting is everything. The pasta was actually good, creamy, well seasoned, generous portion for the price point. Cocktails were a bit sweet for my taste but my friend loved hers. Will I come back? Yes but mostly for the vibes."},
    {"rating": 2, "city": "Kano", "price_sensitivity": "high", "tone": "pidgin-heavy",
     "review": "I don try am twice, I no go try am third time. The jollof rice dry like harmattan sand. Protein small like they dey manage. For N4000 you dey think say them go at least give you correct portion. The only thing wey save the experience na the cold zobo. Everything else, God abeg."},
    {"rating": 4, "city": "Lagos", "price_sensitivity": "medium", "tone": "formal",
     "review": "The Place remains my go-to for Nigerian food in a clean environment. The ofe onugbu with okpa hit different last weekend, whoever is in that kitchen knows what they are doing. Wait time can be annoying on weekends, sometimes 30 minutes for food. Go on weekdays if you can."},
    {"rating": 5, "city": "Abuja", "price_sensitivity": "high", "tone": "formal",
     "review": "This is where real food lives. The egusi is thick and well-prepared, the eba portion generous enough that you don't leave hungry. For a family that doesn't want to spend a fortune, this place delivers every time. My loyalty here is not changing anytime soon."},
    {"rating": 5, "city": "Lagos", "price_sensitivity": "high", "tone": "pidgin-heavy",
     "review": "2am and this man's suya still dey slap. I don't know what magic happens at this spot but the beef suya after midnight hits completely different. Properly spiced, meat tender, onions and tomatoes fresh. N1500 wrap will carry you. This is Lagos culture at its purest."},
]


# --- Batch generation config -------------------------------------------------

BATCH_CONFIGS = [
    # (city, price_sensitivity, tone, restaurant_type, rating_range, count)
    ("Lagos", "high", "pidgin-heavy", "local buka", [1, 2, 3], 8),
    ("Lagos", "high", "pidgin-heavy", "fast food", [2, 3, 4], 8),
    ("Lagos", "medium", "mixed", "fine dining", [3, 4, 5], 8),
    ("Lagos", "low", "casual", "rooftop bar and grill", [4, 5], 6),
    ("Lagos", "high", "mixed", "suya spot", [4, 5], 6),
    ("Lagos", "medium", "formal", "seafood restaurant", [3, 4, 5], 6),
    ("Abuja", "low", "formal", "fine dining", [3, 4, 5], 8),
    ("Abuja", "high", "mixed", "local buka", [1, 2, 3, 4], 8),
    ("Abuja", "medium", "formal", "fast food", [2, 3, 4], 6),
    ("Abuja", "medium", "casual", "grilled fish spot", [4, 5], 6),
    ("Port Harcourt", "high", "pidgin-heavy", "local buka", [1, 2, 3], 6),
    ("Port Harcourt", "medium", "mixed", "fast food", [2, 3, 4], 6),
    ("Kano", "high", "pidgin-heavy", "fast food", [1, 2, 3], 6),
    ("Kano", "medium", "formal", "local buka", [3, 4, 5], 6),
    ("Ibadan", "high", "mixed", "amala joint", [4, 5], 6),
    ("Ibadan", "medium", "formal", "pepper soup joint", [3, 4, 5], 6),
    ("Enugu", "high", "formal", "local buka", [4, 5], 6),
    ("Warri", "high", "pidgin-heavy", "fast food", [1, 2, 3], 6),
    ("Benin City", "medium", "mixed", "local buka", [3, 4, 5], 6),
    ("Lagos", "high", "pidgin-heavy", "shawarma joint", [2, 3, 4], 6),
    ("Lagos", "medium", "casual", "chinese restaurant", [3, 4], 6),
    ("Abuja", "low", "formal", "seafood restaurant", [4, 5], 6),
    ("Lagos", "high", "pidgin-heavy", "pizza place", [2, 3], 5),
    ("Abuja", "medium", "mixed", "amala joint", [3, 4, 5], 5),
    ("Lagos", "low", "formal", "fine dining", [4, 5], 5),
    ("Port Harcourt", "high", "pidgin-heavy", "suya spot", [4, 5], 5),
    ("Lagos", "medium", "mixed", "grilled fish spot", [3, 4, 5], 5),
    ("Abuja", "high", "pidgin-heavy", "fast food", [1, 2, 3], 5),
    ("Ibadan", "high", "pidgin-heavy", "local buka", [4, 5], 5),
    ("Lagos", "medium", "casual", "pizza place", [3, 4, 5], 5),
]


# --- Prompt builder ----------------------------------------------------------

def build_prompt(city, price_sensitivity, tone, restaurant_type, rating_range, count):
    anchors = random.sample(REAL_REVIEWS, min(4, len(REAL_REVIEWS)))
    anchor_text = json.dumps(anchors, indent=2)

    matching = [h for h in HANDCRAFTED
                if h["city"] == city or h["price_sensitivity"] == price_sensitivity]
    if not matching:
        matching = HANDCRAFTED
    examples = random.sample(matching, min(2, len(matching)))
    example_text = json.dumps(examples, indent=2)

    ratings_str = " or ".join(str(r) for r in rating_range)

    return f"""You are building a Nigerian restaurant review dataset for an AI system.

REAL GOOGLE MAPS REVIEWS FROM NIGERIAN RESTAURANTS (study these language patterns):
{anchor_text}

EXAMPLE STRUCTURED REVIEWS (match this format and cultural authenticity):
{example_text}

YOUR TASK:
Generate {count} NEW and UNIQUE Nigerian restaurant reviews with these exact characteristics:
- City: {city}
- Price sensitivity: {price_sensitivity} (high means very cost-conscious, low means does not mind spending)
- Tone: {tone} (pidgin-heavy means lots of Nigerian Pidgin, mixed means blend of English and Pidgin, formal means standard English, casual means relaxed English)
- Restaurant type: {restaurant_type}
- Ratings: use only {ratings_str} stars

RULES:
1. Sound like real Nigerians wrote these, not like AI
2. Reference real Nigerian context naturally: NEPA, generator, Lagos traffic, heat, naira prices in range N500 to N15000, local foods like jollof, amala, egusi, suya, pepper soup, eba, buka
3. Pidgin-heavy tone must use words like abeg, sha, sef, dey, na, wey, e don, I go, them, wetin, no be, naturally
4. Vary review lengths: some short 2 to 3 sentences, some detailed 4 to 6 sentences
5. Make each review completely unique with different complaints, praises and observations
6. Price-sensitive users always mention value for money, naira amounts, and compare to alternatives
7. {city} users should reflect that city's culture and sensibility

Return ONLY a valid JSON array. No markdown, no explanation, no extra text before or after the array:
[
  {{
    "rating": <integer between 1 and 5>,
    "city": "{city}",
    "price_sensitivity": "{price_sensitivity}",
    "tone": "{tone}",
    "restaurant_type": "{restaurant_type}",
    "review": "<review text here>",
    "source": "gemini_synthesized"
  }}
]"""


# --- Generator ---------------------------------------------------------------

def generate_batch(client, city, price_sensitivity, tone, restaurant_type, rating_range, count):
    prompt = build_prompt(city, price_sensitivity, tone, restaurant_type, rating_range, count)
    try:
        response = client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.9,
                max_output_tokens=3000,
            )
        )
        text = response.text.strip()
        print(f"    RAW RESPONSE: {text[:300]}")
        text = text.replace("```json", "").replace("```", "").strip()
        start = text.find("[")
        end = text.rfind("]") + 1
        if start == -1 or end == 0:
            print("    WARNING: No JSON array found in response")
            return []
        parsed = json.loads(text[start:end])
        return parsed
    except json.JSONDecodeError as e:
        print(f"    WARNING: JSON parse error: {e}")
        return []
    except Exception as e:
        print(f"    WARNING: {e}")
        return []


# --- Main --------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Generate Nigerian restaurant reviews with Gemini")
    parser.add_argument("--api_key", default=None, help="Gemini API key (optional if set in .env)")
    parser.add_argument("--output", default="few_shot_master.json", help="Output JSON file path")
    args = parser.parse_args()

    load_env()

    api_key = args.api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: No API key found.")
        print("  Option 1: Create a .env file with GEMINI_API_KEY=your_key_here")
        print("  Option 2: Run with --api_key YOUR_KEY")
        return

    client = genai.Client(api_key=api_key)
    print("Gemini 2.0 Flash initialized")
    print()

    all_reviews = []

    for h in HANDCRAFTED:
        entry = dict(h)
        entry["source"] = "handcrafted"
        all_reviews.append(entry)
    print(f"Starting with {len(HANDCRAFTED)} handcrafted samples")
    print()

    total_batches = len(BATCH_CONFIGS)
    for i, (city, price, tone, rtype, ratings, count) in enumerate(BATCH_CONFIGS):
        print(f"[{i+1}/{total_batches}] {count} reviews | {city} | {price} | {tone} | {rtype}")
        batch = generate_batch(client, city, price, tone, rtype, ratings, count)

        if batch:
            all_reviews.extend(batch)
            print(f"    OK - got {len(batch)} reviews, total so far: {len(all_reviews)}")
        else:
            print("    FAILED - skipping batch")

        if i < total_batches - 1:
            time.sleep(5)

    for r in REAL_REVIEWS:
        all_reviews.append({
            "rating": int(r["rating"]),
            "city": "Lagos" if "Lagos" in r["restaurant"] else "Abuja",
            "price_sensitivity": "medium",
            "tone": "mixed",
            "restaurant_type": "restaurant",
            "review": r["review"],
            "source": "real_google_maps"
        })

    random.shuffle(all_reviews)

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(all_reviews, f, indent=2, ensure_ascii=False)

    from collections import Counter

    synthesized_count = len([r for r in all_reviews if r.get("source") == "gemini_synthesized"])
    real_count = len([r for r in all_reviews if r.get("source") == "real_google_maps"])

    print()
    print("=" * 50)
    print(f"DONE. Dataset saved to: {args.output}")
    print(f"Total reviews: {len(all_reviews)}")
    print(f"  Handcrafted:        {len(HANDCRAFTED)}")
    print(f"  Gemini synthesized: {synthesized_count}")
    print(f"  Real Google Maps:   {real_count}")
    print()
    print("City breakdown:")
    cities = Counter(r.get("city", "Unknown") for r in all_reviews)
    for city, cnt in sorted(cities.items(), key=lambda x: -x[1]):
        print(f"  {city}: {cnt}")
    print()
    print("Rating breakdown:")
    ratings_counter = Counter(r.get("rating") for r in all_reviews)
    for rating, cnt in sorted(ratings_counter.items()):
        print(f"  {rating} stars: {cnt}")


if __name__ == "__main__":
    main()
