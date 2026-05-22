"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, getPersona } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/utils";
import PlaceDetailsModal from "@/components/PlaceDetailsModal";
import { resolveLocation, UserLocation } from "@/lib/location";
import { getTopPicks, TopPickPlace } from "@/lib/api";

const BOOKS = [
  {
    title: "My Sister, the Serial Killer",
    author: "Oyinkan Braithwaite",
    note: "Matches the dark, spicy intensity of the Buka spot recommendation. A sharp, satirical Lagos noir.",
    link: "ADD TO LIBRARY",
    emoji: "📖",
  },
  {
    title: "Stay With Me",
    author: "Ayobami Adebayo",
    note: "Pairs with the complex, nostalgic flavors of Yellow Chilli's traditional recipes.",
    link: "BUY ON GOODREADS",
    emoji: "📚",
  },
];

const CRAVINGS = [
  { emoji: "🫙", label: "Swallow", query: "swallow food in Lagos" },
  { emoji: "🔥", label: "Grills", query: "suya grills tonight" },
  { emoji: "🍸", label: "Vibes", query: "lounge vibes dinner Lagos" },
  { emoji: "🥟", label: "Small Chops", query: "small chops fast food" },
  { emoji: "☕", label: "Brunch", query: "brunch spot Lagos" },
  { emoji: "🍰", label: "Desserts", query: "dessert and sweets" },
];

const DAILY_CHALLENGES = [
  { emoji: "🍜", title: "Try a pepper soup spot you've never visited",          badge: "Pepper Soup Pioneer",    points: 50, difficulty: 2 },
  { emoji: "🍛", title: "Find the best jollof rice in your area",               badge: "Jollof Judge",           points: 60, difficulty: 2 },
  { emoji: "🥘", title: "Visit a buka and order their specials",                badge: "Buka King",              points: 40, difficulty: 1 },
  { emoji: "🍖", title: "Try suya from a new spot tonight",                     badge: "Suya Scout",             points: 45, difficulty: 1 },
  { emoji: "🥗", title: "Find a healthy Nigerian meal option",                  badge: "Healthy Naija",          points: 55, difficulty: 2 },
  { emoji: "🍲", title: "Try egusi soup somewhere new",                         badge: "Egusi Explorer",         points: 50, difficulty: 2 },
  { emoji: "🍣", title: "Visit a restaurant outside your usual area",           badge: "Area Hopper",            points: 70, difficulty: 3 },
  { emoji: "☕", title: "Try a Nigerian café for breakfast",                    badge: "Morning Flavour",        points: 35, difficulty: 1 },
  { emoji: "🍗", title: "Order fried chicken from a local spot, not a chain",   badge: "Local Lover",            points: 45, difficulty: 1 },
  { emoji: "🥩", title: "Try a new protein you've never reviewed before",       badge: "Protein Pioneer",        points: 60, difficulty: 2 },
  { emoji: "🍱", title: "Visit a restaurant with 4.5+ stars you've never tried",badge: "Star Chaser",            points: 65, difficulty: 2 },
  { emoji: "🌶️", title: "Order the spiciest dish on any menu",                 badge: "Heat Seeker",            points: 75, difficulty: 3 },
  { emoji: "🍚", title: "Try ofada rice and stew somewhere authentic",          badge: "Ofada OG",               points: 55, difficulty: 2 },
  { emoji: "🥣", title: "Have pap or akamu for breakfast somewhere",            badge: "Morning Roots",          points: 40, difficulty: 1 },
  { emoji: "🍤", title: "Try seafood at a spot you've never visited",           badge: "Ocean Taster",           points: 60, difficulty: 2 },
  { emoji: "🫕", title: "Find the best ofe onugbu (bitter leaf soup) near you", badge: "Soup Connoisseur",       points: 55, difficulty: 2 },
  { emoji: "🍔", title: "Visit a Nigerian-owned burger spot",                   badge: "Naija Burger Boss",      points: 45, difficulty: 1 },
  { emoji: "🥙", title: "Try shawarma from a new vendor",                       badge: "Shawarma Sheriff",       points: 40, difficulty: 1 },
  { emoji: "🍝", title: "Find a restaurant that does African fusion well",      badge: "Fusion Finder",          points: 70, difficulty: 3 },
  { emoji: "🫔", title: "Try a wrap or sandwich from a local café",             badge: "Café Crawler",           points: 35, difficulty: 1 },
  { emoji: "🍦", title: "End a meal with a local dessert or sweet treat",       badge: "Sweet Tooth",            points: 40, difficulty: 1 },
  { emoji: "🥤", title: "Try a fresh zobo or kunu from a new vendor",           badge: "Drink Detective",        points: 30, difficulty: 1 },
  { emoji: "🍳", title: "Have a full Nigerian breakfast somewhere new",         badge: "Breakfast Boss",         points: 50, difficulty: 2 },
  { emoji: "🫙", title: "Try a restaurant that specialises in soups only",      badge: "Soup Specialist",        points: 55, difficulty: 2 },
  { emoji: "🌮", title: "Visit a spot known for their small chops",             badge: "Small Chops Champion",   points: 45, difficulty: 1 },
  { emoji: "🍢", title: "Try street food from a vendor you've never tried",     badge: "Street Food Scout",      points: 50, difficulty: 2 },
  { emoji: "🥘", title: "Find a restaurant that serves your tribe's local dish",badge: "Heritage Hunter",        points: 65, difficulty: 2 },
  { emoji: "🍻", title: "Visit a spot with a great outdoor/rooftop vibe",      badge: "Vibe Seeker",            points: 60, difficulty: 2 },
  { emoji: "🫐", title: "Try a smoothie or fresh juice bar",                   badge: "Fresh Finder",           points: 35, difficulty: 1 },
  { emoji: "🍽️", title: "Visit a fine dining restaurant and simulate the review",badge: "Fine Diner",           points: 80, difficulty: 3 },
];

