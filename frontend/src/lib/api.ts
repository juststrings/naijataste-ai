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
  preferred_language?: string;
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
  query?: string;
  user_lat?: number;
  user_lng?: number;
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

export interface PlaceDetails {
  name: string | null;
  address: string | null;
  phone: string | null;
  rating: number | null;
  total_ratings: number | null;
  price_level: number | null;
  website: string | null;
  google_maps_url: string | null;
  photos: string[];
  opening_hours: string[];
  is_open_now: boolean | null;
  lat: number | null;
  lng: number | null;
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const res = await fetch(`${API_BASE}/place-details/${encodeURIComponent(placeId)}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export interface TopPickPlace {
  name: string | null;
  vicinity: string | null;
  rating: number | null;
  price_level: number | null;
  place_id: string | null;
  types: string[];
  photo_url: string | null;
}

export async function getTopPicks(
  lat?: number,
  lng?: number,
  persona?: string
): Promise<TopPickPlace[]> {
  const params = new URLSearchParams();
  if (lat !== undefined) params.set("lat", String(lat));
  if (lng !== undefined) params.set("lng", String(lng));
  if (persona) params.set("persona", persona);
  const res = await fetch(`${API_BASE}/places/top-picks?${params}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export interface RecommendResponse {
  intent: string;
  message: string;
  items: RecommendationItem[];
  detected_language: string;
}

export async function getRecommendations(
  payload: RecommendPayload
): Promise<RecommendResponse> {
  const res = await fetch(`${API_BASE}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
