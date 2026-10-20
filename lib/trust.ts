import { getBand, getVenue } from "@/lib/catalog";
import { todayIso } from "@/lib/fans";
import { sizeLabel } from "@/lib/size";
import type { Review, Role, Snapshot, Verification } from "@/lib/types";

export type Check = { ok: true; data: Omit<Review, "id" | "createdAt"> } | { ok: false; error: string };

export function sizeFit(pieces: number, capacity: number) {
  const count = Math.max(1, Math.round(pieces));
  const room = Math.max(1, Math.round(capacity));
  const label = sizeLabel(count);
  const tight = (room < 50 && count >= 4) || (room < 100 && count >= 6);
  return {
    ok: !tight,
    label: tight ? "Tight fit" : "Fits",
    line: tight
      ? `${label} is tight on a ${room}-capacity stage.`
      : `${label} fits this ${room}-capacity room.`,
  };
}

export function blankVerification(profileId: string): Verification {
  return { profileId, email: false, phone: false, address: false };
}

export function verificationFor(list: Verification[] | undefined, profileId: string): Verification {
  return list?.find((item) => item.profileId === profileId) ?? blankVerification(profileId);
}

export function isVerified(role: Role, check: Verification) {
  if (role === "venue") return check.email && check.phone && check.address;
  if (role === "fan") return check.email;
  return check.email && check.phone;
}

export function reviewsAbout(reviews: Review[], profileId: string) {
  return reviews
    .filter((review) => review.toId === profileId)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function reviewDraft(
  snapshot: Pick<Snapshot, "role" | "bandId" | "venueId" | "bookings" | "openDates" | "reviews">,
  bookingId: string,
  rating: number,
  note: string,
  today = todayIso(),
): Check {
  const booking = snapshot.bookings.find((item) => item.id === bookingId);
  if (!booking || booking.status !== "accepted") {
    return { ok: false, error: "Reviews open after a confirmed date." };
  }
  const openDate = snapshot.openDates.find((item) => item.id === booking.openDateId);
  if (!openDate || openDate.date >= today) {
    return { ok: false, error: "Reviews open the day after the gig." };
  }
  const bandSide = snapshot.role === "band" && snapshot.bandId === booking.bandId;
  const venueSide = snapshot.role === "venue" && snapshot.venueId === booking.venueId;
  if (!bandSide && !venueSide) {
    return { ok: false, error: "Only the band and the room on this date can review each other." };
  }
  const fromId = bandSide ? booking.bandId : booking.venueId;
  const toId = bandSide ? booking.venueId : booking.bandId;
  if (snapshot.reviews.some((review) => review.bookingId === bookingId && review.fromId === fromId)) {
    return { ok: false, error: "You already reviewed this date." };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Choose a rating from 1 to 5." };
  }
  const clean = note.trim();
  if (clean.length < 8) return { ok: false, error: "Add a short note, at least a sentence." };
  if (!getBand(toId) && !getVenue(toId)) return { ok: false, error: "That profile is missing." };
  return {
    ok: true,
    data: {
      bookingId,
      fromRole: bandSide ? "band" : "venue",
      fromId,
      toRole: bandSide ? "venue" : "band",
      toId,
      rating,
      note: clean,
    },
  };
}

export function pendingReviews(
  snapshot: Pick<Snapshot, "role" | "bandId" | "venueId" | "bookings" | "openDates" | "reviews">,
  today: string,
) {
  return snapshot.bookings.flatMap((booking) => {
    const openDate = snapshot.openDates.find((item) => item.id === booking.openDateId);
    if (!openDate) return [];
    const draft = reviewDraft(snapshot, booking.id, 5, "Placeholder note for eligibility.", today);
    if (!draft.ok && draft.error !== "Choose a rating from 1 to 5." && draft.error !== "Add a short note, at least a sentence.") {
      return [];
    }
    const band = getBand(booking.bandId);
    const venue = getVenue(booking.venueId);
    if (!band || !venue) return [];
    return [{ bookingId: booking.id, date: openDate.date, bandName: band.name, venueName: venue.name }];
  });
}
