"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface AuthUser {
  name: string;
  email: string;
  avatar: string;
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
  login: (user: AuthUser) => void;
  logout: () => void;
  savedReviews: SavedReview[];
  addReview: (review: SavedReview) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
  savedReviews: [],
  addReview: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [savedReviews, setSavedReviews] = useState<SavedReview[]>([]);

  useEffect(() => {
    const rawUser = localStorage.getItem("nt_user");
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        if (!parsed.avatar) parsed.avatar = makeAvatar(parsed.name ?? "U");
        setUser(parsed);
      } catch {
        localStorage.removeItem("nt_user");
      }
    }
    const rawRevs = localStorage.getItem("nt_reviews");
    if (rawRevs) {
      try {
        setSavedReviews(JSON.parse(rawRevs));
      } catch {
        localStorage.removeItem("nt_reviews");
      }
    }
  }, []);

  function login(u: AuthUser) {
    setUser(u);
    localStorage.setItem("nt_user", JSON.stringify(u));
  }

  function logout() {
    setUser(null);
    setSavedReviews([]);
    localStorage.removeItem("nt_user");
    localStorage.removeItem("nt_reviews");
  }

  function addReview(review: SavedReview) {
    const next = [...savedReviews, review];
    setSavedReviews(next);
    localStorage.setItem("nt_reviews", JSON.stringify(next));
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, savedReviews, addReview }}>
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
