import { placeForSlug, milesBetween } from "@/lib/geo";
import { linkedBandIds } from "@/lib/links";
import { repertoireFor } from "@/lib/repertoire";
import type { Band, BandLink, MusicKind, Repertoire } from "@/lib/types";

export const NEAR_MILES = 200;

export type SplitKind = "even" | "headliner";

export type PartnerPick = {
  bandId: string;
  miles: number;
  linked: boolean;
  music: MusicKind;
  size: number;
  overlap: string[];
  draw: number | null;
};

export function typicalDraw(draw: string): number | null {
  const nums = draw.match(/\d+/g)?.map(Number) ?? [];
  if (nums.length === 0) return null;
  if (nums.length === 1) return nums[0] ?? null;
  return Math.round(((nums[0] ?? 0) + (nums[1] ?? 0)) / 2);
}

export function combinedDraw(bands: { draw: string }[]) {
  return bands.reduce((sum, band) => sum + (typicalDraw(band.draw) ?? 0), 0);
}

export function splitPreset(count: number, preset: SplitKind): number[] | null {
  if (!Number.isInteger(count) || count < 2 || count > 4) return null;
  if (preset === "even") {
    const base = Math.floor(100 / count);
    const extra = 100 - base * count;
    return Array.from({ length: count }, (_, index) => base + (index === 0 ? extra : 0));
  }
  if (count === 2) return [70, 30];
  if (count === 3) return [50, 30, 20];
  return [50, 20, 20, 10];
}

function tags(band: Band) {
  return [...band.genres, ...band.styles];
}

function musicFits(a: MusicKind, b: MusicKind) {
  if (a === b || a === "mix" || b === "mix") return true;
  return false;
}

export function suggestPartners(input: {
  bandId: string;
  venueCitySlug: string;
  bands: Band[];
  links: BandLink[];
  repertoires: Repertoire[];
}): PartnerPick[] {
  const home = placeForSlug(input.venueCitySlug);
  const self = input.bands.find((band) => band.id === input.bandId);
  if (!home || !self) return [];
  const mine = repertoireFor(self.id, input.repertoires).music;
  const mineTags = new Set(tags(self).map((tag) => tag.toLowerCase()));
  const linked = new Set(linkedBandIds(input.links, self.id));
  const picks: PartnerPick[] = [];

  for (const band of input.bands) {
    if (band.id === self.id) continue;
    const there = placeForSlug(band.citySlug);
    if (!there) continue;
    const miles = milesBetween(home, there);
    if (miles > NEAR_MILES) continue;
    const isLinked = linked.has(band.id);
    const music = repertoireFor(band.id, input.repertoires).music;
    if (!isLinked && !musicFits(mine, music)) continue;
    const overlap = tags(band).filter((tag, index, list) => {
      const key = tag.toLowerCase();
      return mineTags.has(key) && list.findIndex((item) => item.toLowerCase() === key) === index;
    });
    if (!isLinked && overlap.length === 0) continue;
    picks.push({
      bandId: band.id,
      miles: Math.round(miles),
      linked: isLinked,
      music,
      size: band.size,
      overlap,
      draw: typicalDraw(band.draw),
    });
  }

  return picks.sort((a, b) => {
    if (a.linked !== b.linked) return a.linked ? -1 : 1;
    const overlapGap = b.overlap.length - a.overlap.length;
    if (overlapGap !== 0) return overlapGap;
    if (a.miles !== b.miles) return a.miles - b.miles;
    return a.bandId.localeCompare(b.bandId);
  });
}

function minutesOf(showTime: string) {
  const match = showTime.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  const suffix = match[3];
  if (suffix === "pm" && hour !== 12) hour += 12;
  if (suffix === "am" && hour === 12) hour = 0;
  return hour * 60 + minute;
}

function formatMinutes(total: number) {
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  let hour = Math.floor(wrapped / 60);
  const minute = wrapped % 60;
  const suffix = hour >= 12 ? "pm" : "am";
  hour %= 12;
  if (hour === 0) hour = 12;
  return `${hour}:${String(minute).padStart(2, "0")}${suffix}`;
}

export function setTimes(showTime: string, count: number) {
  const start = minutesOf(showTime);
  if (start == null) {
    return Array.from({ length: count }, () => showTime);
  }
  return Array.from({ length: count }, (_, index) => formatMinutes(start - index * 60));
}
