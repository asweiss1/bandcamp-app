import Link from "next/link";
import { getBand, getVenue } from "@/lib/catalog";
import { dealHeadline, formatDay } from "@/lib/deal";
import type { Booking, OpenDate } from "@/lib/types";
import { OriginalsBadge } from "@/components/originals";
import { BandSamples } from "@/components/samples";
import { StatusPill } from "@/components/status-pill";

export function BookingRow({
  booking,
  openDate,
  emphasize,
}: {
  booking: Booking;
  openDate?: OpenDate;
  emphasize?: string;
}) {
  const band = getBand(booking.bandId);
  const venue = getVenue(booking.venueId);
  return (
    <article className="grid gap-3 rounded-2xl border bg-card p-4 transition hover:border-rust/40 hover:bg-cream sm:grid-cols-[120px_1fr_auto] sm:items-center">
      <Link
        href={`/bookings/${booking.id}`}
        className="contents"
      >
      <div>
        <p className="font-display text-xl">{openDate ? formatDay(openDate.date) : "Date"}</p>
        <p className="text-sm text-muted-foreground">{openDate?.showTime}</p>
      </div>
      <div>
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          {band?.name} at {venue?.name}
          {band ? <OriginalsBadge bandId={band.id} /> : null}
        </p>
        <p className="text-sm text-muted-foreground">
          {venue?.city} · {dealHeadline(booking.terms)}
        </p>
        {emphasize ? <p className="mt-1 text-sm font-medium text-rust">{emphasize}</p> : null}
      </div>
      <StatusPill status={booking.status} />
      </Link>
      <div className="sm:col-span-3">
        <BandSamples bandId={booking.bandId} variant="compact" />
      </div>
    </article>
  );
}
