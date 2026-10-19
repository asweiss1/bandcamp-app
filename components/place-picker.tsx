"use client";

import { useEffect, useMemo, useState } from "react";
import { searchPlaces, type Place, type SavedPlace } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const RADII = [25, 50, 100, 150, 300];

export function PlacePicker({
  place,
  onPlace,
  radiusMiles,
  onRadius,
  label = "Your area",
}: {
  place: SavedPlace;
  onPlace: (place: SavedPlace) => void;
  radiusMiles?: number;
  onRadius?: (miles: number) => void;
  label?: string;
}) {
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [geoNote, setGeoNote] = useState("");
  const local = useMemo(() => (query.trim().length >= 2 ? searchPlaces(query) : []), [query]);
  const results = useMemo(() => {
    const seen = new Set(local.map((item) => item.label.toLowerCase()));
    const extra = remote.filter((item) => {
      const key = item.label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return [...local, ...extra].slice(0, 8);
  }, [local, remote]);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const handle = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/places?q=${encodeURIComponent(query.trim())}`);
        const data = (await response.json()) as { places?: Place[] };
        setRemote(data.places ?? []);
      } catch {
        setRemote([]);
      } finally {
        setSearching(false);
      }
    }, 600);
    return () => window.clearTimeout(handle);
  }, [query]);

  function choose(next: Place, source: SavedPlace["source"]) {
    onPlace({ ...next, source });
    setQuery("");
    setRemote([]);
    setGeoNote("");
  }

  function locate() {
    if (!navigator.geolocation) {
      setGeoNote("This browser has no location. Search for a city instead.");
      return;
    }
    setGeoNote("Checking this device…");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `/api/places?lat=${position.coords.latitude}&lng=${position.coords.longitude}`,
          );
          const data = (await response.json()) as { places?: Place[] };
          const found = data.places?.[0];
          if (!found) {
            setGeoNote("Location came back without a US town. Search for a city instead.");
            return;
          }
          choose(found, "geo");
        } catch {
          setGeoNote("The town lookup failed. Search for a city instead.");
        }
      },
      () => setGeoNote("Location is off in this browser. Search for a city instead."),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }

  const source =
    place.source === "geo" ? "This device" : place.source === "search" ? "Search" : "Sample default";

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">{label}</p>
          <h2 className="mt-1 font-display text-3xl leading-none">{place.city}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {place.label} · {source}
          </p>
        </div>
        <button
          type="button"
          onClick={locate}
          className="h-10 rounded-lg bg-ink px-3 text-sm font-medium text-cream"
        >
          Use this device
        </button>
      </div>
      <label className="mt-3 block text-sm font-medium" htmlFor={`place-${label}`}>
        Search any US city or town
      </label>
      <Input
        id={`place-${label}`}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Santa Fe, Gallup, Marfa…"
        className="mt-1 h-11"
        autoComplete="off"
      />
      {searching ? <p className="mt-2 text-xs text-muted-foreground">Checking OpenStreetMap…</p> : null}
      {geoNote ? <p className="mt-2 text-sm text-muted-foreground">{geoNote}</p> : null}
      {results.length > 0 ? (
        <ul className="mt-2 grid gap-1">
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => choose(item, "search")}
                className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-sand"
              >
                <span className="font-medium">{item.label}</span>
                <span className="text-xs text-muted-foreground">Sample list or map search</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {onRadius && radiusMiles != null ? (
        <div className="mt-3">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Radius · {radiusMiles} miles
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {RADII.map((miles) => (
              <button
                key={miles}
                type="button"
                aria-pressed={miles === radiusMiles}
                onClick={() => onRadius(miles)}
                className={cn(
                  "h-9 rounded-full px-3 text-sm font-medium",
                  miles === radiusMiles ? "bg-ink text-cream" : "bg-sand text-foreground",
                )}
              >
                {miles} mi
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
