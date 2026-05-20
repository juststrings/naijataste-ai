"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const BADGES = [
  { id: "first_bite", label: "First Bite", icon: "🍔", desc: "Simulate your first review", threshold: 1 },
  { id: "flavor_explorer", label: "Flavor Explorer", icon: "🧭", desc: "Reach 5 simulations", threshold: 5 },
  { id: "taste_oracle", label: "Taste Oracle", icon: "🔮", desc: "Reach 10 simulations", threshold: 10 },
  { id: "pidgin_pro", label: "Pidgin Pro", icon: "🗣️", desc: "Reach 20 simulations", threshold: 20 },
];

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <div className="flex gap-0.5 mt-1">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`material-symbols-outlined text-sm ${i < full ? "star-on" : "star-off"}`}
          style={{ fontVariationSettings: `'FILL' ${i < full ? 1 : 0}` }}
        >
          star
        </span>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading, logout, savedReviews } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  const reviewCount = savedReviews.length;
  const level = Math.floor(reviewCount / 5) + 1;
  const personaTitles = ["Curious Taster", "Flavor Seeker", "Taste Connoisseur", "Flavor Oracle"];
  const personaTitle = personaTitles[Math.min(level - 1, 3)];
  const levelPct = Math.min(((reviewCount % 5) / 5) * 100, 100);

  const recentReviews = [...savedReviews].reverse().slice(0, 5);

  const flavorTags = [
    reviewCount >= 5 ? "🌶️ High Spice Tolerance" : "🍽️ Exploring Flavors",
    "💰 Budget: Moderate",
    "🍢 Street Food Fan",
    "🍰 Pastry Lover",
  ];

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-16 py-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-on-surface" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Welcome back, {user.name.split(" ")[0]}.
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">Your Flavor Gist — all in one place.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/simulator"
            className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-red-800 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-base">edit</span> Simulate Review
          </Link>
          <button
            onClick={handleLogout}
            className="border-2 border-outline/20 text-on-surface-variant px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:border-error hover:text-error transition-all"
          >
            <span className="material-symbols-outlined text-base">logout</span> Log out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: user card + connect data */}
        <div className="space-y-4">
          <div className="glass rounded-2xl p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white font-black text-3xl mx-auto mb-4">
              {user.avatar || user.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="font-bold text-2xl text-on-surface mb-1">{user.name}</h2>
            <p className="text-sm text-on-surface-variant mb-1">{user.email}</p>
            <div className="inline-flex items-center gap-2 bg-primary-fixed text-primary text-xs font-bold px-3 py-1 rounded-full mb-4">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              Level {level} • {personaTitle}
            </div>
            <div className="flex gap-2 items-center mb-4">
              <div className="flex-1 bg-surface-container-high rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${levelPct}%` }} />
              </div>
              <span className="text-xs text-on-surface-variant whitespace-nowrap">{reviewCount % 5}/5</span>
            </div>
          </div>

          {/* Connect Your Data */}
          <div className="glass rounded-2xl p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
              Connect Your Data
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl cursor-not-allowed opacity-60">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🍴</span>
                  <div>
                    <div className="text-xs font-bold">Yelp</div>
                    <div className="text-xs text-on-surface-variant">Import 24 reviews</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-tertiary text-base">link</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl cursor-not-allowed opacity-60">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📚</span>
                  <div>
                    <div className="text-xs font-bold">Goodreads</div>
                    <div className="text-xs text-on-surface-variant">Sync culinary reading</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-base">add</span>
              </div>
              <p className="text-xs text-on-surface-variant text-center pt-1 italic">Coming in Phase 2</p>
            </div>
          </div>
        </div>

        {/* Right columns: flavor profile + badges + activity */}
        <div className="md:col-span-2 space-y-6">
          {/* Flavor Profile */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <h3 className="font-bold text-xl" style={{ fontFamily: "Montserrat, sans-serif" }}>Your Flavor Profile</h3>
            </div>
            <div className="flex flex-wrap gap-2 mb-5">
              {flavorTags.map((tag) => (
                <span key={tag} className="profile-tag bg-tertiary text-white">{tag}</span>
              ))}
            </div>
            <div className="bg-surface-container-low rounded-xl p-4 italic text-sm text-on-surface-variant border-l-4 border-primary">
              &ldquo;Chief, your taste buds get clear direction. You no dey joke with pepper at all!&rdquo;
            </div>
          </div>

          {/* Badges */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-bold text-xl mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>Badges</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {BADGES.map((badge) => {
                const unlocked = reviewCount >= badge.threshold;
                return (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      unlocked
                        ? "border-secondary bg-secondary-fixed/40"
                        : "border-outline/15 opacity-40 grayscale"
                    }`}
                  >
                    <div className="text-3xl mb-2">{badge.icon}</div>
                    <div className="font-bold text-xs text-on-surface">{badge.label}</div>
                    <div className="text-xs text-on-surface-variant mt-1 leading-tight">{badge.desc}</div>
                    {unlocked && (
                      <div className="mt-2 text-xs font-bold text-tertiary flex items-center justify-center gap-0.5">
                        <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        Earned
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl" style={{ fontFamily: "Montserrat, sans-serif" }}>Recent Activity</h3>
              {recentReviews.length > 0 && (
                <span className="text-xs text-on-surface-variant">{reviewCount} total</span>
              )}
            </div>
            {recentReviews.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant">
                <div className="text-4xl mb-3">🍛</div>
                <p className="text-sm">Wetin you don chop? No reviews yet — go simulate one!</p>
                <Link href="/simulator" className="mt-3 inline-block text-primary font-semibold text-sm hover:underline">
                  + Simulate a review
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReviews.map((r) => (
                  <div key={r.id} className="flex gap-4 items-start p-3 bg-surface-container-low rounded-xl">
                    <div className="text-3xl flex-shrink-0">🍛</div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between gap-2">
                        <div className="font-bold text-sm truncate">{r.restaurant}</div>
                        <div className="text-xs text-on-surface-variant whitespace-nowrap">{r.date}</div>
                      </div>
                      <div className="text-xs text-on-surface-variant italic mt-0.5 line-clamp-2">
                        {r.review.substring(0, 100)}{r.review.length > 100 ? "..." : ""}
                      </div>
                      <Stars rating={r.rating} />
                    </div>
                  </div>
                ))}
                <Link href="/simulator" className="mt-2 block text-center text-sm text-primary font-semibold hover:underline">
                  + Simulate a new review
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
