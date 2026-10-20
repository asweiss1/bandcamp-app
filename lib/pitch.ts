import { getBand, getVenue } from "@/lib/catalog";
import { todayIso } from "@/lib/fans";
import { linkedBandIds } from "@/lib/links";
import { isVerified, verificationFor } from "@/lib/trust";
import type { PeerReview, Pitch, PitchMember, Review, Snapshot } from "@/lib/types";
import { setTimes, splitPreset, type SplitKind } from "@/lib/full-night";

export type PeerChecks = Pick<PeerReview, "onTime" | "sharedGear" | "broughtCrowd" | "easyToWorkWith">;

type GlanceSnapshot = Pick<
  Snapshot,
  "bookings" | "openDates" | "bills" | "reviews" | "peerReviews" | "verifications" | "bandLinks"
>;

export function buildPitchMembers(leadId: string, partnerIds: string[], showTime: string, preset: SplitKind) {
  const ids = [leadId, ...partnerIds.filter((id) => id && id !== leadId)];
  const unique = [...new Set(ids)];
  if (unique.length !== ids.length || unique.length < 2 || unique.length > 4) return null;
  const splits = splitPreset(unique.length, preset);
  if (!splits) return null;
  const times = setTimes(showTime, unique.length);
  return unique.map((bandId, index) => ({
    bandId,
    role: index === 0 ? ("Headliner" as const) : ("Opener" as const),
    setTime: times[index] ?? showTime,
    splitPercent: splits[index] ?? 1,
    status: index === 0 ? ("accepted" as const) : ("invited" as const),
  }));
}

export function pitchGuarantee(bands: { feeMin: number; feeMax: number }[]) {
  return bands.reduce((sum, band) => sum + Math.round((band.feeMin + band.feeMax) / 2), 0);
}

export function sendBlock(pitch: Pitch) {
  if (pitch.bookingId) return "This pitch was already sent to the venue.";
  if (pitch.members.some((member) => member.status !== "accepted")) {
    return "Wait until every band accepts. The venue does not see this yet.";
  }
  return null;
}

export function applyMemberChange(
  members: PitchMember[],
  bandId: string,
  setTime: string,
  splitPercent: number,
): { ok: true; members: PitchMember[] } | { ok: false; error: string } {
  const time = setTime.trim();
  if (!time) return { ok: false, error: "Add a set time." };
  if (!Number.isInteger(splitPercent) || splitPercent < 1 || splitPercent > 99) {
    return { ok: false, error: "Use a whole percent from 1 to 99." };
  }
  const next = members.map((member) => ({ ...member }));
  const mine = next.find((member) => member.bandId === bandId);
  const head = next.find((member) => member.role === "Headliner");
  if (!mine || !head) return { ok: false, error: "You are not on this pitch." };
  mine.setTime = time;
  mine.splitPercent = splitPercent;
  if (mine.bandId === head.bandId) {
    const opener = next.find((member) => member.role === "Opener");
    if (!opener) return { ok: false, error: "An opener has to be on the pitch before the split can move." };
    const rest = next
      .filter((member) => member.bandId !== head.bandId && member.bandId !== opener.bandId)
      .reduce((sum, member) => sum + member.splitPercent, 0);
    const openerSplit = 100 - splitPercent - rest;
    if (openerSplit < 1) return { ok: false, error: "That split does not leave enough for the opener." };
    opener.splitPercent = openerSplit;
  } else {
    const rest = next
      .filter((member) => member.bandId !== head.bandId)
      .reduce((sum, member) => sum + member.splitPercent, 0);
    const headSplit = 100 - rest;
    if (headSplit < 1) return { ok: false, error: "That split does not leave enough for the headliner." };
    head.splitPercent = headSplit;
  }
  for (const member of next) member.status = member.bandId === bandId ? "accepted" : "invited";
  return { ok: true, members: next };
}

export function bandsOnBooking(snapshot: Pick<Snapshot, "bills">, booking: { bandId: string; billId?: string | null }) {
  const bill = booking.billId ? snapshot.bills.find((item) => item.id === booking.billId) : undefined;
  if (bill && bill.members.length > 0) return bill.members.map((member) => member.bandId);
  return [booking.bandId];
}

export function playedBookings(snapshot: Pick<Snapshot, "bookings" | "openDates" | "bills">, bandId: string, today = todayIso()) {
  return snapshot.bookings.filter((booking) => {
    if (booking.status !== "accepted") return false;
    const openDate = snapshot.openDates.find((item) => item.id === booking.openDateId);
    if (!openDate || openDate.date >= today) return false;
    return bandsOnBooking(snapshot, booking).includes(bandId);
  });
}

