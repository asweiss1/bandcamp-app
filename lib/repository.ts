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

export const localRepository: Repository = {
  load(fallback) {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const parsed: unknown = JSON.parse(raw);
      if (!isSnapshot(parsed)) return fallback;
      const account = isAccount(parsed.account)
        ? parsed.account
        : { phase: "ready" as const, demo: true, activeId: null, profiles: [] };
      return {
        ...parsed,
        opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : fallback.opportunities,
        applications: Array.isArray(parsed.applications) ? parsed.applications : fallback.applications,
        repertoires: normalizeRepertoires(Array.isArray(parsed.repertoires) ? parsed.repertoires : fallback.repertoires),
        streamLinks: Array.isArray(parsed.streamLinks) ? parsed.streamLinks : fallback.streamLinks,
        nightStays: Array.isArray(parsed.nightStays) ? parsed.nightStays : fallback.nightStays,
        vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles : fallback.vehicles,
        fuelOverrides: Array.isArray(parsed.fuelOverrides) ? parsed.fuelOverrides : fallback.fuelOverrides,
        bandLinks: Array.isArray(parsed.bandLinks) ? parsed.bandLinks : fallback.bandLinks,
        bills: Array.isArray(parsed.bills) ? parsed.bills : fallback.bills,
        sizes: Array.isArray(parsed.sizes) ? parsed.sizes : [],
        capacities: Array.isArray(parsed.capacities) ? parsed.capacities : [],
        media: Array.isArray(parsed.media) ? parsed.media : fallback.media,
        follows: Array.isArray(parsed.follows) ? parsed.follows : fallback.follows,
        rsvps: Array.isArray(parsed.rsvps) ? parsed.rsvps : fallback.rsvps,
        alerts: Array.isArray(parsed.alerts) ? parsed.alerts : fallback.alerts,
        reviews: Array.isArray(parsed.reviews) ? parsed.reviews : fallback.reviews,
        verifications: Array.isArray(parsed.verifications) ? parsed.verifications : fallback.verifications,
        fanId: typeof parsed.fanId === "string" && parsed.fanId ? parsed.fanId : fallback.fanId,
        openDates: parsed.openDates.map((date) => (date.daypart ? date : { ...date, daypart: daypartFor(date.showTime) })),
        account: {
          ...account,
          profiles: account.profiles.map((profile) => {
            if (!profile.band || (typeof profile.band.size === "number" && profile.band.size >= 1)) return profile;
            const count = profile.band.members.length > 0 ? profile.band.members.length : 1;
            return { ...profile, band: { ...profile.band, size: count } };
          }),
        },
      };
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
