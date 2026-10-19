import { candidateForBooking, confirmedClash, pendingOverlap } from "@/lib/conflicts";
import type { BillMember, Booking, Snapshot } from "@/lib/types";

type ClashSnapshot = Pick<
  Snapshot,
  "bookings" | "openDates" | "applications" | "opportunities" | "interests" | "listings"
>;

export function memberBandIds(members: BillMember[]) {
  return members.map((member) => member.bandId);
}

export function billProblem(members: BillMember[]) {
  if (members.length < 2 || members.length > 4) return "A bill needs 2 to 4 bands.";
  const ids = memberBandIds(members);
  if (new Set(ids).size !== ids.length) return "Each band can only be on the bill once.";
  const headliners = members.filter((member) => member.role === "Headliner");
  if (headliners.length !== 1) return "A bill needs exactly one headliner.";
  if (members.some((member) => member.setTime.trim().length === 0)) {
    return "Every set needs a start time.";
  }
  if (
    members.some(
      (member) =>
        !Number.isInteger(member.splitPercent) || member.splitPercent < 1 || member.splitPercent > 100,
    )
  ) {
    return "Each split is a whole percent from 1 to 100.";
  }
  const total = members.reduce((sum, member) => sum + member.splitPercent, 0);
  if (total !== 100) return "Splits have to add up to 100.";
  return null;
}

function clashFor(
  snapshot: ClashSnapshot,
  bandIds: string[],
  booking: Booking,
  mode: "confirmed" | "pending",
) {
  for (const bandId of bandIds) {
    const id = bandId === booking.bandId ? booking.id : `${booking.id}:${bandId}`;
    const candidate = candidateForBooking(snapshot, { ...booking, id, bandId }, mode);
    if (!candidate) return "That date is no longer listed.";
    const message =
      mode === "confirmed" ? confirmedClash(snapshot, candidate) : pendingOverlap(snapshot, candidate);
    if (message) return message;
  }
  return null;
}

export function billConfirmedClash(snapshot: ClashSnapshot, bandIds: string[], booking: Booking) {
  return clashFor(snapshot, bandIds, booking, "confirmed");
}

export function billPendingWarning(snapshot: ClashSnapshot, bandIds: string[], booking: Booking) {
  return clashFor(snapshot, bandIds, booking, "pending");
}
