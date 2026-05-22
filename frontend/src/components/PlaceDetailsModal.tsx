"use client";

import { useEffect, useState } from "react";
import { getPlaceDetails, PlaceDetails } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  placeId: string | null;
  restaurantName: string;
}

function SkeletonLine({ width = "100%" }: { width?: string }) {
  return (
    <div
      className="h-4 bg-surface-container-high rounded animate-pulse"
      style={{ width }}
    />
  );
}

export default function PlaceDetailsModal({ isOpen, onClose, placeId, restaurantName }: Props) {
  const [placeData, setPlaceData] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [hoursOpen, setHoursOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setPlaceData(null);
    setError(null);
    setPhotoIdx(0);
    setHoursOpen(false);
    if (!placeId) return;

    setLoading(true);
    getPlaceDetails(placeId)
      .then(setPlaceData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isOpen, placeId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const mapsUrl =
    placeData?.google_maps_url ||
    (placeData?.lat && placeData?.lng
      ? `https://maps.google.com/?q=${placeData.lat},${placeData.lng}`
      : `https://maps.google.com/?q=${encodeURIComponent(restaurantName)}`);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Sheet — slides up from bottom on mobile, centered on desktop */}
      <div className="fixed inset-x-0 bottom-0 z-50 md:inset-0 md:flex md:items-center md:justify-center md:p-4">
        <div
          className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-lg max-h-[85vh] overflow-y-auto scrollbar-thin"
          style={{ animation: "slideUp 0.28s ease" }}
        >
          {/* Drag handle — mobile only */}
          <div className="flex justify-center pt-3 pb-1 md:hidden">
            <div className="w-10 h-1 bg-outline/30 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-3 pb-2">
            <h2
              className="font-black text-lg text-on-surface truncate pr-4"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {restaurantName}
            </h2>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* ── No place_id: featured / fallback restaurant ── */}
          {!placeId && (
            <div className="px-5 pb-6">
              <p className="text-on-surface-variant text-sm mb-5">
                This is a featured recommendation. Search Google Maps to see live details.
              </p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(restaurantName)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-primary text-white py-3 rounded-xl font-bold hover:bg-red-800 transition-all active:scale-95"
              >
                Search on Google Maps
              </a>
            </div>
          )}

          {/* ── Loading skeleton ── */}
          {placeId && loading && (
            <div className="px-5 pb-6 space-y-4">
              <div className="h-52 bg-surface-container-high rounded-2xl animate-pulse" />
              <div className="space-y-2">
                <SkeletonLine width="55%" />
                <SkeletonLine width="38%" />
              </div>
              <SkeletonLine />
              <SkeletonLine width="65%" />
              <div className="h-12 bg-surface-container-high rounded-xl animate-pulse" />
            </div>
          )}

          {/* ── Error ── */}
          {placeId && error && !loading && (
            <div className="px-5 pb-6">
              <p className="text-error text-sm mb-4">
                Search Google Maps to see live details
              </p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-primary text-white py-3 rounded-xl font-bold hover:bg-red-800 transition-all active:scale-95"
              >
                Open in Google Maps
              </a>
            </div>
          )}

          {/* ── Full details ── */}
          {placeId && placeData && !loading && (
            <>
              {/* Photo carousel */}
              {placeData.photos.length > 0 && (
                <div className="relative h-52 bg-surface-container-high overflow-hidden mx-5 rounded-2xl mb-4">
                  <img
                    src={placeData.photos[photoIdx]}
                    alt={restaurantName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const t = e.target as HTMLImageElement;
                      t.onerror = null;
                      t.src = "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80";
                    }}
                  />
                  {placeData.photos.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setPhotoIdx((i) => (i - 1 + placeData.photos.length) % placeData.photos.length)
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-base">chevron_left</span>
                      </button>
                      <button
                        onClick={() =>
                          setPhotoIdx((i) => (i + 1) % placeData.photos.length)
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-base">chevron_right</span>
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {placeData.photos.map((_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                              i === photoIdx ? "bg-white" : "bg-white/40"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="px-5 pb-6 space-y-4">
                {/* Rating · status · price */}
                <div className="flex items-center gap-2 flex-wrap">
                  {placeData.is_open_now !== null && (
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        placeData.is_open_now
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {placeData.is_open_now ? "Open Now ✓" : "Closed"}
                    </span>
                  )}
                  {placeData.rating && (
                    <span className="text-sm font-semibold text-on-surface">
                      ⭐ {placeData.rating.toFixed(1)}
                      {placeData.total_ratings && (
                        <span className="text-on-surface-variant font-normal">
                          {" "}· {placeData.total_ratings.toLocaleString()} reviews
                        </span>
                      )}
                    </span>
                  )}
                  {placeData.price_level && (
                    <span className="text-xs font-semibold px-2.5 py-1 bg-surface-container-high rounded-full text-on-surface-variant">
                      {formatPrice(placeData.price_level)}
                    </span>
                  )}
                </div>

                {/* Address */}
                {placeData.address && (
                  <div className="flex gap-2 items-start text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-base flex-shrink-0 mt-0.5">location_on</span>
                    <span>{placeData.address}</span>
                  </div>
                )}

                {/* Phone */}
                {placeData.phone && (
                  <a
                    href={`tel:${placeData.phone}`}
                    className="flex gap-2 items-center text-sm text-primary font-medium"
                  >
                    <span className="material-symbols-outlined text-base">call</span>
                    {placeData.phone}
                  </a>
                )}

                {/* Website */}
                {placeData.website && (
                  <a
                    href={placeData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-2 items-center text-sm text-primary font-medium"
                  >
                    <span className="material-symbols-outlined text-base">language</span>
                    <span className="truncate">
                      {placeData.website.replace(/^https?:\/\//, "").split("/")[0]}
                    </span>
                  </a>
                )}

                {/* Opening hours — collapsible */}
                {placeData.opening_hours.length > 0 && (
                  <div>
                    <button
                      onClick={() => setHoursOpen((o) => !o)}
                      className="flex items-center gap-2 text-sm font-semibold text-on-surface w-full text-left"
                    >
                      <span className="material-symbols-outlined text-base">schedule</span>
                      Opening Hours
                      <span
                        className="material-symbols-outlined text-base ml-auto text-on-surface-variant transition-transform"
                        style={{ transform: hoursOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      >
                        expand_more
                      </span>
                    </button>
                    {hoursOpen && (
                      <div className="mt-2 space-y-1 pl-6">
                        {placeData.opening_hours.map((line, i) => (
                          <p key={i} className="text-xs text-on-surface-variant">
                            {line}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Get Directions */}
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-primary text-white py-3 rounded-xl font-bold hover:bg-red-800 transition-all active:scale-95"
                >
                  Get Directions →
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
