export const formatPrice = (priceLevel: number | undefined | null): string => {
  if (!priceLevel || priceLevel === 0) return "";
  const labels: Record<number, string> = {
    1: "Budget",
    2: "Mid-range",
    3: "Premium",
    4: "Fine Dining",
  };
  return labels[Math.min(priceLevel, 4)] ?? "";
};
