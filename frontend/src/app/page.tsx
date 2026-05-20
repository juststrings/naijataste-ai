"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PersonaCard from "@/components/PersonaCard";

export default function HomePage() {
  const { user, savedReviews } = useAuth();
  const router = useRouter();

  function setChatInput(text: string) {
    sessionStorage.setItem("chatPrefill", text);
    router.push("/recommend");
  }

  if (user) {
    return <AuthenticatedHome user={user} reviewCount={savedReviews.length} onChatPrefill={setChatInput} />;
  }

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

function RadarChart() {
  const labels = ["Spicy", "Sweet", "Savory", "Local", "Adventurous", "Social"];
  // TODO: derive from saved reviews; static for now
  const values = [0.7, 0.4, 0.85, 0.9, 0.55, 0.65];
  const cx = 120, cy = 120, maxR = 85;
  const n = labels.length;

  function toPoint(idx: number, val: number) {
    const angle = (idx * (2 * Math.PI) / n) - Math.PI / 2;
    return { x: cx + val * maxR * Math.cos(angle), y: cy + val * maxR * Math.sin(angle) };
  }

  function ringPath(val: number) {
    return Array.from({ length: n }, (_, i) => {
      const p = toPoint(i, val);
      return `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(" ") + " Z";
  }

  const dataPath = values.map((v, i) => {
    const p = toPoint(i, v);
    return `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ") + " Z";

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[260px] mx-auto">
      {[0.25, 0.5, 0.75, 1].map((v) => (
        <path key={v} d={ringPath(v)} fill="none" stroke="#e4bebc" strokeWidth="1" />
      ))}
      {labels.map((_, i) => {
        const p = toPoint(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke="#e4bebc" strokeWidth="1" />;
      })}
      <path d={dataPath} fill="rgba(183,16,42,0.15)" stroke="#b7102a" strokeWidth="2" />
      {values.map((v, i) => {
        const p = toPoint(i, v);
        return <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4" fill="#b7102a" />;
      })}
      {labels.map((label, i) => {
        const p = toPoint(i, 1.28);
        return (
          <text key={i} x={p.x.toFixed(1)} y={p.y.toFixed(1)} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="600" fill="#5b403f">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function AuthenticatedHome({
  user,
  reviewCount,
  onChatPrefill,
}: {
  user: { name: string; avatar: string };
  reviewCount: number;
  onChatPrefill: (text: string) => void;
}) {
  const level = Math.floor(reviewCount / 5) + 1;
  const personaTitles = ["Curious Taster", "Flavor Seeker", "Taste Connoisseur", "Flavor Oracle"];
  const personaTitle = personaTitles[Math.min(level - 1, 3)];
  const levelPct = Math.min(((reviewCount % 5) / 5) * 100, 100);
  const firstName = user.name.split(" ")[0];

  const cravings = [
    { emoji: "🌶️", label: "Spicy & Bold", query: "spicy bold food Lagos" },
    { emoji: "🛵", label: "Street Food", query: "street food Lagos" },
    { emoji: "🍚", label: "Rice Dishes", query: "rice dishes jollof Nigeria" },
    { emoji: "🍲", label: "Soups & Stews", query: "pepper soup egusi stew" },
    { emoji: "🔥", label: "Grilled", query: "grilled suya barbecue" },
    { emoji: "🍰", label: "Sweets", query: "dessert sweets pastry" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-16 py-10">
      <p className="text-sm text-on-surface-variant italic mb-2">Correct taste only.</p>

      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-on-surface mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Welcome back, <span className="text-primary">{firstName}.</span>
          </h1>
          <p className="text-on-surface-variant">Your palate is sharp today. Ready to explore the best spots?</p>
        </div>
        <div className="glass rounded-2xl p-5 min-w-64">
          <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Current Persona</div>
          <div className="font-bold text-lg text-on-surface mb-0.5">{personaTitle}</div>
          <div className="text-xs text-on-surface-variant mb-3">{reviewCount} review{reviewCount !== 1 ? "s" : ""} simulated</div>
          <div className="flex gap-2 items-center">
            <div className="flex-1 bg-surface-container-high rounded-full h-2 overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${levelPct}%` }} />
            </div>
            <span className="text-xs font-bold text-on-surface-variant whitespace-nowrap">Level {level}</span>
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
        <Link href="/profile" className="glass rounded-2xl p-5 text-left hover:shadow-lg transition-all active:scale-95">
          <span className="material-symbols-outlined text-secondary text-3xl mb-2 block">person</span>
          <div className="font-bold text-on-surface">My Flavor Profile</div>
          <div className="text-xs text-on-surface-variant mt-1">Badges &amp; activity</div>
        </Link>
        <Link href="/simulator" className="glass rounded-2xl p-5 text-left hover:shadow-lg transition-all active:scale-95">
          <span className="material-symbols-outlined text-on-surface-variant text-3xl mb-2 block">emoji_events</span>
          <div className="font-bold text-on-surface">Daily Challenge</div>
          <div className="text-xs text-on-surface-variant mt-1">Try a new spot today</div>
        </Link>
      </div>

      {/* Radar + Browse + Daily Challenge */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Flavor Radar */}
        <div className="glass rounded-2xl p-6">
          <h2 className="font-bold text-xl mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Your Flavor Radar</h2>
          <p className="text-xs text-on-surface-variant mb-4">Based on your taste profile</p>
          <RadarChart />
        </div>

        {/* Browse by Craving */}
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
                <span className="text-xs font-semibold text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Daily Challenge */}
        <div className="glass rounded-2xl p-6 flex flex-col">
          <div className="text-xs font-bold uppercase tracking-wider text-secondary mb-3">Daily Challenge 🏆</div>
          <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4 mb-4 flex-grow">
            <div className="text-2xl mb-2">🍲</div>
            <div className="font-bold text-on-surface mb-1">Try a pepper soup spot you&apos;ve never visited</div>
            <div className="text-sm text-on-surface-variant">
              Earn the &apos;Pepper Soup Pioneer&apos; badge and 50 Flavor Points.
            </div>
            {/* TODO: real daily challenge logic in Phase 2 */}
          </div>
          <Link
            href="/simulator"
            className="w-full bg-secondary text-white px-4 py-3 rounded-xl text-sm font-semibold text-center hover:bg-orange-800 transition-all active:scale-95"
          >
            Accept Challenge
          </Link>

          <div className="mt-4 border-t border-outline-variant/20 pt-4">
            <div className="text-sm font-bold text-on-surface mb-3">Community Gist 💬</div>
            <div className="space-y-3">
              <div className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">C</div>
                <div>
                  <div className="text-xs font-bold">Chidi K. <span className="text-on-surface-variant font-normal">2m ago</span></div>
                  <div className="text-xs text-on-surface-variant italic">&ldquo;The jollof at Yellow Chilli is actually spiritual. No cap.&rdquo;</div>
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-full bg-tertiary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">A</div>
                <div>
                  <div className="text-xs font-bold">Amina O. <span className="text-on-surface-variant font-normal">15m ago</span></div>
                  <div className="text-xs text-on-surface-variant italic">&ldquo;Just earned the &apos;Spice Explorer&apos; badge!&rdquo;</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
