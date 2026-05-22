"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, getPersona } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/utils";
import PlaceDetailsModal from "@/components/PlaceDetailsModal";
import { resolveLocation, UserLocation } from "@/lib/location";

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

type SelectedPlace = { placeId: string | null; name: string };

export default function FlavorFinderPage() {
  const { user, loading, savedReviews } = useAuth();
  const router = useRouter();
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

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

  if (loading || !user) return null;

  const { level, title: personaTitle } = getPersona(savedReviews.length);
  const firstName = user.name.split(" ")[0];

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

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-16 py-10">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-on-surface mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Welcome Back, <span className="text-primary">{firstName}.</span>
        </h1>
        <p className="text-on-surface-variant italic text-sm">Correct taste Wey fit your mood today.</p>
      </div>

      {/* Daily Challenge */}
      <div className="glass rounded-2xl p-5 flex items-start gap-4 mb-6">
        <div className="text-3xl flex-shrink-0">🍲</div>
        <div className="flex-grow min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-secondary mb-1">Daily Challenge 🏆</div>
          <div className="font-bold text-on-surface mb-0.5">Try a pepper soup spot you&apos;ve never visited</div>
          <div className="text-xs text-on-surface-variant">Earn the &apos;Pepper Soup Pioneer&apos; badge + 50 Flavor Points</div>
        </div>
        <Link
          href="/simulator"
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
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: "#E63946", color: "white" }}>Modern Fusion</span>
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: "#0D9488", color: "white" }}>Victoria Island</span>
            {(() => {
              if (!userLocation) return null;
              const loc = resolveLocation("near me", userLocation);
              if (loc.useGPS) {
                return (
                  <span className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    Near you
                  </span>
                );
              }
              if (loc.label) {
                return (
                  <span className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-surface-container text-on-surface-variant">
                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>location_on</span>
                    {loc.label}
                  </span>
                );
              }
              return null;
            })()}
          </div>

          {/* Featured restaurant card */}
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

          {/* Smaller picks grid */}
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
