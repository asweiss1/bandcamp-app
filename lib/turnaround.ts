import { commitmentsFrom, SET_MINUTES, type Commitment } from "@/lib/conflicts";
import { driveBetween } from "@/lib/geo";
import type { Snapshot } from "@/lib/types";

export type Turnaround = {
  bookingId: string;
  otherId: string;
  betweenMinutes: number;
  driveMinutes: number;
  sameCity: boolean;
  tight: boolean;
  note: string;
};

export function formatSpan(minutes: number) {
  const rounded = Math.max(0, Math.round(minutes));
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

export function turnaroundNote(betweenMinutes: number, driveMinutes: number, sameCity: boolean) {
  const slack = betweenMinutes - driveMinutes;
  const label = slack <= 90 ? "Tight turnaround" : "Same-date turnaround";
  const drive = sameCity || driveMinutes < 10 ? "same city" : `${formatSpan(driveMinutes)} drive`;
  return `${label}: ${formatSpan(betweenMinutes)} between sets, ${drive}`;
}

function windowsOverlap(a: Commitment, b: Commitment) {
  if (a.showMinutes == null || b.showMinutes == null) return true;
  return a.showMinutes < b.showMinutes + SET_MINUTES && b.showMinutes < a.showMinutes + SET_MINUTES;
}

export function turnaroundsFor(snapshot: Pick<Snapshot, "bookings" | "openDates" | "applications" | "opportunities" | "interests" | "listings">) {
  const notes = new Map<string, Turnaround>();
  const confirmed = commitmentsFrom(snapshot).filter(
    (item) =>
      item.status === "confirmed" &&
      item.source === "booking" &&
      item.bandId &&
      item.showMinutes != null &&
      item.date === item.endDate,
  );
  const groups = new Map<string, Commitment[]>();
  for (const item of confirmed) {
    const key = `${item.bandId}:${item.date}`;
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  for (const list of groups.values()) {
    const sorted = [...list].sort((a, b) => (a.showMinutes ?? 0) - (b.showMinutes ?? 0));
    for (let index = 0; index < sorted.length - 1; index += 1) {
      const earlier = sorted[index];
      const later = sorted[index + 1];
      if (earlier.showMinutes == null || later.showMinutes == null || windowsOverlap(earlier, later)) continue;
      const between = later.showMinutes - earlier.showMinutes - SET_MINUTES;
      if (between < 0) continue;
      const sameCity = Boolean(earlier.citySlug) && earlier.citySlug === later.citySlug;
      let driveMinutes = 0;
      if (!sameCity && earlier.lat != null && earlier.lng != null && later.lat != null && later.lng != null) {
        driveMinutes = Math.round(driveBetween({ lat: earlier.lat, lng: earlier.lng }, { lat: later.lat, lng: later.lng }).hours * 60);
      }
      if (!sameCity && driveMinutes > between) continue;
      const note = turnaroundNote(between, driveMinutes, sameCity);
      const tight = between - driveMinutes <= 90;
      const pair: Omit<Turnaround, "bookingId" | "otherId"> = {
        betweenMinutes: between,
        driveMinutes,
        sameCity,
        tight,
        note,
      };
      notes.set(earlier.id, { ...pair, bookingId: earlier.id, otherId: later.id });
      notes.set(later.id, { ...pair, bookingId: later.id, otherId: earlier.id });
    }
  }
  return notes;
}

export function noteForBooking(
  snapshot: Pick<Snapshot, "bookings" | "openDates" | "applications" | "opportunities" | "interests" | "listings">,
  bookingId: string,
) {
  return turnaroundsFor(snapshot).get(bookingId)?.note ?? null;
}
