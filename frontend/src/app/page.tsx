"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PersonaCard from "@/components/PersonaCard";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push("/flavor-finder");
  }, [user, router]);

  if (user) return null;

  return <GuestHome />;
}

function GuestHome() {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 md:px-16 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h1
            className="text-4xl md:text-6xl font-black text-on-surface leading-tight mb-4"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Correct Taste, <span className="text-primary">Every Time.</span>
          </h1>
          <p className="text-lg text-on-surface-variant mb-8">
            We recommend spots that match the Nigerian taste. Spice, smoke, and soul.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto text-center bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-red-800 transition-all active:scale-95 shadow-lg"
            >
              Login
            </Link>
            <Link
              href="/simulator"
              className="w-full sm:w-auto text-center border-2 border-primary text-primary px-8 py-3 rounded-full font-bold hover:bg-primary hover:text-white transition-all"
            >
              Try as Guest →
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Row 1 — 60% / 40% */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/20">
            <div className="text-3xl mb-3">🍛</div>
            <div className="font-bold text-on-surface mb-1">Jollof Mastery</div>
            <div className="text-sm text-on-surface-variant">Predicts how any Nigerian user would rate any restaurant</div>
          </div>
          <div className="lg:col-span-2 bg-primary text-white rounded-2xl p-6 shadow-lg">
            <div className="text-3xl mb-3">🤖</div>
            <div className="font-bold mb-1">98% Cultural Match</div>
            <div className="text-sm opacity-80">Nigerian Persona Engine trained on real Lagos reviews</div>
          </div>
          {/* Row 2 — 40% / 60% */}
          <div className="lg:col-span-2 bg-tertiary-container text-white rounded-2xl p-6 shadow-sm">
            <div className="text-3xl mb-3">📍</div>
            <div className="font-bold mb-1">Hyper-Local</div>
            <div className="text-sm text-white/80">Lagos, Abuja, PH, Ibadan. We know each city&apos;s vibe</div>
          </div>
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/20">
            <div className="text-3xl mb-3">💬</div>
            <div className="font-bold text-on-surface mb-1">Speaks Naija</div>
            <div className="text-sm text-on-surface-variant">&ldquo;The food sweet die&rdquo; and &ldquo;Abeg, no go there again&rdquo;</div>
          </div>
        </div>
      </section>

      {/* WhatsApp banner */}
      <section className="max-w-7xl mx-auto px-4 md:px-16 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border-2 border-[#25D366]/30 bg-[#25D366]/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📱</span>
            <div>
              <p className="font-bold text-on-surface text-sm">Also available on WhatsApp</p>
              <p className="text-xs text-on-surface-variant">Chat with our AI food guru in Pidgin, Yoruba, Hausa or Igbo</p>
            </div>
          </div>
          <a
            href="https://wa.me/14155238886?text=join%20dress-newspaper"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 bg-[#25D366] text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-[#1da851] transition-all active:scale-95"
          >
            Try on WhatsApp
          </a>
        </div>
      </section>

      {/* Persona cards */}
      <section className="bg-surface-container-low py-16 relative">
        <div className="adire-bg" style={{ position: "absolute", opacity: 0.04 }} />
        <div className="max-w-7xl mx-auto px-4 md:px-16 relative z-10">
          <h2
            className="text-2xl md:text-4xl font-black text-center text-on-surface mb-2"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Who are you eating like today?
          </h2>
          <p className="text-center text-on-surface-variant mb-10">
            Choose a persona to see how NaijaTaste AI reads the city for you.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PersonaCard
              emoji="💼"
              title="Lagos Professional"
              description="Quiet lunch spots with AC and reliable Wi-Fi for your zoom calls. Price? Secondary to ambiance."
              personaKey="professional"
              ctaLabel="Find Quiet Spots →"
            />
            <PersonaCard
              emoji="🔥"
              title="Street Food Enthusiast"
              description="The best holes-in-the-wall. Smoke-heavy jollof and the sharpest Suya. Cheap and correct."
              personaKey="street"
              ctaLabel="Find Correct Food →"
            />
            <PersonaCard
              emoji="👑"
              title="The Aunty"
              description="Premium spots for family Sunday lunch. Clean environment and respectable portions."
              personaKey="aunty"
              ctaLabel="Find Sunday Lunch →"
            />
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-7xl mx-auto px-4 md:px-16 py-16 grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link href="/simulator" className="glass rounded-2xl p-8 cursor-pointer hover:shadow-lg transition-all">
          <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined">rate_review</span>
          </div>
          <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>Review Simulator</h3>
          <p className="text-on-surface-variant mb-4">
            Our LLM-powered engine simulates dining experiences based on real Nigerian taste data.
            See how a restaurant stacks up before you spend a kobo.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 text-on-surface-variant"><span className="material-symbols-outlined text-tertiary text-base">check_circle</span>Pidgin-fluent review generation</li>
            <li className="flex items-center gap-2 text-on-surface-variant"><span className="material-symbols-outlined text-tertiary text-base">check_circle</span>Price sensitivity modeling</li>
            <li className="flex items-center gap-2 text-on-surface-variant"><span className="material-symbols-outlined text-tertiary text-base">check_circle</span>Tone &amp; behavioural fidelity</li>
          </ul>
          <div className="mt-6 text-primary font-semibold text-sm">Simulate Now →</div>
        </Link>
        <Link
          href="/recommend"
          className="rounded-2xl p-8 cursor-pointer hover:shadow-lg transition-all bg-inverse-surface text-inverse-on-surface border-2 border-primary/20"
        >
          <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center text-tertiary mb-4">
            <span className="material-symbols-outlined">explore</span>
          </div>
          <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>Recommendation Engine</h3>
          <p className="opacity-80 mb-4">
            Stop asking &ldquo;What&apos;s good here?&rdquo;. Our engine understands the cultural nuances of Nigerian
            food: from pepper soup depth to pounded yam texture.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 opacity-80"><span className="material-symbols-outlined text-tertiary text-base">bolt</span>Chat mode: just type what you crave</li>
            <li className="flex items-center gap-2 opacity-80"><span className="material-symbols-outlined text-tertiary text-base">bolt</span>Cold-start for new users</li>
            <li className="flex items-center gap-2 opacity-80"><span className="material-symbols-outlined text-tertiary text-base">bolt</span>Nigerian cultural context on every pick</li>
          </ul>
          <div className="mt-6 text-tertiary-fixed font-semibold text-sm">Find My Next Meal →</div>
        </Link>
      </section>

      {/* CTA banner */}
      <section className="bg-primary py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-16 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Oya, let&apos;s go!
          </h2>
          <p className="text-white/80 mb-8 text-lg">Get the correct taste every single time.</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/login" className="bg-white text-primary px-8 py-3 rounded-full font-bold hover:bg-primary-fixed transition-all active:scale-95">
              Create Account
            </Link>
            <Link href="/recommend" className="border-2 border-white text-white px-8 py-3 rounded-full font-bold hover:bg-white hover:text-primary transition-all">
              Try Guest Engine
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

