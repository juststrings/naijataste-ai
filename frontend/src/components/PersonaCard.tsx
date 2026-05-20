"use client";

import { useRouter } from "next/navigation";

interface Props {
  emoji: string;
  title: string;
  description: string;
  personaKey: "professional" | "street" | "aunty";
  ctaLabel?: string;
}

export default function PersonaCard({ emoji, title, description, personaKey, ctaLabel = "Try Demo →" }: Props) {
  const router = useRouter();

  return (
    <div
      className="persona-card"
      onClick={() => router.push(`/simulator?persona=${personaKey}`)}
    >
      <div className="text-3xl mb-3">{emoji}</div>
      <h3 className="font-bold text-lg text-on-surface mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
        {title}
      </h3>
      <p className="text-sm text-on-surface-variant mb-4">{description}</p>
      <span className="text-primary text-sm font-semibold">{ctaLabel}</span>
    </div>
  );
}
