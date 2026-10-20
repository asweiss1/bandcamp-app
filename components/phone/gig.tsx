"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BedDouble, Clock3, Guitar, Ticket } from "lucide-react";
import { getBand, getVenue } from "@/lib/catalog";
import { dealDetails, dealHeadline, formatDayLong, formatTime } from "@/lib/deal";
import { canWithdraw, isYourMove } from "@/lib/queries";
import { useApp } from "@/lib/store";
import type { Terms } from "@/lib/types";
import { BillLineup } from "@/components/bills";
import { PeerReviews } from "@/components/peer-review";
import { DealFields } from "@/components/deal-fields";
import { slotLine } from "@/lib/daypart";
import { BandMarks } from "@/components/originals";
import { TurnaroundNote } from "@/components/turnaround-note";
import { DrawNote } from "@/components/draw-note";
import { PromoStudio } from "@/components/promo-studio";
import { BandSamples } from "@/components/samples";
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

export function PhoneGig({ id }: { id: string }) {
  const { snapshot, counter, accept, decline } = useApp();
  const booking = snapshot.bookings.find((item) => item.id === id);
  const openDate = booking
    ? snapshot.openDates.find((item) => item.id === booking.openDateId)
    : undefined;
  const band = booking ? getBand(booking.bandId) : undefined;
  const venue = booking ? getVenue(booking.venueId) : undefined;
  const [terms, setTerms] = useState<Terms | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [counterOpen, setCounterOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineNote, setDeclineNote] = useState("");
  const [acceptOpen, setAcceptOpen] = useState(false);

  if (!booking || !openDate || !band || !venue) {
    return (
      <div className="pb-2">
        <h1 className="font-display text-4xl">That gig isn&apos;t in this browser.</h1>
        <Link href="/phone" className="mt-3 inline-block text-sm font-semibold text-rust">
          Back to next up
        </Link>
      </div>
    );
  }

  const yourMove = isYourMove(booking, snapshot);
  const involved = canWithdraw(booking, snapshot);
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
    setCounterOpen(false);
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
    toast(yourMove ? "Declined" : "Withdrawn");
  }

  return (
    <div className="grid gap-4 pb-2">
      <Link href="/phone" className="text-sm font-semibold text-rust">
        ← Next up
      </Link>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={booking.status} />
          {yourMove ? (
            <span className="text-sm font-semibold text-rust">Your move</span>
          ) : booking.awaiting ? (
            <span className="text-sm text-muted-foreground">Waiting on the {booking.awaiting}</span>
          ) : null}
        </div>
        <h1 className="mt-2 font-display text-4xl leading-[0.95] tracking-tight">
          {band.name} at {venue.name}
        </h1>
        <div className="mt-2">
          <BandMarks bandId={band.id} withInfo />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {formatDayLong(openDate.date)} · {slotLine(openDate.showTime, openDate.daypart)} · {venue.city}
        </p>
        <TurnaroundNote bookingId={booking.id} className="mt-2" />
        <DrawNote
          bandIds={
            booking.billId
              ? snapshot.bills.find((item) => item.id === booking.billId)?.members.map((member) => member.bandId) ?? [band.id]
              : [band.id]
          }
          venueId={venue.id}
          bookingId={booking.id}
          confirmed={booking.status === "accepted"}
        />
        <BillLineup billId={booking.billId} surface="phone" />
        <PeerReviews bookingId={booking.id} />
      </div>

      {booking.status === "accepted" ? (
        <>
        <TicketCard
          band={band.name}
          venue={venue.name}
          city={venue.city}
          citySlug={venue.citySlug}
          date={openDate.date}
          showTime={openDate.showTime}
          headline={dealHeadline(booking.terms)}
          details={dealDetails(booking.terms)}
          booker={`${venue.bookerName} · ${venue.bookerPhone}`}
          agreementHref={`/phone/gig/${booking.id}/agreement`}
        />
        <PromoStudio kind="booking" id={booking.id} />
        </>
      ) : (
        <>
          <BandSamples bandId={band.id} variant="listen" />
          <section className="rounded-2xl border bg-card p-4">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Current terms
            </p>
            <p className="mt-1 font-display text-3xl leading-none">{dealHeadline(booking.terms)}</p>
            <ul className="mt-3 grid gap-1.5 text-sm">
              {dealDetails(booking.terms).map((line) => (
                <li key={line} className="flex items-center gap-2">
                  {line.startsWith("Tickets") ? <Ticket className="size-4 text-rust" /> : null}
                  {line.includes("Load-in") ? <Clock3 className="size-4 text-rust" /> : null}
                  {line.toLowerCase().includes("backline") ? <Guitar className="size-4 text-rust" /> : null}
                  {line}
                </li>
              ))}
            </ul>
            {booking.terms.note ? (
              <p className="mt-3 rounded-xl bg-sand px-3 py-3 text-sm leading-relaxed">{booking.terms.note}</p>
            ) : null}
            <p className="mt-3 text-xs text-muted-foreground">
              Load-in {formatTime(booking.terms.loadIn)} · {openDate.slot} · {openDate.age}
            </p>
          </section>

          <Link
            href={`/phone/stay?city=${venue.citySlug}`}
            className="flex items-center gap-2 rounded-2xl border bg-card px-4 py-3 text-sm font-semibold"
          >
            <BedDouble className="size-4 text-rust" />
            Sleeping notes for {venue.city}
          </Link>

          {yourMove ? (
            <section className="grid gap-3">
              <Button className="h-11" onClick={() => setAcceptOpen(true)}>
                Accept these terms
              </Button>
              {counterOpen ? (
                <form onSubmit={sendCounter} className="grid gap-3 rounded-2xl border bg-cream p-4">
                  <h2 className="font-display text-2xl">Counter</h2>
                  <DealFields value={draft} onChange={setTerms} />
                  {error ? (
                    <p role="alert" className="text-sm text-destructive">
                      {error}
                    </p>
                  ) : null}
                  <Button type="submit" variant="secondary" className="h-11">
                    Send counter-offer
                  </Button>
                  <Button type="button" variant="ghost" className="h-10" onClick={() => setCounterOpen(false)}>
                    Keep the current terms
                  </Button>
                </form>
              ) : (
                <Button variant="secondary" className="h-11" onClick={() => setCounterOpen(true)}>
                  Counter the {statusLabel(booking.status).toLowerCase()}
                </Button>
              )}
              <Button variant="ghost" className="h-10" onClick={() => setDeclineOpen(true)}>
                Decline
              </Button>
            </section>
          ) : booking.status === "declined" ? (
            <p className="rounded-2xl bg-sand px-4 py-3 text-sm">This conversation is closed.</p>
          ) : involved ? (
            <section className="rounded-2xl border bg-cream p-4">
              <h2 className="font-display text-2xl">Waiting</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                The other side has the current terms. Withdraw if the route changed.
              </p>
              <Button variant="outline" className="mt-3 h-11 w-full" onClick={() => setDeclineOpen(true)}>
                Withdraw
              </Button>
            </section>
          ) : (
            <p className="rounded-2xl bg-sand px-4 py-3 text-sm">
              You&apos;re not on this bill. Switch who you are on the You tab to answer it.
            </p>
          )}
        </>
      )}

      <Dialog open={acceptOpen} onOpenChange={setAcceptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Confirm this gig</DialogTitle>
            <DialogDescription>
              Accepting locks {formatDayLong(openDate.date)} and declines other open talks for this time.
            </DialogDescription>
          </DialogHeader>
          <p className="font-display text-2xl">{dealHeadline(booking.terms)}</p>
          <Button className="h-11" onClick={confirmAccept}>
            Confirm booking
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{yourMove ? "Decline" : "Withdraw"}</DialogTitle>
            <DialogDescription>A sentence is enough. The other side will see it.</DialogDescription>
          </DialogHeader>
          <form onSubmit={confirmDecline} className="grid gap-3">
            <Textarea
              value={declineNote}
              onChange={(event) => setDeclineNote(event.target.value)}
              placeholder="Route changed, or the number doesn't work."
            />
            <Button type="submit" variant="destructive" className="h-11">
              {yourMove ? "Decline this gig" : "Withdraw"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TicketCard({
  band,
  venue,
  city,
  citySlug,
  date,
  showTime,
  headline,
  details,
  booker,
  agreementHref,
}: {
  band: string;
  venue: string;
  city: string;
  citySlug: string;
  date: string;
  showTime: string;
  headline: string;
  details: string[];
  booker: string;
  agreementHref: string;
}) {
  return (
    <section className="overflow-hidden rounded-3xl bg-ink text-cream">
      <div className="px-4 py-5">
        <p className="text-xs font-semibold tracking-[0.2em] text-amber uppercase">Admit one · confirmed</p>
        <h2 className="mt-2 font-display text-3xl">{band}</h2>
        <p className="mt-1 text-sm text-cream/75">
          at {venue} · {city}
        </p>
        <p className="mt-3 font-display text-xl">
          {formatDayLong(date)} · {showTime}
        </p>
      </div>
      <div className="border-t border-dashed border-cream/25 px-4 py-4">
        <p className="font-display text-2xl">{headline}</p>
        <ul className="mt-3 grid gap-1.5 text-sm">
          {details.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-cream/70">Booker: {booker}</p>
        <Link
          href={agreementHref}
          className="mt-4 grid h-11 place-items-center rounded-lg bg-amber text-sm font-semibold text-ink"
        >
          Gig agreement
        </Link>
        <Link
          href={`/phone/stay?city=${citySlug}`}
          className="mt-2 grid h-11 place-items-center rounded-lg border border-cream/30 text-sm font-semibold text-cream"
        >
          Where to sleep in {city}
        </Link>
      </div>
    </section>
  );
}
