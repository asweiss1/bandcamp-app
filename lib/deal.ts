import type { DealType, Terms } from "@/lib/types";

export const DEAL_OPTIONS: { id: DealType; label: string; hint: string }[] = [
  {
    id: "guarantee",
    label: "Guarantee",
    hint: "A flat fee, paid regardless of the door.",
  },
  {
    id: "door",
    label: "Door split",
    hint: "The band's share of ticket money.",
  },
  {
    id: "guarantee_plus",
    label: "Guarantee + %",
    hint: "A floor, then a cut of the door on top.",
  },
];

export function defaultTerms(partial?: Partial<Terms>): Terms {
  return {
    dealType: "guarantee",
    guarantee: 800,
    doorSplitBand: 70,
    ticketPrice: 15,
    backline: true,
    loadIn: "16:00",
    note: "",
    ...partial,
  };
}

export function money(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(y, m - 1, d));
}

export function formatDayLong(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

export function monthParts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    month: new Intl.DateTimeFormat("en-US", { month: "short" })
      .format(date)
      .toUpperCase(),
    day: String(d),
    weekday: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date),
  };
}

export function formatWhen(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatTime(hhmm: string) {
  const [hRaw, minRaw] = hhmm.split(":");
  const h = Number(hRaw);
  const min = Number(minRaw);
  if (Number.isNaN(h) || Number.isNaN(min)) return hhmm;
  const ampm = h >= 12 ? "pm" : "am";
  const hr = h % 12 || 12;
  return `${hr}:${String(min).padStart(2, "0")}${ampm}`;
}

export function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export function dealHeadline(t: Terms) {
  if (t.dealType === "guarantee") return `${money(t.guarantee)} guarantee`;
  if (t.dealType === "door") {
    return `${t.doorSplitBand ?? "—"}% of the door`;
  }
  return `${money(t.guarantee)} + ${t.doorSplitBand ?? "—"}% of the door`;
}

export function dealDetails(t: Terms) {
  const bits = [
    t.ticketPrice ? `Tickets ${money(t.ticketPrice)}` : "Ticket price unset",
    t.backline ? "Backline in house" : "No backline",
    t.loadIn ? `Load-in ${formatTime(t.loadIn)}` : "Load-in unset",
  ];
  return bits;
}

export function termsError(t: Terms): string | null {
  if (
    (t.dealType === "guarantee" || t.dealType === "guarantee_plus") &&
    (t.guarantee == null || t.guarantee <= 0)
  ) {
    return "Add a guarantee greater than zero.";
  }
  if (
    (t.dealType === "door" || t.dealType === "guarantee_plus") &&
    (t.doorSplitBand == null || t.doorSplitBand < 0 || t.doorSplitBand > 100)
  ) {
    return "Set the band's door share between 0 and 100.";
  }
  if (!t.loadIn) return "Add a load-in time.";
  return null;
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}
