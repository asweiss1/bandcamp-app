import { getBand, getVenue } from "@/lib/catalog";
import { minutesOf } from "@/lib/conflicts";
import { isYourMove } from "@/lib/queries";
import type { Booking, OpenDate, Snapshot } from "@/lib/types";

export type Stop = {
  booking: Booking;
  openDate: OpenDate;
  bandName: string;
  venueName: string;
  city: string;
  citySlug: string;
};

export function viewerStops(snapshot: Snapshot): Stop[] {
  const bookings =
    snapshot.role === "band"
      ? snapshot.bookings.filter((booking) => booking.bandId === snapshot.bandId)
      : snapshot.role === "venue"
        ? snapshot.bookings.filter((booking) => booking.venueId === snapshot.venueId)
        : [];

  return bookings
    .flatMap((booking) => {
      const openDate = snapshot.openDates.find((date) => date.id === booking.openDateId);
      const band = getBand(booking.bandId);
      const venue = getVenue(booking.venueId);
      if (!openDate || !band || !venue) return [];
      const stop: Stop = {
        booking,
        openDate,
        bandName: band.name,
        venueName: venue.name,
        city: venue.city,
        citySlug: venue.citySlug,
      };
      return [stop];
    })
    .sort(
      (a, b) =>
        a.openDate.date.localeCompare(b.openDate.date) ||
        (minutesOf(a.openDate.showTime) ?? 0) - (minutesOf(b.openDate.showTime) ?? 0),
    );
}

export function liveStops(stops: Stop[]) {
  return stops.filter((stop) => stop.booking.status !== "declined");
}

function todayIso() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function nextStop(stops: Stop[]) {
  const live = liveStops(stops);
  const today = todayIso();
  return live.find((stop) => stop.openDate.date >= today) ?? live.at(-1);
}

export function yourMoves(stops: Stop[], snapshot: Snapshot) {
  return stops.filter((stop) => isYourMove(stop.booking, snapshot));
}

export function counterpart(stop: Stop, snapshot: Snapshot) {
  return snapshot.role === "venue" ? stop.bandName : stop.venueName;
}
