import type { Repertoire } from "@/lib/types";

export const ORIGINALS_INFO =
  "An all-original set can help a room with ASCAP, BMI, SESAC, and GMR fees. Venues often hold blanket licenses anyway. This is not legal advice.";

export function repertoireFor(bandId: string, list: Repertoire[] | undefined): Repertoire {
  return (
    list?.find((item) => item.bandId === bandId) ?? {
      bandId,
      originalsOnly: false,
      coversNote: "",
      rightsAttested: false,
    }
  );
}
