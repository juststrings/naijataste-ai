"use client";

import toast from "react-hot-toast";

interface Props {
  rating: number;
  toneLabel: string;
  reviewerName: string;
  reviewerHabit: string;
  restaurantType: string;
  reviewText: string;
  onRegenerate: () => void;
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`material-symbols-outlined text-base ${i < full ? "star-on" : "star-off"}`}
          style={{ fontVariationSettings: `'FILL' ${i < full ? 1 : 0}` }}
        >
          star
        </span>
      ))}
      <span className="ml-2 font-bold text-on-surface">{rating.toFixed(1)} / 5.0</span>
    </div>
  );
}

export default function ReviewOutputCard({
  rating,
  toneLabel,
  reviewerName,
  reviewerHabit,
  restaurantType,
  reviewText,
  onRegenerate,
}: Props) {
  function handleCopy() {
    navigator.clipboard.writeText(`"${reviewText}"`).then(() => {
      toast.success("Review copied to clipboard!");
    });
  }

  return (
    <div className="glass rounded-2xl shadow-xl overflow-hidden fade-up">
      <div className="p-5 bg-surface-container-low border-b border-outline/10 flex justify-between items-start">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
            Predicted Rating
          </div>
          <Stars rating={rating} />
        </div>
        <div className="text-xs font-bold px-3 py-1 rounded-full bg-tertiary-container text-on-tertiary-container uppercase">
          {toneLabel || "AI Review"}
        </div>
      </div>

      <div className="p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center font-bold text-on-secondary-fixed text-xl">
            {reviewerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-on-surface">{reviewerName}</div>
            <div className="text-sm text-on-surface-variant">
              {reviewerHabit.charAt(0).toUpperCase() + reviewerHabit.slice(1)} rater •{" "}
              {restaurantType}
            </div>
          </div>
        </div>
        <div className="bg-surface-container rounded-xl p-6 relative">
          <span
            className="material-symbols-outlined absolute -top-3 -left-1 text-primary text-4xl"
            style={{ opacity: 0.2 }}
          >
            format_quote
          </span>
          <p className="text-base italic leading-relaxed text-on-surface">
            &ldquo;{reviewText}&rdquo;
          </p>
        </div>
      </div>

      <div className="p-4 bg-surface/50 flex gap-2 border-t border-outline/10">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-on-surface-variant py-2 hover:bg-surface-container-high rounded-xl transition-colors"
        >
          <span className="material-symbols-outlined text-base">content_copy</span>
          Copy Review
        </button>
        <button
          onClick={onRegenerate}
          className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-on-surface-variant py-2 hover:bg-surface-container-high rounded-xl transition-colors"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          Regenerate
        </button>
      </div>
    </div>
  );
}
