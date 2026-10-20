import { getBand, getVenue } from "@/lib/catalog";
import { formatDay } from "@/lib/deal";
import { driveBetween, placeForSlug } from "@/lib/geo";
import type {
  Application,
  Booking,
  Interest,
  Listing,
  NightStay,
  Opportunity,
  Snapshot,
} from "@/lib/types";

/** Matches the tour planner's default max drive: straight-line miles × 1.3 at 55 mph. */
export const DRIVE_LIMIT_HOURS = 6;

/** A set occupies this many minutes from the listed start time. */
export const SET_MINUTES = 90;

export type Commitment = {
  id: string;
  source: "booking" | "application" | "fill-in";
  status: "confirmed" | "pending";
  date: string;
  endDate: string;
  showMinutes: number | null;
  citySlug: string;
  lat: number | null;
  lng: number | null;
  label: string;
  bandId: string | null;
  venueId: string | null;
  musicianId: string | null;
};

const MONTHS: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

export function datesMentioned(text: string, fallbackYear = "2026") {
  const found = new Set<string>();
  for (const match of text.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) {
    found.add(`${match[1]}-${match[2]}-${match[3]}`);
  }
  for (const match of text.matchAll(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:,?\s+(\d{4}))?/gi,
  )) {
    const month = MONTHS[match[1].slice(0, 3).toLowerCase()];
    const day = match[2].padStart(2, "0");
    const year = match[3] ?? fallbackYear;
    if (month) found.add(`${year}-${month}-${day}`);
  }
  return [...found].sort();
}

