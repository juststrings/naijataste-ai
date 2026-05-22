"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className={`relative z-10 bg-inverse-surface text-inverse-on-surface py-10 mt-auto ${user ? "hidden md:block" : "block"}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-16 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <div className="font-bold text-xl mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
            NaijaTaste
          </div>
          <p className="text-sm opacity-60">© 2026 NaijaTaste. Correct taste, every time.</p>
        </div>
        <div className="flex gap-6 text-sm opacity-70 flex-wrap justify-center">
          <Link href="/" className="hover:opacity-100 transition-opacity">Home</Link>
          <Link href="/simulator" className="hover:opacity-100 transition-opacity">Review Simulator</Link>
          <Link href="/recommend" className="hover:opacity-100 transition-opacity">Recommendations</Link>
          <Link href="/about" className="hover:opacity-100 transition-opacity">About</Link>
          <a href="https://naijataste-ai-production.up.railway.app/docs" target="_blank" rel="noreferrer" className="hover:opacity-100 transition-opacity">API Docs</a>
          <a href="https://github.com/juststrings/naijataste-ai" target="_blank" rel="noreferrer" className="hover:opacity-100 transition-opacity">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
