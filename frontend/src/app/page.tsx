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
          {/* WhatsApp banner */}
          <a
            href="https://wa.me/14155238886?text=join%20dress-newspaper"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-[#25D366]/40 bg-[#25D366]/5 px-4 py-3 hover:bg-[#25D366]/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#25D366" className="w-5 h-5 shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <div>
                <p className="font-bold text-on-surface text-sm">Also available on WhatsApp</p>
                <p className="text-xs text-on-surface-variant">Chat in Pidgin, Yoruba, Hausa or Igbo</p>
              </div>
            </div>
            <span className="shrink-0 bg-[#25D366] text-white px-4 py-1.5 rounded-full text-xs font-bold">
              Try it →
            </span>
          </a>

          {/* Mobile-only demo video — shown immediately after WhatsApp on small screens */}
          <div className="lg:hidden mt-6 px-0 py-4">
            <h2 className="text-xl md:text-2xl font-bold text-center text-gray-900 mb-1 md:mb-2">See NaijaTaste in Action</h2>
            <p className="hidden md:block text-center text-gray-500 mb-6">
              Watch the full demo — recommendations, review simulation, WhatsApp bot and more
            </p>
            <div className="rounded-2xl overflow-hidden shadow-md bg-white p-2 md:p-0">
              <div className="relative w-full rounded-2xl overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%', height: 0 }}>
                <iframe
                  src="https://www.youtube.com/embed/VkwtAWm8jig"
                  title="NaijaTaste Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                />
              </div>
            </div>
            <p className="md:hidden text-center text-sm text-red-700 font-medium mt-2">
              Tap to watch on YouTube ↗
            </p>
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
            <div className="font-bold mb-1">100% Nigerian Grounding</div>
            <div className="text-sm opacity-80">Every recommendation grounded in Nigerian food culture</div>
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

      {/* Demo video — desktop only; mobile version lives inside the hero column above */}
      <section className="hidden lg:block w-full max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          See NaijaTaste in Action
        </h2>
        <p className="text-center text-gray-500 mb-6">
          Watch the full demo — recommendations, review simulation, WhatsApp bot and more
        </p>
        <div className="relative w-full rounded-2xl overflow-hidden shadow-lg"
             style={{ paddingBottom: '56.25%', height: 0 }}>
          <iframe
            src="https://www.youtube.com/embed/VkwtAWm8jig"
            title="NaijaTaste Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
          />
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
            Choose a persona to see how NaijaTaste reads the city for you.
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

