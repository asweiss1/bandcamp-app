import type { BandLink } from "@/lib/types";

export function pairLinks(links: BandLink[], a: string, b: string) {
  return links.filter(
    (link) =>
      link.status !== "declined" &&
      ((link.fromBandId === a && link.toBandId === b) ||
        (link.fromBandId === b && link.toBandId === a)),
  );
}

export function tuneOutLink(links: BandLink[], bandId: string, otherId: string) {
  const link = links.find(
    (item) =>
      item.status === "accepted" &&
      ((item.fromBandId === bandId && item.toBandId === otherId) ||
        (item.fromBandId === otherId && item.toBandId === bandId)),
  );
  if (!link) return { ok: false as const, error: "You are not tuned in with that band." };
  return {
    ok: true as const,
    links: links.map((item) => (item.id === link.id ? { ...item, status: "declined" as const } : item)),
  };
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
