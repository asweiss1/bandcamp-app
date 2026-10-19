import { NextResponse } from "next/server";
import { parseEiaHtml, SAMPLE_QUOTE, type FuelQuote } from "@/lib/fuel";

const USER_AGENT = "BandCampPrototype/0.1 (local demo; EIA weekly fuel prices)";
const EIA_URL = "https://www.eia.gov/petroleum/gasdiesel/";
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

let cached: { at: number; quote: FuelQuote } | null = null;

export async function GET() {
  if (cached && Date.now() - cached.at < MAX_AGE_MS) {
    return NextResponse.json(cached.quote);
  }
  try {
    const response = await fetch(EIA_URL, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json(SAMPLE_QUOTE);
    const html = await response.text();
    const quote = parseEiaHtml(html) ?? SAMPLE_QUOTE;
    if (quote.source === "eia") cached = { at: Date.now(), quote };
    return NextResponse.json(quote);
  } catch {
    return NextResponse.json(SAMPLE_QUOTE);
  }
}
