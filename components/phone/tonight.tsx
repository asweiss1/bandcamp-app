"use client";

import Link from "next/link";
import { getMusician } from "@/lib/catalog";
import { dealHeadline, formatDay, monthParts } from "@/lib/deal";
import { listingOwner } from "@/lib/queries";
import { useApp } from "@/lib/store";
import { roleLabel } from "@/components/role-switcher";
import { StatusPill } from "@/components/status-pill";
import { slotLine } from "@/lib/daypart";
import { TurnaroundNote } from "@/components/turnaround-note";
import { counterpart, liveStops, nextStop, viewerStops, yourMoves } from "@/components/phone/stops";
import type { Stop } from "@/components/phone/stops";

export function Tonight() {
  const { snapshot } = useApp();
  if (snapshot.role === "musician") return <MusicianNight />;

  const name = roleLabel(snapshot.role, snapshot.bandId, snapshot.venueId, snapshot.musicianId, snapshot.fanId);
  const stops = viewerStops(snapshot);
  const live = liveStops(stops);
  const moves = yourMoves(stops, snapshot);
  const upcoming = nextStop(stops);
  const confirmed = live.filter((stop) => stop.booking.status === "accepted").length;
  const rest = live.filter((stop) => stop !== upcoming && !moves.includes(stop)).slice(0, 3);

  return (
    <div className="grid gap-5 pb-2">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Next up</p>
        <h1 className="mt-1 font-display text-4xl leading-none tracking-tight">{name}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {confirmed} confirmed {confirmed === 1 ? "date" : "dates"} on this route.
          {moves.length > 0
            ? ` ${moves.length} ${moves.length === 1 ? "conversation is" : "conversations are"} waiting on you.`
            : " Nothing is waiting on you."}
        </p>
      </div>

      {moves.length > 0 ? (
        <section className="grid gap-2">
          <h2 className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Your move</h2>
          {moves.map((stop) => (
            <MoveCard key={stop.booking.id} stop={stop} who={counterpart(stop, snapshot)} />
          ))}
        </section>
      ) : null}

      {upcoming ? (
        <section className="grid gap-2">
          <h2 className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            The next date
          </h2>
          <NextCard stop={upcoming} who={counterpart(upcoming, snapshot)} />
        </section>
      ) : (
        <EmptyRoute />
      )}

      {rest.length > 0 ? (
        <section className="grid gap-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              After that
            </h2>
            <Link href="/phone/route" className="text-xs font-semibold text-rust">
              Whole route
            </Link>
          </div>
          {rest.map((stop) => (
            <CompactStop key={stop.booking.id} stop={stop} who={counterpart(stop, snapshot)} />
          ))}
        </section>
      ) : (
        <Link href="/phone/route" className="text-sm font-semibold text-rust">
          Open the route
        </Link>
      )}
      <Applications />
    </div>
  );
}

function Applications() {
  const { snapshot } = useApp();
  if (snapshot.role !== "band") return null;
  const rows = snapshot.applications
    .filter((application) => application.bandId === snapshot.bandId && application.status !== "declined")
    .flatMap((application) => {
      const opportunity = snapshot.opportunities.find((item) => item.id === application.opportunityId);
      return opportunity ? [{ application, opportunity }] : [];
    })
    .sort((a, b) => a.opportunity.startDate.localeCompare(b.opportunity.startDate));
  if (rows.length === 0) return null;
  return (
    <section className="grid gap-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Permits and fairs
        </h2>
        <Link href="/phone/book" className="text-xs font-semibold text-rust">
          Browse
        </Link>
      </div>
      {rows.map(({ application, opportunity }) => (
        <Link
          key={application.id}
          href={`/phone/book/opp/${opportunity.id}`}
          className="flex items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3"
        >
          <span>
            <span className="block text-sm font-medium">{opportunity.title}</span>
            <span className="text-xs text-muted-foreground">
              {formatDay(opportunity.startDate)} · {opportunity.city}
            </span>
          </span>
          <StatusPill status={application.status} />
        </Link>
      ))}
    </section>
  );
}

