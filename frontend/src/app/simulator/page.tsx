"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { simulateReview } from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import ReviewOutputCard from "@/components/ReviewOutputCard";
import { useAuth } from "@/contexts/AuthContext";
import { AuthThemeSync } from "@/components/AuthThemeSync";

const PERSONAS = {
  professional: {
    name: "Tunde",
    habit: "balanced" as const,
    price: "medium" as const,
    restaurant: "The Palms Mall Food Court",
    type: "restaurant",
    location: "Lekki, Lagos",
    features: "AC, WiFi, quick service, clean environment",
  },
  street: {
    name: "Emeka",
    habit: "harsh" as const,
    price: "high" as const,
    restaurant: "Local Buka",
    type: "buka",
    location: "Surulere, Lagos",
    features: "cheap, smoky jollof, small portions",
  },
  aunty: {
    name: "Mrs. Adaobi",
    habit: "generous" as const,
    price: "low" as const,
    restaurant: "Yellow Chilli Victoria Island",
    type: "fine dining",
    location: "Victoria Island, Lagos",
    features: "clean, family-friendly, generous portions, professional service",
  },
};

type SimState = "idle" | "loading" | "result" | "error";

export default function SimulatorPage() {
  return (
    <Suspense>
      <SimulatorContent />
    </Suspense>
  );
}

