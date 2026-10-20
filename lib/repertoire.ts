import type { MusicKind, Repertoire } from "@/lib/types";

export const ORIGINALS_INFO =
  "An all-original set can help a room with ASCAP, BMI, SESAC, and GMR fees. Venues often hold blanket licenses anyway. This is not legal advice.";

export const MUSIC_LABEL: Record<MusicKind, string> = {
  covers: "Covers",
  originals: "Originals",
  mix: "Mix",
};

export function musicFromStored(raw: unknown): MusicKind {
  if (!raw || typeof raw !== "object") return "mix";
  const row = raw as { music?: unknown; originalsOnly?: unknown; coversNote?: unknown };
  if (row.music === "covers" || row.music === "originals" || row.music === "mix") return row.music;
  if (row.originalsOnly === true) return "originals";
  if (row.originalsOnly === false && typeof row.coversNote === "string" && row.coversNote.trim()) return "mix";
  if (row.originalsOnly === false) return "covers";
  return "mix";
}

export function repertoireFor(bandId: string, list: Repertoire[] | undefined): Repertoire {
  const found = list?.find((item) => item.bandId === bandId);
  if (!found) return { bandId, music: "mix" };
  return { bandId, music: musicFromStored(found) };
}

export function normalizeRepertoires(list: unknown): Repertoire[] {
  if (!Array.isArray(list)) return [];
  return list.flatMap((item) => {
    if (!item || typeof item !== "object" || typeof (item as { bandId?: unknown }).bandId !== "string") return [];
    const bandId = (item as { bandId: string }).bandId;
    return [{ bandId, music: musicFromStored(item) }];
  });
}
