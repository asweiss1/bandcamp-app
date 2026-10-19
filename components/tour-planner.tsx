"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { defaultTerms, formatDay, money } from "@/lib/deal";
import { placeForSlug, SAMPLE_PLACE, searchPlaces, type Place, type SavedPlace } from "@/lib/geo";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GENRES = ["Americana", "any", "Desert rock", "Indie folk", "Indie rock", "Alt-country"];

function toSaved(place: Place): SavedPlace {
  return { ...place, source: "search" };
}

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
    setSending(true);
    let sent = 0;
    let skipped = 0;
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
      if (result.ok) sent += 1;
      else skipped += 1;
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
  }

  const shown = plan ?? built;
  const gigCount = shown.nights.filter((night) => night.kind === "gig").length;

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Tour planner · sample</p>
        <h1 className="mt-1 font-display text-4xl leading-none tracking-tight sm:text-5xl">Days away</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          A start town and a number of days. The builder lines up open rooms, permits, and fairs along a
          drive, leaves rest days where nothing fits, and prices gas and lodging with sample rates.
        </p>
      </div>

      <form
        className="grid gap-3 rounded-2xl border bg-card p-4"
        onSubmit={(event) => {
          event.preventDefault();
          rebuild();
        }}
      >
        <CityField label="Start city" place={start} onPlace={setStart} />
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
        {loop ? null : <CityField label="End city" place={end} onPlace={setEnd} />}
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
        <Button type="submit" className="h-11">
          Build this route
        </Button>
      </form>

      <PlanResult
        nights={shown.nights}
        miles={shown.miles}
        gas={shown.gas}
        lodgingTotal={shown.lodgingTotal}
        guarantees={shown.guarantees}
        net={shown.net}
        assumptions={shown.assumptions}
        saved={Boolean(plan)}
        surface={surface}
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

function PlanResult({
  nights,
  miles,
  gas,
  lodgingTotal,
  guarantees,
  net,
  assumptions,
  saved,
  surface,
  onNight,
}: {
  nights: PlanNight[];
  miles: number;
  gas: number;
  lodgingTotal: number;
  guarantees: number;
  net: number;
  assumptions: string;
  saved: boolean;
  surface: "desk" | "phone";
  onNight: (index: number, night: PlanNight) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="rounded-2xl bg-ink p-4 text-cream">
        <p className="text-xs font-semibold tracking-[0.16em] text-amber uppercase">
          Estimated budget · sample
        </p>
        <p className="mt-2 font-display text-4xl">{money(net)}</p>
        <p className="mt-1 text-sm text-cream/75">
          {money(guarantees)} in guarantees, minus {money(gas)} gas and {money(lodgingTotal)} lodging · {miles}{" "}
          road miles
        </p>
        <p className="mt-2 text-xs leading-relaxed text-cream/60">{assumptions}</p>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

function CityField({
  label,
  place,
  onPlace,
}: {
  label: string;
  place: SavedPlace;
  onPlace: (place: SavedPlace) => void;
}) {
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<Place[]>([]);
  const local = query.trim().length >= 2 ? searchPlaces(query) : [];
  const matches = [
    ...local,
    ...remote.filter((item) => !local.some((known) => known.label.toLowerCase() === item.label.toLowerCase())),
  ].slice(0, 8);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const handle = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/places?q=${encodeURIComponent(query.trim())}`);
        const data = (await response.json()) as { places?: Place[] };
        setRemote(data.places ?? []);
      } catch {
        setRemote([]);
      }
    }, 600);
    return () => window.clearTimeout(handle);
  }, [query]);

  return (
    <div>
      <Field label={`${label} · ${place.label}`}>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type a US city"
          className="h-11"
          autoComplete="off"
        />
      </Field>
      {matches.length > 0 ? (
        <ul className="mt-1 grid gap-1">
          {matches.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-sand"
                onClick={() => {
                  onPlace(toSaved(item));
                  setQuery("");
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
