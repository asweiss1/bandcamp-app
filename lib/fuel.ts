import type { FuelType, Vehicle } from "@/lib/types";

export type FuelRegion = "east" | "midwest" | "gulf" | "rockies" | "west" | "us";

export type RegionalPrices = Record<FuelRegion, number>;

export type FuelQuote = {
  source: "eia" | "sample";
  week: string;
  gas: RegionalPrices;
  diesel: RegionalPrices;
  label: string;
};

export const REGION_LABEL: Record<FuelRegion, string> = {
  east: "East Coast",
  midwest: "Midwest",
  gulf: "Gulf Coast",
  rockies: "Rocky Mountain",
  west: "West Coast",
  us: "U.S.",
};

const WEEK = "2026-10-12";

export const SAMPLE_QUOTE: FuelQuote = {
  source: "sample",
  week: WEEK,
  gas: {
    us: 4.331,
    east: 4.118,
    midwest: 4.145,
    gulf: 3.851,
    rockies: 4.439,
    west: 5.639,
  },
  diesel: {
    us: 6.179,
    east: 5.908,
    midwest: 6.259,
    gulf: 5.809,
    rockies: 6.302,
    west: 7.24,
  },
  label: "Saved EIA weekly table for the week of October 12, 2026. Not a live fetch.",
};

const WEST = new Set(["AK", "HI", "WA", "OR", "CA", "NV", "AZ"]);
const GULF = new Set(["TX", "NM", "LA", "AR", "MS", "AL"]);
const ROCKIES = new Set(["MT", "ID", "WY", "CO", "UT"]);
const MIDWEST = new Set([
  "OH",
  "IN",
  "IL",
  "MI",
  "WI",
  "MN",
  "IA",
  "MO",
  "ND",
  "SD",
  "NE",
  "KS",
  "KY",
  "TN",
  "OK",
]);
const EAST = new Set([
  "ME",
  "NH",
  "VT",
  "MA",
  "RI",
  "CT",
  "NY",
  "NJ",
  "PA",
  "DE",
  "MD",
  "DC",
  "VA",
  "WV",
  "NC",
  "SC",
  "GA",
  "FL",
]);

export function regionForState(state: string): FuelRegion {
  const code = state.trim().toUpperCase();
  if (WEST.has(code)) return "west";
  if (GULF.has(code)) return "gulf";
  if (ROCKIES.has(code)) return "rockies";
  if (MIDWEST.has(code)) return "midwest";
  if (EAST.has(code)) return "east";
  return "us";
}

export type Rig = {
  name: string;
  mpg: number;
  fuel: FuelType;
  towing: boolean;
  sample: boolean;
};

export function rigFor(vehicles: Vehicle[]): Rig {
  if (vehicles.length === 0) {
    return { name: "Sample van", mpg: 12, fuel: "gas", towing: false, sample: true };
  }
  const primary = vehicles.find((vehicle) => vehicle.vehicleType !== "trailer") ?? vehicles[0];
  const hasTrailer = vehicles.some((vehicle) => vehicle.vehicleType === "trailer");
  const towing = hasTrailer && primary.towMpg != null && primary.towMpg > 0;
  return {
    name: primary.name,
    mpg: towing ? (primary.towMpg as number) : primary.mpg,
    fuel: primary.fuel,
    towing,
    sample: false,
  };
}

export type LegFuel = {
  gallons: number;
  cost: number;
  price: number;
  suggested: number;
  region: FuelRegion;
  regionLabel: string;
  source: "override" | FuelQuote["source"];
  mpg: number;
  fuel: FuelType;
  rigName: string;
  towing: boolean;
  sampleRig: boolean;
};

export function legFuel(miles: number, mpg: number, price: number) {
  const gallons = miles > 0 && mpg > 0 ? miles / mpg : 0;
  return { gallons, cost: gallons * price };
}

export function priceDrive(
  miles: number,
  state: string,
  override: number | null,
  rig: Rig,
  quote: FuelQuote,
): LegFuel {
  const region = regionForState(state);
  const table = rig.fuel === "diesel" ? quote.diesel : quote.gas;
  const suggested = table[region];
  const usingOverride = override != null && override > 0;
  const price = usingOverride ? override : suggested;
  const { gallons, cost } = legFuel(miles, rig.mpg, price);
  return {
    gallons,
    cost,
    price,
    suggested,
    region,
    regionLabel: REGION_LABEL[region],
    source: usingOverride ? "override" : quote.source,
    mpg: rig.mpg,
    fuel: rig.fuel,
    rigName: rig.name,
    towing: rig.towing,
    sampleRig: rig.sample,
  };
}

export function gallonPrice(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(n);
}

