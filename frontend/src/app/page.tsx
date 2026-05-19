"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PersonaCard from "@/components/PersonaCard";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  function setChatInput(text: string) {
    sessionStorage.setItem("chatPrefill", text);
    router.push("/recommend");
  }

  if (user) {
    return <AuthenticatedHome user={user} onChatPrefill={setChatInput} />;
  }

  return <GuestHome />;
}

function GuestHome() {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 md:px-16 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block bg-secondary-container text-on-secondary-container text-xs font-bold px-3 py-1 rounded-full mb-4">
            It starts with Emeka
          </span>
          <h1
            className="text-4xl md:text-6xl font-black text-on-surface leading-tight mb-4"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Correct Taste, <span className="text-primary">Every Time.</span>
          </h1>
          <p className="text-lg text-on-surface-variant mb-8">
            The AI-powered food engine for the Nigerian palate. We simulate reviews and recommend
            spots that hit the right notes of spice, smoke, and soul.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link
              href="/simulator"
              className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-red-800 transition-all active:scale-95 shadow-lg"
            >
              Simulate a Review →
            </Link>
            <Link
              href="/recommend"
              className="border-2 border-primary text-primary px-8 py-3 rounded-full font-bold hover:bg-primary hover:text-white transition-all"
            >
              Find My Next Meal
            </Link>
          </div>
        </div>
        <div className="hidden lg:grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-md border border-outline-variant/20">
            <div className="text-3xl mb-2">🍛</div>
            <div className="font-bold text-on-surface mb-1">Jollof Mastery</div>
            <div className="text-sm text-on-surface-variant">Predicts how any Nigerian user would rate any restaurant</div>
          </div>
          <div className="bg-primary text-white rounded-2xl p-6 shadow-lg mt-6">
            <div className="text-3xl mb-2">🤖</div>
            <div className="font-bold mb-1">98% Cultural Match</div>
            <div className="text-sm opacity-80">Nigerian Persona Engine trained on real Lagos reviews</div>
          </div>
          <div className="bg-tertiary-container text-on-surface rounded-2xl p-6 shadow-md -mt-4">
            <div className="text-3xl mb-2">📍</div>
            <div className="font-bold mb-1">Hyper-Local</div>
            <div className="text-sm text-on-surface-variant">Lagos, Abuja, PH, Ibadan — we know each city&apos;s vibe</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md border border-outline-variant/20">
            <div className="text-3xl mb-2">💬</div>
            <div className="font-bold text-on-surface mb-1">Speaks Naija</div>
            <div className="text-sm text-on-surface-variant">&ldquo;The food sweet die&rdquo; and &ldquo;Abeg, no go there again&rdquo;</div>
          </div>
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
            />
            <PersonaCard
              emoji="🔥"
              title="Street Food Enthusiast"
              description="The best holes-in-the-wall. Smoke-heavy jollof and the sharpest Suya. Cheap and correct."
              personaKey="street"
            />
            <PersonaCard
              emoji="👑"
              title="The Aunty"
              description="Premium spots for family Sunday lunch. Clean environment and respectable portions."
              personaKey="aunty"
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
            food — from pepper soup depth to pounded yam texture.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 opacity-80"><span className="material-symbols-outlined text-tertiary text-base">bolt</span>Chat mode — just type what you crave</li>
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

const PERSONAS_META = {
  professional: { name: "The Lagos High-Life", desc: "Curated vibes, premium pepper, and zero-compromise service." },
  street: { name: "The Street Connoisseur", desc: "Hole-in-the-wall specialist. Smoke, spice, and street cred." },
  balanced: { name: "The Balanced Foodie", desc: "Equal love for buka and fine dining. Correct taste all day." },
  premium: { name: "The Lagos High-Life", desc: "Curated vibes, premium pepper, and zero-compromise service." },
};

function AuthenticatedHome({
  user,
  onChatPrefill,
}: {
  user: { name: string; flavor: string };
  onChatPrefill: (text: string) => void;
}) {
  const persona = PERSONAS_META[user.flavor as keyof typeof PERSONAS_META] ?? PERSONAS_META.balanced;
  const firstName = user.name.split(" ")[0];

  const cravings = [
    { emoji: "🫙", label: "Swallow", query: "swallow food in Lagos" },
    { emoji: "🔥", label: "Grills", query: "suya grills tonight" },
    { emoji: "🍸", label: "Vibes", query: "lounge vibes dinner" },
    { emoji: "🥟", label: "Small Chops", query: "small chops fast food" },
    { emoji: "☕", label: "Brunch", query: "brunch spot Lagos" },
    { emoji: "🍰", label: "Desserts", query: "dessert and sweets" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-16 py-10">
      <div className="mb-2 text-sm text-on-surface-variant italic">Correct taste only.</div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-on-surface mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Welcome back, <span className="text-primary">{firstName}.</span>
          </h1>
          <p className="text-on-surface-variant">Your palate is sharp today. Ready to explore the best spots?</p>
        </div>
        <div className="glass rounded-2xl p-5 min-w-64">
          <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Current Persona</div>
          <div className="font-bold text-lg text-on-surface mb-1">{persona.name}</div>
          <p className="text-sm text-on-surface-variant mb-3">{persona.desc}</p>
          <div className="flex gap-2 items-center">
            <div className="flex-1 bg-surface-container-high rounded-full h-2 overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: "72%" }} />
            </div>
            <span className="text-xs font-bold text-on-surface-variant">Level 12</span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Link href="/simulator" className="glass rounded-2xl p-5 text-left hover:shadow-lg transition-all active:scale-95">
          <span className="material-symbols-outlined text-primary text-3xl mb-2 block">rate_review</span>
          <div className="font-bold text-on-surface">Simulate a Review</div>
          <div className="text-xs text-on-surface-variant mt-1">Predict any restaurant</div>
        </Link>
        <Link href="/recommend" className="glass rounded-2xl p-5 text-left hover:shadow-lg transition-all active:scale-95">
          <span className="material-symbols-outlined text-tertiary text-3xl mb-2 block">explore</span>
          <div className="font-bold text-on-surface">Find Flavor</div>
          <div className="text-xs text-on-surface-variant mt-1">Chat or form mode</div>
        </Link>
        <Link href="/about" className="glass rounded-2xl p-5 text-left hover:shadow-lg transition-all active:scale-95">
          <span className="material-symbols-outlined text-on-surface-variant text-3xl mb-2 block">info</span>
          <div className="font-bold text-on-surface">How It Works</div>
          <div className="text-xs text-on-surface-variant mt-1">The Persona Engine</div>
        </Link>
        <Link href="/simulator" className="glass rounded-2xl p-5 text-left hover:shadow-lg transition-all active:scale-95">
          <span className="material-symbols-outlined text-secondary text-3xl mb-2 block">auto_awesome</span>
          <div className="font-bold text-on-surface">Daily Challenge</div>
          <div className="text-xs text-on-surface-variant mt-1">Review a Buka today</div>
        </Link>
      </div>

      {/* Flavor Radar + Browse */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-xl" style={{ fontFamily: "Montserrat, sans-serif" }}>Your Flavor Radar</h2>
            <Link href="/recommend" className="text-primary text-sm font-semibold hover:underline">View All →</Link>
          </div>
          <div className="space-y-3">
            <div className="flex gap-4 p-3 bg-surface-container-low rounded-xl">
              <div className="text-3xl">🍛</div>
              <div>
                <div className="font-bold text-sm text-on-surface">Yellow Chilli, VI</div>
                <div className="text-xs text-on-surface-variant">Vibe: Premium Lagos Fine Dining</div>
                <div className="flex gap-1 mt-1 text-xs">⭐⭐⭐⭐<span className="opacity-30">⭐</span></div>
              </div>
            </div>
            <div className="flex gap-4 p-3 bg-surface-container-low rounded-xl">
              <div className="text-3xl">🔥</div>
              <div>
                <div className="font-bold text-sm text-on-surface">Buka Joint, Surulere</div>
                <div className="text-xs text-on-surface-variant">Vibe: Street Food Authentic</div>
                <div className="flex gap-1 mt-1 text-xs">⭐⭐⭐⭐⭐</div>
              </div>
            </div>
          </div>
          <div className="mt-5 bg-secondary/10 border border-secondary/20 rounded-xl p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-secondary mb-1">Daily Challenge 🏆</div>
            <div className="font-bold text-on-surface">Review a Buka today!</div>
            <div className="text-sm text-on-surface-variant">Earn the &apos;Local Legend&apos; badge and 50 Flavor Points.</div>
            <Link href="/simulator" className="mt-3 inline-block bg-secondary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-800 transition-all active:scale-95">
              Accept Challenge
            </Link>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="font-bold text-xl mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>Browse by Craving</h2>
          <div className="grid grid-cols-3 gap-3">
            {cravings.map(({ emoji, label, query }) => (
              <button
                key={label}
                onClick={() => onChatPrefill(query)}
                className="flex flex-col items-center gap-1 p-3 bg-surface-container-low rounded-xl hover:bg-primary-fixed transition-colors"
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-xs font-semibold">{label}</span>
              </button>
            ))}
          </div>
          <div className="mt-5 border-t border-outline-variant/20 pt-4">
            <div className="text-sm font-bold text-on-surface mb-3">Community Gist 💬</div>
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">C</div>
                <div>
                  <div className="text-xs font-bold">Chidi K. <span className="text-on-surface-variant font-normal">2m ago</span></div>
                  <div className="text-xs text-on-surface-variant italic">&ldquo;The jollof at Yellow Chilli is actually spiritual. No cap.&rdquo;</div>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-tertiary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">A</div>
                <div>
                  <div className="text-xs font-bold">Amina O. <span className="text-on-surface-variant font-normal">15m ago</span></div>
                  <div className="text-xs text-on-surface-variant italic">&ldquo;Just earned the &apos;Spice Explorer&apos; badge. My tongue is on fire!&rdquo;</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
