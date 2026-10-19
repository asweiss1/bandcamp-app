"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { rulesFor, staysFor, STAY_GROUPS } from "@/lib/lodging";
import { formatDay, formatTime, money } from "@/lib/deal";
import { useApp } from "@/lib/store";
import {
  bookLink,
  buildTour,
  GIG_COLOR,
  GIG_LABEL,
  lodgingKind,
  LODGING_LABEL,
  sampleCost,
  stayOn,
  TOUR_ASSUMPTIONS,
  type GigKind,
  type LodgingKind,
  type TourNight,
} from "@/lib/tour";
import type { NightStay, Stay, StayType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const RouteMap = dynamic(() => import("@/components/tour-map").then((mod) => mod.TourMap), {
  ssr: false,
  loading: () => (
    <div className="grid h-full min-h-40 place-items-center text-sm text-muted-foreground">
      Loading the route map…
    </div>
  ),
});

const gigTone: Record<GigKind, string> = {
  confirmed: "bg-pine text-cream",
  offer: "bg-amber text-ink",
  counter: "bg-wine text-cream",
  requested: "bg-rust text-cream",
  off: "bg-sand text-ink",
};

const stayTone: Record<LodgingKind, string> = {
  booked: "bg-pine text-cream",
  held: "bg-amber text-ink",
  open: "bg-sand text-ink",
};

function Pill({ className, children }: { className: string; children: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
}

function typeLabel(type: StayType) {
  return STAY_GROUPS.find((group) => group.type === type)?.label ?? type;
}

export function TourOverview({ surface }: { surface: "desk" | "phone" }) {
  const { snapshot } = useApp();
  const { nights, totals } = useMemo(
    () => buildTour(snapshot, snapshot.bandId),
    [snapshot],
  );
  const [picked, setPicked] = useState<string | null>(null);
  const selected = nights.some((night) => night.id === picked) ? picked! : (nights[0]?.id ?? "");

  if (nights.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed px-4 py-10">
        <p className="font-display text-2xl">No dates on the route yet.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Confirmed nights, open talks, and the days between them show up here.
        </p>
      </div>
    );
  }

  function selectFromMap(id: string) {
    setPicked(id);
    document.getElementById(`night-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function selectFromDay(id: string) {
    setPicked(id);
    document.getElementById("tour-map")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  return (
    <div className="grid gap-4">
      <Totals totals={totals} />
      <div className={cn("grid gap-4", surface === "desk" && "lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]")}>
        <div
          id="tour-map"
          className={cn(
            "overflow-hidden rounded-2xl border bg-sand",
            surface === "phone" ? "h-[260px]" : "h-[520px] lg:sticky lg:top-4",
          )}
        >
          <RouteMap nights={nights} selectedId={selected} onSelect={selectFromMap} />
        </div>
        <div className="grid content-start gap-3">
          <Legend />
          <ol className="grid gap-3">
            {nights.map((night, index) => (
              <NightCard
                key={night.id}
                night={night}
                index={index}
                selected={night.id === selected}
                surface={surface}
                bandId={snapshot.bandId}
                record={stayOn(snapshot.nightStays, snapshot.bandId, night.date)}
                canEdit={snapshot.role === "band"}
                onOpen={() => selectFromDay(night.id)}
              />
            ))}
          </ol>
          <p className="text-xs leading-relaxed text-muted-foreground">{TOUR_ASSUMPTIONS}</p>
        </div>
      </div>
    </div>
  );
}

function NightCard({
  night,
  index,
  selected,
  surface,
  bandId,
  record,
  canEdit,
  onOpen,
}: {
  night: TourNight;
  index: number;
  selected: boolean;
  surface: "desk" | "phone";
  bandId: string;
  record: NightStay | null;
  canEdit: boolean;
  onOpen: () => void;
}) {
  const kind = lodgingKind(record);
  const dealHref = night.bookingId
    ? surface === "phone"
      ? `/phone/gig/${night.bookingId}`
      : `/bookings/${night.bookingId}`
    : null;

  return (
    <li id={`night-${night.id}`} className={cn("rounded-2xl border bg-card p-3", selected && "ring-2 ring-rust")}>
      <button type="button" onClick={onOpen} className="w-full text-left">
        <span className="flex items-start justify-between gap-2">
          <span className="flex items-center gap-2">
            <span
              className="grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold text-cream"
              style={{ background: GIG_COLOR[night.gig], color: night.gig === "offer" ? "#1b1612" : "#fffaf3" }}
            >
              {index + 1}
            </span>
            <span>
              <span className="block text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {formatDay(night.date)} · {night.city}
              </span>
              <span className="mt-0.5 block font-display text-2xl leading-none">
                {night.venueName ?? "Unbooked day off"}
              </span>
            </span>
          </span>
          <Pill className={gigTone[night.gig]}>{GIG_LABEL[night.gig]}</Pill>
        </span>
        {night.deal ? <span className="mt-2 block text-sm">{night.deal}</span> : null}
        {night.loadIn ? (
          <span className="mt-1 block text-sm text-muted-foreground">
            Load-in {formatTime(night.loadIn)}
            {night.showTime ? ` · Show ${night.showTime}` : ""}
          </span>
        ) : (
          <span className="mt-2 block text-sm text-muted-foreground">
            No gig. The van stays in {night.city}.
          </span>
        )}
        {night.leg ? (
          <span className="mt-1 block text-xs font-medium text-rust">
            {night.leg.miles === 0 ? "Stay put · 0 mi" : `${night.leg.hours}h · ${night.leg.miles} mi`}
          </span>
        ) : null}
      </button>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Pill className={stayTone[kind]}>{LODGING_LABEL[kind]}</Pill>
        {dealHref ? (
          <Button asChild variant="outline" className="h-8">
            <Link href={dealHref}>Open the deal</Link>
          </Button>
        ) : null}
      </div>
      {selected ? <LodgingPanel night={night} record={record} bandId={bandId} canEdit={canEdit} /> : null}
    </li>
  );
}

function LodgingPanel({
  night,
  record,
  bandId,
  canEdit,
}: {
  night: TourNight;
  record: NightStay | null;
  bandId: string;
  canEdit: boolean;
}) {
  const { setNightStay } = useApp();
  const [draft, setDraft] = useState<{ stayId: string; confirmation: string; cost: string } | null>(null);
  const options = staysFor(night.citySlug);
  const rules = rulesFor(night.citySlug);

  function hold(stay: Stay) {
    const result = setNightStay({
      bandId,
      date: night.date,
      status: "held",
      stayId: stay.id,
      name: stay.name,
      stayType: stay.type,
      address: `${stay.area}, ${night.label}`,
      confirmation: "",
      cost: sampleCost(stay.price),
    });
    if (!result.ok) toast.error(result.error);
    else toast.success("Held in this browser. Not a reservation.");
  }

  function markBooked(stay: Stay) {
    if (!draft || draft.stayId !== stay.id) return;
    const cost = Number(draft.cost);
    const result = setNightStay({
      bandId,
      date: night.date,
      status: "booked",
      stayId: stay.id,
      name: stay.name,
      stayType: stay.type,
      address: `${stay.area}, ${night.label}`,
      confirmation: draft.confirmation,
      cost: Number.isFinite(cost) ? cost : 0,
    });
    if (!result.ok) toast.error(result.error);
    else {
      setDraft(null);
      toast.success("Marked booked in this browser. Not a reservation.");
    }
  }

  return (
    <div className="mt-3 grid gap-3 border-t pt-3">
      {record?.status === "booked" ? (
        <div>
          <p className="font-display text-2xl leading-none">{record.name}</p>
          <p className="mt-1 text-sm">
            {typeLabel(record.stayType)} · {money(record.cost)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{record.address}</p>
          <p className="mt-1 text-sm">{record.confirmation}</p>
        </div>
      ) : record?.status === "held" ? (
        <div>
          <p className="font-display text-2xl leading-none">{record.name}</p>
          <p className="mt-1 text-sm">
            Held, not reserved · {typeLabel(record.stayType)} · {money(record.cost)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{record.address}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Not yet arranged. The options below are sample rooms near {night.city}.
        </p>
      )}
      <div className="grid max-h-80 gap-3 overflow-y-auto pr-1">
        {STAY_GROUPS.map((group) => {
          const rows = options.filter((stay) => stay.type === group.type);
          const link = bookLink(group.type, night.label, night.date);
          return (
            <section key={group.type} className="grid gap-2">
              <h4 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {group.label}
              </h4>
              {group.type === "van" ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Sample, not legal advice. {rules?.vehicleSleeping ?? group.blurb}
                </p>
              ) : null}
              {rows.length === 0 ? (
                <a href={link.href} target="_blank" rel="noreferrer" className="text-sm font-semibold text-rust">
                  {link.label}
                </a>
              ) : (
                rows.map((stay) => (
                  <div key={stay.id} className="rounded-xl border bg-paper px-3 py-2">
                    <p className="font-medium leading-snug">{stay.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {stay.area} · {stay.price} · {stay.distance}
                    </p>
                    {canEdit ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() =>
                            setDraft({
                              stayId: stay.id,
                              confirmation: "",
                              cost: String(sampleCost(stay.price)),
                            })
                          }
                          className="grid h-8 place-items-center rounded-lg bg-ink px-3 text-xs font-semibold text-cream"
                        >
                          Book
                        </a>
                        <button
                          type="button"
                          onClick={() => hold(stay)}
                          className="h-8 rounded-lg border px-3 text-xs font-semibold"
                        >
                          Hold
                        </button>
                      </div>
                    ) : null}
                    {draft?.stayId === stay.id ? (
                      <form
                        className="mt-2 grid gap-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          markBooked(stay);
                        }}
                      >
                        <label className="grid gap-1 text-xs font-medium">
                          Confirmation note
                          <Input
                            value={draft.confirmation}
                            onChange={(event) => setDraft({ ...draft, confirmation: event.target.value })}
                            placeholder="Sample confirmation is fine"
                            className="h-10"
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-medium">
                          Cost
                          <Input
                            inputMode="decimal"
                            value={draft.cost}
                            onChange={(event) => setDraft({ ...draft, cost: event.target.value })}
                            className="h-10"
                          />
                        </label>
                        <Button type="submit" className="h-10">
                          Mark booked
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Book opened the listing site. Mark booked only stores the note and the cost here.
                        </p>
                      </form>
                    ) : null}
                  </div>
                ))
              )}
            </section>
          );
        })}
      </div>
      {canEdit ? null : (
        <p className="text-xs text-muted-foreground">Switch to this band to hold or mark a room booked.</p>
      )}
    </div>
  );
}

function Totals({
  totals,
}: {
  totals: {
    confirmed: number;
    pending: number;
    lodging: number;
    heldLodging: number;
    miles: number;
    gas: number;
    net: number;
  };
}) {
  const cells = [
    ["Confirmed", money(totals.confirmed)],
    ["Pending", money(totals.pending)],
    ["Lodging", money(totals.lodging)],
    ["Held lodging", money(totals.heldLodging)],
    ["Est. gas", money(totals.gas)],
    ["Net", money(totals.net)],
  ];
  return (
    <section aria-label="Tour totals" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {cells.map(([label, value]) => (
        <div key={label} className="rounded-2xl border bg-card px-3 py-2">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{label}</p>
          <p className="mt-1 font-display text-2xl leading-none">{value}</p>
        </div>
      ))}
      <p className="col-span-2 text-xs text-muted-foreground sm:col-span-3 lg:col-span-6">
        {totals.miles} miles of sample driving. Held rooms stay out of the net until you mark them booked. Net is
        confirmed guarantees minus booked lodging and gas.
      </p>
    </section>
  );
}

function Legend() {
  const gigs: GigKind[] = ["confirmed", "offer", "counter", "requested", "off"];
  const stays: LodgingKind[] = ["booked", "held", "open"];
  return (
    <div className="flex flex-wrap gap-2">
      {gigs.map((kind) => (
        <span key={kind} className="inline-flex items-center gap-1.5 text-[11px] font-medium">
          <span className="size-2.5 rounded-full" style={{ background: GIG_COLOR[kind] }} />
          {GIG_LABEL[kind]}
        </span>
      ))}
      {stays.map((kind) => (
        <Pill key={kind} className={stayTone[kind]}>
          {LODGING_LABEL[kind]}
        </Pill>
      ))}
    </div>
  );
}
