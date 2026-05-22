"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const FALLBACK_RADAR = [0.7, 0.4, 0.85, 0.9, 0.55, 0.65];

function RadarChart({ values }: { values: number[] }) {
  const labels = ["Spicy", "Sweet", "Savory", "Local", "Adventurous", "Social"];
  const cx = 120, cy = 120, maxR = 85;
  const n = labels.length;

  function toPoint(idx: number, val: number) {
    const angle = (idx * (2 * Math.PI) / n) - Math.PI / 2;
    return { x: cx + val * maxR * Math.cos(angle), y: cy + val * maxR * Math.sin(angle) };
  }

  function ringPath(val: number) {
    return Array.from({ length: n }, (_, i) => {
      const p = toPoint(i, val);
      return `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(" ") + " Z";
  }

  const dataPath = values.map((v, i) => {
    const p = toPoint(i, v);
    return `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ") + " Z";

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[260px] mx-auto">
      {[0.25, 0.5, 0.75, 1].map((v) => (
        <path key={v} d={ringPath(v)} fill="none" stroke="#e4bebc" strokeWidth="1" />
      ))}
      {labels.map((_, i) => {
        const p = toPoint(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke="#e4bebc" strokeWidth="1" />;
      })}
      <path d={dataPath} fill="rgba(183,16,42,0.15)" stroke="#b7102a" strokeWidth="2" />
      {values.map((v, i) => {
        const p = toPoint(i, v);
        return <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4" fill="#b7102a" />;
      })}
      {labels.map((label, i) => {
        const p = toPoint(i, 1.28);
        return (
          <text key={i} x={p.x.toFixed(1)} y={p.y.toFixed(1)} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="600" fill="#5b403f">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

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
  const [radarValues, setRadarValues] = useState<number[]>(FALLBACK_RADAR);
  const [radarLoading, setRadarLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/radar")
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data) && data.length === 6) setRadarValues(data as number[]);
      })
      .catch(() => {})
      .finally(() => setRadarLoading(false));
  }, [user]);

  if (loading || !user) return null;

  const reviewCount = savedReviews.length;
  const level = Math.floor(reviewCount / 5) + 1;
  const personaTitles = ["Curious Taster", "Flavor Seeker", "Taste Connoisseur", "Flavor Oracle"];
  const personaTitle = personaTitles[Math.min(level - 1, 3)];
  const levelPct = Math.min(((reviewCount % 5) / 5) * 100, 100);

  const recentReviews = [...savedReviews].reverse().slice(0, 5);

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-16 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-on-surface" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Welcome back, {user.name.split(" ")[0]}.
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">Your Flavor Gist, all in one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: 1) User card  2) Flavor Radar */}
        <div className="space-y-4">
          {/* 1. User card */}
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

          {/* 2. Flavor Radar */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-bold text-xl mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Your Flavor Radar</h3>
            <p className="text-xs text-on-surface-variant mb-4">Based on your taste profile</p>
            {radarLoading ? (
              <div className="h-[260px] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <RadarChart values={radarValues} />
            )}
          </div>
        </div>

        {/* Right columns: 3) Connect Your Data  4) Badges  5) Recent Activity */}
        <div className="md:col-span-2 space-y-6">
          {/* 3. Connect Your Data */}
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

          {/* 4. Badges */}
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

          {/* 5. Recent Activity */}
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
                <p className="text-sm">Wetin you don chop? No reviews yet. Go simulate one!</p>
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
