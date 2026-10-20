import { shownCapacity } from "@/lib/capacity";
import { getVenue } from "@/lib/catalog";
import { dateFill } from "@/lib/queries";
import { milesBetween, placeForSlug } from "@/lib/geo";
import type { DateFill, OpenDate, Snapshot, Venue } from "@/lib/types";

export type NearDate = {
  openDate: OpenDate;
  venue: Venue;
  miles: number;
  fill: DateFill;
  capacity: number;
};

export function datesNear(
  snapshot: Pick<Snapshot, "openDates" | "bookings" | "capacities">,
  origin: { lat: number; lng: number },
  radiusMiles: number,
  from: string,
) {
  const rows: NearDate[] = [];
  for (const openDate of snapshot.openDates) {
    if (openDate.date < from) continue;
    const venue = getVenue(openDate.venueId);
    const place = venue ? placeForSlug(venue.citySlug) : null;
    if (!venue || !place) continue;
    const miles = Math.round(milesBetween(origin, place));
    if (miles > radiusMiles) continue;
    rows.push({
      openDate,
      venue,
      miles,
      fill: dateFill(openDate.id, snapshot.bookings),
      capacity: shownCapacity(venue, snapshot.capacities),
    });
  }
  return rows.sort(
    (a, b) => a.openDate.date.localeCompare(b.openDate.date) || a.miles - b.miles || a.venue.name.localeCompare(b.venue.name),
  );
}
