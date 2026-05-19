"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [flavor, setFlavor] = useState<"street" | "balanced" | "premium">("balanced");

  function doLogin() {
    const finalName = name.trim() || "Emeka";
    const finalEmail = email.trim() || "emeka@naijataste.ai";
    login({ name: finalName, email: finalEmail, flavor });
    router.push("/");
  }

  function doGoogleLogin() {
    login({ name: "Emeka Nwosu", email: "emeka@gmail.com", flavor });
    router.push("/");
  }

  const flavors: Array<{ value: "street" | "balanced" | "premium"; emoji: string; label: string }> = [
    { value: "street", emoji: "🔥", label: "Street" },
    { value: "balanced", emoji: "🍲", label: "Balanced" },
    { value: "premium", emoji: "💎", label: "Premium" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        <div className="auth-card bg-white p-8 md:p-10 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary-container to-tertiary" />
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🍛</div>
            <h1 className="font-bold text-2xl text-on-surface mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Welcome Back, Oga/Madam
            </h1>
            <p className="text-secondary italic text-sm">Correct taste guaranteed. Abeg, log in to continue.</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Emeka Nwosu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-outline/20 bg-surface-container-lowest text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1">Email Address</label>
              <input
                type="email"
                placeholder="emeka@naijataste.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-outline/20 bg-surface-container-lowest text-sm transition-all"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-semibold text-on-surface-variant">Password</label>
                <button className="text-xs text-primary hover:underline">Forgot password?</button>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-outline/20 bg-surface-container-lowest text-sm transition-all"
              />
            </div>

            {/* Flavor persona selector */}
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">Your Flavor Persona</label>
              <div className="grid grid-cols-3 gap-2">
                {flavors.map(({ value, emoji, label }) => (
                  <button
                    key={value}
                    onClick={() => setFlavor(value)}
                    className={`border-2 rounded-xl p-3 text-center transition-all hover:border-primary ${
                      flavor === value ? "border-primary bg-primary-fixed" : "border-outline/20"
                    }`}
                  >
                    <div className="text-2xl mb-1">{emoji}</div>
                    <div className="text-xs font-semibold">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={doLogin}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-red-800 transition-all active:scale-95 shadow-lg"
            >
              Login <span className="material-symbols-outlined">arrow_forward</span>
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-outline-variant/30" />
              <span className="mx-4 text-xs text-on-surface-variant opacity-60">OR</span>
              <div className="flex-grow border-t border-outline-variant/30" />
            </div>

            <button
              onClick={doGoogleLogin}
              className="w-full bg-white border-2 border-outline/20 text-on-surface text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-surface-container transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Sign in with Google
            </button>

            <p className="text-center text-sm text-on-surface-variant">
              New here?{" "}
              <button onClick={doLogin} className="text-secondary font-bold hover:underline">Sign Up</button>
            </p>
          </div>
        </div>
        <p className="text-center text-xs text-outline italic mt-6 animate-pulse">
          &ldquo;Food wey sweet, na person cook am.&rdquo; — Ancient Lagos Proverb
        </p>
      </div>
    </div>
  );
}
