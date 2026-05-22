"use client";

import { useState, useRef, useEffect } from "react";
import { getRecommendations, RecommendationItem } from "@/lib/api";
import { parseMessage } from "@/lib/nlp";
import LoadingSpinner from "@/components/LoadingSpinner";
import RecCard from "@/components/RecCard";
import PlaceDetailsModal from "@/components/PlaceDetailsModal";
import { resolveLocation, UserLocation, ResolvedLocation } from "@/lib/location";

type ChatMsg = { type: "user" | "bot"; text: string };
type RecMode = "chat" | "form";
type RecState = "idle" | "loading" | "results" | "empty" | "error";
type LocationStatus = "pending" | "granted" | "denied";
type SelectedPlace = { placeId: string | null; name: string };

const QUICK_PROMPTS = [
  { label: "🍲 Budget buka Lagos", text: "Budget local buka food in Lagos" },
  { label: "🔥 Suya in Abuja", text: "Best suya spots in Abuja" },
  { label: "🫙 Amala Ibadan", text: "Affordable amala in Ibadan" },
  { label: "🍽️ Fine dining PH", text: "Fine dining Port Harcourt" },
];

function BookSidebar({ delay }: { delay: number }) {
  return (
    <div className="mt-6 bg-inverse-surface text-inverse-on-surface rounded-2xl p-6 fade-up" style={{ animationDelay: `${delay}s` }}>
      <div className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">Cross-Domain Taste</div>
      <h4 className="font-bold text-lg mb-3">📚 Reading For The Vibe</h4>
      <p className="text-sm opacity-70 mb-4">Based on your flavor profile, our engine recommends these books that match your taste energy.</p>
      <div className="space-y-3">
        <div className="flex gap-3 bg-white/10 rounded-xl p-3">
          <div className="text-3xl">📖</div>
          <div>
            <div className="font-bold text-sm">My Sister, the Serial Killer</div>
            <div className="text-xs opacity-60 mb-1">Oyinkan Braithwaite</div>
            <div className="text-xs italic opacity-75">&ldquo;Matches the dark, spicy intensity of the Buka spot: sharp, satirical Lagos noir.&rdquo;</div>
          </div>
        </div>
        <div className="flex gap-3 bg-white/10 rounded-xl p-3">
          <div className="text-3xl">📗</div>
          <div>
            <div className="font-bold text-sm">Stay With Me</div>
            <div className="text-xs opacity-60 mb-1">Ayobami Adebayo</div>
            <div className="text-xs italic opacity-75">&ldquo;Pairs with the complex, nostalgic flavors of your top restaurant pick.&rdquo;</div>
          </div>
        </div>
      </div>
      <div className="mt-4 text-xs opacity-50">Powered by NaijaTaste AI Cross-Domain Engine</div>
    </div>
  );
}

function LocationBadge({
  locationStatus,
  queryLocation,
}: {
  locationStatus: LocationStatus;
  queryLocation: ResolvedLocation | null;
}) {
  if (locationStatus === "pending") {
    return (
      <>
        <span className="w-2 h-2 rounded-full bg-on-surface-variant animate-pulse flex-shrink-0" />
        <span className="text-on-surface-variant">Getting your location...</span>
      </>
    );
  }

  if (queryLocation) {
    if (queryLocation.useGPS) {
      return (
        <>
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <span className="text-green-700 font-semibold">Near you</span>
        </>
      );
    }
    if (queryLocation.label) {
      return (
        <>
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: "14px" }}>location_on</span>
          <span className="text-on-surface-variant">{queryLocation.label}</span>
        </>
      );
    }
    return null;
  }

  if (locationStatus === "granted") {
    return (
      <>
        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
        <span className="text-green-700 font-semibold">Location ready</span>
      </>
    );
  }

  return (
    <>
      <span className="w-2 h-2 rounded-full bg-outline flex-shrink-0" />
      <span className="text-on-surface-variant">Using city from your query</span>
    </>
  );
}

