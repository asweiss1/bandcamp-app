"use client";

import Link from "next/link";
import { getBand, getVenue } from "@/lib/catalog";
import { formatDay } from "@/lib/deal";
import { dateFill } from "@/lib/queries";
import { useApp } from "@/lib/store";
import { PageFrame, PageIntro } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import { TourOverview } from "@/components/tour-overview";
import { Button } from "@/components/ui/button";

export function TourView() {
  const { snapshot } = useApp();
  const band = getBand(snapshot.bandId);
  const stops = snapshot.bookings
    .filter((booking) => booking.bandId === snapshot.bandId && booking.status !== "declined")
    .map((booking) => ({
      booking,
      openDate: snapshot.openDates.find((item) => item.id === booking.openDateId),
    }))
    .filter((stop) => stop.openDate)
    .sort((a, b) => a.openDate!.date.localeCompare(b.openDate!.date));

  const first = stops[0]?.openDate?.date;
  const last = stops[stops.length - 1]?.openDate?.date;
  const windowEnd = last ? shift(last, 7) : undefined;
  const held = new Set(stops.map((stop) => stop.openDate!.id));
  const alternates =
    first && windowEnd
      ? snapshot.openDates
          .filter((openDate) => openDate.date >= first && openDate.date <= windowEnd && !held.has(openDate.id))
          .filter((openDate) => dateFill(openDate.id, snapshot.bookings) !== "filled")
          .sort((a, b) => a.date.localeCompare(b.date))
      : [];

  if (!band) return null;

  return (
    <PageFrame>
      <PageIntro
        eyebrow={band.touring ? "Touring band" : "Local band"}
        title={`${band.name}'s route`}
        lede={
          snapshot.role === "band"
            ? `${band.availability} The map, the dates, and the rooms in between, including days with no gig.`
            : `Showing ${band.name} because that band is selected. Switch to a band role to mark lodging.`
        }
        actions={
          <>
            <Button asChild className="h-10">
              <Link href="/plan">Plan a tour</Link>
            </Button>
            <Button asChild variant="outline" className="h-10">
              <Link href={`/bands/${band.id}`}>Band profile</Link>
            </Button>
          </>
        }
      />
      <TourOverview surface="desk" />
      {alternates.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-3xl">Other rooms in this window</h2>
          <p className="mt-1 mb-4 max-w-2xl text-sm text-muted-foreground">
            Open or in-talks dates between the first hold and a week after the last one. Useful
            when a city falls out and the van still needs a room.
          </p>
          <div className="grid gap-2">
            {alternates.map((openDate) => {
              const venue = getVenue(openDate.venueId);
              if (!venue) return null;
              return (
                <Link
                  key={openDate.id}
                  href={`/dates/${openDate.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3"
                >
                  <span>
                    <span className="block font-medium">
                      {formatDay(openDate.date)} · {venue.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {venue.city} · {openDate.slot}
                    </span>
                  </span>
                  <StatusPill status={dateFill(openDate.id, snapshot.bookings)} />
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
      <Applications bandId={snapshot.bandId} />
    </PageFrame>
  );
}

function Applications({ bandId }: { bandId: string }) {
  const { snapshot } = useApp();
  const rows = snapshot.applications
    .filter((application) => application.bandId === bandId && application.status !== "declined")
    .flatMap((application) => {
      const opportunity = snapshot.opportunities.find((item) => item.id === application.opportunityId);
      return opportunity ? [{ application, opportunity }] : [];
    })
    .sort((a, b) => a.opportunity.startDate.localeCompare(b.opportunity.startDate));
  if (rows.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="font-display text-3xl">Permits and fairs</h2>
      <p className="mt-1 mb-4 max-w-2xl text-sm text-muted-foreground">
        Street-performance windows and festival calls already on this band&apos;s list. Sample listings, not official applications.
      </p>
      <div className="grid gap-2">
        {rows.map(({ application, opportunity }) => (
          <Link
            key={application.id}
            href={`/opportunities/${opportunity.id}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3"
          >
            <span>
              <span className="block font-medium">{opportunity.title}</span>
              <span className="text-sm text-muted-foreground">
                {formatDay(opportunity.startDate)} · {opportunity.city} · {opportunity.kind === "permit" ? "Street permit" : "Fair"}
              </span>
            </span>
            <StatusPill status={application.status} />
          </Link>
        ))}
      </div>
    </section>
  );
}

function shift(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
