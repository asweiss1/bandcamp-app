"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getBand, getVenue } from "@/lib/catalog";
import { dealHeadline, defaultTerms, formatDayLong } from "@/lib/deal";
import { activeBooking, dateFill } from "@/lib/queries";
import { useApp } from "@/lib/store";
import type { Terms } from "@/lib/types";
import { DealFields } from "@/components/deal-fields";
import { OriginalsBadge } from "@/components/originals";
import { BandSamples } from "@/components/samples";
import { PageFrame } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";

export function DateDetail({ id }: { id: string }) {
  const router = useRouter();
  const { snapshot, requestDate } = useApp();
  const openDate = snapshot.openDates.find((item) => item.id === id);
  const venue = openDate ? getVenue(openDate.venueId) : undefined;
  const band = getBand(snapshot.bandId);
  const [terms, setTerms] = useState<Terms>(() =>
    defaultTerms({
      guarantee: band ? Math.round((band.feeMin + band.feeMax) / 2) : 800,
      note: "",
    }),
  );
  const [error, setError] = useState<string | null>(null);

  if (!openDate || !venue) {
    return (
      <PageFrame>
        <h1 className="font-display text-4xl">That date isn&apos;t on the board.</h1>
        <Button asChild className="mt-4 h-10">
          <Link href="/dates">Back to open dates</Link>
        </Button>
      </PageFrame>
    );
  }

  const fill = dateFill(openDate.id, snapshot.bookings);
  const mine =
    snapshot.role === "band" ? activeBooking(openDate.id, snapshot.bandId, snapshot.bookings) : undefined;
  const related = snapshot.bookings.filter(
    (booking) => booking.openDateId === openDate.id && booking.status !== "declined",
  );
  const ownsVenue = snapshot.role === "venue" && snapshot.venueId === venue.id;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = requestDate(openDate!.id, terms);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast("Request sent");
    router.push(`/bookings/${result.data}`);
  }

  return (
    <PageFrame>
      <Link href="/dates" className="text-sm font-medium text-rust">
        ← All open dates
      </Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={fill} />
            <span className="text-sm text-muted-foreground">
              {openDate.age} · {openDate.slot}
            </span>
          </div>
          <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">{venue.name}</h1>
          <p className="mt-2 text-lg">
            {formatDayLong(openDate.date)} · doors around {openDate.showTime}
          </p>
          <p className="mt-1 text-muted-foreground">
            {venue.neighborhood}, {venue.city} · {venue.capacity} capacity
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {openDate.genres.map((genre) => (
              <span key={genre} className="rounded-full bg-sand px-2.5 py-1 text-xs font-medium">
                {genre}
              </span>
            ))}
          </div>
          <p className="mt-5 max-w-xl text-base leading-relaxed">{openDate.notes}</p>
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <Fact label="Typical deal" value={venue.typicalDeal} />
            <Fact label="Backline" value={venue.backline} />
            <Fact label="Load-in" value={venue.loadInNotes} />
            <Fact
              label="Booker"
              value={`${venue.bookerName} · ${venue.bookerEmail} · ${venue.bookerPhone}`}
            />
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild variant="outline" className="h-10">
              <Link href={`/venues/${venue.id}`}>Venue profile</Link>
            </Button>
            <Button asChild variant="outline" className="h-10">
              <Link href={`/lodging/${venue.citySlug}?date=${openDate.date}`}>
                Lodging in {venue.city}
              </Link>
            </Button>
          </div>
          {related.length > 0 ? (
            <div className="mt-8">
              <h2 className="font-display text-2xl">Conversations</h2>
              <div className="mt-3 grid gap-2">
                {related.map((booking) => {
                  const other = getBand(booking.bandId);
                  const visible =
                    ownsVenue ||
                    (snapshot.role === "band" && booking.bandId === snapshot.bandId);
                  if (!visible) return null;
                  return (
                    <article key={booking.id} className="rounded-xl border bg-card px-3 py-3">
                      <Link href={`/bookings/${booking.id}`} className="flex items-center justify-between gap-3">
                        <span>
                          <span className="flex flex-wrap items-center gap-2 font-medium">
                            {other?.name}
                            {other ? <OriginalsBadge bandId={other.id} /> : null}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {dealHeadline(booking.terms)}
                          </span>
                        </span>
                        <StatusPill status={booking.status} />
                      </Link>
                      {other ? <BandSamples bandId={other.id} variant="compact" /> : null}
                    </article>
                  );
                })}
                {related.every(
                  (booking) =>
                    !(
                      ownsVenue ||
                      (snapshot.role === "band" && booking.bandId === snapshot.bandId)
                    ),
                ) ? (
                  <p className="text-sm text-muted-foreground">
                    Another band is already talking with this room.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
        <aside className="h-fit rounded-2xl border bg-card p-4 sm:p-5">
          {fill === "filled" ? (
            <p className="text-sm leading-relaxed">
              This date is confirmed. The room is off the market unless someone declines, which
              confirmed gigs don&apos;t do from this screen.
            </p>
          ) : mine ? (
            <div>
              <h2 className="font-display text-2xl">You&apos;re already in talks</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Pick up the negotiation instead of sending a second request.
              </p>
              <Button asChild className="mt-4 h-10">
                <Link href={`/bookings/${mine.id}`}>Open the booking</Link>
              </Button>
            </div>
          ) : snapshot.role === "band" ? (
            <form onSubmit={submit} className="grid gap-4">
              <div>
                <h2 className="font-display text-2xl">Request this date</h2>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  Sending as {band?.name}. The venue can accept, decline, or counter.
                  {band ? <OriginalsBadge bandId={band.id} withInfo /> : null}
                </p>
              </div>
              <DealFields value={terms} onChange={setTerms} />
              {error ? (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="h-11">
                Send gig request
              </Button>
            </form>
          ) : ownsVenue ? (
            <div>
              <h2 className="font-display text-2xl">Your date</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Offers go out from a band&apos;s profile. Incoming requests show up here and on
                your desk.
              </p>
              <Button asChild className="mt-4 h-10">
                <Link href="/bands">Find a band to offer</Link>
              </Button>
            </div>
          ) : (
            <div>
              <h2 className="font-display text-2xl">Read only</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Switch to a band to request this date, or to this venue to answer one.
              </p>
            </div>
          )}
        </aside>
      </div>
    </PageFrame>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-sand/70 px-3 py-3">
      <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 text-sm leading-relaxed">{value}</dd>
    </div>
  );
}
