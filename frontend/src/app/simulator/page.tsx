"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { simulateReview, adjustReview } from "@/lib/api";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import ReviewOutputCard from "@/components/ReviewOutputCard";
import { useAuth, makeAvatar, getPersona } from "@/contexts/AuthContext";
import { useVoiceInput } from "@/hooks/useVoiceInput";

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

const TRAIT_COLORS = ["#E63946", "#0D9488", "#F97316"];

const LANGUAGE_OPTIONS = [
  { label: "Auto-detect", value: "" },
  { label: "English", value: "English" },
  { label: "Pidgin", value: "Nigerian Pidgin" },
  { label: "Yoruba", value: "Yoruba" },
  { label: "Hausa", value: "Hausa" },
  { label: "Igbo", value: "Igbo" },
];

const TRENDING = [
  { emoji: "🌶️", label: "Extra Pepper" },
  { emoji: "🌿", label: "Farm Fresh" },
  { emoji: "❤️", label: "Mama's Kitchen" },
  { emoji: "🎉", label: "Party Jollof" },
];

const FOOD_OPTIONS = [
  { emoji: "🍚", label: "Jollof Rice" },
  { emoji: "🥘", label: "Egusi & Fufu" },
  { emoji: "🍡", label: "Suya Platter" },
  { emoji: "➕", label: "Other..." },
];