function getDailyChallenge(level: number) {
  const baseIdx = Math.floor(Date.now() / 86400000) % DAILY_CHALLENGES.length;
  if (level >= 3) return DAILY_CHALLENGES[baseIdx];
  const maxDifficulty = level === 1 ? 2 : 3;
  if (DAILY_CHALLENGES[baseIdx].difficulty <= maxDifficulty) return DAILY_CHALLENGES[baseIdx];
  for (let i = 1; i < DAILY_CHALLENGES.length; i++) {
    const c = DAILY_CHALLENGES[(baseIdx + i) % DAILY_CHALLENGES.length];
    if (c.difficulty <= maxDifficulty) return c;
  }
  return DAILY_CHALLENGES[baseIdx];
}

function getCuisineEmoji(types: string[]): string {
  if (types.some((t) => t.includes("seafood"))) return "🦐";
  if (types.some((t) => t.includes("bakery") || t.includes("cafe"))) return "☕";
  if (types.some((t) => t.includes("bar"))) return "🍸";
  if (types.some((t) => t.includes("fast_food"))) return "🍔";
  return "🍛";
}

type SelectedPlace = { placeId: string | null; name: string };

export default function FlavorFinderPage() {
  const { user, loading, savedReviews } = useAuth();
  const router = useRouter();
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [topPicks, setTopPicks] = useState<TopPickPlace[] | null>(null);
  const [topPicksLoading, setTopPicksLoading] = useState(true);
  const topPicksFetched = useRef<string | null>(null);

  const { level, title: personaTitle } = getPersona(savedReviews.length);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  useEffect(() => {
    if (!user) return;
    const locationKey = userLocation
      ? `${userLocation.lat.toFixed(2)},${userLocation.lng.toFixed(2)}`
      : "default";
    if (topPicksFetched.current === locationKey) return;
    topPicksFetched.current = locationKey;
    setTopPicksLoading(true);
    getTopPicks(userLocation?.lat, userLocation?.lng, personaTitle)
      .then(setTopPicks)
      .catch(() => {})
      .finally(() => setTopPicksLoading(false));
  }, [user, userLocation, personaTitle]);

  if (loading || !user) return null;

  const firstName = user.name.split(" ")[0];
  const challenge = getDailyChallenge(level);

  function handleCraving(query: string) {
    const loc = resolveLocation(query, userLocation);
    sessionStorage.setItem("chatPrefill", query);
    if (loc.lat !== undefined && loc.lng !== undefined) {
      sessionStorage.setItem("chatPrefillLat", String(loc.lat));
      sessionStorage.setItem("chatPrefillLng", String(loc.lng));
    }
    router.push("/recommend");
  }

  function openDetails(name: string, placeId?: string | null) {
    setSelectedPlace({ placeId: placeId ?? null, name });
  }

  const featuredPick = topPicks?.[0] ?? null;
  const smallPicks = topPicks?.slice(1, 3) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-16 py-10">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full mb-6 gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-black text-on-surface" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Welcome Back, <span className="text-primary">{firstName}.</span>
          </h1>
          <p className="text-on-surface-variant italic mt-1 text-sm">Correct taste Wey fit your mood today.</p>
        </div>
        <div className="flex-shrink-0 w-full md:w-auto">
          <Link
            href="/simulator"
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-primary text-white px-5 py-3 md:py-2 rounded-xl font-bold text-sm hover:bg-red-800 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            Simulate Review
          </Link>
        </div>
      </div>

      {/* Daily Challenge */}
      <div className="glass rounded-2xl p-5 flex items-center gap-4 mb-6">
        <div className="text-3xl flex-shrink-0">{challenge.emoji}</div>
        <div className="flex-grow min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-secondary mb-1">Daily Challenge 🏆</div>
          <div className="font-bold text-on-surface mb-0.5">{challenge.title}</div>
          <div className="text-xs text-on-surface-variant">Earn the &apos;{challenge.badge}&apos; badge + {challenge.points} Flavor Points</div>
        </div>
        <Link
          href={`/simulator?challenge=${encodeURIComponent(challenge.title)}`}
          className="bg-secondary text-white px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap hover:bg-orange-800 transition-all active:scale-95 flex-shrink-0"
        >
          Accept
        </Link>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Top Picks (2/3) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Section header */}
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-bold text-xl text-on-surface" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Top Picks for your &ldquo;{personaTitle}&rdquo; Persona
            </h2>
            {userLocation ? (
              <span className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                Near you
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-surface-container text-on-surface-variant">
                <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>location_on</span>
                Lagos, Nigeria
              </span>
            )}
          </div>

          {/* Loading skeletons */}
          {topPicksLoading && (
            <>
              <div className="glass rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-surface-container-high" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-surface-container-high rounded w-2/3" />
                  <div className="h-3 bg-surface-container-high rounded w-full" />
                  <div className="h-3 bg-surface-container-high rounded w-3/4" />
                  <div className="h-10 bg-surface-container-high rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1].map((i) => (
                  <div key={i} className="glass rounded-2xl p-5 animate-pulse space-y-3">
                    <div className="w-10 h-10 bg-surface-container-high rounded-xl" />
                    <div className="h-4 bg-surface-container-high rounded w-1/2" />
                    <div className="h-3 bg-surface-container-high rounded" />
                    <div className="h-3 bg-surface-container-high rounded w-3/4" />
                    <div className="h-8 bg-surface-container-high rounded-xl" />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Real API results */}
          {!topPicksLoading && featuredPick && (
            <>
              <div className="glass rounded-2xl overflow-hidden">
                <div className="h-48 relative overflow-hidden">
                  <img
                    src={featuredPick.photo_url ?? "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80"}
                    alt={featuredPick.name ?? ""}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      const t = e.target as HTMLImageElement;
                      t.onerror = null;
                      t.src = "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&q=80";
                    }}
                  />
                  {featuredPick.rating && (
                    <div className="absolute top-3 right-3 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      ★ {featuredPick.rating.toFixed(1)}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-grow min-w-0">
                      <h3 className="font-bold text-xl text-on-surface mb-1 truncate">{featuredPick.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant flex-wrap">
                        {featuredPick.vicinity && (
                          <>
                            <span className="material-symbols-outlined text-xs">location_on</span>
                            <span className="truncate">{featuredPick.vicinity}</span>
                          </>
                        )}
                        {featuredPick.price_level != null && (
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-semibold">
                            {formatPrice(featuredPick.price_level)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => openDetails(featuredPick.name ?? "", featuredPick.place_id)}
                      className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-800 transition-all active:scale-95 whitespace-nowrap flex-shrink-0"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>

              {smallPicks.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {smallPicks.map((pick, i) => (
                    <div key={pick.place_id ?? i} className="glass rounded-2xl p-5">
                      <div className="text-4xl mb-3">{getCuisineEmoji(pick.types)}</div>
                      <h4 className="font-bold text-on-surface mb-1 truncate">{pick.name}</h4>
                      <p className="text-on-surface-variant text-xs mb-3 leading-relaxed line-clamp-2">
                        {pick.vicinity ?? "See details on Google Maps"}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        {pick.price_level != null ? (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary text-white">
                            {formatPrice(pick.price_level)}
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-secondary text-white">
                            Restaurant
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openDetails(pick.name ?? "", pick.place_id)}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            View Details
                          </button>
                          <button className="text-on-surface-variant hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-base">favorite_border</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Fallback hardcoded cards (when API fails or returns empty) */}
          {!topPicksLoading && !featuredPick && (
            <>
              <div className="glass rounded-2xl overflow-hidden">
                <div className="h-48 relative overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80"
                    alt="Nigerian food"
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      const t = e.target as HTMLImageElement;
                      t.onerror = null;
                      t.src = "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&q=80";
                    }}
                  />
                  <div className="absolute top-3 right-3 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    ★ 4.8 Match
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-grow">
                      <h3 className="font-bold text-xl text-on-surface mb-1">Yellow Chilli</h3>
                      <p className="text-on-surface-variant text-sm mb-2">
                        Contemporary Pan-African fine dining with a legendary Seafood Okra.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant flex-wrap">
                        <span className="material-symbols-outlined text-xs">location_on</span>
                        Victoria Island, Lagos
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-semibold">{formatPrice(3)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => openDetails("Yellow Chilli")}
                      className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-800 transition-all active:scale-95 whitespace-nowrap"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    name: "Olaiya's Kitchen",
                    desc: "The gold standard for Amala and Gbegiri in the city. Truly authentic vibes.",
                    tag: "BUKA KING",
                    emoji: "🍲",
                    tagClass: "bg-secondary text-white",
                  },
                  {
                    name: "Sailors Lounge",
                    desc: "Waterfront cocktails with a spicy Suya twist. Perfect for evening networking.",
                    tag: "WATERFRONT",
                    emoji: "🍸",
                    tagClass: "bg-tertiary text-white",
                  },
                ].map((spot) => (
                  <div key={spot.name} className="glass rounded-2xl p-5">
                    <div className="text-4xl mb-3">{spot.emoji}</div>
                    <h4 className="font-bold text-on-surface mb-1">{spot.name}</h4>
                    <p className="text-on-surface-variant text-xs mb-3 leading-relaxed">{spot.desc}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${spot.tagClass}`}>{spot.tag}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDetails(spot.name)}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          View Details
                        </button>
                        <button className="text-on-surface-variant hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-base">favorite_border</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Browse by Craving */}
          <div className="glass rounded-2xl p-5">
            <h3 className="font-bold text-lg text-on-surface mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Browse by Craving
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {CRAVINGS.map(({ emoji, label, query }) => (
                <button
                  key={label}
                  onClick={() => handleCraving(query)}
                  className="flex flex-col items-center gap-1 p-3 bg-surface-container-low rounded-xl hover:bg-primary-fixed/20 transition-colors"
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-xs font-semibold text-on-surface-variant text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <Link
            href="/recommend"
            className="block w-full text-center bg-primary/15 border border-primary/30 text-primary font-semibold py-3 rounded-xl hover:bg-primary/25 transition-all text-sm"
          >
            Browse All Flavors with AI →
          </Link>
        </div>

        {/* Right sidebar (1/3) */}
        <div className="space-y-4">
          {/* Cross-Domain Taste */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white" style={{ fontSize: "14px" }}>auto_awesome</span>
              </div>
              <div>
                <div className="text-sm font-bold text-on-surface">Cross-Domain Taste</div>
                <div className="text-xs text-on-surface-variant">Unlocked Persona Insights</div>
              </div>
            </div>

            <div className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Reading for the Vibe</div>
            <div className="space-y-4">
              {BOOKS.map((book) => (
                <div key={book.title} className="flex gap-3">
                  <div className="text-3xl flex-shrink-0">{book.emoji}</div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-on-surface leading-tight">{book.title}</div>
                    <div className="text-xs text-on-surface-variant mb-1">{book.author}</div>
                    <div className="text-xs text-on-surface-variant italic leading-tight mb-2 line-clamp-2">
                      &ldquo;{book.note}&rdquo;
                    </div>
                    <button className="text-xs font-bold text-primary hover:underline">{book.link}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Engine Reasoning */}
          <div className="glass rounded-2xl p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-4">Engine Reasoning</div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-on-surface-variant mb-1.5">
                  <span>Lyrical/Poetic</span>
                  <span>Spicy/Bold</span>
                </div>
                <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "72%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-on-surface-variant mb-1.5">
                  <span>Budget</span>
                  <span>Premium</span>
                </div>
                <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: `${Math.min((level / 4) * 100, 90)}%` }} />
                </div>
              </div>
            </div>
            <Link
              href="/profile"
              className="mt-4 block text-center text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
            >
              See full Persona Data →
            </Link>
          </div>

          {/* Weekend Event promo */}
          <div className="rounded-2xl p-5 border border-secondary/30 bg-secondary/10">
            <div className="text-sm font-bold text-on-surface mb-1">Weekend Foodie Tour</div>
            <div className="text-xs text-on-surface-variant mb-3">
              Join a curated &ldquo;Cultural Vibe&rdquo; tour with other Persona-matches.
            </div>
            <button className="w-full bg-secondary text-white py-2 rounded-xl text-xs font-bold hover:bg-orange-800 transition-all active:scale-95">
              EXPLORE EVENT
            </button>
          </div>

          {/* Level chip */}
          <div className="glass rounded-2xl p-4 text-center">
            <div className="text-xs text-on-surface-variant mb-1">Your Persona Level</div>
            <div className="text-2xl font-black text-primary mb-1">Level {level}</div>
            <div className="text-sm font-semibold text-on-surface">{personaTitle}</div>
            <div className="text-xs text-on-surface-variant mt-1">{savedReviews.length} review{savedReviews.length !== 1 ? "s" : ""} simulated</div>
          </div>
        </div>
      </div>

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
