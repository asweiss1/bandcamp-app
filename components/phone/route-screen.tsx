"use client";

import Link from "next/link";
import { cities, getVenue } from "@/lib/catalog";
import { dealHeadline, formatDay } from "@/lib/deal";
import { dateFill } from "@/lib/queries";
import { useApp } from "@/lib/store";
import { StatusPill } from "@/components/status-pill";
import { counterpart, liveStops, viewerStops } from "@/components/phone/stops";

export function PhoneRoute() {
  const { snapshot } = useApp();
  if (snapshot.role === "musician") return <MusicianRoute />;

  const stops = liveStops(viewerStops(snapshot));
  const openDates =
    snapshot.role === "venue"
      ? snapshot.openDates
          .filter((date) => date.venueId === snapshot.venueId)
          .filter((date) => dateFill(date.id, snapshot.bookings) !== "filled")
          .sort((a, b) => a.date.localeCompare(b.date))
      : [];

  return (
    <div className="grid gap-4 pb-2">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Route</p>
        <h1 className="mt-1 font-display text-4xl leading-none tracking-tight">
          {snapshot.role === "band" ? "Cities in order" : "Nights at the room"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {stops.length === 0
            ? "Declined talks stay off this list."
            : `${stops.length} live ${stops.length === 1 ? "stop" : "stops"}, drive order.`}
        </p>
      </div>
      {stops.length === 0 ? (
        <p className="rounded-2xl border bg-card px-4 py-4 text-sm text-muted-foreground">
          Nothing confirmed or in talks. Open dates live on the desk.
        </p>
      ) : (
        <ol>
          {stops.map((stop, index) => {
            const previous = stops[index - 1];
            const hop = previous && previous.city !== stop.city;
            return (
              <li key={stop.booking.id}>
                {hop ? (
                  <p className="ml-5 border-l border-dashed border-rust/50 py-2 pl-4 text-xs text-muted-foreground">
                    Drive {previous.city} → {stop.city}
                  </p>
                ) : null}
                <Link
                  href={`/phone/gig/${stop.booking.id}`}
                  className="flex gap-3 rounded-2xl border bg-card px-3 py-3"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink font-display text-amber">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="font-medium leading-snug">{counterpart(stop, snapshot)}</span>
                      <StatusPill status={stop.booking.status} />
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {formatDay(stop.openDate.date)} · {stop.openDate.showTime} · {stop.city}
                    </span>
                    <span className="mt-1 block text-sm">{dealHeadline(stop.booking.terms)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
      {openDates.length > 0 ? (
        <section className="grid gap-2">
          <h2 className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Still open at your room
          </h2>
          {openDates.map((date) => {
            const venue = getVenue(date.venueId);
            return (
              <Link
                key={date.id}
                href={`/phone/book/${date.id}`}
                className="rounded-2xl border bg-card px-4 py-3"
              >
                <p className="font-medium">
                  {formatDay(date.date)} · {date.slot}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {venue?.city} · {date.showTime} · {date.genres.slice(0, 2).join(", ")}
                </p>
              </Link>
            );
          })}
        </section>
      ) : null}
      <p className="text-xs leading-relaxed text-muted-foreground">
        Same bookings as the desk. A reply here shows up there.
      </p>
    </div>
  );
}

function MusicianRoute() {
  return (
    <div className="grid gap-4 pb-2">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Route</p>
        <h1 className="mt-1 font-display text-4xl leading-none tracking-tight">No van on this profile</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A route is the band&apos;s holds, in drive order. Switch to a band on the You tab to see Mesa Dust&apos;s run, or stay here and work the board.
        </p>
      </div>
      <Link href="/phone/you" className="grid h-11 place-items-center rounded-lg bg-ink text-sm font-semibold text-cream">
        Switch who you are
      </Link>
      <section className="grid gap-2">
        <h2 className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Cities in the sample
        </h2>
        {cities.map((city) => (
          <Link
            key={city.slug}
            href={`/phone/stay?city=${city.slug}`}
            className="rounded-2xl border bg-card px-4 py-3"
          >
            <p className="font-medium">{city.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{city.blurb}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