function MusicianNight() {
  const { snapshot } = useApp();
  const musician = getMusician(snapshot.musicianId);
  const name = musician?.name ?? "Musician";
  const mine = snapshot.listings.filter((listing) => listingOwner(listing, snapshot));
  const open = snapshot.listings.filter((listing) => !listingOwner(listing, snapshot));
  const matched = musician
    ? open.filter((listing) =>
        musician.instruments.some((instrument) => {
          const needle = instrument.toLowerCase();
          const hay = listing.instrument.toLowerCase();
          return hay.includes(needle) || needle.includes(hay);
        }),
      )
    : open;
  const shown = (matched.length > 0 ? matched : open).slice(0, 4);

  return (
    <div className="grid gap-5 pb-2">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Next up</p>
        <h1 className="mt-1 font-display text-4xl leading-none tracking-tight">{name}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {musician
            ? `${musician.instruments.join(" · ")} · ${musician.city}. ${musician.availability}`
            : "Pick a player on the Profile tab."}
        </p>
      </div>
      <section className="grid gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            {matched.length > 0 ? "Calls that fit" : "On the board"}
          </h2>
          <Link href="/phone/board" className="text-xs font-semibold text-rust">
            All listings
          </Link>
        </div>
        {shown.length === 0 ? (
          <p className="rounded-2xl border bg-card px-4 py-4 text-sm text-muted-foreground">
            The board is empty in this browser.
          </p>
        ) : (
          shown.map((listing) => (
            <Link
              key={listing.id}
              href={`/phone/board/${listing.id}`}
              className="rounded-2xl border bg-card px-4 py-3"
            >
              <p className="font-medium leading-snug">{listing.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {listing.instrument} · {listing.city} · {listing.paid ? listing.payNote : "Unpaid"}
              </p>
            </Link>
          ))
        )}
      </section>
      {mine.length > 0 ? (
        <section className="grid gap-2">
          <h2 className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Your posts
          </h2>
          {mine.map((listing) => (
            <Link
              key={listing.id}
              href={`/phone/board/${listing.id}`}
              className="rounded-2xl border bg-card px-4 py-3 text-sm"
            >
              <span className="font-medium">{listing.title}</span>
              <span className="mt-1 block text-muted-foreground">{listing.dates}</span>
            </Link>
          ))}
        </section>
      ) : null}
      {musician ? (
        <Link
          href={`/phone/stay?city=${musician.citySlug}`}
          className="rounded-2xl bg-pine px-4 py-4 text-cream"
        >
          <span className="text-xs font-semibold tracking-[0.16em] text-amber uppercase">
            Where you are
          </span>
          <span className="mt-1 block font-display text-2xl">Sleeping notes for {musician.city}</span>
        </Link>
      ) : null}
    </div>
  );
}

function NextCard({ stop, who }: { stop: Stop; who: string }) {
  const parts = monthParts(stop.openDate.date);
  return (
    <article className="overflow-hidden rounded-3xl bg-ink text-cream">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-amber uppercase">
            {parts.weekday} · {slotLine(stop.openDate.showTime, stop.openDate.daypart)}
          </p>
          <h3 className="mt-1 font-display text-3xl leading-none">{who}</h3>
          <p className="mt-2 text-sm text-cream/70">
            {stop.city} · {formatDay(stop.openDate.date)}
          </p>
        </div>
        <div className="rounded-2xl bg-cream/10 px-3 py-2 text-center">
          <p className="text-[10px] font-semibold tracking-wide text-amber uppercase">{parts.month}</p>
          <p className="font-display text-2xl leading-none">{parts.day}</p>
        </div>
      </div>
      <div className="mt-4 border-t border-cream/15 px-4 py-4">
        <p className="font-display text-2xl">{dealHeadline(stop.booking.terms)}</p>
        <TurnaroundNote bookingId={stop.booking.id} className="mt-2 text-amber" />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusPill status={stop.booking.status} />
          <span className="text-sm text-cream/70">{stop.venueName}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href={`/phone/gig/${stop.booking.id}`}
            className="grid h-11 place-items-center rounded-lg bg-amber text-sm font-semibold text-ink"
          >
            Open the gig
          </Link>
          <Link
            href={`/phone/stay?city=${stop.citySlug}`}
            className="grid h-11 place-items-center rounded-lg border border-cream/25 text-sm font-semibold"
          >
            Where to sleep
          </Link>
        </div>
      </div>
    </article>
  );
}

function MoveCard({ stop, who }: { stop: Stop; who: string }) {
  return (
    <Link
      href={`/phone/gig/${stop.booking.id}`}
      className="block rounded-2xl border border-rust/40 bg-accent px-4 py-3"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">{who}</p>
        <StatusPill status={stop.booking.status} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatDay(stop.openDate.date)} · {stop.city} · {dealHeadline(stop.booking.terms)}
      </p>
      <p className="mt-2 text-sm font-semibold text-rust">Answer this</p>
    </Link>
  );
}

function CompactStop({ stop, who }: { stop: Stop; who: string }) {
  return (
    <Link href={`/phone/gig/${stop.booking.id}`} className="flex items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3">
      <span>
        <span className="block text-sm font-medium">{who}</span>
        <span className="text-xs text-muted-foreground">
          {formatDay(stop.openDate.date)} · {stop.city}
        </span>
      </span>
      <StatusPill status={stop.booking.status} />
    </Link>
  );
}

function EmptyRoute() {
  return (
    <div className="rounded-2xl border bg-card px-4 py-4">
      <p className="font-medium">No dates on this route yet.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Find an open date and send a request, or switch who you are on the You tab.
      </p>
      <Link href="/phone/book" className="mt-3 inline-block text-sm font-semibold text-rust">
        Book a date
      </Link>
    </div>
  );
}
