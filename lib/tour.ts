import { getCity, getVenue } from "@/lib/catalog";
import { addDays, dealHeadline } from "@/lib/deal";
import { driveBetween, placeForSlug } from "@/lib/geo";
import { searchLinksFor } from "@/lib/lodging";
import type { Booking, NightStay, Snapshot, StayType, Terms } from "@/lib/types";

export type GigKind = "confirmed" | "offer" | "counter" | "requested" | "off";
export type LodgingKind = "booked" | "held" | "open";

export const GIG_COLOR: Record<GigKind, string> = {
  confirmed: "#1f3d34",
  offer: "#e2a322",
  counter: "#7a3144",
  requested: "#c4492c",
  off: "#8a7e72",
};

export const GIG_LABEL: Record<GigKind, string> = {
  confirmed: "Confirmed",
  offer: "Offer pending",
  counter: "Counter pending",
  requested: "Requested",
  off: "Day off",
};

export const LODGING_LABEL: Record<LodgingKind, string> = {
  booked: "Booked",
  held: "Held",
  open: "Not arranged",
};

const GAS_PRICE = 3.6;
const MPG = 12;
const RANK: Record<string, number> = {
  accepted: 4,
  offered: 3,
  countered: 2,
  requested: 1,
};

export function gigKind(status: string): GigKind {
  if (status === "accepted") return "confirmed";
  if (status === "offered") return "offer";
  if (status === "countered") return "counter";
  if (status === "requested") return "requested";
  return "off";
}

export function guaranteeDollars(terms: Terms) {
  if (terms.dealType === "door") return 0;
  return terms.guarantee ?? 0;
}

export type TourNight = {
  id: string;
  date: string;
  city: string;
  state: string;
  citySlug: string;
  label: string;
  lat: number;
  lng: number;
  pinLat: number;
  pinLng: number;
  gig: GigKind;
  venueName: string | null;
  bookingId: string | null;
  deal: string | null;
  guarantee: number;
  loadIn: string | null;
  showTime: string | null;
  leg: { miles: number; hours: number } | null;
};

export type TourTotals = {
  confirmed: number;
  pending: number;
  lodging: number;
  heldLodging: number;
  miles: number;
  gas: number;
  net: number;
};

const emptyTotals: TourTotals = {
  confirmed: 0,
  pending: 0,
  lodging: 0,
  heldLodging: 0,
  miles: 0,
  gas: 0,
  net: 0,
};

type PlacedStop = {
  booking: Booking;
  date: string;
  citySlug: string;
  city: string;
  state: string;
  label: string;
  lat: number;
  lng: number;
  venueName: string;
  showTime: string;
};

