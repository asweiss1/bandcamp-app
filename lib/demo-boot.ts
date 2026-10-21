import { initialSnapshot } from "@/lib/seed";
import { SNAPSHOT_KEY } from "@/lib/storage-key";
import type { Snapshot } from "@/lib/types";

export function demoSnapshot(): Snapshot {
  return {
    ...initialSnapshot,
    account: { phase: "ready", demo: true, activeId: null, profiles: [] },
    role: "band",
    bandId: "mesa-dust",
    venueId: "high-country",
    musicianId: "lena-ortiz",
    fanId: "avery-quinn",
  };
}

export function startDemo() {
  window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(demoSnapshot()));
  document.cookie = "bandcamp-phase=ready; Path=/; Max-Age=31536000; SameSite=Lax";
}