export default function RecommendPage() {
  const [mode, setMode] = useState<RecMode>("chat");
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { type: "bot", text: "Kedu! 👋 I'm your AI Food Guru. What are you craving today? Try: \"Budget buka in Lekki\" or \"Best suya in Abuja tonight\"." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [recState, setRecState] = useState<RecState>("idle");
  const [recs, setRecs] = useState<RecommendationItem[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("pending");
  const [queryLocation, setQueryLocation] = useState<ResolvedLocation | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);

  // Form state
  const [city, setCity] = useState("Lagos");
  const [food, setFood] = useState("");
  const [priceRange, setPriceRange] = useState<"budget" | "mid" | "premium">("budget");

  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefill = sessionStorage.getItem("chatPrefill");
    if (prefill) {
      setChatInput(prefill);
      sessionStorage.removeItem("chatPrefill");
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied")
    );
  }, []);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [chatMsgs]);

  async function sendChat() {
    const msg = chatInput.trim();
    if (!msg) return;

    setChatMsgs((prev) => [...prev, { type: "user", text: msg }]);
    setChatInput("");
    setChatMsgs((prev) => [...prev, { type: "bot", text: "my oga abeg no vex, chill for me as i dey try reason am..." }]);

    const signals = parseMessage(msg);
    const loc = resolveLocation(msg, userLocation);
    setQueryLocation(loc);

    try {
      const data = await getRecommendations({
        cold_start_signals: signals,
        ...(loc.lat !== undefined && { user_lat: loc.lat, user_lng: loc.lng }),
      });
      setChatMsgs((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          type: "bot",
          text: `Ehen! Found ${data.length} spot${data.length !== 1 ? "s" : ""} for you based on your craving. Check the recommendations below! 👇`,
        };
        return next;
      });
      if (data.length === 0) {
        setRecState("empty");
      } else {
        setRecs(data);
        setRecState("results");
      }
    } catch (e) {
      setChatMsgs((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          type: "bot",
          text: `Wahala! ${e instanceof Error ? e.message : "Something went wrong"}. Try again in a minute.`,
        };
        return next;
      });
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong.");
      setRecState("error");
    }
  }

  async function getFormRecs() {
    setRecState("loading");
    setRecs([]);

    const loc = resolveLocation(city.toLowerCase(), userLocation);
    setQueryLocation(loc);

    try {
      const data = await getRecommendations({
        cold_start_signals: { city, preferred_food: food || "local Nigerian food", price_range: priceRange },
        ...(loc.lat !== undefined && { user_lat: loc.lat, user_lng: loc.lng }),
      });
      if (data.length === 0) {
        setRecState("empty");
      } else {
        setRecs(data);
        setRecState("results");
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong.");
      setRecState("error");
    }
  }

  function prefillChat(text: string) {
    setChatInput(text);
    setMode("chat");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-16 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-on-surface mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Find Your Correct Taste
        </h1>
        <p className="text-on-surface-variant italic text-lg">Oya, let&apos;s find that food that hits the spot.</p>
      </div>

      <div className="max-w-3xl mx-auto mb-8">
        <div className="glass rounded-2xl p-4">
          {/* Location status */}
          <div className="flex items-center gap-2 mb-4 text-xs">
            <LocationBadge locationStatus={locationStatus} queryLocation={queryLocation} />
          </div>

          {/* Mode toggle */}
          <div className="flex justify-center mb-5">
            <div className="bg-surface-container-low p-1 rounded-full flex gap-1">
              <button
                onClick={() => setMode("chat")}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${mode === "chat" ? "bg-primary text-white" : "text-on-surface-variant hover:bg-surface-variant/30"}`}
              >
                Chat Mode
              </button>
              <button
                onClick={() => setMode("form")}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${mode === "form" ? "bg-primary text-white" : "text-on-surface-variant hover:bg-surface-variant/30"}`}
              >
                Form Mode
              </button>
            </div>
          </div>

          {/* CHAT MODE */}
          {mode === "chat" && (
            <div>
              <div
                ref={chatWindowRef}
                className="h-72 overflow-y-auto scrollbar-thin p-3 flex flex-col gap-2 mb-4 bg-surface-container-low rounded-xl"
              >
                {chatMsgs.map((msg, i) => (
                  <div key={i} className={msg.type === "user" ? "chat-user" : "chat-bot"}>
                    <p>{msg.text}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap mb-3">
                {QUICK_PROMPTS.map(({ label, text }) => (
                  <button
                    key={label}
                    onClick={() => prefillChat(text)}
                    className="text-xs bg-surface-container px-3 py-1 rounded-full border border-outline/15 hover:border-primary hover:text-primary transition-all"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="Type your craving..."
                  className="flex-grow bg-white border-2 border-outline/20 rounded-xl px-4 py-3 text-sm"
                />
                <button
                  onClick={sendChat}
                  className="bg-primary text-white w-12 h-12 flex items-center justify-center rounded-xl hover:bg-red-800 active:scale-95 transition-all flex-shrink-0"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          )}

          {/* FORM MODE */}
          {mode === "form" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                <div className="md:col-span-3">
                  <label className="block text-sm font-semibold text-on-surface-variant mb-1">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-white border-2 border-outline/20 rounded-xl px-4 py-3 text-sm"
                  >
                    {["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Enugu"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-4">
                  <label className="block text-sm font-semibold text-on-surface-variant mb-1">Preferred Food</label>
                  <input
                    type="text"
                    value={food}
                    onChange={(e) => setFood(e.target.value)}
                    placeholder="e.g. Amala, Suya, Jollof"
                    className="w-full bg-white border-2 border-outline/20 rounded-xl px-4 py-3 text-sm"
                  />
                </div>
                <div className="md:col-span-5">
                  <label className="block text-sm font-semibold text-on-surface-variant mb-1">Price Range</label>
                  <div className="flex gap-2">
                    {(["budget", "mid", "premium"] as const).map((val, i) => (
                      <button
                        key={val}
                        data-val={val}
                        onClick={() => setPriceRange(val)}
                        className={`rec-price-btn flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap py-3 px-2 border-2 rounded-xl text-sm font-semibold hover:border-primary transition-all ${priceRange === val ? "sel border-primary" : "border-outline/20"}`}
                      >
                        <span>{["Budget", "Mid-range", "Baller"][i]}</span>
                        <span>{["💸", "💳", "💎"][i]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={getFormRecs}
                disabled={recState === "loading"}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-red-800 transition-all active:scale-95 disabled:opacity-60"
              >
                Find Best Taste
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading */}
      {recState === "loading" && (
        <div className="max-w-3xl mx-auto text-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {/* Results */}
      {recState === "results" && recs.length > 0 && (
        <div className="max-w-3xl mx-auto">
          <h3 className="font-bold text-lg text-on-surface mb-4 px-1">Recommendations for you</h3>
          {recs.map((item, i) => (
            <RecCard
              key={i}
              itemName={item.item_name}
              predictedRating={item.predicted_rating}
              reason={item.reason}
              culturalNote={item.cultural_note}
              index={i}
              placeId={item.business_id}
              onViewDetails={(name, placeId) => setSelectedPlace({ placeId, name })}
            />
          ))}
          <BookSidebar delay={recs.length * 0.08 + 0.1} />
        </div>
      )}

      {/* Empty state */}
      {recState === "empty" && (
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-8">
            <div className="flex justify-center">
              <div className="relative w-64 h-64 bg-white rounded-3xl shadow-xl flex items-center justify-center border border-outline-variant/20">
                <div className="text-7xl">🍽️</div>
                <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 rounded-full border border-outline/10 text-sm italic text-secondary font-semibold">
                  Correct taste? Still looking...
                </div>
              </div>
            </div>
            <div>
              <span className="inline-block bg-primary-fixed text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
                E don finish?
              </span>
              <h2 className="text-2xl font-black text-primary mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Omo, we couldn&apos;t find that exact spot.
              </h2>
              <p className="text-on-surface-variant mb-4 text-sm">
                Try searching for something else! Our tastebuds are sharp, but even they need a little direction sometimes.
              </p>
              <div className="flex gap-3 flex-wrap mb-4">
                <button
                  onClick={() => setRecState("idle")}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full font-semibold text-sm hover:bg-red-800 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>Back to Search
                </button>
              </div>
              <div className="border-t border-outline-variant/20 pt-4">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Suggested Palates:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Suya Night 🌶️", text: "Suya spots tonight" },
                    { label: "Amala Joint 🥣", text: "Best amala Lagos" },
                    { label: "Seafood Okra 🍤", text: "Seafood okra restaurant" },
                  ].map(({ label, text }) => (
                    <button
                      key={label}
                      onClick={() => { prefillChat(text); setRecState("idle"); }}
                      className="px-3 py-1 bg-surface-container-high rounded-full text-sm text-secondary border border-secondary/10 hover:bg-secondary hover:text-white transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {recState === "error" && (
        <div className="max-w-3xl mx-auto glass rounded-2xl p-8 text-center border-2 border-error/20">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-error font-semibold">{errorMsg || "Something went wrong."}</p>
          <p className="text-sm text-on-surface-variant mt-2">
            The Gemini API keys may be rate limited. Please try again in a minute.
          </p>
          <button
            onClick={() => setRecState("idle")}
            className="mt-4 text-primary text-sm font-semibold hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {selectedPlace && (
        <PlaceDetailsModal
          isOpen={true}
          onClose={() => setSelectedPlace(null)}
          placeId={selectedPlace.placeId}
          restaurantName={selectedPlace.name}
        />
      )}
    </div>
  );
}
