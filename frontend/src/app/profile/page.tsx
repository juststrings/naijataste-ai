"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface SavedReview {
  restaurant: string;
  review: string;
  rating: number;
  date: string;
}

const FLAVOR_QUOTES = {
  street: '"You no dey play with pepper — that\'s how we know you\'re real."',
  balanced: '"Chief, your taste buds get clear direction. You no dey joke with pepper at all!"',
  premium: '"Your palate is a Lagos skyline — elevated, expensive, and worth every naira."',
};

const FLAVOR_TAGS: Record<string, string[]> = {
  street: ["🌶️ High Spice Tolerance", "💰 Budget: Low", "🍢 Street Food Specialist", "🔥 Buka Regular"],
  balanced: ["🍲 Balanced Palate", "💰 Budget: Moderate", "🏠 Comfort Food Fan", "🍰 Pastry Lover"],
  premium: ["💎 Premium Taste", "💰 Budget: High", "🍽️ Fine Dining Fan", "🥂 Special Occasions"],
};

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<SavedReview[]>([]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    const saved = JSON.parse(localStorage.getItem("nt_reviews") ?? "[]");
    setReviews(saved.slice(-5).reverse());
  }, [user, router]);

  if (!user) return null;

  const flavor = user.flavor ?? "balanced";
  const quote = FLAVOR_QUOTES[flavor as keyof typeof FLAVOR_QUOTES] ?? FLAVOR_QUOTES.balanced;
  const tags = FLAVOR_TAGS[flavor as keyof typeof FLAVOR_TAGS] ?? FLAVOR_TAGS.balanced;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-16 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-on-surface" style={{ fontFamily: "Montserrat, sans-serif" }}>
          My Flavor Profile
        </h1>
        <Link
          href="/simulator"
          className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-red-800 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-base">edit</span> Simulate Review
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User card */}
        <div className="glass rounded-2xl p-6 text-center">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white font-black text-4xl mx-auto mb-4">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="font-bold text-2xl text-on-surface mb-1">{user.name}</h2>
          <p className="text-sm text-on-surface-variant mb-4">Lagos, Nigeria • Foodie Level 42</p>
          <div className="border-t border-outline-variant/20 pt-4">
            <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
              Connect Your Data
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🍴</span>
                  <div>
                    <div className="text-xs font-bold">Yelp</div>
                    <div className="text-xs text-on-surface-variant">Import 24 reviews</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-tertiary text-base">link</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📚</span>
                  <div>
                    <div className="text-xs font-bold">Goodreads</div>
                    <div className="text-xs text-on-surface-variant">Sync culinary reading</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-base">add</span>
              </div>
            </div>
          </div>
        </div>

        {/* Flavor profile */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <h3 className="font-bold text-xl" style={{ fontFamily: "Montserrat, sans-serif" }}>Your Flavor Profile</h3>
            </div>
            <div className="flex flex-wrap gap-3 mb-5">
              {tags.map((tag) => (
                <span key={tag} className="profile-tag bg-tertiary text-white">{tag}</span>
              ))}
            </div>
            <div className="bg-surface-container-low rounded-xl p-4 italic text-sm text-on-surface-variant border-l-4 border-primary">
              {quote}
            </div>
          </div>

          {/* Recent activity */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-bold text-xl mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>Recent Activity</h3>
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant">
                <div className="text-4xl mb-3">🍛</div>
                <p className="text-sm">No reviews yet. Go simulate one!</p>
                <Link href="/simulator" className="mt-3 inline-block text-primary font-semibold text-sm hover:underline">
                  + Simulate a review
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((r, i) => (
                  <div key={i} className="flex gap-4 items-start p-3 bg-surface-container-low rounded-xl">
                    <div className="text-3xl">🍛</div>
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <div className="font-bold text-sm">{r.restaurant}</div>
                        <div className="text-xs text-on-surface-variant">{r.date}</div>
                      </div>
                      <div className="text-xs text-on-surface-variant italic">
                        {r.review.substring(0, 80)}...
                      </div>
                      <div className="text-xs mt-1">
                        {"⭐".repeat(r.rating)}
                        <span className="opacity-30">{"⭐".repeat(5 - r.rating)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <Link href="/simulator" className="mt-4 block text-center text-sm text-primary font-semibold hover:underline">
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
