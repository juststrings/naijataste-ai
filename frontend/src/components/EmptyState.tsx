interface Props {
  title: string;
  subtitle: string;
  emoji?: string;
}

export default function EmptyState({ title, subtitle, emoji = "🍽️" }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-8 glass rounded-2xl">
      <div className="text-6xl mb-4">{emoji}</div>
      <h3 className="font-bold text-xl text-on-surface mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
        {title}
      </h3>
      <p className="text-on-surface-variant text-sm max-w-xs">{subtitle}</p>
    </div>
  );
}
