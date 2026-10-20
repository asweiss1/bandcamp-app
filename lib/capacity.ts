import type { VenueCapacity } from "@/lib/types";

export const CAPACITY_PRESETS: { id: string; label: string; min: number; max: number | null }[] = [
  { id: "under-50", label: "Under 50", min: 1, max: 49 },
  { id: "50-150", label: "50–150", min: 50, max: 150 },
  { id: "150-300", label: "150–300", min: 150, max: 300 },
  { id: "300+", label: "300+", min: 300, max: null },
];

export type CapacityQuery = { min: number | null; max: number | null };

export function shownCapacity(
  venue: { id: string; capacity: number },
  overrides?: VenueCapacity[],
) {
  const hit = overrides?.find((item) => item.venueId === venue.id);
  if (hit && hit.capacity >= 1) return Math.round(hit.capacity);
  return Math.max(1, Math.round(venue.capacity || 1));
}

export function capacityMatches(capacity: number, query: CapacityQuery) {
  if (query.min == null && query.max == null) return true;
  if (!(capacity >= 1)) return false;
  if (query.min != null && capacity < query.min) return false;
  if (query.max != null && capacity > query.max) return false;
  return true;
}

export function capacityLabel(capacity: number, long = false) {
  const count = Math.round(capacity);
  return long ? `${count} capacity` : `${count} cap`;
}
