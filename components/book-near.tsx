"use client";

import { useState } from "react";
import Link from "next/link";
import { datesNear } from "@/lib/book-near";
import { slotLine } from "@/lib/daypart";
import { monthParts } from "@/lib/deal";
import { todayIso } from "@/lib/fans";
import { usePlace } from "@/lib/place";
import { isYourMove } from "@/lib/queries";
import { MUSIC_LABEL, repertoireFor } from "@/lib/repertoire";
import { bandSize } from "@/lib/size";
import { useApp } from "@/lib/store";
import { sizeFit } from "@/lib/trust";
import { PlacePicker } from "@/components/place-picker";
import { FullBillMark } from "@/components/full-night";
import { PageFrame, PageIntro } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import { getBand, getVenue } from "@/lib/catalog";

export function BookNear({ surface }: { surface: "desk" | "phone" }) {
  const { snapshot } = useApp();
  const { place, radiusMiles, setPlace, setRadius } = usePlace();
  const [hideFilled, setHideFilled] = useState(true);
  const band = snapshot.role === "band" ? getBand(snapshot.bandId) : getBand(snapshot.bandId);
  const rows = datesNear(snapshot, place, radiusMiles, todayIso()).filter((row) => !hideFilled || row.fill !== "filled");
  const moves = snapshot.bookings.filter((booking) => isYourMove(booking, snapshot));
  const gigHref = (id: string) => (surface === "phone" ? `/phone/gig/${id}` : `/bookings/${id}`);
  const dateHref = (id: string) => (surface === "phone" ? `/phone/book/${id}` : `/dates/${id}`);
  const callsHref = surface === "phone" ? "/phone/book/calls" : "/dates?kind=calls";
  const music = band ? MUSIC_LABEL[repertoireFor(band.id, snapshot.repertoires).music] : null;
  const pieces = band ? bandSize(band, snapshot.sizes) : null;

  const body = (
    <div id="book-near" className="grid gap-4">
      {moves.length > 0 ? (
        <section className="grid gap-2">
          <h2 className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Your move</h2>
          <ul className="grid gap-2">
            {moves.slice(0, 3).map((booking) => {
              const room = getVenue(booking.venueId);
              const act = getBand(booking.bandId);
              return (
                <li key={booking.id}>
                  <Link href={gigHref(booking.id)} className="flex items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3">
                    <span>
                      <span className="block font-medium">
                        {act?.name} at {room?.name}
                      </span>
                      <span className="text-sm text-muted-foreground">Open the talk and accept, counter, or decline.</span>
                    </span>
                    <StatusPill status={booking.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      <PlacePicker place={place} onPlace={setPlace} radiusMiles={radiusMiles} onRadius={setRadius} label="Near" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {rows.length} open {rows.length === 1 ? "date" : "dates"} within {radiusMiles} miles
          {band && music && pieces != null
            ? ` · ${band.name} plays ${music.toLowerCase()} as ${pieces === 1 ? "a solo act" : `a ${pieces}-piece`}`
            : ""}
          .
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-rust"
            checked={hideFilled}
            onChange={(event) => setHideFilled(event.target.checked)}
          />
          Hide filled dates
        </label>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card px-4 py-10 text-center">
          <p className="font-display text-2xl">No open dates in that radius.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Widen the miles, or look at permits and fairs. Filled dates stay hidden until you uncheck that box.
          </p>
          <Link href={callsHref} className="mt-4 inline-flex h-10 items-center font-semibold text-rust">
            Permits and fairs
          </Link>
        </div>
      ) : (
        <ul className="grid gap-2">
          {rows.map((row) => {
            const parts = monthParts(row.openDate.date);
            const fit = pieces == null ? null : sizeFit(pieces, row.capacity);
            return (
              <li key={row.openDate.id}>
                <Link
                  href={dateHref(row.openDate.id)}
                  className="grid grid-cols-[72px_1fr] gap-3 rounded-2xl border bg-card p-3 hover:border-rust/40"
                >
                  <div className="rounded-xl bg-ink px-1 py-2 text-center text-cream">
                    <p className="text-[10px] tracking-[0.14em] text-amber uppercase">{parts.month}</p>
                    <p className="font-display text-2xl leading-none">{parts.day}</p>
                    <p className="text-[10px] text-cream/70">{parts.weekday}</p>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium leading-snug">{row.venue.name}</p>
                      <StatusPill status={row.fill} />
                    </div>
                    {row.openDate.fullBill ? (
                      <div className="mt-1">
                        <FullBillMark />
                      </div>
                    ) : null}
                    <p className="mt-1 text-sm text-muted-foreground">
                      {row.venue.city} · {row.miles} mi · {slotLine(row.openDate.showTime, row.openDate.daypart)}
                    </p>
                    <p className="mt-1 text-sm">
                      {row.capacity} capacity
                      {fit ? ` · ${fit.label}` : ""}
                      {music ? ` · ${music}` : ""}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-sm text-muted-foreground">
        Street permits and fairs sit in a separate list.{" "}
        <Link href={callsHref} className="font-semibold text-rust">
          Permits and fairs
        </Link>
      </p>
    </div>
  );

  if (surface === "phone") {
    return (
      <div className="grid gap-4 pb-2">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Book a gig</p>
          <h1 className="mt-1 font-display text-4xl leading-none tracking-tight">Dates near you</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Open a room, check capacity, size, and originals or covers, then send an offer. A room marked looking for a full bill wants the whole night in one pitch.
          </p>
        </div>
        {body}
      </div>
    );
  }

  return (
    <PageFrame>
      <PageIntro
        eyebrow="Book a gig"
        title="Dates near you"
        lede="Find an open date, check the room, and send an offer. A date marked looking for a full bill wants the whole night in one pitch. Confirming still writes the one-page agreement."
      />
      {body}
    </PageFrame>
  );
}
