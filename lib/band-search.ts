import { getVenue } from "@/lib/catalog";
import { milesBetween, placeForSlug } from "@/lib/geo";
import { bandRating } from "@/lib/pitch";
import { repertoireFor } from "@/lib/repertoire";
import { bandSize } from "@/lib/size";
import { SEED_TRACKS } from "@/lib/seed-tracks";
import { isVerified, verificationFor } from "@/lib/trust";
import type { Band, MusicKind, Snapshot } from "@/lib/types";

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
  music: "any" | MusicKind;
  sizeMin: number | null;
  sizeMax: number | null;
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
  if (query.music !== "any" && repertoireFor(band.id, snapshot.repertoires).music !== query.music) return false;
  const pieces = bandSize(band, snapshot.sizes);
  if (query.sizeMin != null && pieces < query.sizeMin) return false;
  if (query.sizeMax != null && pieces > query.sizeMax) return false;
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

export type BandSort = "distance" | "rating" | "active";

export type FindQuery = {
  name: string;
  styles: string[];
  styleText: string;
  origin: { lat: number; lng: number } | null;
  radius: number;
  sizeMin: number | null;
  sizeMax: number | null;
  music: "any" | MusicKind;
  verified: boolean;
  hasSamples: boolean;
  availableOn: string;
  sort: BandSort;
  excludeId?: string;
};

export type FoundBand = {
  band: Band;
  miles: number | null;
  rating: number | null;
  ratingLabel: string;
  verified: boolean;
  size: number;
  music: MusicKind;
  activeAt: string;
};

export function findBands(catalog: Band[], snapshot: Snapshot, uploads: TrackTitle[], query: FindQuery): FoundBand[] {
  const titles = [
    ...SEED_TRACKS.map((track) => ({ bandId: track.bandId, title: track.title })),
    ...uploads,
  ];
  const rows = catalog.flatMap((band) => {
    if (query.excludeId && band.id === query.excludeId) return [];
    const found = matchFind(band, snapshot, titles, query);
    return found ? [found] : [];
  });
  rows.sort((a, b) => compareFound(a, b, query.sort));
  return rows;
}

function matchFind(band: Band, snapshot: Snapshot, titles: TrackTitle[], query: FindQuery): FoundBand | null {
  const name = query.name.trim().toLowerCase();
  if (name) {
    const songs = titles.filter((track) => track.bandId === band.id).map((track) => track.title);
    const haystack = [band.name, ...band.members.map((member) => member.name), ...songs].join(" ").toLowerCase();
    if (!haystack.includes(name)) return null;
  }
  const tags = [...band.genres, ...band.styles];
  if (query.styles.length > 0 && !query.styles.some((style) => tags.includes(style))) return null;
  const typed = query.styleText.trim().toLowerCase();
  if (typed && !tags.some((tag) => tag.toLowerCase().includes(typed))) return null;
  const music = repertoireFor(band.id, snapshot.repertoires).music;
  if (query.music !== "any" && music !== query.music) return null;
  const size = bandSize(band, snapshot.sizes);
  if (query.sizeMin != null && size < query.sizeMin) return null;
  if (query.sizeMax != null && size > query.sizeMax) return null;
  const verified = isVerified("band", verificationFor(snapshot.verifications, band.id));
  if (query.verified && !verified) return null;
  if (query.hasSamples && !hasSamples(band.id, snapshot, titles)) return null;
  if (query.availableOn && bookedOn(snapshot, band.id, query.availableOn)) return null;
  const home = placeForSlug(band.citySlug);
  const miles =
    query.origin && home ? Math.round(milesBetween(query.origin, home)) : null;
  if (query.origin && (miles == null || miles > query.radius)) return null;
  const rating = bandRating(snapshot, band.id);
  return {
    band,
    miles,
    rating: rating.score,
    ratingLabel: rating.label,
    verified,
    size,
    music,
    activeAt: lastActive(snapshot, band.id),
  };
}

function bookedOn(snapshot: Snapshot, bandId: string, date: string) {
  return snapshot.bookings.some((booking) => {
    if (booking.status !== "accepted") return false;
    const openDate = snapshot.openDates.find((item) => item.id === booking.openDateId);
    if (!openDate || openDate.date !== date) return false;
    if (booking.bandId === bandId) return true;
    const bill = booking.billId ? snapshot.bills.find((item) => item.id === booking.billId) : undefined;
    return bill?.members.some((member) => member.bandId === bandId) ?? false;
  });
}

function lastActive(snapshot: Snapshot, bandId: string) {
  const times: string[] = [];
  for (const booking of snapshot.bookings) {
    const bill = booking.billId ? snapshot.bills.find((item) => item.id === booking.billId) : undefined;
    const onBand = booking.bandId === bandId || Boolean(bill?.members.some((member) => member.bandId === bandId));
    if (!onBand) continue;
    times.push(booking.createdAt);
    for (const event of booking.events) times.push(event.at);
  }
  for (const bill of snapshot.bills) {
    if (bill.members.some((member) => member.bandId === bandId)) times.push(bill.createdAt);
  }
  for (const pitch of snapshot.pitches) {
    if (!pitch.members.some((member) => member.bandId === bandId)) continue;
    times.push(pitch.createdAt);
    for (const message of pitch.messages) times.push(message.createdAt);
  }
  for (const thread of snapshot.threads) {
    if (!thread.parties.some((party) => party.role === "band" && party.id === bandId)) continue;
    times.push(thread.createdAt);
    for (const message of snapshot.messages) {
      if (message.threadId === thread.id) times.push(message.createdAt);
    }
  }
  for (const link of snapshot.bandLinks) {
    if (link.fromBandId === bandId || link.toBandId === bandId) times.push(link.createdAt);
  }
  return times.sort().at(-1) ?? "";
}

function compareFound(a: FoundBand, b: FoundBand, sort: BandSort) {
  if (sort === "rating") {
    const diff = (b.rating ?? -1) - (a.rating ?? -1);
    if (diff !== 0) return diff;
  } else if (sort === "active") {
    const diff = b.activeAt.localeCompare(a.activeAt);
    if (diff !== 0) return diff;
  } else {
    const left = a.miles ?? Number.POSITIVE_INFINITY;
    const right = b.miles ?? Number.POSITIVE_INFINITY;
    if (left !== right) return left - right;
  }
  return a.band.name.localeCompare(b.band.name);
}