function peerScore(review: PeerReview) {
  const yes = [review.onTime, review.sharedGear, review.broughtCrowd, review.easyToWorkWith].filter(Boolean).length;
  return (yes / 4) * 5;
}

function scoreLabel(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function trustGlance(snapshot: GlanceSnapshot, viewerBandId: string, otherBandId: string, today = todayIso()) {
  const venueReviews = snapshot.reviews.filter((review) => review.toId === otherBandId && review.fromRole === "venue");
  const peerReviews = snapshot.peerReviews.filter((review) => review.toBandId === otherBandId);
  const scores = [...venueReviews.map((review) => review.rating), ...peerReviews.map(peerScore)];
  const rooms = venueReviews.length;
  const bands = peerReviews.length;
  const who = [
    rooms ? `${rooms} ${rooms === 1 ? "room" : "rooms"}` : "",
    bands ? `${bands} ${bands === 1 ? "band" : "bands"}` : "",
  ].filter(Boolean);
  const rating =
    scores.length === 0
      ? "No reviews yet"
      : `${scoreLabel(scores.reduce((sum, score) => sum + score, 0) / scores.length)} from ${who.join(" and ")}`;
  const gigs = playedBookings(snapshot, otherBandId, today).length;
  const verified = isVerified("band", verificationFor(snapshot.verifications, otherBandId));
  const mine = new Set(playedBookings(snapshot, viewerBandId, today).map((booking) => booking.venueId));
  const connections: string[] = [];
  for (const booking of playedBookings(snapshot, otherBandId, today)) {
    if (!mine.has(booking.venueId)) continue;
    const venue = getVenue(booking.venueId);
    const line = venue ? `You both played ${venue.name}` : "";
    if (line && !connections.includes(line)) connections.push(line);
  }
  if (linkedBandIds(snapshot.bandLinks, viewerBandId).includes(otherBandId)) {
    connections.push("Linked with you");
  } else {
    const friends = new Set(linkedBandIds(snapshot.bandLinks, viewerBandId));
    const shared = linkedBandIds(snapshot.bandLinks, otherBandId).find((id) => friends.has(id));
    const name = shared ? getBand(shared)?.name : "";
    if (name) connections.push(`Linked with ${name}`);
  }
  return {
    verified,
    rating,
    gigs,
    gigsLabel: gigs === 0 ? "No gigs on the app yet" : gigs === 1 ? "1 gig on the app" : `${gigs} gigs on the app`,
    connections,
  };
}

export function openInvites(snapshot: Pick<Snapshot, "pitches">, bandId: string) {
  return snapshot.pitches.filter(
    (pitch) => !pitch.bookingId && pitch.members.some((member) => member.bandId === bandId && member.status === "invited"),
  );
}

type PeerResult = { ok: true; data: Omit<PeerReview, "id" | "createdAt"> } | { ok: false; error: string };

export function peerReviewDraft(
  snapshot: Pick<Snapshot, "role" | "bandId" | "bookings" | "openDates" | "bills" | "peerReviews">,
  bookingId: string,
  toBandId: string,
  checks: PeerChecks,
  note: string,
  today = todayIso(),
): PeerResult {
  if (snapshot.role !== "band") return { ok: false, error: "Switch to a band to review another band." };
  const booking = snapshot.bookings.find((item) => item.id === bookingId);
  if (!booking || booking.status !== "accepted") return { ok: false, error: "Reviews open after a confirmed date." };
  const openDate = snapshot.openDates.find((item) => item.id === booking.openDateId);
  if (!openDate || openDate.date >= today) return { ok: false, error: "Reviews open the day after the gig." };
  const ids = bandsOnBooking(snapshot, booking);
  if (!ids.includes(snapshot.bandId) || !ids.includes(toBandId) || snapshot.bandId === toBandId) {
    return { ok: false, error: "You can review the other bands on this bill." };
  }
  if (snapshot.peerReviews.some((review) => review.bookingId === bookingId && review.fromBandId === snapshot.bandId && review.toBandId === toBandId)) {
    return { ok: false, error: "You already reviewed this band for this gig." };
  }
  const clean = note.trim();
  if (clean.length > 280) return { ok: false, error: "Keep the note to a few sentences." };
  return {
    ok: true,
    data: {
      bookingId,
      fromBandId: snapshot.bandId,
      toBandId,
      onTime: checks.onTime,
      sharedGear: checks.sharedGear,
      broughtCrowd: checks.broughtCrowd,
      easyToWorkWith: checks.easyToWorkWith,
      note: clean,
    },
  };
}

export function reviewsAboutBand(reviews: Review[], peerReviews: PeerReview[], bandId: string) {
  return {
    venues: reviews.filter((review) => review.toId === bandId && review.fromRole === "venue"),
    bands: peerReviews.filter((review) => review.toBandId === bandId),
  };
}
