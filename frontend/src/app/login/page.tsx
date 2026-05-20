"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";

type Tab = "login" | "signup";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  // Signup fields
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});

  async function handleLogin() {
    const errors: Record<string, string> = {};
    if (!loginEmail.trim()) errors.email = "Email is required";
    else if (!isValidEmail(loginEmail)) errors.email = "Enter a valid email address";
    if (!loginPassword.trim()) errors.password = "Password is required";
    if (Object.keys(errors).length > 0) { setLoginErrors(errors); return; }
    setLoginErrors({});
    setLoading(true);

    const result = await signIn("credentials", {
      email: loginEmail.trim(),
      password: loginPassword,
      isSignUp: "false",
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setLoginErrors({ password: "Invalid email or password." });
    } else {
      router.push("/");
    }
  }

  async function handleSignup() {
    const errors: Record<string, string> = {};
    if (!signupName.trim()) errors.name = "Name is required";
    if (!signupEmail.trim()) errors.email = "Email is required";
    else if (!isValidEmail(signupEmail)) errors.email = "Enter a valid email address";
    if (!signupPassword.trim()) errors.password = "Password is required";
    else if (signupPassword.length < 6) errors.password = "Password must be at least 6 characters";
    if (Object.keys(errors).length > 0) { setSignupErrors(errors); return; }
    setSignupErrors({});
    setLoading(true);

    const result = await signIn("credentials", {
      email: signupEmail.trim(),
      password: signupPassword,
      name: signupName.trim(),
      isSignUp: "true",
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setSignupErrors({ email: result.error === "Email already exists" ? "That email is already registered." : "Sign-up failed. Try again." });
    } else {
      router.push("/");
    }
  }

  async function handleGoogle() {
    await signIn("google", { callbackUrl: "/" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        <div className="auth-card bg-white rounded-2xl relative overflow-hidden">
          {/* Gradient top bar */}
          <div className="h-1.5 bg-gradient-to-r from-primary via-secondary-container to-tertiary" />

          {/* Tab toggle */}
          <div className="flex border-b border-outline-variant/20">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${tab === "login" ? "text-primary border-b-2 border-primary -mb-px" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              Login
            </button>
            <button
              onClick={() => setTab("signup")}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${tab === "signup" ? "text-primary border-b-2 border-primary -mb-px" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              Sign Up
            </button>
          </div>

          <div className="p-8 md:p-10">
            {tab === "login" ? (
              <>
                <div className="text-center mb-8">
                  <h1 className="font-bold text-2xl text-on-surface mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Welcome Back, Oga/Madam
                  </h1>
                  <p className="text-secondary italic text-sm">Correct taste guaranteed. Abeg, log in to continue.</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface-variant mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="emeka@naijataste.ai"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      className={`w-full px-4 py-3 rounded-xl border-2 bg-surface-container-lowest text-sm transition-all ${loginErrors.email ? "border-error" : "border-outline/20"}`}
                    />
                    {loginErrors.email && <p className="text-error text-xs mt-1">{loginErrors.email}</p>}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-semibold text-on-surface-variant">Password</label>
                      <button className="text-xs text-primary hover:underline">Forgot password?</button>
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      className={`w-full px-4 py-3 rounded-xl border-2 bg-surface-container-lowest text-sm transition-all ${loginErrors.password ? "border-error" : "border-outline/20"}`}
                    />
                    {loginErrors.password && <p className="text-error text-xs mt-1">{loginErrors.password}</p>}
                  </div>

                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-red-800 transition-all active:scale-95 shadow-lg disabled:opacity-60"
                  >
                    {loading ? "Logging in..." : <>Login <span className="material-symbols-outlined">arrow_forward</span></>}
                  </button>

                  <div className="relative flex items-center">
                    <div className="flex-grow border-t border-outline-variant/30" />
                    <span className="mx-4 text-xs text-on-surface-variant opacity-60">OR</span>
                    <div className="flex-grow border-t border-outline-variant/30" />
                  </div>

                  <button
                    onClick={handleGoogle}
                    className="w-full bg-white border-2 border-outline/20 text-on-surface text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-surface-container transition-colors"
                  >
                    <GoogleIcon />
                    Sign in with Google
                  </button>

                  <p className="text-center text-sm text-on-surface-variant">
                    New here?{" "}
                    <button onClick={() => setTab("signup")} className="text-secondary font-bold hover:underline">Sign Up</button>
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="font-bold text-2xl text-on-surface mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Join the Flavor Community
                  </h1>
                  <p className="text-secondary italic text-sm">Oya, create your account and find correct taste.</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface-variant mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="Emeka Nwosu"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 bg-surface-container-lowest text-sm transition-all ${signupErrors.name ? "border-error" : "border-outline/20"}`}
                    />
                    {signupErrors.name && <p className="text-error text-xs mt-1">{signupErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-on-surface-variant mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="emeka@naijataste.ai"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 bg-surface-container-lowest text-sm transition-all ${signupErrors.email ? "border-error" : "border-outline/20"}`}
                    />
                    {signupErrors.email && <p className="text-error text-xs mt-1">{signupErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-on-surface-variant mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="Min. 6 characters"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 bg-surface-container-lowest text-sm transition-all ${signupErrors.password ? "border-error" : "border-outline/20"}`}
                    />
                    {signupErrors.password && <p className="text-error text-xs mt-1">{signupErrors.password}</p>}
                  </div>

                  <button
                    onClick={handleSignup}
                    disabled={loading}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-red-800 transition-all active:scale-95 shadow-lg disabled:opacity-60"
                  >
                    {loading ? "Creating account..." : <>Create Account <span className="material-symbols-outlined">arrow_forward</span></>}
                  </button>

                  <div className="relative flex items-center">
                    <div className="flex-grow border-t border-outline-variant/30" />
                    <span className="mx-4 text-xs text-on-surface-variant opacity-60">OR</span>
                    <div className="flex-grow border-t border-outline-variant/30" />
                  </div>

                  <button
                    onClick={handleGoogle}
                    className="w-full bg-white border-2 border-outline/20 text-on-surface text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-surface-container transition-colors"
                  >
                    <GoogleIcon />
                    Sign up with Google
                  </button>

                  <p className="text-center text-sm text-on-surface-variant">
                    Already have an account?{" "}
                    <button onClick={() => setTab("login")} className="text-secondary font-bold hover:underline">Login</button>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-outline italic mt-6 animate-pulse">
          &ldquo;Food wey sweet, na person cook am.&rdquo; — Ancient Lagos Proverb
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}
