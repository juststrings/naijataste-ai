import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-16 py-12">
      <div className="mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">Our Vision</span>
      </div>
      <h1
        className="text-4xl md:text-5xl font-black text-on-surface mb-4"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        Preserving Heritage Through{" "}
        <span className="text-primary italic">Deep Intelligence.</span>
      </h1>
      <p className="text-lg text-on-surface-variant mb-10">
        NaijaTaste isn&apos;t just an algorithm. It&apos;s a digital connoisseur trained on the vibrant pulse
        of Nigerian kitchens, markets, and buka traditions.
      </p>

      {/* Nigerian Persona Engine */}
      <div className="glass rounded-2xl p-8 mb-8">
        <h2 className="text-2xl font-black mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
          The Nigerian Persona Engine
        </h2>
        <p className="text-primary text-sm font-semibold italic mb-6">Correct taste, every time. No be fluke.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-surface-container-low rounded-xl">
            <div className="flex items-center gap-2 mb-3 text-primary">
              <span className="material-symbols-outlined">translate</span>
              <h3 className="font-bold">Pidgin Linguistic Layer</h3>
            </div>
            <p className="text-sm text-on-surface-variant">
              Our engine doesn&apos;t just &ldquo;read&rdquo; Nigerian English; it understands the emotional weight
              of &ldquo;Oya,&rdquo; the subtle critique in &ldquo;E remain small,&rdquo; and the ultimate praise
              of &ldquo;The food sweet die.&rdquo;
            </p>
            <blockquote className="mt-4 border-l-4 border-primary pl-4 text-sm italic text-on-surface-variant">
              &ldquo;When a user says &apos;The spice level is for street people,&apos; our AI knows they aren&apos;t
              talking about traffic. They&apos;re talking about that authentic, Lagos-standard heat.&rdquo;
            </blockquote>
          </div>
          <div className="p-6 bg-primary rounded-xl text-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined">groups</span>
              <h3 className="font-bold">Cultural Nuance</h3>
            </div>
            <p className="text-sm opacity-85">
              Understanding the regional variations between a Lagos Buka and a Calabar kitchen.
              We map taste profiles across 250+ ethnic nuances.
            </p>
          </div>
          <div className="p-6 bg-tertiary-container rounded-xl" style={{ color: "#ffffff" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined" style={{ color: "#ffffff" }}>restaurant_menu</span>
              <h3 className="font-bold" style={{ color: "#ffffff" }}>Texture AI</h3>
            </div>
            <p className="text-sm opacity-85" style={{ color: "#ffffff" }}>
              From the &apos;stretch&apos; of Pounded Yam to the &apos;crunch&apos; of Chin Chin, our models
              prioritize sensory feedback over simple ingredients.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-outline-variant/20">
            <div className="flex items-center gap-2 mb-3 text-on-surface">
              <span className="material-symbols-outlined">schedule</span>
              <h3 className="font-bold">Local Context Logic</h3>
            </div>
            <p className="text-sm text-on-surface-variant">
              Our AI factors in time-of-day dynamics. It knows that &apos;Afternoon Rice&apos; hits differently
              than &apos;Morning Akara&apos; and adjusts accordingly.
            </p>
          </div>
          <div className="md:col-span-2 p-6 bg-surface-container-low rounded-xl border border-outline-variant/20">
            <div className="flex items-center gap-2 mb-3 text-on-surface">
              <span className="material-symbols-outlined">language</span>
              <h3 className="font-bold">Multilingual</h3>
            </div>
            <p className="text-sm text-on-surface-variant">
              Understands and responds in <strong>English</strong>, <strong>Yoruba</strong>, <strong>Hausa</strong>, <strong>Igbo</strong>, and <strong>Nigerian Pidgin</strong>.
              Type in your language and NaijaTaste replies in kind — no switching required.
            </p>
          </div>
        </div>
      </div>

      {/* Architecture */}
      <div className="mb-8">
        <h2 className="text-2xl font-black text-center mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
          The Architecture of Taste
        </h2>
        <div className="w-16 h-1 bg-primary mx-auto rounded-full mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <div className="w-16 h-16 rounded-full bg-primary-fixed mx-auto mb-4 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">database</span>
            </div>
            <h3 className="font-bold mb-2">Hyper-Local Data</h3>
            <p className="text-sm text-on-surface-variant">
              500+ real Nigerian Google Maps reviews + 144 Gemini-synthesized cultural samples.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 rounded-full bg-secondary-fixed mx-auto mb-4 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-2xl">psychology</span>
            </div>
            <h3 className="font-bold mb-2">Nigerian Persona Models</h3>
            <p className="text-sm text-on-surface-variant">
              1,027 Yelp user personas encode price sensitivity, rating tendency, and cultural tone.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 rounded-full bg-tertiary-fixed mx-auto mb-4 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
            <h3 className="font-bold mb-2">Correctness Check</h3>
            <p className="text-sm text-on-surface-variant">
              Gemini 2.5 Flash with 6-key × 4-model rotation (24 attempts before failure) ensures cultural authenticity.
            </p>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="glass rounded-2xl p-8 mb-8">
        <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "Montserrat, sans-serif" }}>Tech Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "LLM", value: "Gemini 2.5 Flash" },
            { label: "Backend", value: "FastAPI (Python 3.11)" },
            { label: "Deploy", value: "Railway + Docker" },
            { label: "Data", value: "Yelp Academic Dataset" },
            { label: "Cultural Data", value: "500 Google Maps Reviews" },
            { label: "Frontend", value: "Next.js 16 + Tailwind CSS v4" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-container p-4 rounded-xl">
              <div className="text-xs text-on-surface-variant mb-1">{label}</div>
              <div className="font-semibold text-sm">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Dataset disclosure */}
      <div className="bg-surface-container-low rounded-2xl p-6 mb-8 text-sm text-on-surface-variant">
        <h3 className="font-bold text-on-surface mb-3">Dataset Disclosure</h3>
        <p>
          Built for DSN × Bluechip Technologies LLM Agent Challenge, Hackathon 3.0. Uses Yelp Academic Dataset,
          real Nigerian Google Maps reviews via Outscraper, and Gemini-synthesized cultural samples. All AI-generated
          content is clearly labeled.
        </p>
      </div>

      {/* CTA */}
      <div className="bg-inverse-surface text-inverse-on-surface rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="font-bold text-lg mb-1">Ready to taste the future?</h3>
          <p className="text-sm opacity-70">
            Join the thousands of food lovers using AI to find their next favorite meal.
          </p>
        </div>
        <Link
          href="/recommend"
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-red-800 transition-all active:scale-95 flex-shrink-0"
        >
          Try Recommendation Engine
        </Link>
      </div>
    </div>
  );
}
