export const formatPrice = (priceLevel: number | undefined | null): string => {
  if (!priceLevel || priceLevel === 0) return "";
  return "₦".repeat(Math.min(priceLevel, 4));
};
