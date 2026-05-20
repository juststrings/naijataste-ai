export const NIGERIAN_CITIES: Record<string, { lat: number; lng: number }> = {
  "lagos": { lat: 6.5244, lng: 3.3792 },
  "abuja": { lat: 9.0765, lng: 7.3986 },
  "port harcourt": { lat: 4.8156, lng: 7.0498 },
  "ph": { lat: 4.8156, lng: 7.0498 },
  "ibadan": { lat: 7.3775, lng: 3.9470 },
  "kano": { lat: 12.0022, lng: 8.5920 },
  "kaduna": { lat: 10.5222, lng: 7.4383 },
  "enugu": { lat: 6.4584, lng: 7.5464 },
  "benin": { lat: 6.3350, lng: 5.6037 },
  "calabar": { lat: 4.9517, lng: 8.3220 },
  "warri": { lat: 5.5167, lng: 5.7500 },
  "owerri": { lat: 5.4836, lng: 7.0333 },
  "jos": { lat: 9.8965, lng: 8.8583 },
  "ilorin": { lat: 8.4966, lng: 4.5421 },
  "abeokuta": { lat: 7.1475, lng: 3.3619 },
  "onitsha": { lat: 6.1667, lng: 6.7833 },
  "uyo": { lat: 5.0333, lng: 7.9333 },
  "lekki": { lat: 6.4698, lng: 3.5852 },
  "victoria island": { lat: 6.4281, lng: 3.4219 },
  "vi": { lat: 6.4281, lng: 3.4219 },
  "surulere": { lat: 6.5059, lng: 3.3537 },
  "ikeja": { lat: 6.5954, lng: 3.3403 },
  "yaba": { lat: 6.5158, lng: 3.3756 },
  "ajah": { lat: 6.4698, lng: 3.5852 },
  "ikorodu": { lat: 6.6194, lng: 3.5106 },
};

export const NEAR_ME_KEYWORDS = [
  "near me", "nearby", "around me", "close to me",
  "close by", "around here", "my area", "where i am",
];

export type UserLocation = { lat: number; lng: number };

export type ResolvedLocation = {
  lat?: number;
  lng?: number;
  label: string;
  useGPS: boolean;
};

export function getUserCurrentCity(userLocation: UserLocation | null): string | null {
  if (!userLocation) return null;

  let closestCity: string | null = null;
  let minDistance = Infinity;

  for (const [city, coords] of Object.entries(NIGERIAN_CITIES)) {
    const dist = Math.sqrt(
      Math.pow(userLocation.lat - coords.lat, 2) +
      Math.pow(userLocation.lng - coords.lng, 2)
    );
    if (dist < minDistance) {
      minDistance = dist;
      closestCity = city;
    }
  }

  return minDistance < 0.45 ? closestCity : null;
}

export function resolveLocation(query: string, userLocation: UserLocation | null): ResolvedLocation {
  const lowerQuery = query.toLowerCase();

  // 1. Explicit "near me" keywords → always GPS
  if (NEAR_ME_KEYWORDS.some((kw) => lowerQuery.includes(kw))) {
    return { lat: userLocation?.lat, lng: userLocation?.lng, label: "Near you", useGPS: true };
  }

  // 2. Query mentions a specific city
  const mentionedCity = Object.keys(NIGERIAN_CITIES).find((city) => lowerQuery.includes(city));

  if (mentionedCity) {
    const userCity = getUserCurrentCity(userLocation);

    // Mentioned city matches user's current city → use GPS (more precise)
    if (
      userCity &&
      (mentionedCity === userCity ||
        mentionedCity.includes(userCity) ||
        userCity.includes(mentionedCity))
    ) {
      return { lat: userLocation?.lat, lng: userLocation?.lng, label: "Near you", useGPS: true };
    }

    // Different city → use that city's coords
    const cityCoords = NIGERIAN_CITIES[mentionedCity];
    return {
      lat: cityCoords.lat,
      lng: cityCoords.lng,
      label: mentionedCity.charAt(0).toUpperCase() + mentionedCity.slice(1),
      useGPS: false,
    };
  }

  // 3. No city mentioned → use GPS
  if (userLocation) {
    return { lat: userLocation.lat, lng: userLocation.lng, label: "Near you", useGPS: true };
  }

  // 4. No GPS, no city → let backend decide
  return { label: "", useGPS: false };
}
