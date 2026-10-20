import { minutesOf } from "@/lib/conflicts";
import type { Daypart } from "@/lib/types";

export const DAYPARTS: { id: Daypart; label: string; time: string }[] = [
  { id: "brunch", label: "Brunch", time: "11:00am" },
  { id: "afternoon", label: "Afternoon", time: "2:00pm" },
  { id: "evening", label: "Evening", time: "8:00pm" },
  { id: "late", label: "Late", time: "10:30pm" },
];

export function daypartFor(showTime: string): Daypart {
  const minutes = minutesOf(showTime);
  if (minutes == null) return "evening";
  if (minutes < 12 * 60) return "brunch";
  if (minutes < 17 * 60) return "afternoon";
  if (minutes < 21 * 60) return "evening";
  return "late";
}

export function daypartLabel(daypart: Daypart) {
  return DAYPARTS.find((item) => item.id === daypart)?.label ?? "Evening";
}

export function slotLine(showTime: string, daypart: Daypart) {
  return `${daypartLabel(daypart)} · ${showTime}`;
}
