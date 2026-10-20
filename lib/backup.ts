import type { SavedPlace } from "@/lib/geo";
import { isOutboxItem, type OutboxItem } from "@/lib/outbox";
import { coerceSnapshot } from "@/lib/repository";
import type { Snapshot } from "@/lib/types";

export const BACKUP_VERSION = 1;

export type PlaceBackup = {
  place: SavedPlace;
  radiusMiles: number;
  lodging: "camp" | "cheap" | "hotel";
  plan: unknown;
};

export type BackupFile = {
  version: 1;
  exportedAt: string;
  snapshot: Snapshot;
  place: PlaceBackup | null;
  outbox: OutboxItem[];
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export function demoReset(current: Snapshot, seed: Snapshot): Snapshot {
  const ownedIds = new Set(current.account.profiles.map((profile) => profile.id));
  const exploring = current.account.demo || ownedIds.size === 0;
  if (exploring) {
    return {
      ...seed,
      account: {
        phase: "ready",
        demo: true,
        activeId: null,
        profiles: current.account.profiles,
      },
    };
  }
  return {
    ...seed,
    account: { ...current.account, phase: "ready" },
    role: current.role,
    bandId: current.bandId,
    venueId: current.venueId,
    musicianId: current.musicianId,
    fanId: current.fanId,
    vehicles: [...seed.vehicles, ...current.vehicles.filter((vehicle) => ownedIds.has(vehicle.bandId))],
    streamLinks: [...seed.streamLinks, ...current.streamLinks.filter((link) => ownedIds.has(link.bandId))],
    repertoires: [...seed.repertoires, ...current.repertoires.filter((item) => ownedIds.has(item.bandId))],
    openDates: [...seed.openDates, ...current.openDates.filter((date) => ownedIds.has(date.venueId))],
    nightStays: [...seed.nightStays, ...current.nightStays.filter((stay) => ownedIds.has(stay.bandId))],
    fuelOverrides: current.fuelOverrides.filter((item) => ownedIds.has(item.bandId)),
  };
}

export function buildBackup(input: {
  snapshot: Snapshot;
  place: PlaceBackup | null;
  outbox: OutboxItem[];
  exportedAt: string;
}): BackupFile {
  return {
    version: BACKUP_VERSION,
    exportedAt: input.exportedAt,
    snapshot: input.snapshot,
    place: input.place,
    outbox: input.outbox,
  };
}

function parsePlace(value: unknown): PlaceBackup | null {
  if (!value || typeof value !== "object") return null;
  const state = value as PlaceBackup;
  if (!state.place || typeof state.place.lat !== "number" || typeof state.place.lng !== "number") return null;
  if (typeof state.place.city !== "string" || typeof state.radiusMiles !== "number") return null;
  const lodging = state.lodging === "camp" || state.lodging === "cheap" || state.lodging === "hotel" ? state.lodging : "cheap";
  const source = state.place.source === "sample" || state.place.source === "geo" || state.place.source === "search" ? state.place.source : "search";
  const plan = state.plan && typeof state.plan === "object" && Array.isArray((state.plan as { nights?: unknown }).nights) ? state.plan : null;
  return {
    place: { ...state.place, source },
    radiusMiles: state.radiusMiles,
    lodging,
    plan,
  };
}

export function parseBackup(raw: string, fallback: Snapshot): Result<BackupFile> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "That file is not a BandCamp backup." };
  }
  if (!parsed || typeof parsed !== "object") return { ok: false, error: "That file is not a BandCamp backup." };
  const record = parsed as Record<string, unknown>;
  if (record.version !== BACKUP_VERSION || !("snapshot" in record)) {
    return { ok: false, error: "That file is not a BandCamp backup." };
  }
  const snapshot = coerceSnapshot(record.snapshot, fallback);
  if (!snapshot) return { ok: false, error: "That file is not a BandCamp backup." };
  const outbox = Array.isArray(record.outbox) ? record.outbox.filter(isOutboxItem) : [];
  return {
    ok: true,
    data: {
      version: BACKUP_VERSION,
      exportedAt: typeof record.exportedAt === "string" ? record.exportedAt : "",
      snapshot,
      place: parsePlace(record.place),
      outbox,
    },
  };
}