function SimulatorContent() {
  const searchParams = useSearchParams();
  const personaParam = searchParams.get("persona") as keyof typeof PERSONAS | null;
  const { user } = useAuth();

  const [name, setName] = useState("Emeka");
  const [habit, setHabit] = useState<"harsh" | "balanced" | "generous">("balanced");
  const [price, setPrice] = useState<"high" | "medium" | "low">("high");
  const [restaurant, setRestaurant] = useState("");
  const [type, setType] = useState("restaurant");
  const [location, setLocation] = useState("");
  const [features, setFeatures] = useState("");

  const [state, setState] = useState<SimState>("idle");
  const [result, setResult] = useState<{ rating: number; review_text: string; tone_label: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (personaParam && PERSONAS[personaParam]) {
      const p = PERSONAS[personaParam];
      setName(p.name);
      setHabit(p.habit);
      setPrice(p.price);
      setRestaurant(p.restaurant);
      setType(p.type);
      setLocation(p.location);
      setFeatures(p.features);
    }
  }, [personaParam]);

  async function generate() {
    const avgMap = { harsh: 2.5, balanced: 3.5, generous: 4.5 };
    const payload = {
      persona: {
        user_id: "demo_user",
        avg_rating: avgMap[habit],
        rating_tendency: habit,
        price_sensitivity: price,
        tone_keywords: ["jollof", "service", "price", "portion", "food", "ambience"],
        total_reviews: 30,
        sample_reviews: [
          habit === "harsh"
            ? "The food was okay but too expensive for the portion size"
            : "Good food and reasonable prices",
          habit === "harsh"
            ? "Service was slow and the AC was not working"
            : "Lovely atmosphere and great service",
        ],
      },
      item_name: restaurant || "Yellow Chilli Victoria Island",
      item_type: type,
      location: location || "Lagos",
      features: features ? features.split(",").map((f) => f.trim()).filter(Boolean) : ["nice ambience", "average food"],
    };

    setState("loading");
    try {
      const data = await simulateReview(payload);
      setResult(data);
      setState("result");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong.");
      setState("error");
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-16 py-12">
      {user && <AuthThemeSync />}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-on-surface mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Review Simulator
        </h1>
        <p className="text-on-surface-variant text-lg">Predict the vibes before you pay the bill. No carry-go!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT: Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* Persona card */}
          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-5 text-primary">
              <span className="material-symbols-outlined">person</span>
              <h2 className="font-bold text-xl" style={{ fontFamily: "Montserrat, sans-serif" }}>The Persona</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1">Reviewer Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Emeka, Chidi, Amaka"
                  className="w-full bg-white border-2 border-outline/20 rounded-xl px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1">Rating Habits</label>
                <select
                  value={habit}
                  onChange={(e) => setHabit(e.target.value as typeof habit)}
                  className="w-full bg-white border-2 border-outline/20 rounded-xl px-4 py-3 text-sm"
                >
                  <option value="harsh">Strict critic (avg 2.5 stars)</option>
                  <option value="balanced">Balanced realist (avg 3.5 stars)</option>
                  <option value="generous">Generous rater (avg 4.5 stars)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-2">Price Sensitivity</label>
                <div className="flex gap-3">
                  {(["high", "medium", "low"] as const).map((val, i) => (
                    <button
                      key={val}
                      onClick={() => setPrice(val)}
                      className={`price-btn flex-1 py-2 border-2 border-outline/20 rounded-xl text-sm font-semibold transition-all ${price === val ? "sel" : "hover:border-primary"}`}
                    >
                      {["Budget 💸", "Mid-range 💳", "Baller 💎"][i]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Spot card */}
          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-5 text-primary">
              <span className="material-symbols-outlined">restaurant</span>
              <h2 className="font-bold text-xl" style={{ fontFamily: "Montserrat, sans-serif" }}>The Spot</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1">Restaurant Name</label>
                <input
                  type="text"
                  value={restaurant}
                  onChange={(e) => setRestaurant(e.target.value)}
                  placeholder="e.g. Yellow Chilli Victoria Island"
                  className="w-full bg-white border-2 border-outline/20 rounded-xl px-4 py-3 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-white border-2 border-outline/20 rounded-xl px-4 py-3 text-sm"
                  >
                    <option value="buka">Buka</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="fast food">Fast Food</option>
                    <option value="fine dining">Fine Dining</option>
                    <option value="street food">Street Food</option>
                    <option value="bar">Bar &amp; Grill</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="VI, Lagos"
                    className="w-full bg-white border-2 border-outline/20 rounded-xl px-4 py-3 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1">
                  Features (comma-separated)
                </label>
                <input
                  type="text"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="e.g. nice ambience, expensive, fast service"
                  className="w-full bg-white border-2 border-outline/20 rounded-xl px-4 py-3 text-sm"
                />
              </div>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={state === "loading"}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-red-800 transition-all active:scale-95 shadow-lg disabled:opacity-60"
          >
            <span className="material-symbols-outlined">auto_awesome</span> Generate Review
          </button>
        </div>

        {/* RIGHT: Output */}
        <div className="lg:col-span-7">
          {state === "idle" && (
            <div className="h-full min-h-96 flex flex-col items-center justify-center glass rounded-2xl border-dashed border-2 border-outline/25 text-center p-12">
              <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center text-primary/40 mb-4">
                <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  reviews
                </span>
              </div>
              <h3 className="font-bold text-xl text-on-surface-variant mb-2">Ready to predict!</h3>
              <p className="text-on-surface-variant text-sm max-w-xs">
                Fill the form and hit generate. We go tell you how the matter go be.
              </p>
            </div>
          )}

          {state === "loading" && (
            <div className="h-full min-h-96 flex flex-col items-center justify-center glass rounded-2xl">
              <LoadingSpinner />
            </div>
          )}

          {state === "result" && result && (
            <ReviewOutputCard
              rating={result.rating}
              toneLabel={result.tone_label}
              reviewerName={name || "Emeka"}
              reviewerHabit={habit}
              restaurantType={type}
              reviewText={result.review_text}
              onRegenerate={generate}
            />
          )}

          {state === "error" && (
            <div className="glass rounded-2xl p-8 text-center border-2 border-error/20">
              <div className="text-error text-4xl mb-3">⚠️</div>
              <p className="text-error font-semibold">{errorMsg || "Something went wrong."}</p>
              <p className="text-sm text-on-surface-variant mt-2">
                The Gemini API keys may be rate limited. Try again in a minute.
              </p>
              <button
                onClick={() => setState("idle")}
                className="mt-4 text-primary text-sm font-semibold hover:underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
