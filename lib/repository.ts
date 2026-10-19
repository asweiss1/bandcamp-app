import { isAccount } from "@/lib/account";
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
    (snapshot.role === "band" || snapshot.role === "venue" || snapshot.role === "musician") &&
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
      return {
        ...parsed,
        opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : fallback.opportunities,
        applications: Array.isArray(parsed.applications) ? parsed.applications : fallback.applications,
        repertoires: Array.isArray(parsed.repertoires) ? parsed.repertoires : fallback.repertoires,
        streamLinks: Array.isArray(parsed.streamLinks) ? parsed.streamLinks : fallback.streamLinks,
        nightStays: Array.isArray(parsed.nightStays) ? parsed.nightStays : fallback.nightStays,
        vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles : fallback.vehicles,
        fuelOverrides: Array.isArray(parsed.fuelOverrides) ? parsed.fuelOverrides : fallback.fuelOverrides,
        account: isAccount(parsed.account)
          ? parsed.account
          : { phase: "ready", demo: true, activeId: null, profiles: [] },
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
