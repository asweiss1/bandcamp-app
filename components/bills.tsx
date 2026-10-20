"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { billProblem } from "@/lib/bills";
import { getBand, getVenue, listBands } from "@/lib/catalog";
import { slotLine } from "@/lib/daypart";
import { defaultTerms, formatDayLong } from "@/lib/deal";
import { linkedBandIds } from "@/lib/links";
import { dateFill, sortByDate } from "@/lib/queries";
import { useApp } from "@/lib/store";
import type { BillMember, BillRole, OpenDate, Terms } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DealFields } from "@/components/deal-fields";
import { PageFrame, PageIntro } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import { DrawNote } from "@/components/draw-note";
import { PromoStudio } from "@/components/promo-studio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function billHref(id: string, surface: "desk" | "phone") {
  return surface === "phone" ? `/phone/book/bills/${id}` : `/bills/${id}`;
}

function bookingHref(id: string, surface: "desk" | "phone") {
  return surface === "phone" ? `/phone/gig/${id}` : `/bookings/${id}`;
}

function indexHref(surface: "desk" | "phone") {
  return surface === "phone" ? "/phone/book/bills" : "/bills";
}

export function BillLineup({
  billId,
  surface,
}: {
  billId: string | null | undefined;
  surface: "desk" | "phone";
}) {
  const { snapshot } = useApp();
  const bill = billId ? snapshot.bills.find((item) => item.id === billId) : undefined;
  if (!bill) return null;
  return (
    <section className="mt-4 rounded-2xl border bg-card p-4">
      <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Shared bill</p>
      <Link href={billHref(bill.id, surface)} className="mt-1 block font-display text-2xl hover:text-rust">
        {bill.name}
      </Link>
      <ul className="mt-3 grid gap-2">
        {bill.members.map((member) => {
          const band = getBand(member.bandId);
          return (
            <li key={member.bandId} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span>
                <span className="font-medium">{band?.name ?? "Band"}</span>
                <span className="text-muted-foreground"> · {member.role} · {member.setTime}</span>
              </span>
              <span className="font-semibold">{member.splitPercent}%</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function BillIndex({ surface }: { surface: "desk" | "phone" }) {
  const { snapshot } = useApp();
  const rows = snapshot.bills;
  const body = (
    <>
      <PageIntro
        eyebrow="Shared bills"
        title="Play the date as a package"
        lede="Two to four linked bands, one headliner, set times, and a pay split. A venue sends one offer for the whole bill."
        actions={
          snapshot.role === "band" ? (
            <Button asChild className="h-10">
              <Link href={surface === "phone" ? "/phone/book/bills/new" : "/bills/new"}>Build a bill</Link>
            </Button>
          ) : null
        }
      />
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
          No bills yet. A band can package a headliner and openers, then pitch an open date.
        </p>
      ) : (
        <div className="grid gap-3">
          {rows.map((bill) => {
            const booking = bill.bookingId
              ? snapshot.bookings.find((item) => item.id === bill.bookingId)
              : undefined;
            const venue = bill.venueId ? getVenue(bill.venueId) : undefined;
            const openDate = bill.openDateId
              ? snapshot.openDates.find((item) => item.id === bill.openDateId)
              : undefined;
            return (
              <Link
                key={bill.id}
                href={billHref(bill.id, surface)}
                className="rounded-2xl border bg-card p-4 hover:border-rust/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-2xl">{bill.name}</h2>
                  {booking ? <StatusPill status={booking.status} /> : <span className="text-xs font-semibold uppercase text-muted-foreground">Not pitched</span>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {bill.members
                    .map((member) => `${getBand(member.bandId)?.name ?? "Band"} ${member.splitPercent}%`)
                    .join(" · ")}
                </p>
                <p className="mt-2 text-sm">
                  {venue && openDate
                    ? `${venue.name} · ${formatDayLong(openDate.date)}`
                    : "No date attached yet"}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
  if (surface === "phone") return <div className="grid gap-4 pb-2">{body}</div>;
  return <PageFrame>{body}</PageFrame>;
}

export function BillDetail({ id, surface }: { id: string; surface: "desk" | "phone" }) {
  const { snapshot, pitchBill, offerBill } = useApp();
  const bill = snapshot.bills.find((item) => item.id === id);
  const [terms, setTerms] = useState<Terms>(defaultTerms({ guarantee: 1200, note: "One offer for the whole bill." }));
  const [openDateId, setOpenDateId] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!bill) {
    const missing = (
      <div>
        <h1 className="font-display text-4xl">That bill is gone.</h1>
        <Link href={indexHref(surface)} className="mt-3 inline-block text-sm font-semibold text-rust">
          Back to bills
        </Link>
      </div>
    );
    return surface === "phone" ? missing : <PageFrame>{missing}</PageFrame>;
  }

  const booking = bill.bookingId ? snapshot.bookings.find((item) => item.id === bill.bookingId) : undefined;
  const active = booking && booking.status !== "declined";
  const venue = bill.venueId ? getVenue(bill.venueId) : undefined;
  const openDate = bill.openDateId ? snapshot.openDates.find((item) => item.id === bill.openDateId) : undefined;
  const lead = snapshot.role === "band" && snapshot.bandId === bill.leadBandId;
  const venueDates =
    snapshot.role === "venue"
      ? sortByDate(snapshot.openDates).filter(
          (item) => item.venueId === snapshot.venueId && dateFill(item.id, snapshot.bookings) !== "filled",
        )
      : [];
  const pitchDates = lead
    ? sortByDate(snapshot.openDates).filter((item) => dateFill(item.id, snapshot.bookings) !== "filled")
    : [];

  function sendPitch(event: React.FormEvent) {
    event.preventDefault();
    const result = pitchBill(bill!.id, openDateId, terms);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast(result.warning ?? "Bill pitched");
    setError(null);
  }

  function sendOffer(event: React.FormEvent) {
    event.preventDefault();
    const result = offerBill(bill!.id, openDateId, terms);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast(result.warning ?? "Offer sent for the whole bill");
    setError(null);
  }

  const body = (
    <>
      <Link href={indexHref(surface)} className="text-sm font-medium text-rust">
        ← Bills
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {active && booking ? <StatusPill status={booking.status} /> : null}
        <span className="rounded-full bg-sand px-2.5 py-1 text-xs font-semibold uppercase">
          {bill.members.length} bands
        </span>
      </div>
      <h1 className="mt-3 font-display text-5xl tracking-tight">{bill.name}</h1>
      <div className="mt-4">
        <PromoStudio kind="bill" id={bill.id} />
      </div>
      {venue ? (
        <DrawNote
          bandIds={bill.members.map((member) => member.bandId)}
          venueId={venue.id}
          bookingId={booking?.id ?? null}
          confirmed={booking?.status === "accepted"}
        />
      ) : null}
      <p className="mt-2 text-lg text-muted-foreground">
        {venue && openDate
          ? `${venue.name} · ${formatDayLong(openDate.date)} · ${slotLine(openDate.showTime, openDate.daypart)}`
          : "Package only. Pitch it to an open date, or wait for a venue offer."}
      </p>
      <ul className="mt-6 grid gap-2">
        {bill.members.map((member) => {
          const band = getBand(member.bandId);
          const href = surface === "phone" ? `/phone/bands/${member.bandId}` : `/bands/${member.bandId}`;
          return (
            <li key={member.bandId} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border bg-card px-4 py-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">{member.role}</p>
                <Link href={href} className="font-display text-3xl hover:text-rust">
                  {band?.name ?? "Band"}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {band?.city} · downbeat {member.setTime}
                </p>
              </div>
              <p className="font-display text-4xl">{member.splitPercent}%</p>
            </li>
          );
        })}
      </ul>
      {active && booking ? (
        <div className="mt-6">
          <Button asChild className="h-11">
            <Link href={bookingHref(booking.id, surface)}>Open the negotiation</Link>
          </Button>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            The venue and the headlining band negotiate once. Confirming the bill checks every band for a double booking.
          </p>
        </div>
      ) : null}
      {!active && lead ? (
        <form onSubmit={sendPitch} className="mt-6 grid max-w-2xl gap-4 rounded-2xl border bg-card p-4">
          <p className="font-display text-2xl">Pitch this bill</p>
          <DateSelect dates={pitchDates} value={openDateId} onChange={setOpenDateId} />
          <DealFields value={terms} onChange={setTerms} />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="h-11 w-fit">
            Pitch the stacked bill
          </Button>
        </form>
      ) : null}
      {!active && snapshot.role === "venue" ? (
        <form onSubmit={sendOffer} className="mt-6 grid max-w-2xl gap-4 rounded-2xl border bg-card p-4">
          <p className="font-display text-2xl">One offer for the bill</p>
          <DateSelect dates={venueDates} value={openDateId} onChange={setOpenDateId} />
          <DealFields value={terms} onChange={setTerms} />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="h-11 w-fit">
            Send the offer
          </Button>
        </form>
      ) : null}
    </>
  );
  if (surface === "phone") return <div className="grid gap-4 pb-2">{body}</div>;
  return <PageFrame>{body}</PageFrame>;
}

function DateSelect({
  dates,
  value,
  onChange,
}: {
  dates: { id: string; date: string; showTime: string; daypart: OpenDate["daypart"]; venueId: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">Open date</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-md border bg-card px-3"
        required
      >
        <option value="">Pick a date</option>
        {dates.map((item) => {
          const venue = getVenue(item.venueId);
          return (
            <option key={item.id} value={item.id}>
              {formatDayLong(item.date)} · {slotLine(item.showTime, item.daypart)} · {venue?.name ?? "Room"}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function blankOpener(): BillMember {
  return { bandId: "", role: "Opener", setTime: "8:00pm", splitPercent: 30 };
}

export function BillForm({ surface }: { surface: "desk" | "phone" }) {
  const router = useRouter();
  const { snapshot, saveBill } = useApp();
  const lead = getBand(snapshot.bandId);
  const linked = useMemo(() => new Set(linkedBandIds(snapshot.bandLinks, snapshot.bandId)), [snapshot.bandLinks, snapshot.bandId]);
  const others = listBands()
    .filter((band) => band.id !== snapshot.bandId)
    .slice()
    .sort((a, b) => Number(linked.has(b.id)) - Number(linked.has(a.id)) || a.name.localeCompare(b.name));
  const [name, setName] = useState("Friday package");
  const [headSplit, setHeadSplit] = useState(70);
  const [headTime, setHeadTime] = useState("9:30pm");
  const [openers, setOpeners] = useState<BillMember[]>([
    { bandId: others[0]?.id ?? "", role: "Opener", setTime: "8:00pm", splitPercent: 30 },
  ]);
  const [error, setError] = useState<string | null>(null);

  const members: BillMember[] = [
    { bandId: snapshot.bandId, role: "Headliner" as BillRole, setTime: headTime, splitPercent: headSplit },
    ...openers,
  ];
  const total = members.reduce((sum, member) => sum + (Number.isFinite(member.splitPercent) ? member.splitPercent : 0), 0);
  const problem = billProblem(members);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (snapshot.role !== "band") {
      setError("Switch to a band to build a bill.");
      return;
    }
    const result = saveBill({ name, members });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast("Bill saved");
    router.push(billHref(result.data, surface));
  }

  const body = (
    <>
      <Link href={indexHref(surface)} className="text-sm font-medium text-rust">
        ← Bills
      </Link>
      <h1 className="mt-3 font-display text-4xl tracking-tight">Build a bill</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        You headline. Add one to three openers, a downbeat for each set, and splits that total 100.
      </p>
      {snapshot.role !== "band" ? (
        <p className="mt-4 rounded-xl bg-sand px-4 py-3 text-sm">Switch to a band on the desk before saving.</p>
      ) : (
        <form onSubmit={submit} className="mt-6 grid max-w-2xl gap-4">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Bill name</span>
            <Input className="h-10" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <MemberRow
            label="Headliner"
            name={lead?.name ?? "Your band"}
            time={headTime}
            split={headSplit}
            onTime={setHeadTime}
            onSplit={setHeadSplit}
          />
          {openers.map((opener, index) => (
            <div key={index} className="grid gap-2 rounded-2xl border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">Opener</p>
                {openers.length > 1 ? (
                  <button
                    type="button"
                    className="text-sm font-medium text-rust"
                    onClick={() => setOpeners(openers.filter((_, item) => item !== index))}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <select
                value={opener.bandId}
                onChange={(event) =>
                  setOpeners(openers.map((item, itemIndex) => (itemIndex === index ? { ...item, bandId: event.target.value } : item)))
                }
                className="h-10 rounded-md border bg-card px-3 text-sm"
              >
                <option value="">Pick a band</option>
                {others.map((band) => (
                  <option key={band.id} value={band.id}>
                    {linked.has(band.id) ? `${band.name} · linked` : band.name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Set time</span>
                  <Input
                    className="h-10"
                    value={opener.setTime}
                    onChange={(event) =>
                      setOpeners(openers.map((item, itemIndex) => (itemIndex === index ? { ...item, setTime: event.target.value } : item)))
                    }
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Split %</span>
                  <Input
                    className="h-10"
                    inputMode="numeric"
                    value={String(opener.splitPercent)}
                    onChange={(event) =>
                      setOpeners(
                        openers.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, splitPercent: Number(event.target.value) } : item,
                        ),
                      )
                    }
                  />
                </label>
              </div>
            </div>
          ))}
          {openers.length < 3 ? (
            <Button type="button" variant="outline" className="h-10 w-fit" onClick={() => setOpeners([...openers, blankOpener()])}>
              Add an opener
            </Button>
          ) : null}
          <p className={cn("text-sm font-medium", total === 100 ? "text-pine" : "text-destructive")}>
            Splits add up to {Number.isFinite(total) ? total : 0}%. They need to total 100.
          </p>
          {error || (problem && total !== 100) ? <p className="text-sm text-destructive">{error ?? problem}</p> : null}
          <Button type="submit" className="h-11 w-fit">
            Save the bill
          </Button>
        </form>
      )}
    </>
  );
  if (surface === "phone") return <div className="grid gap-4 pb-2">{body}</div>;
  return <PageFrame>{body}</PageFrame>;
}

function MemberRow({
  label,
  name,
  time,
  split,
  onTime,
  onSplit,
}: {
  label: string;
  name: string;
  time: string;
  split: number;
  onTime: (value: string) => void;
  onSplit: (value: number) => void;
}) {
  return (
    <div className="grid gap-2 rounded-2xl border bg-card p-4">
      <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">{label}</p>
      <p className="font-display text-2xl">{name}</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Set time</span>
          <Input className="h-10" value={time} onChange={(event) => onTime(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Split %</span>
          <Input className="h-10" inputMode="numeric" value={String(split)} onChange={(event) => onSplit(Number(event.target.value))} />
        </label>
      </div>
    </div>
  );
}
