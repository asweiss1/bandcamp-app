"use client";

import { getBand } from "@/lib/catalog";
import { combinedDraw, typicalDraw } from "@/lib/full-night";
import type { Band } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FullBillMark() {
  return (
    <span className="rounded-full bg-amber/30 px-2.5 py-1 text-xs font-semibold text-ink">
      Looking for a full bill
    </span>
  );
}

export function FullBillField({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl border bg-card px-3 py-3 text-sm">
      <input
        type="checkbox"
        className="mt-1 size-4 accent-rust"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <span className="font-medium">Looking for a full bill</span>
        <span className="mt-1 block text-muted-foreground">
          One offer from a few bands can fill the night. Small bands pool their crowds.
        </span>
      </span>
    </label>
  );
}

export function TypicalDraw({ bandIds, className }: { bandIds: string[]; className?: string }) {
  const bands = bandIds.map((id) => getBand(id)).filter((band): band is Band => Boolean(band));
  const total = combinedDraw(bands);
  if (total <= 0) return null;
  const parts = bands
    .map((band) => {
      const draw = typicalDraw(band.draw);
      return draw == null ? null : `${band.name} ~${draw.toLocaleString()}`;
    })
    .filter((part): part is string => Boolean(part));
  return (
    <p className={cn("text-sm leading-relaxed", className)}>
      <span className="font-semibold">Typical draw about {total.toLocaleString()}.</span> {parts.join(", ")}. That is
      each band&apos;s usual crowd, added together.
    </p>
  );
}
