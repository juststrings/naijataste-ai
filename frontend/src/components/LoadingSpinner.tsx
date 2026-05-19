"use client";

import { useEffect, useState } from "react";

interface Props {
  messages?: string[];
  intervalMs?: number;
}

const DEFAULT_MSGS = [
  "The agent dey think...",
  "Almost ready o...",
  "Hold your side, food dey come...",
  "Consulting the ancestors of flavor...",
  "E almost set...",
  "Dey find the best option for you...",
];

export default function LoadingSpinner({ messages = DEFAULT_MSGS, intervalMs = 900 }: Props) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % messages.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [messages, intervalMs]);

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="spinner" />
      <p className="text-primary font-semibold italic animate-pulse">{messages[idx]}</p>
    </div>
  );
}
