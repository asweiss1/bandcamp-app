import type { BandSize } from "@/lib/types";

export function sizeLabel(size: number) {
  const count = Math.max(1, Math.round(size));
  if (count === 1) return "Solo";
  if (count === 2) return "Duo";
  if (count === 3) return "Trio";
  if (count === 4) return "4-piece";
  return `${count}-piece`;
}

export function bandSize(
  band: { id: string; size?: number; members?: { name: string }[] },
  overrides?: BandSize[],
) {
  const hit = overrides?.find((item) => item.bandId === band.id);
  if (hit && hit.size >= 1) return Math.round(hit.size);
  if (typeof band.size === "number" && band.size >= 1) return Math.round(band.size);
  if (band.members && band.members.length > 0) return band.members.length;
  return 1;
}

export const SIZE_PRESETS: { id: string; label: string; min: number; max: number | null }[] = [
  { id: "solo", label: "Solo", min: 1, max: 1 },
  { id: "duo", label: "Duo", min: 2, max: 2 },
  { id: "trio", label: "Trio", min: 3, max: 3 },
  { id: "four", label: "4-piece", min: 4, max: 4 },
  { id: "five", label: "5+", min: 5, max: null },
];
