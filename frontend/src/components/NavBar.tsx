"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const GUEST_NAV = [
  { href: "/simulator", label: "Review Simulator" },
  { href: "/recommend", label: "Recommendations" },
  { href: "/about", label: "About" },
];

const AUTH_NAV = [
  { href: "/flavor-finder", label: "Flavor Finder" },
  { href: "/recommend", label: "Recommendations" },
  { href: "/simulator", label: "Review Simulator" },
  { href: "/profile", label: "My Profile" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const NAV_LINKS = user ? AUTH_NAV : GUEST_NAV;

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-outline-variant/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-16 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <svg width="38" height="38" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#b7102a" }} />
                <stop offset="100%" style={{ stopColor: "#ffab69" }} />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="90" fill="white" stroke="url(#g1)" strokeWidth="8" />
            <path d="M60 140 Q100 160 140 140" stroke="#b7102a" strokeWidth="8" fill="none" strokeLinecap="round" />
            <path d="M70 80 C70 60 130 60 130 80" stroke="#00685d" strokeWidth="12" fill="none" strokeLinecap="round" />
            <text x="100" y="115" fontFamily="Montserrat,sans-serif" fontSize="22" fontWeight="bold" fill="#001f29" textAnchor="middle">NT AI</text>
          </svg>
          <span className="font-bold text-xl text-primary" style={{ fontFamily: "Montserrat, sans-serif" }}>NaijaTaste AI</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-8 items-center text-sm font-semibold">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-on-surface-variant hover:text-primary transition-colors ${pathname === href ? "text-primary border-b-2 border-primary pb-0.5" : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Auth area */}
        {user ? (
          <div className="flex items-center gap-3">
            <Link href="/profile" className="flex items-center gap-2 hover:bg-surface-container px-3 py-2 rounded-xl transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-on-surface hidden md:block">
                {user.name.split(" ")[0]}
              </span>
            </Link>
            <button onClick={handleLogout} className="text-xs text-on-surface-variant hover:text-error transition-colors">
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors hidden md:block">
              Login
            </Link>
            <Link href="/login" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-800 active:scale-95 transition-all">
              Get Started
            </Link>
          </div>
        )}

        {/* Mobile hamburger */}
        <button
          className="md:hidden ml-2 p-2 rounded-lg hover:bg-surface-container transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined">{menuOpen ? "close" : "menu"}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-outline-variant/20 px-4 py-3 flex flex-col gap-3">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-semibold py-2 ${pathname === href ? "text-primary" : "text-on-surface-variant"}`}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
