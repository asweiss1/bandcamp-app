import type {
  Booking,
  DateFill,
  Interest,
  Listing,
  OpenDate,
  Party,
  Role,
  Snapshot,
} from "@/lib/types";

export function dateFill(openDateId: string, bookings: Booking[]): DateFill {
  const related = bookings.filter(
    (booking) => booking.openDateId === openDateId && booking.status !== "declined",
  );
  if (related.some((booking) => booking.status === "accepted")) return "filled";
  if (related.length > 0) return "in-talks";
  return "open";
}

export function activeBooking(openDateId: string, bandId: string, bookings: Booking[]) {
  return bookings.find(
    (booking) =>
      booking.openDateId === openDateId &&
      booking.bandId === bandId &&
      booking.status !== "declined",
  );
}

export function viewerParty(
  booking: Booking,
  role: Role,
  bandId: string,
  venueId: string,
): Party | null {
  if (role === "band" && booking.bandId === bandId) return "band";
  if (role === "venue" && booking.venueId === venueId) return "venue";
  return null;
}

export function isYourMove(booking: Booking, snapshot: Pick<Snapshot, "role" | "bandId" | "venueId">) {
  if (booking.awaiting == null) return false;
  if (booking.status === "accepted" || booking.status === "declined") return false;
  const party = viewerParty(booking, snapshot.role, snapshot.bandId, snapshot.venueId);
  return party != null && party === booking.awaiting;
}

export function canWithdraw(booking: Booking, snapshot: Pick<Snapshot, "role" | "bandId" | "venueId">) {
  if (booking.status === "accepted" || booking.status === "declined") return false;
  return viewerParty(booking, snapshot.role, snapshot.bandId, snapshot.venueId) != null;
}

export function bandBookings(bookings: Booking[], bandId: string) {
  return bookings
    .filter((booking) => booking.bandId === bandId)
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function interestsForListing(interests: Interest[], listingId: string) {
  return interests.filter((interest) => interest.listingId === listingId);
}

export function listingOwner(listing: Listing, snapshot: Pick<Snapshot, "role" | "bandId" | "venueId" | "musicianId">) {
  return listing.posterRole === snapshot.role && listing.posterId === profileId(snapshot);
}

export function profileId(snapshot: Pick<Snapshot, "role" | "bandId" | "venueId" | "musicianId">) {
  if (snapshot.role === "band") return snapshot.bandId;
  if (snapshot.role === "venue") return snapshot.venueId;
  return snapshot.musicianId;
}

export function sortByDate(dates: OpenDate[]) {
  return dates.slice().sort((a, b) => a.date.localeCompare(b.date) || a.showTime.localeCompare(b.showTime));
}
