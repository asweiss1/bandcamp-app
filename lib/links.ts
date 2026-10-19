import type { BandLink } from "@/lib/types";

export function pairLinks(links: BandLink[], a: string, b: string) {
  return links.filter(
    (link) =>
      link.status !== "declined" &&
      ((link.fromBandId === a && link.toBandId === b) ||
        (link.fromBandId === b && link.toBandId === a)),
  );
}

export function linkedBandIds(links: BandLink[], bandId: string) {
  const ids = new Set<string>();
  for (const link of links) {
    if (link.status !== "accepted") continue;
    if (link.fromBandId === bandId) ids.add(link.toBandId);
    if (link.toBandId === bandId) ids.add(link.fromBandId);
  }
  return [...ids];
}
