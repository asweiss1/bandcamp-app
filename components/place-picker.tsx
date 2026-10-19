"use client";

import { cn } from "@/lib/utils";
import type { SavedPlace } from "@/lib/geo";
import { HometownField } from "@/components/hometown-field";

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
  const source = place.source === "geo" ? "This device" : place.source === "search" ? "Search" : "Sample default";

  return (
    <section className="rounded-2xl border bg-card p-4">
      <HometownField label={label} place={place} onPlace={onPlace} />
      <p className="text-sm text-muted-foreground">
        {place.label} · {source}
      </p>
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
                  "h-11 rounded-full px-3 text-sm font-medium",
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
