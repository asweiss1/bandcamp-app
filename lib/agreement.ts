import { getBand, getVenue } from "@/lib/catalog";
import { slotLine } from "@/lib/daypart";
import { dealHeadline, formatDayLong, formatTime, money } from "@/lib/deal";
import type { Snapshot } from "@/lib/types";

export const CANCELLATION_TERMS =
  "Either side may cancel more than 14 days before the date with no fee. Inside 14 days, the cancelling side owes the guarantee, or $200 when the deal is door-only. A closed room or unsafe weather is settled in writing between the two sides. This sample agreement is not a legal contract.";

export type GigAgreement = {
  bookingId: string;
  bandName: string;
  venueName: string;
  city: string;
  address: string;
  dateLabel: string;
  when: string;
  loadIn: string;
  age: string;
  pay: string;
  door: string;
  tickets: string;
  gear: string;
  cancellation: string;
  acceptedOn: string;
};

export function agreementFor(snapshot: Snapshot, bookingId: string): GigAgreement | null {
  const booking = snapshot.bookings.find((item) => item.id === bookingId);
  if (!booking || booking.status !== "accepted") return null;
  const openDate = snapshot.openDates.find((item) => item.id === booking.openDateId);
  const band = getBand(booking.bandId);
  const venue = getVenue(booking.venueId);
  if (!openDate || !band || !venue) return null;
  const accept = [...booking.events].reverse().find((event) => event.kind === "accept");
  const door =
    booking.terms.dealType === "guarantee"
      ? "Guarantee only. No door percentage on this date."
      : `Band keeps ${booking.terms.doorSplitBand ?? "—"}% of the door.`;
  return {
    bookingId: booking.id,
    bandName: band.name,
    venueName: venue.name,
    city: venue.city,
    address: venue.address?.trim() || `${venue.neighborhood}, ${venue.city}`,
    dateLabel: formatDayLong(openDate.date),
    when: slotLine(openDate.showTime, openDate.daypart),
    loadIn: booking.terms.loadIn ? formatTime(booking.terms.loadIn) : "Unset",
    age: openDate.age,
    pay: dealHeadline(booking.terms),
    door,
    tickets: booking.terms.ticketPrice ? `${money(booking.terms.ticketPrice)} cover` : "Cover at the door",
    gear: booking.terms.backline ? `Backline in house. ${venue.backline}` : `Band brings the rig. ${venue.backline}`,
    cancellation: CANCELLATION_TERMS,
    acceptedOn: accept ? formatDayLong(accept.at.slice(0, 10)) : formatDayLong(openDate.date),
  };
}

export function agreementText(agreement: GigAgreement) {
  return [
    "BandCamp gig agreement",
    `${agreement.bandName} at ${agreement.venueName}`,
    agreement.dateLabel,
    agreement.when,
    agreement.address,
    `Pay: ${agreement.pay}`,
    agreement.door,
    `Tickets: ${agreement.tickets}`,
    `Age: ${agreement.age}`,
    `Load-in: ${agreement.loadIn}`,
    `Gear: ${agreement.gear}`,
    `Cancellation: ${agreement.cancellation}`,
    `Both sides accepted on ${agreement.acceptedOn}.`,
  ].join("\n");
}
