"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { planBatchClash } from "@/lib/conflicts";
import { defaultTerms, formatDay, money } from "@/lib/deal";
import { fuelAssumptions, gallonPrice, fuelSourceLabel, priceDrive, rigFor, type FuelQuote, type Rig } from "@/lib/fuel";
import { useFuelQuote } from "@/lib/fuel-client";
import { getBand } from "@/lib/catalog";
import { placeForSlug, SAMPLE_PLACE, type SavedPlace } from "@/lib/geo";
import { linkedBandIds } from "@/lib/links";
import { HometownField } from "@/components/hometown-field";
import { searchLinksFor } from "@/lib/lodging";
import {
  applyChoice,
  asRest,
  buildPlan,
  withLodging,
  type LodgingPref,
  type PlanNight,
} from "@/lib/planner";
import { usePlace } from "@/lib/place";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { PriceField } from "@/components/fuel-price";
import { OriginalsBadge } from "@/components/originals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GENRES = ["Americana", "any", "Desert rock", "Indie folk", "Indie rock", "Alt-country"];

export function TourPlanner({ surface }: { surface: "desk" | "phone" }) {
  const { snapshot, requestDate } = useApp();
  const { lodging, setLodging, plan, savePlan, setNight } = usePlace();
  const [start, setStart] = useState<SavedPlace>(SAMPLE_PLACE);
  const [end, setEnd] = useState<SavedPlace>(SAMPLE_PLACE);
  const [days, setDays] = useState(7);
  const [startDate, setStartDate] = useState("2026-11-16");
  const [maxDriveHours, setMaxDriveHours] = useState(6);
  const [genre, setGenre] = useState("Americana");
  const [minGuarantee, setMinGuarantee] = useState(300);
  const [loop, setLoop] = useState(true);
  const [sending, setSending] = useState(false);
  const [withIds, setWithIds] = useState<string[]>([]);
  const mates = useMemo(() => {
    if (snapshot.role !== "band") return [];
    return linkedBandIds(snapshot.bandLinks, snapshot.bandId)
      .map((id) => getBand(id))
      .filter((band) => band != null);
  }, [snapshot.role, snapshot.bandLinks, snapshot.bandId]);
  const riding = mates.filter((band) => withIds.includes(band.id));
  const quote = useFuelQuote();
  const rig = useMemo(
    () => rigFor(snapshot.vehicles.filter((vehicle) => vehicle.bandId === snapshot.bandId)),
    [snapshot.vehicles, snapshot.bandId],
  );

  const built = useMemo(
    () =>
      buildPlan(snapshot, {
        start,
        days: Math.min(14, Math.max(1, days)),
        startDate,
        maxDriveHours,
        genre,
        minGuarantee,
        end: loop ? null : end,
        loop,
        lodging,
      }),
    [snapshot, start, days, startDate, maxDriveHours, genre, minGuarantee, loop, end, lodging],
  );

  function rebuild() {
    savePlan(built);
    toast.success("Route updated. Sample drives and rates, not a booked tour.");
  }

  function sendAll() {
    const current = plan ?? built;
    if (snapshot.role !== "band") {
      toast.error("Switch to a band to send these gig requests.");
      return;
    }
    const stops = current.nights
      .filter((night) => night.kind === "gig" && night.openDateId)
      .map((night) => ({
        openDateId: night.openDateId as string,
        date: night.date,
        lat: night.place.lat,
        lng: night.place.lng,
        citySlug: night.place.id,
        label: night.venueName ?? night.title,
      }));
    const clash = planBatchClash(snapshot, snapshot.bandId, stops, maxDriveHours);
    if (clash) {
      toast.error(clash);
      return;
    }
    setSending(true);
    let sent = 0;
    let skipped = 0;
    let warning: string | undefined;
    for (const night of current.nights) {
      if (night.kind !== "gig" || !night.openDateId) continue;
      const result = requestDate(
        night.openDateId,
        defaultTerms({
          dealType: "guarantee",
          guarantee: night.guarantee,
          note: `Tour plan for ${night.place.label} on ${night.date}. Sample request from the route builder.`,
        }),
      );
      if (result.ok) {
        sent += 1;
        warning ??= result.warning;
      } else skipped += 1;
    }
    setSending(false);
    savePlan(current);
    if (sent === 0) {
      toast.error(skipped ? "Those rooms already have a conversation." : "No venue nights to request.");
      return;
    }
    toast.success(
      `Sent ${sent} gig ${sent === 1 ? "request" : "requests"}. Lodging picks stay on this plan.${skipped ? ` ${skipped} already in talks.` : ""}`,
    );
    if (warning) toast(warning);
  }

  const shown = plan ?? built;
  const gigCount = shown.nights.filter((night) => night.kind === "gig").length;

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Tour planner · sample</p>
        <h1 className="mt-1 font-display text-4xl leading-none tracking-tight sm:text-5xl">Days away</h1>
        <div className="mt-3">
          <OriginalsBadge bandId={snapshot.bandId} withInfo />
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          A start town and a number of days. The builder lines up open rooms, permits, and fairs along a
          drive, leaves rest days where nothing fits, and prices fuel from the listed vehicle plus lodging
          sample rates.
        </p>
      </div>

      <form
        className="grid gap-3 rounded-2xl border bg-card p-4"
        onSubmit={(event) => {
          event.preventDefault();
          rebuild();
        }}
      >
        <HometownField label="Start city" place={start} onPlace={setStart} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Days away">
            <Input
              type="number"
              min={1}
              max={14}
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className="h-11"
            />
          </Field>
          <Field label="First day">
            <Input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-11"
            />
          </Field>
          <Field label="Max drive hours">
            <Input
              type="number"
              min={1}
              max={12}
              step={0.5}
              value={maxDriveHours}
              onChange={(event) => setMaxDriveHours(Number(event.target.value))}
              className="h-11"
            />
          </Field>
          <Field label="Minimum guarantee">
            <Input
              type="number"
              min={0}
              step={50}
              value={minGuarantee}
              onChange={(event) => setMinGuarantee(Number(event.target.value))}
              className="h-11"
            />
          </Field>
        </div>
        <Field label="Genre">
          <select
            value={genre}
            onChange={(event) => setGenre(event.target.value)}
            className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm"
          >
            {GENRES.map((item) => (
              <option key={item} value={item}>
                {item === "any" ? "Any genre" : item}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={loop} onChange={(event) => setLoop(event.target.checked)} />
          Loop back to {start.city}
        </label>
        {loop ? null : <HometownField label="End city" place={end} onPlace={setEnd} />}
        <Field label="Lodging preference">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["camp", "Camping"],
                ["cheap", "Cheap motel"],
                ["hotel", "Hotel"],
              ] as const
            ).map(([id, name]) => (
              <button
                key={id}
                type="button"
                aria-pressed={lodging === id}
                onClick={() => setLodging(id)}
                className={cn(
                  "h-10 rounded-full px-3 text-sm font-medium",
                  lodging === id ? "bg-ink text-cream" : "bg-sand",
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </Field>
        {snapshot.role === "band" && mates.length > 0 ? (
          <div className="grid gap-2">
            <p className="text-sm font-medium">Tour together</p>
            <p className="text-sm text-muted-foreground">
              Linked bands share this route. Fuel and lodging split evenly. Guarantees stay with the gigs.
            </p>
            <div className="flex flex-wrap gap-2">
              {mates.map((band) => {
                const on = withIds.includes(band.id);
                return (
                  <button
                    key={band.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setWithIds(on ? withIds.filter((id) => id !== band.id) : [...withIds, band.id])
                    }
                    className={cn(
                      "h-10 rounded-full px-3 text-sm font-medium",
                      on ? "bg-ink text-cream" : "bg-sand",
                    )}
                  >
                    {band.name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        <Button type="submit" className="h-11">
          Build this route
        </Button>
      </form>

      <PlanResult
        nights={shown.nights}
        rig={rig}
        quote={quote}
        saved={Boolean(plan)}
        surface={surface}
        mateNames={riding.map((band) => band.name)}
        onNight={(index, night) => {
          if (!plan) savePlan(built);
          setNight(index, night);
        }}
      />

      <div className="rounded-2xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          One tap asks every matched room for a guarantee at the sample number. Permits, fairs, and rest days
          stay on the plan. Lodging picks are saved with it.
        </p>
        <Button type="button" className="mt-3 h-11" disabled={sending || gigCount === 0} onClick={sendAll}>
          {sending ? "Sending…" : `Request ${gigCount} matched ${gigCount === 1 ? "gig" : "gigs"}`}
        </Button>
        {snapshot.role !== "band" ? (
          <p className="mt-2 text-sm text-muted-foreground">Switch to a band before sending. The plan itself is still here.</p>
        ) : null}
      </div>
    </div>
  );
}

function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function PlanResult({
  nights,
  rig,
  quote,
  saved,
  surface,
  mateNames,
  onNight,
}: {
  nights: PlanNight[];
  rig: Rig;
  quote: FuelQuote;
  saved: boolean;
  surface: "desk" | "phone";
  mateNames: string[];
  onNight: (index: number, night: PlanNight) => void;
}) {
  const budget = useMemo(() => {
    let gallons = 0;
    let gas = 0;
    for (const night of nights) {
      if (night.driveMiles <= 0) continue;
      const leg = priceDrive(night.driveMiles, night.place.state, night.fuelPriceOverride ?? null, rig, quote);
      gallons += leg.gallons;
      gas += leg.cost;
    }
    const rounded = Math.round(gas);
    const lodgingTotal = nights.reduce((sum, night) => sum + night.lodgingCost, 0);
    const guarantees = nights.reduce((sum, night) => sum + night.guarantee, 0);
    const miles = nights.reduce((sum, night) => sum + night.driveMiles, 0);
    return {
      miles,
      gallons,
      gas: rounded,
      lodgingTotal,
      guarantees,
      net: guarantees - rounded - lodgingTotal,
    };
  }, [nights, rig, quote]);

  return (
    <div className="grid gap-3">
      <div className="rounded-2xl bg-ink p-4 text-cream">
        <p className="text-xs font-semibold tracking-[0.16em] text-amber uppercase">
          Estimated budget · sample
        </p>
        <p className="mt-2 font-display text-4xl">{money(budget.net)}</p>
        <p className="mt-1 text-sm text-cream/75">
          {money(budget.guarantees)} in guarantees, minus {money(budget.gas)} fuel and {money(budget.lodgingTotal)}{" "}
          lodging · {budget.miles} road miles · {budget.gallons.toFixed(1)} gal
        </p>
        <p className="mt-2 text-xs leading-relaxed text-cream/60">
          {fuelAssumptions(rig, quote)} Drives use straight-line distance × 1.3 at 55 mph, not live traffic. Lodging
          is a flat sample rate: $28 camp, $89 motel, $165 hotel.
        </p>
        {mateNames.length > 0 ? (
          <p className="mt-2 text-sm leading-relaxed text-cream">
            Split {mateNames.length + 1} ways with {joinNames(mateNames)}. Each band covers{" "}
            {money(Math.round(budget.gas / (mateNames.length + 1)))} of the fuel and{" "}
            {money(Math.round(budget.lodgingTotal / (mateNames.length + 1)))} of the lodging.
          </p>
        ) : null}
        {saved ? <p className="mt-2 text-xs text-amber">Saved on this device.</p> : null}
      </div>
      <ol className="grid gap-3">
        {nights.map((night, index) => {
          const known = placeForSlug(night.place.id);
          const stay =
            surface === "phone"
              ? known
                ? `/phone/stay?city=${known.id}`
                : `/phone/stay?label=${encodeURIComponent(night.place.label)}`
              : known
                ? `/lodging/${known.id}`
                : `/lodging/outbound?label=${encodeURIComponent(night.place.label)}`;
          const links = searchLinksFor(night.place.label, night.date);
          return (
            <li key={`${night.date}-${index}`} className="rounded-2xl border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  {formatDay(night.date)} · {night.place.label}
                </p>
                <span className="rounded-full bg-sand px-2 py-1 text-[11px] font-semibold uppercase">
                  {night.kind === "gig" ? "Room" : night.kind === "rest" ? "Rest" : "Sample call"}
                </span>
              </div>
              <h2 className="mt-1 font-display text-2xl">{night.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {night.driveHours > 0 ? `${night.driveHours} h · ${night.driveMiles} mi sample drive · ` : "No drive · "}
                {night.guarantee > 0 ? money(night.guarantee) : "No guarantee"}
                {night.showTime ? ` · ${night.showTime}` : ""}
              </p>
              <PlanFuel
                night={night}
                rig={rig}
                quote={quote}
                onCommit={(price) => onNight(index, { ...night, fuelPriceOverride: price })}
              />
              <p className="mt-1 text-sm">
                {night.lodgingName} · {money(night.lodgingCost)} sample
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [
                    ["camp", "Camp"],
                    ["cheap", "Motel"],
                    ["hotel", "Hotel"],
                  ] as const
                ).map(([id, name]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={night.lodging === id}
                    onClick={() => onNight(index, withLodging(night, id as LodgingPref))}
                    className={cn(
                      "h-9 rounded-full px-3 text-xs font-medium",
                      night.lodging === id ? "bg-ink text-cream" : "bg-sand",
                    )}
                  >
                    {name}
                  </button>
                ))}
                {night.kind !== "rest" ? (
                  <button
                    type="button"
                    onClick={() => onNight(index, asRest(night))}
                    className="h-9 rounded-full bg-sand px-3 text-xs font-medium"
                  >
                    Make a rest day
                  </button>
                ) : null}
                <Link href={stay} className="inline-flex h-9 items-center text-xs font-semibold text-rust">
                  Lodging
                </Link>
                <a href={links[3]?.href} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center text-xs font-semibold text-rust">
                  Map
                </a>
              </div>
              {night.choices.length > 1 ? (
                <label className="mt-3 block text-xs font-medium text-muted-foreground">
                  Other rooms that day
                  <select
                    className="mt-1 h-10 w-full rounded-lg border bg-transparent px-2 text-sm text-foreground"
                    value={night.openDateId ?? ""}
                    onChange={(event) => {
                      const choice = night.choices.find((item) => item.openDateId === event.target.value);
                      if (choice) onNight(index, applyChoice(night, choice, night.lodging));
                    }}
                  >
                    {night.choices.map((choice) => (
                      <option key={choice.openDateId} value={choice.openDateId}>
                        {choice.venueName} · {choice.cityLabel} · {money(choice.guarantee)} · {choice.driveHours}h
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function PlanFuel({
  night,
  rig,
  quote,
  onCommit,
}: {
  night: PlanNight;
  rig: Rig;
  quote: FuelQuote;
  onCommit: (price: number | null) => void;
}) {
  const fuel =
    night.driveMiles > 0
      ? priceDrive(night.driveMiles, night.place.state, night.fuelPriceOverride ?? null, rig, quote)
      : null;

  if (!fuel) return null;

  const priceLine =
    fuel.source === "override"
      ? `Your price ${gallonPrice(fuel.price)}/gal · ${fuel.regionLabel} table ${gallonPrice(fuel.suggested)}`
      : `${fuel.regionLabel} ${gallonPrice(fuel.price)}/gal · ${fuelSourceLabel(fuel.source, quote.week)}`;

  return (
    <div className="mt-1 grid gap-1">
      <p className="text-xs font-medium text-rust">
        {fuel.gallons.toFixed(1)} gal {fuel.fuel} · {money(fuel.cost)}
      </p>
      <p className="text-xs text-muted-foreground">{priceLine}</p>
      <PriceField
        key={`${night.date}-${night.place.id}-${night.fuelPriceOverride ?? "region"}`}
        initial={night.fuelPriceOverride != null ? String(night.fuelPriceOverride) : ""}
        placeholder={fuel.suggested.toFixed(3)}
        label={`Fuel price for ${night.place.label}`}
        onCommit={(value) => {
          if (value != null && (!(value >= 0.5) || value > 20 || Number.isNaN(value))) {
            toast.error("Enter a price between $0.50 and $20 a gallon.");
            return;
          }
          onCommit(value == null ? null : Math.round(value * 1000) / 1000);
        }}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}
