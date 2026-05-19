interface Props {
  itemName: string;
  predictedRating: number;
  reason: string;
  culturalNote?: string;
  index: number;
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`material-symbols-outlined text-sm ${i < full ? "star-on" : "star-off"}`}
          style={{ fontVariationSettings: `'FILL' ${i < full ? 1 : 0}` }}
        >
          star
        </span>
      ))}
      <span className="text-xs text-on-surface-variant ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function RecCard({ itemName, predictedRating, reason, culturalNote, index }: Props) {
  return (
    <div
      className="rec-card fade-up mb-4"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-lg text-on-surface">{itemName || "Unknown Spot"}</h4>
          <Stars rating={predictedRating || 3.5} />
        </div>
        <span className="bg-tertiary-container text-on-tertiary-container text-xs font-bold px-3 py-1 rounded-full">
          AI Pick
        </span>
      </div>
      <div className="bg-surface-container-low rounded-xl p-4 mb-3">
        <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
          Match Reason
        </div>
        <p className="text-sm text-on-surface">{reason || "Great match for your taste profile"}</p>
      </div>
      {culturalNote && (
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-tertiary text-base mt-0.5">lightbulb</span>
          <p className="text-sm text-tertiary italic">{culturalNote}</p>
        </div>
      )}
    </div>
  );
}
