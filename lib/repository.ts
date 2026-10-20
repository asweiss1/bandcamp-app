import { isAccount } from "@/lib/account";
import { daypartFor } from "@/lib/daypart";
import { normalizeRepertoires } from "@/lib/repertoire";
import type { Snapshot } from "@/lib/types";

/**
 * Persistence seam for BandCamp.
 *
 * The prototype ships a LocalRepository that reads seeded data and writes
 * mutations to localStorage. Pages should not touch storage themselves.
 * A production client can replace LocalRepository with fetch calls that
 * honor the same Snapshot shape (bookings, open dates, listings, interests,
 * and account.profiles) while auth and payments live on the server.
 * account.profiles is the local stand-in for a signed-in user.
 */
export interface Repository {
  load(fallback: Snapshot): Snapshot;
  save(snapshot: Snapshot): void;
  clear(): void;
}

const STORAGE_KEY = "bandcamp.prototype.v1";

function isSnapshot(value: unknown): value is Snapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Snapshot;
  return (
    (snapshot.role === "band" || snapshot.role === "venue" || snapshot.role === "musician" || snapshot.role === "fan") &&
    typeof snapshot.bandId === "string" &&
    typeof snapshot.venueId === "string" &&
    typeof snapshot.musicianId === "string" &&
    Array.isArray(snapshot.openDates) &&
    Array.isArray(snapshot.bookings) &&
    Array.isArray(snapshot.listings) &&
    Array.isArray(snapshot.interests)
  );
}

export function coerceSnapshot(value: unknown, fallback: Snapshot): Snapshot | null {
  if (!isSnapshot(value)) return null;
  const account = isAccount(value.account)
    ? value.account
    : { phase: "ready" as const, demo: true, activeId: null, profiles: [] };
  return {
    ...value,
    opportunities: Array.isArray(value.opportunities) ? value.opportunities : fallback.opportunities,
    applications: Array.isArray(value.applications) ? value.applications : fallback.applications,
    repertoires: normalizeRepertoires(Array.isArray(value.repertoires) ? value.repertoires : fallback.repertoires),
    streamLinks: Array.isArray(value.streamLinks) ? value.streamLinks : fallback.streamLinks,
    nightStays: Array.isArray(value.nightStays) ? value.nightStays : fallback.nightStays,
    vehicles: Array.isArray(value.vehicles) ? value.vehicles : fallback.vehicles,
    fuelOverrides: Array.isArray(value.fuelOverrides) ? value.fuelOverrides : fallback.fuelOverrides,
    bandLinks: Array.isArray(value.bandLinks) ? value.bandLinks : fallback.bandLinks,
    bills: Array.isArray(value.bills) ? value.bills : fallback.bills,
    sizes: Array.isArray(value.sizes) ? value.sizes : [],
    capacities: Array.isArray(value.capacities) ? value.capacities : [],
    media: Array.isArray(value.media) ? value.media : fallback.media,
    follows: Array.isArray(value.follows) ? value.follows : fallback.follows,
    rsvps: Array.isArray(value.rsvps) ? value.rsvps : fallback.rsvps,
    alerts: Array.isArray(value.alerts) ? value.alerts : fallback.alerts,
    reviews: Array.isArray(value.reviews) ? value.reviews : fallback.reviews,
    verifications: Array.isArray(value.verifications) ? value.verifications : fallback.verifications,
    pitches: Array.isArray(value.pitches) ? value.pitches : fallback.pitches,
    peerReviews: Array.isArray(value.peerReviews) ? value.peerReviews : fallback.peerReviews,
    threads: Array.isArray(value.threads) ? value.threads : fallback.threads,
    messages: Array.isArray(value.messages) ? value.messages : fallback.messages,
    reads: Array.isArray(value.reads) ? value.reads : fallback.reads,
    fanMail: Array.isArray(value.fanMail) ? value.fanMail : fallback.fanMail,
    fanBlocks: Array.isArray(value.fanBlocks) ? value.fanBlocks : fallback.fanBlocks,
    fanId: typeof value.fanId === "string" && value.fanId ? value.fanId : fallback.fanId,
    openDates: value.openDates.map((date) => (date.daypart ? date : { ...date, daypart: daypartFor(date.showTime) })),
    account: {
      ...account,
      profiles: account.profiles.map((profile) => {
        if (!profile.band || (typeof profile.band.size === "number" && profile.band.size >= 1)) return profile;
        const count = profile.band.members.length > 0 ? profile.band.members.length : 1;
        return { ...profile, band: { ...profile.band, size: count } };
      }),
    },
  };
}

export const localRepository: Repository = {
  load(fallback) {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      return coerceSnapshot(JSON.parse(raw) as unknown, fallback) ?? fallback;
    } catch {
      return fallback;
    }
  },
  save(snapshot) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  },
};
