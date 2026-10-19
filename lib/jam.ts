import { milesBetween, placeForSlug } from "@/lib/geo";
import type { Listing } from "@/lib/types";

export function milesFromHome(
  listing: Pick<Listing, "citySlug" | "lat" | "lng">,
  home: { lat?: number; lng?: number; citySlug?: string } | null | undefined,
) {
  if (!home) return null;
  const from =
    home.lat != null && home.lng != null
      ? { lat: home.lat, lng: home.lng }
      : placeForSlug(home.citySlug ?? "");
  const to =
    listing.lat != null && listing.lng != null
      ? { lat: listing.lat, lng: listing.lng }
      : placeForSlug(listing.citySlug);
  if (!from || !to) return null;
  return Math.round(milesBetween(from, to));
}
