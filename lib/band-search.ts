import { getVenue } from "@/lib/catalog";
import { milesBetween, placeForSlug } from "@/lib/geo";
import { repertoireFor } from "@/lib/repertoire";
import { SEED_TRACKS } from "@/lib/seed-tracks";
import type { Band, Snapshot } from "@/lib/types";

export type TrackTitle = { bandId: string; title: string };

export type BandQuery = {
  text: string;
  styles: string[];
  substyles: string[];
  citySlug: string;
  radius: number;
  from: string;
  to: string;
  feeMin: number | null;
  feeMax: number | null;
  originalsOnly: boolean;
  hasSamples: boolean;
};

export function searchBands(catalog: Band[], snapshot: Snapshot, uploads: TrackTitle[], query: BandQuery) {
  const titles = [
    ...SEED_TRACKS.map((track) => ({ bandId: track.bandId, title: track.title })),
    ...uploads,
  ];
  return catalog.filter((band) => matches(band, snapshot, titles, query));
}

function matches(band: Band, snapshot: Snapshot, titles: TrackTitle[], query: BandQuery) {
  const text = query.text.trim().toLowerCase();
  if (text) {
    const ownTitles = titles.filter((track) => track.bandId === band.id).map((track) => track.title);
    const haystack = [band.name, ...band.members.map((member) => member.name), ...ownTitles]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(text)) return false;
  }
  if (query.styles.length > 0) {
    const tags = new Set([...band.genres, ...band.styles]);
    if (!query.styles.some((style) => tags.has(style))) return false;
  }
  if (query.substyles.length > 0 && !query.substyles.some((style) => band.styles.includes(style))) return false;
  if (query.originalsOnly && !repertoireFor(band.id, snapshot.repertoires).originalsOnly) return false;
  if (query.hasSamples && !hasSamples(band.id, snapshot, titles)) return false;
  if (query.feeMin != null && band.feeMax < query.feeMin) return false;
  if (query.feeMax != null && band.feeMin > query.feeMax) return false;
  if (!inRange(band, snapshot, query)) return false;
  if (!nearCity(band, snapshot, query)) return false;
  return true;
}

function hasSamples(bandId: string, snapshot: Snapshot, titles: TrackTitle[]) {
  return titles.some((track) => track.bandId === bandId) || snapshot.streamLinks.some((link) => link.bandId === bandId);
}

function inRange(band: Band, snapshot: Snapshot, query: BandQuery) {
  if (!query.from && !query.to) return true;
  const from = query.from || query.to;
  const to = query.to || query.from;
  if (band.routeFrom && band.routeTo && overlaps(band.routeFrom, band.routeTo, from, to)) return true;
  return bookingsIn(band, snapshot, from, to).length > 0;
}

function nearCity(band: Band, snapshot: Snapshot, query: BandQuery) {
  if (!query.citySlug || query.citySlug === "any") return true;
  const origin = placeForSlug(query.citySlug);
  if (!origin) return true;
  const from = query.from || query.to;
  const to = query.to || query.from;
  const dated = Boolean(from && to);
  const points: { lat: number; lng: number }[] = [];
  const routeOpen = !dated || (band.routeFrom && band.routeTo && overlaps(band.routeFrom, band.routeTo, from, to));
  if (routeOpen) {
    for (const slug of [band.citySlug, ...band.routeCities]) {
      const place = placeForSlug(slug);
      if (place) points.push(place);
    }
  }
  const nights = dated ? bookingsIn(band, snapshot, from, to) : bookingCities(band, snapshot);
  for (const slug of nights) {
    const place = placeForSlug(slug);
    if (place) points.push(place);
  }
  if (!dated && points.length === 0) {
    const home = placeForSlug(band.citySlug);
    if (home) points.push(home);
  }
  if (points.length === 0) return false;
  const nearest = Math.min(...points.map((point) => milesBetween(origin, point)));
  return nearest <= query.radius;
}

function bookingsIn(band: Band, snapshot: Snapshot, from: string, to: string) {
  return bookingCities(band, snapshot, from, to);
}

function bookingCities(band: Band, snapshot: Snapshot, from?: string, to?: string) {
  const slugs: string[] = [];
  for (const booking of snapshot.bookings) {
    if (booking.bandId !== band.id || booking.status === "declined") continue;
    const openDate = snapshot.openDates.find((item) => item.id === booking.openDateId);
    if (!openDate) continue;
    if (from && to && (openDate.date < from || openDate.date > to)) continue;
    const venue = getVenue(booking.venueId);
    if (venue) slugs.push(venue.citySlug);
  }
  return slugs;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart <= bEnd && bStart <= aEnd;
}

export function bandHasSeededAudio(bandId: string) {
  return SEED_TRACKS.some((track) => track.bandId === bandId);
}
