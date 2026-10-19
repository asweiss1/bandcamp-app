import { NextResponse } from "next/server";
import { placeFromNominatim } from "@/lib/geo";

const USER_AGENT = "BandCampPrototype/0.1 (local demo; city search)";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");

  try {
    if (lat && lng) {
      const endpoint = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
      const response = await fetch(endpoint, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        next: { revalidate: 3600 },
      });
      if (!response.ok) return NextResponse.json({ places: [] });
      const data: unknown = await response.json();
      const place = placeFromNominatim(data as Parameters<typeof placeFromNominatim>[0]);
      return NextResponse.json({ places: place ? [place] : [] });
    }

    if (query.length < 2) return NextResponse.json({ places: [] });
    const endpoint = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=us&limit=5&q=${encodeURIComponent(query)}`;
    const response = await fetch(endpoint, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (!response.ok) return NextResponse.json({ places: [] });
    const data: unknown = await response.json();
    const places: ReturnType<typeof placeFromNominatim>[] = [];
    const seen = new Set<string>();
    for (const item of Array.isArray(data) ? data : []) {
      const place = placeFromNominatim(item as Parameters<typeof placeFromNominatim>[0]);
      if (!place) continue;
      const key = place.label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      places.push(place);
      if (places.length === 5) break;
    }
    return NextResponse.json({ places });
  } catch {
    return NextResponse.json({ places: [] });
  }
}