function placedStops(snapshot: Snapshot, bandId: string) {
  const byDate = new Map<string, PlacedStop>();
  for (const booking of snapshot.bookings) {
    if (booking.bandId !== bandId || booking.status === "declined") continue;
    const openDate = snapshot.openDates.find((item) => item.id === booking.openDateId);
    const venue = getVenue(booking.venueId);
    if (!openDate || !venue) continue;
    const place = placeForSlug(venue.citySlug);
    const city = getCity(venue.citySlug);
    if (!place || !city) continue;
    const existing = byDate.get(openDate.date);
    if (existing && (RANK[existing.booking.status] ?? 0) >= (RANK[booking.status] ?? 0)) continue;
    byDate.set(openDate.date, {
      booking,
      date: openDate.date,
      citySlug: venue.citySlug,
      city: city.city,
      state: city.state,
      label: city.label,
      lat: place.lat,
      lng: place.lng,
      venueName: venue.name,
      showTime: openDate.showTime,
    });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function buildTour(snapshot: Snapshot, bandId: string) {
  const stops = placedStops(snapshot, bandId);
  if (stops.length === 0) return { nights: [] as TourNight[], totals: emptyTotals };

  const nights: TourNight[] = [];
  let cursor = stops[0].date;
  const last = stops[stops.length - 1].date;
  let previous: PlacedStop | TourNight | null = null;

  while (cursor <= last && nights.length < 45) {
    const stop = stops.find((item) => item.date === cursor);
    const city = stop ?? previous;
    if (!city) break;
    const leg = previous ? driveBetween(previous, city) : null;
    nights.push({
      id: cursor,
      date: cursor,
      city: city.city,
      state: city.state,
      citySlug: city.citySlug,
      label: "label" in city && city.label ? city.label : `${city.city}, ${city.state}`,
      lat: city.lat,
      lng: city.lng,
      pinLat: city.lat,
      pinLng: city.lng,
      gig: stop ? gigKind(stop.booking.status) : "off",
      venueName: stop?.venueName ?? null,
      bookingId: stop?.booking.id ?? null,
      deal: stop ? dealHeadline(stop.booking.terms) : null,
      guarantee: stop ? guaranteeDollars(stop.booking.terms) : 0,
      loadIn: stop?.booking.terms.loadIn ?? null,
      showTime: stop?.showTime ?? null,
      leg,
    });
    previous = nights[nights.length - 1];
    cursor = addDays(cursor, 1);
  }

  const groups = new Map<string, number[]>();
  nights.forEach((night, index) => {
    const list = groups.get(night.citySlug) ?? [];
    list.push(index);
    groups.set(night.citySlug, list);
  });
  for (const indexes of groups.values()) {
    if (indexes.length < 2) continue;
    indexes.forEach((index, order) => {
      const angle = (order / indexes.length) * Math.PI * 2 - Math.PI / 2;
      nights[index].pinLat += Math.sin(angle) * 0.06;
      nights[index].pinLng += Math.cos(angle) * 0.07;
    });
  }

  return { nights, totals: totalsFor(nights, snapshot.nightStays, bandId) };
}

function totalsFor(nights: TourNight[], stays: NightStay[], bandId: string): TourTotals {
  let confirmed = 0;
  let pending = 0;
  let miles = 0;
  for (const night of nights) {
    if (night.gig === "confirmed") confirmed += night.guarantee;
    if (night.gig === "offer" || night.gig === "counter" || night.gig === "requested") {
      pending += night.guarantee;
    }
    if (night.leg) miles += night.leg.miles;
  }
  const dates = new Set(nights.map((night) => night.date));
  const relevant = stays.filter((stay) => stay.bandId === bandId && dates.has(stay.date));
  const lodging = relevant.filter((stay) => stay.status === "booked").reduce((sum, stay) => sum + stay.cost, 0);
  const heldLodging = relevant.filter((stay) => stay.status === "held").reduce((sum, stay) => sum + stay.cost, 0);
  const gas = Math.round((miles / MPG) * GAS_PRICE);
  return {
    confirmed,
    pending,
    lodging,
    heldLodging,
    miles,
    gas,
    net: confirmed - lodging - gas,
  };
}

export function stayOn(stays: NightStay[], bandId: string, date: string) {
  return stays.find((stay) => stay.bandId === bandId && stay.date === date) ?? null;
}

export function lodgingKind(stay: NightStay | null): LodgingKind {
  if (!stay) return "open";
  return stay.status;
}

export function bookLink(type: StayType, label: string, date: string) {
  const links = searchLinksFor(label, date);
  if (type === "rental") return links[0];
  if (type === "campground") return links[2];
  if (type === "van") return links[3];
  return links[1];
}

export function sampleCost(price: string) {
  const nums = price.match(/\d+/g)?.map(Number).filter((n) => n > 0) ?? [];
  return nums[0] ?? 0;
}

export const TOUR_ASSUMPTIONS =
  "Sample budget. Drives use straight-line distance × 1.3 at 55 mph, not live traffic. Gas assumes a van at 12 mpg and $3.60 a gallon. Door-only talks count as a $0 guarantee. Marking a night booked only saves a note in this browser.";
