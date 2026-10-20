"use client";

import { shownCapacity } from "@/lib/capacity";
import { getBand, getVenue } from "@/lib/catalog";
import { MUSIC_LABEL, repertoireFor } from "@/lib/repertoire";
import { bandSize } from "@/lib/size";
import { useApp } from "@/lib/store";
import { sizeFit } from "@/lib/trust";
import { cn } from "@/lib/utils";

export function FitFacts({ bandId, venueId }: { bandId: string; venueId: string }) {
  const { snapshot } = useApp();
  const band = getBand(bandId);
  const venue = getVenue(venueId);
  if (!band || !venue) return null;
  const capacity = shownCapacity(venue, snapshot.capacities);
  const pieces = bandSize(band, snapshot.sizes);
  const fit = sizeFit(pieces, capacity);
  const music = MUSIC_LABEL[repertoireFor(band.id, snapshot.repertoires).music];

  return (
    <dl className="mt-4 grid gap-2 sm:grid-cols-3">
      <Fact label="Capacity" value={`${capacity} capacity`} />
      <Fact label="Size fit" value={fit.line} tone={fit.ok ? "ok" : "tight"} />
      <Fact label="Originals / covers" value={music} />
    </dl>
  );
}

function Fact({ label, value, tone = "ok" }: { label: string; value: string; tone?: "ok" | "tight" }) {
  return (
    <div className={cn("rounded-2xl border bg-card px-3 py-3", tone === "tight" && "border-amber/60")}>
      <dt className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 text-sm leading-snug">{value}</dd>
    </div>
  );
}
