"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BedDouble, Clock3, Guitar, Ticket } from "lucide-react";
import { getBand, getVenue } from "@/lib/catalog";
import {
  dealDetails,
  dealHeadline,
  formatDayLong,
  formatTime,
  formatWhen,
  money,
} from "@/lib/deal";
import { canWithdraw, isYourMove } from "@/lib/queries";
import { useApp } from "@/lib/store";
import type { Terms } from "@/lib/types";
import { BillLineup } from "@/components/bills";
import { DealFields } from "@/components/deal-fields";
import { slotLine } from "@/lib/daypart";
import { BandMarks } from "@/components/originals";
import { PromoStudio } from "@/components/promo-studio";
import { TurnaroundNote } from "@/components/turnaround-note";
import { BandSamples } from "@/components/samples";
import { PageFrame } from "@/components/shell";
import { StatusPill, statusLabel } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function BookingRoom({ id }: { id: string }) {
  const { snapshot, counter, accept, decline } = useApp();
  const booking = snapshot.bookings.find((item) => item.id === id);
  const openDate = booking
    ? snapshot.openDates.find((item) => item.id === booking.openDateId)
    : undefined;
  const band = booking ? getBand(booking.bandId) : undefined;
  const venue = booking ? getVenue(booking.venueId) : undefined;
  const [terms, setTerms] = useState<Terms | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineNote, setDeclineNote] = useState("");
  const [acceptOpen, setAcceptOpen] = useState(false);

  if (!booking || !openDate || !band || !venue) {
    return (
      <PageFrame>
        <h1 className="font-display text-4xl">That booking isn&apos;t in this browser.</h1>
        <Button asChild className="mt-4 h-10">
          <Link href="/dashboard">Back to the desk</Link>
        </Button>
      </PageFrame>
    );
  }

  const yourMove = isYourMove(booking, snapshot);
  const involved = canWithdraw(booking, snapshot) || booking.status === "accepted";
  const draft = terms ?? { ...booking.terms, note: "" };

  function sendCounter(event: React.FormEvent) {
    event.preventDefault();
    const result = counter(booking!.id, draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setTerms(null);
    toast("Counter sent");
  }

  function confirmAccept() {
    const result = accept(booking!.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setAcceptOpen(false);
    toast("Gig confirmed");
  }

  function confirmDecline(event: React.FormEvent) {
    event.preventDefault();
    const result = decline(booking!.id, declineNote);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setDeclineOpen(false);
    toast("Declined");
  }

  return (
    <PageFrame>
      <Link href="/dashboard" className="text-sm font-medium text-rust">
        ← Desk
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusPill status={booking.status} />
        {yourMove ? (
          <span className="text-sm font-medium text-rust">Your move</span>
        ) : booking.awaiting ? (
          <span className="text-sm text-muted-foreground">
            Waiting on the {booking.awaiting}
          </span>
        ) : null}
      </div>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        {band.name} at {venue.name}
      </h1>
      <div className="mt-3">
        <BandMarks bandId={band.id} withInfo />
      </div>
      <p className="mt-2 text-lg text-muted-foreground">
        {formatDayLong(openDate.date)} · {slotLine(openDate.showTime, openDate.daypart)} · {venue.city}
      </p>
      <TurnaroundNote bookingId={booking.id} className="mt-2" />
      <BillLineup billId={booking.billId} surface="desk" />

      {booking.status === "accepted" ? (
        <>
        <Confirmation
          band={band.name}
          venue={venue.name}
          city={venue.city}
          date={openDate.date}
          showTime={openDate.showTime}
          citySlug={venue.citySlug}
          headline={dealHeadline(booking.terms)}
          details={dealDetails(booking.terms)}
          booker={`${venue.bookerName} · ${venue.bookerEmail} · ${venue.bookerPhone}`}
        />
        <div className="mt-6">
          <PromoStudio kind="booking" id={booking.id} />
        </div>
        </>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl border bg-card p-4 sm:p-5">
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Current terms
            </p>
            <p className="mt-2 font-display text-3xl">{dealHeadline(booking.terms)}</p>
            <ul className="mt-4 grid gap-2 text-sm">
              {dealDetails(booking.terms).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            {booking.terms.note ? (
              <p className="mt-4 rounded-xl bg-sand px-3 py-3 text-sm leading-relaxed">
                {booking.terms.note}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="outline" className="h-10">
                <Link href={`/lodging/${venue.citySlug}?date=${openDate.date}`}>
                  <BedDouble />
                  Lodging
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-10">
                <Link href={`/dates/${openDate.id}`}>Date listing</Link>
              </Button>
            </div>
            {!involved && snapshot.role !== "musician" ? (
              <p className="mt-4 text-sm text-muted-foreground">
                You&apos;re viewing this as someone who isn&apos;t on the bill. Switch roles to act.
              </p>
            ) : null}
          </section>
          <section className="rounded-2xl border bg-cream p-4 sm:p-5">
            <div className="mb-5">
              <BandSamples bandId={band.id} variant="listen" />
            </div>
            {yourMove ? (
              <div className="grid gap-5">
                <div>
                  <h2 className="font-display text-2xl">Answer the {statusLabel(booking.status).toLowerCase()}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Accept locks the date and declines other open talks for this time. A counter
                    sends the terms below back across the table.
                  </p>
                </div>
                <Button className="h-11" onClick={() => setAcceptOpen(true)}>
                  Accept these terms
                </Button>
                <form onSubmit={sendCounter} className="grid gap-4 border-t pt-4">
                  <h3 className="font-semibold">Or counter</h3>
                  <DealFields value={draft} onChange={setTerms} />
                  {error ? (
                    <p role="alert" className="text-sm text-destructive">
                      {error}
                    </p>
                  ) : null}
                  <Button type="submit" variant="secondary" className="h-11">
                    Send counter-offer
                  </Button>
                </form>
                <Button variant="ghost" className="h-10 justify-start px-0" onClick={() => setDeclineOpen(true)}>
                  Decline
                </Button>
              </div>
            ) : booking.status === "declined" ? (
              <p>This conversation is closed.</p>
            ) : involved ? (
              <div>
                <h2 className="font-display text-2xl">Waiting</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  The other side has the current terms. You can withdraw if the route changed.
                </p>
                <Button variant="outline" className="mt-4 h-10" onClick={() => setDeclineOpen(true)}>
                  Withdraw
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Switch to {band.name} or {venue.name} to negotiate.
              </p>
            )}
          </section>
        </div>
      )}

      <section className="mt-8">
        <h2 className="font-display text-2xl">History</h2>
        <ol className="mt-4 grid gap-3">
          {booking.events.map((item) => (
            <li key={item.id} className="rounded-xl border bg-card px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">
                  {item.actorName} · {item.kind}
                </p>
                <p className="text-xs text-muted-foreground">{formatWhen(item.at)}</p>
              </div>
              <p className="mt-1 text-sm">{dealHeadline(item.terms)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
            </li>
          ))}
        </ol>
      </section>

      <Dialog open={acceptOpen} onOpenChange={setAcceptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Confirm the gig</DialogTitle>
            <DialogDescription>
              {band.name} plays {venue.name} on {formatDayLong(openDate.date)} for{" "}
              {dealHeadline(booking.terms)}. Tickets {money(booking.terms.ticketPrice)}, load-in{" "}
              {formatTime(booking.terms.loadIn)}, {booking.terms.backline ? "backline in house" : "no backline"}.
            </DialogDescription>
          </DialogHeader>
          <Button className="h-11" onClick={confirmAccept}>
            Confirm booking
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Decline</DialogTitle>
            <DialogDescription>A sentence is enough. The other side will see it.</DialogDescription>
          </DialogHeader>
          <form onSubmit={confirmDecline} className="grid gap-3">
            <Textarea
              value={declineNote}
              onChange={(event) => setDeclineNote(event.target.value)}
              placeholder="Route changed, or the number doesn't work."
            />
            <Button type="submit" variant="destructive" className="h-10">
              Decline this gig
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
}

function Confirmation({
  band,
  venue,
  city,
  date,
  showTime,
  citySlug,
  headline,
  details,
  booker,
}: {
  band: string;
  venue: string;
  city: string;
  date: string;
  showTime: string;
  citySlug: string;
  headline: string;
  details: string[];
  booker: string;
}) {
  return (
    <section className="mt-6 overflow-hidden rounded-3xl bg-ink text-cream shadow-xl">
      <div className="flex items-start justify-between gap-4 px-5 py-6 sm:px-7">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-amber uppercase">
            Admit one · confirmed
          </p>
          <h2 className="mt-2 font-display text-4xl">{band}</h2>
          <p className="mt-1 text-cream/80">
            at {venue} · {city}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-cream/70">{formatDayLong(date)}</p>
          <p className="font-display text-2xl">{showTime}</p>
        </div>
      </div>
      <div className="border-t border-dashed border-cream/25 px-5 py-5 sm:px-7">
        <p className="font-display text-3xl">{headline}</p>
        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
          {details.map((line) => (
            <li key={line} className="flex items-center gap-2">
              {line.startsWith("Tickets") ? <Ticket className="size-4 text-amber" /> : null}
              {line.includes("Load-in") ? <Clock3 className="size-4 text-amber" /> : null}
              {line.toLowerCase().includes("backline") ? <Guitar className="size-4 text-amber" /> : null}
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-cream/75">Booker: {booker}</p>
        <Button asChild className="mt-5 h-10 bg-amber text-ink hover:bg-amber/90">
          <Link href={`/lodging/${citySlug}?date=${date}`}>
            <BedDouble />
            Where to sleep in {city}
          </Link>
        </Button>
      </div>
    </section>
  );
}
