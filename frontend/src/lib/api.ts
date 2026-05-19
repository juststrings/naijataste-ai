const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface PersonaPayload {
  user_id?: string;
  avg_rating?: number;
  rating_tendency?: "harsh" | "balanced" | "generous";
  price_sensitivity?: "high" | "medium" | "low";
  tone_keywords?: string[];
  total_reviews?: number;
  sample_reviews?: string[];
}

export interface SimulateReviewPayload {
  persona: PersonaPayload;
  item_name: string;
  item_type: string;
  location: string;
  features: string[];
}

export interface SimulateReviewResponse {
  rating: number;
  review_text: string;
  tone_label: string;
}

export interface RecommendPayload {
  cold_start_signals: {
    city: string;
    preferred_food: string;
    price_range: "budget" | "mid" | "premium";
  };
}

export interface RecommendationItem {
  item_name: string;
  business_id?: string;
  reason: string;
  predicted_rating: number;
  cultural_note?: string;
}

export async function simulateReview(
  payload: SimulateReviewPayload
): Promise<SimulateReviewResponse> {
  const res = await fetch(`${API_BASE}/simulate-review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function getRecommendations(
  payload: RecommendPayload
): Promise<RecommendationItem[]> {
  const res = await fetch(`${API_BASE}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
