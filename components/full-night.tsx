"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getBand, getVenue, listBands } from "@/lib/catalog";
import { defaultTerms } from "@/lib/deal";
import {
  combinedDraw,
  setTimes,
  splitPreset,
  suggestPartners,
  typicalDraw,
  type SplitKind,
} from "@/lib/full-night";
import { MUSIC_LABEL } from "@/lib/repertoire";
import { sizeLabel } from "@/lib/size";
import { activeBooking } from "@/lib/queries";
import { useApp } from "@/lib/store";
import type { Band } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

export function PitchTogether({
  openDateId,
  venueId,
  showTime,
  surface,
}: {
  openDateId: string;
  venueId: string;
  showTime: string;
  surface: "desk" | "phone";
}) {
  const router = useRouter();
  const { snapshot, saveBill, pitchBill } = useApp();
  const venue = getVenue(venueId);
  const band = snapshot.role === "band" ? getBand(snapshot.bandId) : undefined;
  const suggestions = useMemo(() => {
    if (!band || !venue) return [];
    return suggestPartners({
      bandId: band.id,
      venueCitySlug: venue.citySlug,
      bands: listBands(),
      links: snapshot.bandLinks,
      repertoires: snapshot.repertoires,
    });
  }, [band, venue, snapshot.bandLinks, snapshot.repertoires]);
  const [picked, setPicked] = useState<string[] | null>(null);
  const [preset, setPreset] = useState<SplitKind>("headliner");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!band || !venue || snapshot.role !== "band") return null;
  const selected = (picked ?? (suggestions[0] ? [suggestions[0].bandId] : [])).filter((id) =>
    suggestions.some((item) => item.bandId === id),
  );
  const lineup = [band, ...selected.map((id) => getBand(id)).filter((item): item is Band => Boolean(item))];
  const splits = splitPreset(lineup.length, preset);
  const total = combinedDraw(lineup);
  const mine = activeBooking(openDateId, band.id, snapshot.bookings);
  const bookingHref = mine ? (surface === "phone" ? `/phone/gig/${mine.id}` : `/bookings/${mine.id}`) : null;

  function toggle(id: string) {
    const current = selected;
    if (current.includes(id)) {
      setPicked(current.filter((item) => item !== id));
      return;
    }
    if (current.length >= 3) return;
    setPicked([...current, id]);
  }

  function pitch() {
    if (!splits || lineup.length < 2) {
      setError("Pick at least one band to share the night.");
      return;
    }
    setPending(true);
    const times = setTimes(showTime, lineup.length);
    const saved = saveBill({
      name: `${venue!.name} full night`,
      members: lineup.map((item, index) => ({
        bandId: item.id,
        role: index === 0 ? "Headliner" : "Opener",
        setTime: times[index] ?? showTime,
        splitPercent: splits[index] ?? 1,
      })),
    });
    if (!saved.ok) {
      setPending(false);
      setError(saved.error);
      return;
    }
    const guarantee = lineup.reduce((sum, item) => sum + Math.round((item.feeMin + item.feeMax) / 2), 0);
    const sent = pitchBill(
      saved.data,
      openDateId,
      defaultTerms({
        guarantee,
        note: "One offer for the whole night. We are pooling our crowds.",
      }),
    );
    setPending(false);
    if (!sent.ok) {
      setError(sent.error);
      return;
    }
    toast(sent.warning ?? "Pitched the full night");
    router.push(surface === "phone" ? `/phone/gig/${sent.data}` : `/bookings/${sent.data}`);
  }

  return (
    <section id="full-night" className="mt-5 rounded-2xl border bg-card p-4">
      <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Build a full night</p>
      <h2 className="mt-1 font-display text-2xl">Pitch the night together</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        One offer fills this room. These bands are close, and the style, size, and originals or covers line up.
        {venue ? ` ${band.name} headlines.` : ""}
      </p>
      {suggestions.length === 0 ? (
        <p className="mt-3 text-sm">No linked or compatible bands within {200} miles of {venue.city}.</p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {suggestions.map((pick) => {
            const other = getBand(pick.bandId);
            if (!other) return null;
            const on = selected.includes(pick.bandId);
            return (
              <li key={pick.bandId}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(pick.bandId)}
                  className={cn(
                    "grid w-full gap-1 rounded-xl border px-3 py-3 text-left",
                    on ? "border-rust bg-accent" : "bg-background",
                  )}
                >
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{other.name}</span>
                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                      {on ? "On the bill" : "Add"}
                    </span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {pick.linked ? "Linked · " : ""}
                    {sizeLabel(pick.size)} · {MUSIC_LABEL[pick.music]} · {pick.miles} mi
                    {pick.overlap.length > 0 ? ` · ${pick.overlap.slice(0, 2).join(", ")}` : ""}
                    {pick.draw != null ? ` · usual crowd ~${pick.draw}` : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant={preset === "even" ? "default" : "outline"} className="h-10" onClick={() => setPreset("even")}>
          Even split
        </Button>
        <Button
          type="button"
          variant={preset === "headliner" ? "default" : "outline"}
          className="h-10"
          onClick={() => setPreset("headliner")}
        >
          Headliner 50/30/20
        </Button>
      </div>
      {splits && lineup.length > 1 ? (
        <p className="mt-2 text-sm">
          {lineup.map((item, index) => `${item.name} ${splits[index]}%`).join(" · ")}
        </p>
      ) : null}
      {total > 0 ? (
        <p id="typical-draw" className="mt-2 text-sm leading-relaxed">
          <span className="font-semibold">Typical draw about {total.toLocaleString()}.</span> The room sees the sum of
          each band&apos;s usual crowd.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {bookingHref ? (
        <Button asChild className="mt-3 h-11">
          <Link href={bookingHref}>Open the booking</Link>
        </Button>
      ) : (
        <Button type="button" className="mt-3 h-11" disabled={pending || lineup.length < 2} onClick={pitch}>
          Pitch together
        </Button>
      )}
    </section>
  );
}
