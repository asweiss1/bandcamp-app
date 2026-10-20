"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getBand } from "@/lib/catalog";
import { formatDay, formatDayLong } from "@/lib/deal";
import { activeApplication } from "@/lib/queries";
import { useApp } from "@/lib/store";
import type { Application, Opportunity, Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PageFrame } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const setups = ["Acoustic", "Battery amp", "Small PA"];

export function OpportunityDetail({ id, surface }: { id: string; surface: "phone" | "desk" }) {
  const { snapshot, applyToOpportunity, withdrawApplication, confirmApplication } = useApp();
  const opportunity = snapshot.opportunities.find((item) => item.id === id);
  const back = surface === "phone" ? "/phone/book" : "/dates";
  const backLabel = surface === "phone" ? "← Opportunities" : "← Booking opportunities";

  if (!opportunity) {
    const missing = (
      <div>
        <h1 className="font-display text-4xl">That listing is gone.</h1>
        <Link href={back} className="mt-3 inline-block text-sm font-semibold text-rust">
          {backLabel}
        </Link>
      </div>
    );
    return surface === "desk" ? <PageFrame>{missing}</PageFrame> : missing;
  }

  const band = getBand(snapshot.bandId);
  const mine =
    snapshot.role === "band"
      ? activeApplication(opportunity.id, snapshot.bandId, snapshot.applications)
      : undefined;
  const body = (
    <OpportunityBody
      opportunity={opportunity}
      bandName={band?.name}
      mine={mine}
      role={snapshot.role}
      back={back}
      backLabel={backLabel}
      stayHref={
        surface === "phone"
          ? `/phone/stay?city=${opportunity.citySlug}`
          : `/lodging/${opportunity.citySlug}?date=${opportunity.startDate}`
      }
      onApply={applyToOpportunity}
      onWithdraw={withdrawApplication}
      onConfirm={confirmApplication}
    />
  );
  return surface === "desk" ? <PageFrame>{body}</PageFrame> : body;
}

function OpportunityBody({
  opportunity,
  bandName,
  mine,
  role,
  back,
  backLabel,
  stayHref,
  onApply,
  onWithdraw,
  onConfirm,
}: {
  opportunity: Opportunity;
  bandName?: string;
  mine?: Application;
  role: Role;
  back: string;
  backLabel: string;
  stayHref: string;
  onApply: (id: string, input: { setup: string; note: string }) => { ok: true; data: string; warning?: string } | { ok: false; error: string };
  onWithdraw: (id: string) => { ok: true; data: string } | { ok: false; error: string };
  onConfirm: (id: string) => { ok: true; data: string } | { ok: false; error: string };
}) {
  const [setup, setSetup] = useState(setups[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const kind = opportunity.kind === "permit" ? "Street permit" : "Fair";

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = onApply(opportunity.id, { setup, note });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setOpen(false);
    toast(result.warning ?? "Application sent");
  }

  function confirmHold() {
    if (!mine) return;
    const result = onConfirm(mine.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast("Hold confirmed. Other talks on that date are closed.");
  }

  function withdraw() {
    if (!mine) return;
    const result = onWithdraw(mine.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast("Application withdrawn");
  }

  return (
    <div className="grid gap-4 pb-2">
      <Link href={back} className="text-sm font-semibold text-rust">
        {backLabel}
      </Link>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold tracking-wide text-cream uppercase">
            {kind}
          </span>
          <StatusPill status={mine?.status ?? "open"} />
        </div>
        <h1 className="mt-2 font-display text-4xl leading-[0.95] tracking-tight">{opportunity.title}</h1>
        <p className="mt-2 text-sm">
          {formatSpan(opportunity.startDate, opportunity.endDate)} · {opportunity.timeWindow}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {opportunity.location} · {opportunity.city}
        </p>
      </div>
      <p className="rounded-2xl bg-sand px-4 py-3 text-sm leading-relaxed">
        Sample listing. Not an official permit desk or festival application.
      </p>
      <dl className="grid gap-2 text-sm">
        <Fact label="Host" value={`${opportunity.host} · ${opportunity.contact}`} />
        <Fact label="Pay" value={opportunity.compensation} />
        <Fact label="Spots" value={opportunity.spots} />
        <Fact label="Deadline" value={opportunity.deadline ? formatDayLong(opportunity.deadline) : "None in this sample"} />
      </dl>
      <div className="flex flex-wrap gap-1.5">
        {opportunity.genres.map((genre) => (
          <span key={genre} className="rounded-full bg-sand px-2.5 py-1 text-xs font-medium">
            {genre}
          </span>
        ))}
      </div>
      <p className="text-sm leading-relaxed">{opportunity.notes}</p>
      <section className="rounded-2xl bg-pine p-4 text-cream">
        <p className="text-xs font-semibold tracking-[0.16em] text-amber uppercase">Rules in this sample</p>
        <p className="mt-2 text-sm leading-relaxed text-cream/90">{opportunity.rules}</p>
      </section>
      <Link href={stayHref} className="text-sm font-semibold text-rust">
        Sleeping notes for {opportunity.city.split(",")[0]}
      </Link>

      {mine ? (
        <section className="rounded-2xl border bg-card p-4">
          <h2 className="font-display text-2xl">
            {mine.status === "accepted" ? "You're on this one" : "Application in"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mine.setup}. {mine.note}
          </p>
          {mine.status === "applied" ? (
            <Button className="mt-3 h-11 w-full" onClick={confirmHold}>
              Mark this hold confirmed
            </Button>
          ) : null}
          <Button variant="outline" className="mt-3 h-11 w-full" onClick={withdraw}>
            Withdraw
          </Button>
        </section>
      ) : role === "band" ? (
        open ? (
          <form onSubmit={submit} className="grid gap-3 rounded-2xl border bg-cream p-4">
            <h2 className="font-display text-2xl">Apply as {bandName}</h2>
            <div className="grid gap-2">
              {setups.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={setup === item}
                  onClick={() => setSetup(item)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left text-sm font-medium",
                    setup === item ? "border-rust bg-accent" : "bg-card",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="The time you can play, what you bring, and where the van will sit."
            />
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="h-11">
              Send application
            </Button>
            <Button type="button" variant="ghost" className="h-10" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </form>
        ) : (
          <Button className="h-11" onClick={() => setOpen(true)}>
            Apply for this {opportunity.kind === "permit" ? "permit" : "fair"}
          </Button>
        )
      ) : (
        <p className="rounded-2xl bg-sand px-4 py-3 text-sm">
          Switch to a band to apply. Venues and players can read the call, not send it.
        </p>
      )}
    </div>
  );
}

function formatSpan(start: string, end: string) {
  if (start === end) return formatDayLong(start);
  return `${formatDay(start)} – ${formatDay(end)}`;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card px-3 py-2 ring-1 ring-border">
      <dt className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-0.5 leading-relaxed">{value}</dd>
    </div>
  );
}