function getTraits(count: number): string[] {
  if (count === 0) return ["Fresh Palate", "Open Minded"];
  if (count < 5) return ["Curious Reviewer", "Pidgin Learner"];
  if (count < 10) return ["Blunt Reviewer", "Pidgin Code-Switcher"];
  return ["Taste Oracle", "High Spice Tolerance", "Pidgin Pro"];
}

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
  const challengeParam = searchParams.get("challenge");
  const { user, savedReviews, addReview } = useAuth();

  // Shared state
  const [restaurant, setRestaurant] = useState("");
  const [type, setType] = useState("restaurant");
  const [location, setLocation] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("");
  const [state, setState] = useState<SimState>("idle");
  const [result, setResult] = useState<{ rating: number; review_text: string; tone_label: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Guest-only state
  const [name, setName] = useState("Emeka");
  const [habit, setHabit] = useState<"harsh" | "balanced" | "generous">("balanced");
  const [price, setPrice] = useState<"high" | "medium" | "low">("high");
  const [features, setFeatures] = useState("");

  // Auth-only state
  const [selectedFood, setSelectedFood] = useState<string | null>(null);

  // Save + feedback state
  const [isSaved, setIsSaved] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [lastPersona, setLastPersona] = useState<Record<string, unknown>>({});

  const [showVoiceHint, setShowVoiceHint] = useState(false);
  const { isListening, startListening, supported: voiceSupported, interim } = useVoiceInput(
    (t) => setRestaurant(t)
  );

  function handleMicClick() {
    startListening();
    if (showVoiceHint) {
      setShowVoiceHint(false);
      localStorage.setItem("voiceHintSeen", "1");
    }
  }

  function handleSave() {
    if (!result || !user) return;
    addReview({
      id: Date.now().toString(),
      restaurant: restaurant || "Nigerian Restaurant",
      review: result.review_text,
      rating: result.rating,
      date: new Date().toISOString(),
    });
    setIsSaved(true);
    toast.success("Review saved to your profile!");
  }

  async function handleAdjust() {
    if (!feedbackText.trim() || !result) return;
    setIsAdjusting(true);
    try {
      const adjusted = await adjustReview({
        original_review: result.review_text,
        feedback: feedbackText,
        original_persona: lastPersona,
      });
      setResult(adjusted);
      setIsSaved(false);
      setFeedbackText("");
    } catch {
      toast.error("Couldn't adjust the review. Try again.");
    } finally {
      setIsAdjusting(false);
    }
  }

  useEffect(() => {
    if (!localStorage.getItem("voiceHintSeen")) setShowVoiceHint(true);
  }, []);

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

  useEffect(() => {
    if (challengeParam) setRestaurant(challengeParam);
  }, [challengeParam]);

  useEffect(() => {
    if (user) setLocation((prev) => prev || "VI, Lagos");
  }, [user]);

  async function generate() {
    const avgMap = { harsh: 2.5, balanced: 3.5, generous: 4.5 };
    const persona = {
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
    };
    const payload = {
      persona,
      item_name: restaurant || "Yellow Chilli Victoria Island",
      item_type: type,
      location: location || "Lagos",
      features: features ? features.split(",").map((f) => f.trim()).filter(Boolean) : ["nice ambience", "average food"],
      ...(preferredLanguage && { preferred_language: preferredLanguage }),
    };

    setLastPersona(persona as Record<string, unknown>);
    setIsSaved(false);
    setFeedbackText("");
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

  async function generateAuthenticated() {
    if (!user) return;

    let ratingHabit: "harsh" | "balanced" | "generous" = "balanced";
    if (savedReviews.length > 0) {
      const avg = savedReviews.reduce((sum, r) => sum + r.rating, 0) / savedReviews.length;
      if (avg < 2.5) ratingHabit = "harsh";
      else if (avg > 3.8) ratingHabit = "generous";
    }

    const avgMap = { harsh: 2.5, balanced: 3.5, generous: 4.5 };
    const persona = {
      user_id: user.email,
      avg_rating: avgMap[ratingHabit],
      rating_tendency: ratingHabit,
      price_sensitivity: "medium" as const,
      tone_keywords: ["jollof", "service", "flavour", "portion", "vibes", "ambience"],
      total_reviews: savedReviews.length,
      sample_reviews: savedReviews.slice(-2).map((r) => r.review),
    };
    const payload = {
      persona,
      item_name: restaurant || "Nigerian Restaurant",
      item_type: type,
      location: location || "VI, Lagos",
      features:
        selectedFood && selectedFood !== "Other..."
          ? [selectedFood]
          : ["nice ambience", "good service"],
      ...(preferredLanguage && { preferred_language: preferredLanguage }),
    };

    setLastPersona(persona as Record<string, unknown>);
    setIsSaved(false);
    setFeedbackText("");
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

  // ─── Authenticated UI ────────────────────────────────────────────────────
  if (user) {
    const { level } = getPersona(savedReviews.length);
    const traits = getTraits(savedReviews.length);
    const lastReview = savedReviews.length > 0 ? savedReviews[savedReviews.length - 1] : null;

    return (
      <div className="max-w-7xl mx-auto px-4 md:px-16 py-12">
        <div className="mb-8">
          <h1
            className="text-4xl font-black text-on-surface mb-1"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Review Simulator
          </h1>
          <p className="text-on-surface-variant italic text-sm">
            &ldquo;Correct taste, accurate vibez. Let&apos;s cook up a review.&rdquo;
          </p>
        </div>

        {challengeParam && (
          <div className="mb-6 glass rounded-2xl p-4 border-2 border-secondary/30 flex items-center gap-3">
            <span className="text-2xl flex-shrink-0">🏆</span>
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-wider text-secondary mb-0.5">Daily Challenge Active</div>
              <div className="text-sm font-semibold text-on-surface truncate">{challengeParam}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: The Persona */}
          <div className="lg:col-span-5">
            <div className="glass p-6 rounded-2xl h-full">
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="font-bold text-xl text-primary"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  The Persona
                </h2>
                <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                  <span
                    className="material-symbols-outlined text-white"
                    style={{ fontSize: "16px", fontVariationSettings: "'FILL' 1" }}
                  >
                    check
                  </span>
                </div>
              </div>

              {/* Avatar */}
              <div className="text-center mb-5">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-black mx-auto mb-2"
                  style={{ backgroundColor: "#E63946" }}
                >
                  {makeAvatar(user.name)}
                </div>
                <div className="text-xs text-on-surface-variant mb-0.5">Active Persona</div>
                <div className="font-bold text-lg text-on-surface">{user.name}</div>
              </div>

              {/* Traits */}
              <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Calculated Traits
              </div>
              <div className="flex flex-wrap gap-2 mb-5">
                {traits.map((trait, i) => (
                  <span
                    key={trait}
                    className="text-xs font-semibold px-3 py-1 rounded-full text-white"
                    style={{ backgroundColor: TRAIT_COLORS[i % TRAIT_COLORS.length] }}
                  >
                    {trait}
                  </span>
                ))}
              </div>

              {/* Modify Persona */}
              <button className="w-full border-2 border-primary text-primary py-2 rounded-xl text-sm font-bold hover:bg-primary/5 transition-colors mb-5">
                {/* TODO: open persona settings */}
                ✦ Modify Persona
              </button>

              {/* Last Review */}
              <div className="bg-surface-container-low rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-on-surface-variant">Last Review</div>
                  <span className="material-symbols-outlined text-primary text-base">trending_up</span>
                </div>
                {lastReview ? (
                  <>
                    <div className="text-2xl font-black text-on-surface">
                      {lastReview.rating.toFixed(1)} / 5.0
                    </div>
                    <div className="text-xs text-on-surface-variant mt-0.5">
                      Influencer Level {level}
                    </div>
                    <div className="h-1.5 bg-surface-container-high rounded-full mt-3">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(lastReview.rating / 5) * 100}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-on-surface-variant">No reviews yet</div>
                )}
              </div>
            </div>
          </div>

          {/* Right: The Spot / Result */}
          <div className="lg:col-span-7 space-y-5">
            {(state === "idle" || state === "error") && (
              <>
                <div className="glass p-6 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1 text-primary">
                    <span className="material-symbols-outlined">restaurant</span>
                    <h2
                      className="font-bold text-xl"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      The Spot
                    </h2>
                  </div>
                  <p className="text-sm text-on-surface-variant mb-5">
                    Tell us where you just chopped.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-on-surface-variant mb-1">
                        Restaurant Name
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={isListening ? interim : restaurant}
                          onChange={(e) => !isListening && setRestaurant(e.target.value)}
                          placeholder={isListening ? "Listening..." : "e.g. Yellow Chilli"}
                          readOnly={isListening}
                          className={`flex-grow bg-white border-2 rounded-xl px-4 py-3 text-sm transition-colors ${isListening ? "border-red-400 text-on-surface-variant italic" : "border-outline/20"}`}
                        />
                        {voiceSupported && (
                          <button
                            onClick={handleMicClick}
                            title="Speak restaurant name"
                            className={`w-12 h-12 flex items-center justify-center rounded-xl flex-shrink-0 transition-all ${
                              isListening
                                ? "bg-red-500 text-white animate-pulse"
                                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
                            }`}
                          >
                            <span className="material-symbols-outlined">mic</span>
                          </button>
                        )}
                      </div>
                      {showVoiceHint && (
                        <p className="text-xs text-on-surface-variant mt-1">
                          🎤 Speak or type in English, Yoruba, Hausa, Igbo or Pidgin, I go respond in your language
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-on-surface-variant mb-1">
                          Type of Spot
                        </label>
                        <select
                          value={type}
                          onChange={(e) => setType(e.target.value)}
                          className="w-full bg-white border-2 border-outline/20 rounded-xl px-4 py-3 text-sm"
                        >
                          <option value="restaurant">Casual Dining</option>
                          <option value="fine dining">Fine Dining</option>
                          <option value="buka">Buka/Mama Put</option>
                          <option value="street food">Street Food</option>
                          <option value="fast food">Fast Food</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-on-surface-variant mb-1">
                          Location
                        </label>
                        <div className="relative">
                          <span
                            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                            style={{ fontSize: "18px" }}
                          >
                            location_on
                          </span>
                          <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="VI, Lagos"
                            className="w-full bg-white border-2 border-outline/20 rounded-xl pl-9 pr-4 py-3 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                        What did you order?
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {FOOD_OPTIONS.map(({ emoji, label }) => (
                          <button
                            key={label}
                            onClick={() =>
                              setSelectedFood(selectedFood === label ? null : label)
                            }
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                              selectedFood === label
                                ? "border-primary bg-primary/10"
                                : "border-outline/20 hover:border-primary/40"
                            }`}
                          >
                            <span className="text-2xl">{emoji}</span>
                            <span className="text-xs font-semibold text-on-surface-variant leading-tight text-center">
                              {label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-on-surface-variant mb-1">
                        Review Language
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {LANGUAGE_OPTIONS.map(({ label, value }) => (
                          <button
                            key={label}
                            onClick={() => setPreferredLanguage(value)}
                            className={`px-3 py-1.5 rounded-full border-2 text-xs font-semibold transition-all ${
                              preferredLanguage === value
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-outline/20 text-on-surface-variant hover:border-primary/40"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {state === "error" && (
                  <div className="glass rounded-2xl p-4 border-2 border-error/20 text-center">
                    <p className="text-error text-sm font-semibold">
                      {errorMsg || "Something went wrong."}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      The Gemini API keys may be rate limited. Try again in a minute.
                    </p>
                    <button
                      onClick={() => setState("idle")}
                      className="mt-2 text-primary text-sm font-semibold hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                )}

                <button
                  onClick={generateAuthenticated}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-red-800 transition-all active:scale-95 shadow-lg"
                >
                  Generate AI Review
                </button>
              </>
            )}

            {state === "loading" && (
              <div className="min-h-96 flex flex-col items-center justify-center glass rounded-2xl">
                <LoadingSpinner />
              </div>
            )}

            {state === "result" && result && (
              <>
                <ReviewOutputCard
                  rating={result.rating}
                  toneLabel={result.tone_label}
                  reviewerName={user.name}
                  reviewerHabit="balanced"
                  restaurantType={type}
                  reviewText={result.review_text}
                  onRegenerate={generateAuthenticated}
                  onSave={handleSave}
                  isSaved={isSaved}
                />

                {/* Feedback / adjustment */}
                <div className="glass p-4 rounded-2xl">
                  <p className="text-sm font-semibold text-on-surface-variant mb-3">
                    Not quite right? Tell me how to adjust it
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAdjust()}
                      placeholder="e.g. make it shorter, less hype, drop the rating to 3 stars"
                      className="flex-grow bg-white border-2 border-outline/20 rounded-xl px-4 py-2.5 text-sm"
                      disabled={isAdjusting}
                    />
                    <button
                      onClick={handleAdjust}
                      disabled={isAdjusting || !feedbackText.trim()}
                      className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-red-800 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {isAdjusting ? "..." : "Adjust"}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setState("idle");
                    setResult(null);
                  }}
                  className="w-full text-center text-primary text-sm font-semibold hover:underline"
                >
                  ← New Review
                </button>
              </>
            )}
          </div>
        </div>

        {/* Trending Flavors */}
        <div className="mt-8 glass rounded-2xl p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
            Trending Flavors
          </div>
          <div className="flex flex-wrap gap-2">
            {TRENDING.map(({ emoji, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-full bg-surface-container-high text-on-surface"
              >
                <span>{emoji}</span>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Guest UI (unchanged) ────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-16 py-12">
      <div className="mb-8">
        <h1
          className="text-4xl font-black text-on-surface mb-1"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          Review Simulator
        </h1>
        <p className="text-on-surface-variant text-lg">
          Predict the vibes before you pay the bill. No carry-go!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT: Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* Persona card */}
          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-5 text-primary">
              <span className="material-symbols-outlined">person</span>
              <h2 className="font-bold text-xl" style={{ fontFamily: "Montserrat, sans-serif" }}>
                The Persona
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1">
                  Reviewer Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Emeka, Chidi, Amaka"
                  className="w-full bg-white border-2 border-outline/20 rounded-xl px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1">
                  Rating Habits
                </label>
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
                <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                  Price Sensitivity
                </label>
                <div className="flex gap-3">
                  {(["high", "medium", "low"] as const).map((val, i) => (
                    <button
                      key={val}
                      onClick={() => setPrice(val)}
                      className={`price-btn flex-1 py-2 border-2 border-outline/20 rounded-xl text-sm font-semibold transition-all ${
                        price === val ? "sel" : "hover:border-primary"
                      }`}
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
              <h2 className="font-bold text-xl" style={{ fontFamily: "Montserrat, sans-serif" }}>
                The Spot
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1">
                  Restaurant Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={isListening ? interim : restaurant}
                    onChange={(e) => !isListening && setRestaurant(e.target.value)}
                    placeholder={isListening ? "Listening..." : "e.g. Yellow Chilli Victoria Island"}
                    readOnly={isListening}
                    className={`flex-grow bg-white border-2 rounded-xl px-4 py-3 text-sm transition-colors ${isListening ? "border-red-400 text-on-surface-variant italic" : "border-outline/20"}`}
                  />
                  {voiceSupported && (
                    <button
                      onClick={handleMicClick}
                      title="Speak restaurant name"
                      className={`w-12 h-12 flex items-center justify-center rounded-xl flex-shrink-0 transition-all ${
                        isListening
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
                      }`}
                    >
                      <span className="material-symbols-outlined">mic</span>
                    </button>
                  )}
                </div>
                {showVoiceHint && (
                  <p className="text-xs text-on-surface-variant mt-1">
                    🎤 Speak or type in English, Yoruba, Hausa, Igbo or Pidgin, I go respond in your language
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-1">
                    Type
                  </label>
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
                  <label className="block text-sm font-semibold text-on-surface-variant mb-1">
                    Location
                  </label>
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
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1">
                  Review Language
                </label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map(({ label, value }) => (
                    <button
                      key={label}
                      onClick={() => setPreferredLanguage(value)}
                      className={`px-3 py-1.5 rounded-full border-2 text-xs font-semibold transition-all ${
                        preferredLanguage === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-outline/20 text-on-surface-variant hover:border-primary/40"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
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
                <span
                  className="material-symbols-outlined text-5xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
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
            <>
              <ReviewOutputCard
                rating={result.rating}
                toneLabel={result.tone_label}
                reviewerName={name || "Emeka"}
                reviewerHabit={habit}
                restaurantType={type}
                reviewText={result.review_text}
                onRegenerate={generate}
              />

              {/* Feedback / adjustment */}
              <div className="glass p-4 rounded-2xl mt-4">
                <p className="text-sm font-semibold text-on-surface-variant mb-3">
                  Not quite right? Tell me how to adjust it
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdjust()}
                    placeholder="e.g. make it shorter, less hype, drop the rating to 3 stars"
                    className="flex-grow bg-white border-2 border-outline/20 rounded-xl px-4 py-2.5 text-sm"
                    disabled={isAdjusting}
                  />
                  <button
                    onClick={handleAdjust}
                    disabled={isAdjusting || !feedbackText.trim()}
                    className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-red-800 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {isAdjusting ? "..." : "Adjust"}
                  </button>
                </div>
              </div>
            </>
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