export function formatFuelWeek(week: string) {
  const date = new Date(`${week}T00:00:00`);
  if (Number.isNaN(date.getTime())) return week;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fuelSourceLabel(source: LegFuel["source"], week: string) {
  if (source === "override") return "Your price";
  if (source === "eia") return `EIA week of ${formatFuelWeek(week)}`;
  return "Saved EIA table, not a live fetch";
}

export function fuelAssumptions(rig: Rig, quote: FuelQuote) {
  const priceNote =
    quote.source === "eia"
      ? `Prices are EIA weekly regional averages for the week of ${formatFuelWeek(quote.week)}.`
      : quote.label;
  const rigNote = rig.sample
    ? `No vehicle is listed, so this uses a sample van at ${rig.mpg} mpg ${rig.fuel}.`
    : `${rig.name} at ${rig.mpg} mpg ${rig.fuel}${rig.towing ? ", towing" : ""}.`;
  return `${priceNote} ${rigNote} Gallons are miles divided by mpg. Leave a price blank to use that stop's region.`;
}

const REGIONS: { key: FuelRegion; test: (name: string) => boolean }[] = [
  { key: "us", test: (name) => name.startsWith("U.S.") },
  { key: "east", test: (name) => name.startsWith("East Coast") },
  { key: "midwest", test: (name) => name.startsWith("Midwest") },
  { key: "gulf", test: (name) => name.startsWith("Gulf Coast") },
  { key: "rockies", test: (name) => name.startsWith("Rocky Mountain") },
  { key: "west", test: (name) => name.startsWith("West Coast") && name.includes("PADD5") && !name.includes("less California") },
];

function cellTexts(row: string) {
  return [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((match) =>
    match[1]
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function pricesFromTable(table: string): { week: string | null; prices: Partial<RegionalPrices> } {
  const head = table.match(/<thead[\s\S]*?<\/thead>/i)?.[0] ?? "";
  const dates = [...head.matchAll(/(\d{2})\/(\d{2})\/(\d{2})/g)];
  const last = dates[dates.length - 1];
  const week = last ? `20${last[3]}-${last[1]}-${last[2]}` : null;
  const prices: Partial<RegionalPrices> = {};
  const body = table.match(/<tbody[\s\S]*?<\/tbody>/i)?.[0] ?? "";
  for (const row of body.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
    const cells = cellTexts(row);
    if (cells.length < 2) continue;
    const name = cells[0];
    if (name.includes("less California")) continue;
    const region = REGIONS.find((item) => item.test(name));
    if (!region || prices[region.key] != null) continue;
    const nums = cells
      .slice(1)
      .map((cell) => cell.match(/-?\d+\.\d+/)?.[0])
      .filter((value): value is string => Boolean(value))
      .map(Number);
    const latest = nums[2];
    if (latest != null && latest > 0) prices[region.key] = latest;
  }
  return { week, prices };
}

export function parseEiaHtml(html: string): FuelQuote | null {
  const stripped = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  const tables = stripped.match(/<table[\s\S]*?<\/table>/gi) ?? [];
  let gas: Partial<RegionalPrices> | null = null;
  let diesel: Partial<RegionalPrices> | null = null;
  let week: string | null = null;
  for (const table of tables) {
    const caption = table.match(/<caption[\s\S]*?<\/caption>/i)?.[0] ?? "";
    const plain = caption.replace(/<[^>]+>/g, " ");
    const parsed = pricesFromTable(table);
    if (/Regular Gasoline/i.test(plain) && !gas) {
      gas = parsed.prices;
      week = parsed.week ?? week;
    } else if (/On-Highway Diesel/i.test(plain) && !diesel) {
      diesel = parsed.prices;
      week = week ?? parsed.week;
    }
  }
  if (!gas?.us || !diesel?.us) return null;
  const fill = (partial: Partial<RegionalPrices>, sample: RegionalPrices): RegionalPrices => ({
    us: partial.us ?? sample.us,
    east: partial.east ?? sample.east,
    midwest: partial.midwest ?? sample.midwest,
    gulf: partial.gulf ?? sample.gulf,
    rockies: partial.rockies ?? sample.rockies,
    west: partial.west ?? sample.west,
  });
  return {
    source: "eia",
    week: week ?? SAMPLE_QUOTE.week,
    gas: fill(gas, SAMPLE_QUOTE.gas),
    diesel: fill(diesel, SAMPLE_QUOTE.diesel),
    label: "EIA weekly regional averages.",
  };
}

export function isFuelQuote(value: unknown): value is FuelQuote {
  if (!value || typeof value !== "object") return false;
  const quote = value as FuelQuote;
  if (quote.source !== "eia" && quote.source !== "sample") return false;
  if (typeof quote.week !== "string" || typeof quote.label !== "string") return false;
  for (const table of [quote.gas, quote.diesel]) {
    if (!table) return false;
    for (const key of ["us", "east", "midwest", "gulf", "rockies", "west"] as const) {
      if (typeof table[key] !== "number" || !(table[key] > 0)) return false;
    }
  }
  return true;
}
