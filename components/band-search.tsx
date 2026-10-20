"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AUDIO_EVENT, listAllTracks } from "@/lib/audio-db";
import { searchBands, type TrackTitle } from "@/lib/band-search";
import { cities, getBand, listBands, STYLE_TAGS, SUBSTYLE_TAGS } from "@/lib/catalog";
import { combinedDraw } from "@/lib/full-night";
import { useApp } from "@/lib/store";
import type { Band, MusicKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { OfferDialog } from "@/components/offer-dialog";
import { BandMarks, MusicFilter, SizeFilter } from "@/components/originals";
import { BandSamples } from "@/components/samples";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RADII = [50, 100, 150, 300];

export function BandSearch({ surface }: { surface: "desk" | "phone" }) {
  const { snapshot } = useApp();
  const [text, setText] = useState("");
  const [styles, setStyles] = useState<string[]>([]);
  const [substyles, setSubstyles] = useState<string[]>([]);
  const [citySlug, setCitySlug] = useState("any");
  const [radius, setRadius] = useState(150);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [feeMin, setFeeMin] = useState("");
  const [feeMax, setFeeMax] = useState("");
  const [music, setMusic] = useState<"any" | MusicKind>("any");
  const [sizeMin, setSizeMin] = useState<number | null>(null);
  const [sizeMax, setSizeMax] = useState<number | null>(null);
  const [hasSamples, setHasSamples] = useState(false);
  const [uploads, setUploads] = useState<TrackTitle[]>([]);
  const [offer, setOffer] = useState<Band | null>(null);

  useEffect(() => {
    let cancel = false;
    const load = () => {
      listAllTracks()
        .then((rows) => {
          if (!cancel) setUploads(rows.map((row) => ({ bandId: row.bandId, title: row.title })));
        })
        .catch(() => {
          if (!cancel) setUploads([]);
        });
    };
    load();
    window.addEventListener(AUDIO_EVENT, load);
    return () => {
      cancel = true;
      window.removeEventListener(AUDIO_EVENT, load);
    };
  }, []);

  const rows = useMemo(
    () =>
      searchBands(listBands(), snapshot, uploads, {
        text,
        styles,
        substyles,
        citySlug,
        radius,
        from,
        to,
        feeMin: numberOrNull(feeMin),
        feeMax: numberOrNull(feeMax),
        music,
        sizeMin,
        sizeMax,
        hasSamples,
      }),
    [snapshot, uploads, text, styles, substyles, citySlug, radius, from, to, feeMin, feeMax, music, sizeMin, sizeMax, hasSamples],
  );

  function toggle(list: string[], value: string, setList: (next: string[]) => void) {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  return (
    <div className="grid gap-4">
      <ReadyBills surface={surface} />
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Search</span>
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Band, member, or song"
          className="h-11"
        />
      </label>
      <TagRow label="Style" options={STYLE_TAGS} selected={styles} onToggle={(value) => toggle(styles, value, setStyles)} />
      <TagRow
        label="Sub-style"
        options={SUBSTYLE_TAGS}
        selected={substyles}
        onToggle={(value) => toggle(substyles, value, setSubstyles)}
      />
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">City</span>
          <Select value={citySlug} onValueChange={setCitySlug}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="Any city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any city</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city.slug} value={city.slug}>
                  {city.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Radius</span>
          <Select value={String(radius)} onValueChange={(value) => setRadius(Number(value))}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RADII.map((miles) => (
                <SelectItem key={miles} value={String(miles)}>
                  {miles} miles
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Touring from</span>
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-10" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Touring through</span>
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-10" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Fee min</span>
          <Input
            inputMode="numeric"
            value={feeMin}
            onChange={(event) => setFeeMin(event.target.value)}
            placeholder="Any"
            className="h-10"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Fee max</span>
          <Input
            inputMode="numeric"
            value={feeMax}
            onChange={(event) => setFeeMax(event.target.value)}
            placeholder="Any"
            className="h-10"
          />
        </label>
      </div>
      <MusicFilter value={music} onChange={setMusic} />
      <SizeFilter min={sizeMin} max={sizeMax} onChange={(min, max) => { setSizeMin(min); setSizeMax(max); }} />
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={hasSamples} onChange={(event) => setHasSamples(event.target.checked)} />
          Has music samples
        </label>
      </div>
      <p className="text-sm text-muted-foreground">
        {rows.length} {rows.length === 1 ? "band" : "bands"}. Radius uses straight-line miles from the city you pick.
        Touring dates use each band&apos;s seeded route plus dates already on the book.
      </p>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
          No band matches that search. Clear a style or widen the radius.
        </p>
      ) : (
        <div className={cn("grid gap-3", surface === "desk" && "sm:grid-cols-2")}>
          {rows.map((band) => (
            <article key={band.id} className="rounded-2xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={surface === "phone" ? `/phone/bands/${band.id}` : `/bands/${band.id}`} className="font-display text-2xl hover:text-rust">
                    {band.name}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {band.city}
                    {band.routeFrom && band.routeTo ? ` · on the road ${band.routeFrom.slice(5)} to ${band.routeTo.slice(5)}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-sand px-2 py-1 text-[11px] font-semibold uppercase">
                  {band.touring ? "Touring" : "Local"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <BandMarks bandId={band.id} />
                {band.styles.map((style) => (
                  <span key={style} className="rounded-full bg-sand px-2 py-1 text-[11px] font-medium">
                    {style}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-sm font-medium">
                ${band.feeMin.toLocaleString()}–${band.feeMax.toLocaleString()}
              </p>
              <BandSamples bandId={band.id} variant="compact" />
              {snapshot.role === "venue" ? (
                <button
                  type="button"
                  onClick={() => setOffer(band)}
                  className="mt-3 grid h-10 w-full place-items-center rounded-lg bg-ink text-sm font-semibold text-cream"
                >
                  Send offer
                </button>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">Switch to a venue to send an offer.</p>
              )}
            </article>
          ))}
        </div>
      )}
      <OfferDialog
        band={offer}
        open={Boolean(offer)}
        onOpenChange={(next) => {
          if (!next) setOffer(null);
        }}
        bookingHref={(id) => (surface === "phone" ? `/phone/gig/${id}` : `/bookings/${id}`)}
        postHref={surface === "phone" ? "/phone/book/new" : "/dates/new"}
      />
    </div>
  );
}

function ReadyBills({ surface }: { surface: "desk" | "phone" }) {
  const { snapshot } = useApp();
  const rows = [...snapshot.bills].sort((a, b) => Number(Boolean(a.bookingId)) - Number(Boolean(b.bookingId)));
  if (rows.length === 0) return null;
  return (
    <section id="ready-bills" className="grid gap-3">
      <div>
        <h2 className="font-display text-3xl tracking-tight">Ready-made bills</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          One offer fills a small bar&apos;s whole night. These packages already have a headliner, openers, and a pay split. Typical draw adds each band&apos;s usual crowd.
        </p>
      </div>
      <div className={cn("grid gap-3", surface === "desk" && "sm:grid-cols-2")}>
        {rows.map((bill) => {
          const booking = bill.bookingId ? snapshot.bookings.find((item) => item.id === bill.bookingId) : undefined;
          const active = Boolean(booking && booking.status !== "declined");
          const bands = bill.members.map((member) => getBand(member.bandId)).filter((band) => Boolean(band));
          const total = combinedDraw(bands.map((band) => ({ draw: band?.draw ?? "" })));
          const href = surface === "phone" ? `/phone/book/bills/${bill.id}` : `/bills/${bill.id}`;
          return (
            <Link key={bill.id} href={href} className="rounded-2xl border bg-card p-4 hover:border-rust/40">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-2xl">{bill.name}</h3>
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {active ? "In talks" : "Ready to book"}
                </span>
              </div>
              <p className="mt-2 text-sm">
                {bill.members.map((member) => `${getBand(member.bandId)?.name ?? "Band"} ${member.splitPercent}%`).join(" · ")}
              </p>
              {total > 0 ? <p className="mt-2 text-sm font-medium">Typical draw about {total.toLocaleString()}</p> : null}
              <p className="mt-2 text-sm text-muted-foreground">
                {active ? "This package already has a conversation." : "Open it and send one offer for every band."}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function TagRow({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {options.map((option) => {
          const on = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(option)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
                on ? "border-ink bg-ink text-cream" : "bg-card",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function numberOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}
