"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSession, signOut } from "next-auth/react";

export interface AuthUser {
  name: string;
  email: string;
  avatar: string;
  image?: string | null;
  flavor?: "street" | "balanced" | "premium";
}

export interface SavedReview {
  id: string;
  restaurant: string;
  review: string;
  rating: number;
  date: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  savedReviews: SavedReview[];
  addReview: (review: SavedReview) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  savedReviews: [],
  addReview: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [savedReviews, setSavedReviews] = useState<SavedReview[]>([]);

  const user: AuthUser | null = session?.user
    ? {
        name: session.user.name || "",
        email: session.user.email || "",
        avatar: makeAvatar(session.user.name || "U"),
        image: session.user.image,
      }
    : null;

  const loading = status === "loading";

  // Fetch reviews from DB whenever user is authenticated
  useEffect(() => {
    if (!session?.user) {
      setSavedReviews([]);
      return;
    }
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setSavedReviews(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.map((r: any) => ({
              id: r.id,
              restaurant: r.restaurantName,
              review: r.reviewText,
              rating: r.rating,
              date: new Date(r.createdAt).toLocaleDateString(),
            }))
          );
        }
      })
      .catch(() => {});
  }, [session?.user]);

  function login() {
    // No-op: login is handled by NextAuth signIn() in the login page
  }

  function logout() {
    signOut({ callbackUrl: "/" });
  }

  async function addReview(review: SavedReview) {
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName: review.restaurant,
          reviewText: review.review,
          rating: review.rating,
          location: "",
        }),
      });
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const saved: any = await res.json();
        const local: SavedReview = {
          id: saved.id,
          restaurant: saved.restaurantName,
          review: saved.reviewText,
          rating: saved.rating,
          date: new Date(saved.createdAt).toLocaleDateString(),
        };
        setSavedReviews((prev) => [...prev, local]);
      } else {
        // Fallback: add to local state so UI doesn't break
        setSavedReviews((prev) => [...prev, review]);
      }
    } catch {
      setSavedReviews((prev) => [...prev, review]);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, savedReviews, addReview }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function makeAvatar(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

export function getPersona(reviewCount: number): { level: number; title: string } {
  const level = Math.floor(reviewCount / 5) + 1;
  const titles = ["Curious Taster", "Flavor Seeker", "Taste Connoisseur", "Flavor Oracle"];
  return { level, title: titles[Math.min(level - 1, 3)] };
}