export function minutesOf(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  const ampm = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (ampm) {
    let hour = Number(ampm[1]);
    const minute = Number(ampm[2] ?? "0");
    if (ampm[3] === "pm" && hour < 12) hour += 12;
    if (ampm[3] === "am" && hour === 12) hour = 0;
    if (hour > 23 || minute > 59) return null;
    return hour * 60 + minute;
  }
  const clock = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!clock) return null;
  const hour = Number(clock[1]);
  const minute = Number(clock[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function daySpan(start: string, end: string) {
  const [ys, ms, ds] = start.split("-").map(Number);
  const [ye, me, de] = end.split("-").map(Number);
  const from = Date.UTC(ys, ms - 1, ds);
  const to = Date.UTC(ye, me - 1, de);
  return Math.round((to - from) / 86400000);
}

function overlaps(a: Commitment, b: Commitment) {
  return a.date <= b.endDate && b.date <= a.endDate;
}

function coordsFor(slug: string) {
  const place = placeForSlug(slug);
  return place ? { lat: place.lat, lng: place.lng, label: place.label } : null;
}

function gigLabel(snapshot: Pick<Snapshot, "openDates">, booking: Booking) {
  const venue = getVenue(booking.venueId);
  const openDate = snapshot.openDates.find((item) => item.id === booking.openDateId);
  const where = venue ? `${venue.name}, ${venue.city}` : "a room";
  const when = openDate ? formatDay(openDate.date) : "that date";
  return `${where} on ${when}`;
}

export function commitmentsFrom(snapshot: Pick<Snapshot, "bookings" | "openDates" | "applications" | "opportunities" | "interests" | "listings">): Commitment[] {
  const list: Commitment[] = [];
  for (const booking of snapshot.bookings) {
    if (booking.status === "declined") continue;
    const openDate = snapshot.openDates.find((item) => item.id === booking.openDateId);
    if (!openDate) continue;
    const place = coordsFor(openDate ? getVenue(booking.venueId)?.citySlug ?? "" : "");
    const venue = getVenue(booking.venueId);
    list.push({
      id: booking.id,
      source: "booking",
      status: booking.status === "accepted" ? "confirmed" : "pending",
      date: openDate.date,
      endDate: openDate.date,
      showMinutes: minutesOf(openDate.showTime),
      citySlug: venue?.citySlug ?? "",
      lat: place?.lat ?? null,
      lng: place?.lng ?? null,
      label: gigLabel(snapshot, booking),
      bandId: booking.bandId,
      venueId: booking.venueId,
      musicianId: null,
    });
  }
  for (const application of snapshot.applications) {
    if (application.status === "declined" || application.status === "waitlisted") continue;
    const opportunity = snapshot.opportunities.find((item) => item.id === application.opportunityId);
    if (!opportunity) continue;
    const place = coordsFor(opportunity.citySlug);
    list.push({
      id: application.id,
      source: "application",
      status: application.status === "accepted" ? "confirmed" : "pending",
      date: opportunity.startDate,
      endDate: opportunity.endDate,
      showMinutes: null,
      citySlug: opportunity.citySlug,
      lat: place?.lat ?? null,
      lng: place?.lng ?? null,
      label: `${opportunity.title} in ${opportunity.city} on ${formatDay(opportunity.startDate)}`,
      bandId: application.bandId,
      venueId: null,
      musicianId: null,
    });
  }
  for (const interest of snapshot.interests) {
    const status = interest.status ?? "pending";
    if (status === "declined" || !interest.listingId) continue;
    const listing = snapshot.listings.find((item) => item.id === interest.listingId);
    if (!listing || listing.kind !== "fill-in") continue;
    const musicianId = interest.fromRole === "musician" ? interest.fromId : listing.posterRole === "musician" ? listing.posterId : null;
    if (!musicianId) continue;
    const dates = datesMentioned(listing.dates);
    if (dates.length === 0) continue;
    const place = coordsFor(listing.citySlug);
    const start = dates[0];
    const end = dates[dates.length - 1];
    list.push({
      id: interest.id,
      source: "fill-in",
      status: status === "confirmed" ? "confirmed" : "pending",
      date: start,
      endDate: end,
      showMinutes: null,
      citySlug: listing.citySlug,
      lat: place?.lat ?? null,
      lng: place?.lng ?? null,
      label: `${listing.title} in ${listing.city} on ${formatDay(start)}`,
      bandId: null,
      venueId: null,
      musicianId,
    });
  }
  return list;
}

function singleDay(item: Commitment) {
  return item.date === item.endDate;
}

function windowsOverlap(a: Commitment, b: Commitment) {
  if (a.showMinutes == null || b.showMinutes == null) return true;
  return a.showMinutes < b.showMinutes + SET_MINUTES && b.showMinutes < a.showMinutes + SET_MINUTES;
}

function separableSameDay(a: Commitment, b: Commitment) {
  return (
    singleDay(a) &&
    singleDay(b) &&
    a.date === b.date &&
    a.showMinutes != null &&
    b.showMinutes != null &&
    !windowsOverlap(a, b)
  );
}

function sameDayDriveHours(a: Commitment, b: Commitment) {
  if (!separableSameDay(a, b) || a.showMinutes == null || b.showMinutes == null) return null;
  const earlier = a.showMinutes <= b.showMinutes ? a : b;
  const later = earlier === a ? b : a;
  const laterMinutes = later.showMinutes;
  const earlierMinutes = earlier.showMinutes;
  if (laterMinutes == null || earlierMinutes == null) return null;
  const between = laterMinutes - earlierMinutes - SET_MINUTES;
  if (earlier.citySlug && earlier.citySlug === later.citySlug) return null;
  if (earlier.lat == null || earlier.lng == null || later.lat == null || later.lng == null) return null;
  const drive = driveBetween({ lat: earlier.lat, lng: earlier.lng }, { lat: later.lat, lng: later.lng });
  if (drive.hours * 60 <= between) return null;
  return drive.hours;
}

function travelProblem(a: Commitment, b: Commitment, limit: number) {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const earlier = a.endDate <= b.date ? a : b;
  const later = earlier === a ? b : a;
  if (later.date <= earlier.endDate) return null;
  const gap = daySpan(earlier.endDate, later.date);
  if (gap < 1) return null;
  const fromLat = earlier.lat;
  const fromLng = earlier.lng;
  const toLat = later.lat;
  const toLng = later.lng;
  if (fromLat == null || fromLng == null || toLat == null || toLng == null) return null;
  const drive = driveBetween({ lat: fromLat, lng: fromLng }, { lat: toLat, lng: toLng });
  if (drive.hours <= gap * limit) return null;
  return drive.hours;
}

function describe(existing: Commitment, candidate: Commitment, hours: number | null, limit: number) {
  const who =
    candidate.bandId && existing.bandId === candidate.bandId
      ? getBand(candidate.bandId)?.name ?? "This band"
      : candidate.musicianId && existing.musicianId === candidate.musicianId
        ? "This player"
        : getVenue(candidate.venueId ?? "")?.name ?? "This room";
  if (hours == null) {
    return `${who} already has ${existing.label} confirmed. That date already has an overlapping booking.`;
  }
  return `${who} already has ${existing.label} confirmed. The drive is ${hours} hours, past the planner's ${limit}-hour limit.`;
}

function describeSameDayDrive(existing: Commitment, candidate: Commitment, hours: number) {
  const who =
    candidate.bandId && existing.bandId === candidate.bandId
      ? getBand(candidate.bandId)?.name ?? "This band"
      : "This player";
  return `${who} already has ${existing.label} confirmed. The drive is ${hours} hours and does not fit between those sets.`;
}

function describePending(existing: Commitment) {
  return `This overlaps a pending talk for ${existing.label}. The request can still be sent.`;
}

function relevant(existing: Commitment, candidate: Commitment) {
  if (candidate.bandId && existing.bandId === candidate.bandId) return "band" as const;
  if (candidate.venueId && existing.venueId === candidate.venueId) return "venue" as const;
  if (candidate.musicianId && existing.musicianId === candidate.musicianId) return "musician" as const;
  return null;
}

export function clashWith(
  existing: Commitment[],
  candidate: Commitment,
  status: "confirmed" | "pending",
  limit = DRIVE_LIMIT_HOURS,
) {
  for (const hold of existing) {
    if (hold.status !== status) continue;
    if (hold.id === candidate.id && hold.source === candidate.source) continue;
    const side = relevant(hold, candidate);
    if (!side) continue;
    if (overlaps(hold, candidate)) {
      if (separableSameDay(hold, candidate)) {
        if (side === "venue") continue;
        const hours = sameDayDriveHours(hold, candidate);
        if (hours == null) continue;
        return status === "confirmed" ? describeSameDayDrive(hold, candidate, hours) : describePending(hold);
      }
      return status === "confirmed" ? describe(hold, candidate, null, limit) : describePending(hold);
    }
    if (side === "venue") continue;
    const hours = travelProblem(hold, candidate, limit);
    if (hours == null) continue;
    if (status === "pending") return describePending(hold);
    return describe(hold, candidate, hours, limit);
  }
  return null;
}

export function candidateForBooking(
  snapshot: Pick<Snapshot, "bookings" | "openDates">,
  booking: Booking,
  status: Commitment["status"],
): Commitment | null {
  const openDate = snapshot.openDates.find((item) => item.id === booking.openDateId);
  const venue = getVenue(booking.venueId);
  if (!openDate || !venue) return null;
  const place = coordsFor(venue.citySlug);
  return {
    id: booking.id,
    source: "booking",
    status,
    date: openDate.date,
    endDate: openDate.date,
    showMinutes: minutesOf(openDate.showTime),
    citySlug: venue.citySlug,
    lat: place?.lat ?? null,
    lng: place?.lng ?? null,
    label: gigLabel(snapshot, booking),
    bandId: booking.bandId,
    venueId: booking.venueId,
    musicianId: null,
  };
}

export function candidateForApplication(
  application: Application,
  opportunity: Opportunity,
  status: Commitment["status"],
): Commitment {
  const place = coordsFor(opportunity.citySlug);
  return {
    id: application.id,
    source: "application",
    status,
    date: opportunity.startDate,
    endDate: opportunity.endDate,
    showMinutes: null,
    citySlug: opportunity.citySlug,
    lat: place?.lat ?? null,
    lng: place?.lng ?? null,
    label: `${opportunity.title} in ${opportunity.city} on ${formatDay(opportunity.startDate)}`,
    bandId: application.bandId,
    venueId: null,
    musicianId: null,
  };
}

export function candidateForFillIn(interest: Interest, listing: Listing, status: Commitment["status"]): Commitment | null {
  if (listing.kind !== "fill-in") return null;
  const musicianId = interest.fromRole === "musician" ? interest.fromId : listing.posterRole === "musician" ? listing.posterId : null;
  if (!musicianId) return null;
  const dates = datesMentioned(listing.dates);
  if (dates.length === 0) return null;
  const place = coordsFor(listing.citySlug);
  return {
    id: interest.id,
    source: "fill-in",
    status,
    date: dates[0],
    endDate: dates[dates.length - 1],
    showMinutes: null,
    citySlug: listing.citySlug,
    lat: place?.lat ?? null,
    lng: place?.lng ?? null,
    label: `${listing.title} in ${listing.city} on ${formatDay(dates[0])}`,
    bandId: null,
    venueId: null,
    musicianId,
  };
}

export function confirmedClash(snapshot: Pick<Snapshot, "bookings" | "openDates" | "applications" | "opportunities" | "interests" | "listings">, candidate: Commitment, limit = DRIVE_LIMIT_HOURS) {
  return clashWith(commitmentsFrom(snapshot), { ...candidate, status: "confirmed" }, "confirmed", limit);
}

export function pendingOverlap(snapshot: Pick<Snapshot, "bookings" | "openDates" | "applications" | "opportunities" | "interests" | "listings">, candidate: Commitment, limit = DRIVE_LIMIT_HOURS) {
  return clashWith(commitmentsFrom(snapshot), { ...candidate, status: "pending" }, "pending", limit);
}

export function competingIds(
  snapshot: Pick<Snapshot, "bookings" | "openDates" | "applications" | "opportunities" | "interests" | "listings">,
  winner: Commitment,
) {
  const bookingIds: string[] = [];
  const applicationIds: string[] = [];
  const interestIds: string[] = [];
  for (const hold of commitmentsFrom(snapshot)) {
    if (hold.status !== "pending") continue;
    if (hold.id === winner.id && hold.source === winner.source) continue;
    const side = relevant(hold, winner);
    if (!side) continue;
    const hit = overlaps(hold, winner)
      ? separableSameDay(hold, winner)
        ? side !== "venue" && sameDayDriveHours(hold, winner) != null
        : true
      : side !== "venue" && travelProblem(hold, winner, DRIVE_LIMIT_HOURS) != null;
    if (!hit) continue;
    if (hold.source === "booking") bookingIds.push(hold.id);
    if (hold.source === "application") applicationIds.push(hold.id);
    if (hold.source === "fill-in") interestIds.push(hold.id);
  }
  return { bookingIds, applicationIds, interestIds };
}

export type PlanStop = {
  openDateId: string;
  date: string;
  lat: number;
  lng: number;
  citySlug: string;
  label: string;
};

export function planBatchClash(
  snapshot: Pick<Snapshot, "bookings" | "openDates" | "applications" | "opportunities" | "interests" | "listings">,
  bandId: string,
  stops: PlanStop[],
  limit = DRIVE_LIMIT_HOURS,
) {
  const confirmed = commitmentsFrom(snapshot).filter((hold) => hold.status === "confirmed");
  const imagined: Commitment[] = [];
  for (const stop of stops) {
    const openDate = snapshot.openDates.find((item) => item.id === stop.openDateId);
    const candidate: Commitment = {
      id: `plan-${stop.openDateId}`,
      source: "booking",
      status: "confirmed",
      date: stop.date,
      endDate: stop.date,
      showMinutes: minutesOf(openDate?.showTime),
      citySlug: stop.citySlug,
      lat: stop.lat,
      lng: stop.lng,
      label: `${stop.label} on ${formatDay(stop.date)}`,
      bandId,
      venueId: openDate?.venueId ?? null,
      musicianId: null,
    };
    const againstBooked = clashWith(confirmed, candidate, "confirmed", limit);
    if (againstBooked) return againstBooked;
    const againstPlan = clashWith(imagined, candidate, "confirmed", limit);
    if (againstPlan) return againstPlan.replace("already has", "would also confirm");
    imagined.push(candidate);
  }
  return null;
}

export function lodgingClash(stays: NightStay[], incoming: Pick<NightStay, "bandId" | "date" | "status" | "stayId" | "name">) {
  if (incoming.status !== "booked") return null;
  const name = incoming.name.trim().toLowerCase();
  const taken = stays.find((stay) => {
    if (stay.bandId === incoming.bandId || stay.date !== incoming.date || stay.status !== "booked") return false;
    if (incoming.stayId && stay.stayId && stay.stayId === incoming.stayId) return true;
    return stay.name.trim().toLowerCase() === name;
  });
  if (!taken) return null;
  const band = getBand(taken.bandId);
  return `${taken.name} is already booked on ${formatDay(taken.date)}${band ? ` by ${band.name}` : ""}. Pick another room for that night.`;
}
