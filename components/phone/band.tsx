"use client";

import Link from "next/link";
import { getBand, getVenue } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import { BandLinks } from "@/components/band-links";
import { BandMarks } from "@/components/originals";
import { TurnaroundNote } from "@/components/turnaround-note";
import { slotLine } from "@/lib/daypart";
import { StatusPill } from "@/components/status-pill";

export function PhoneBand({ id }: { id: string }) {
  const { snapshot } = useApp();
  const band = getBand(id);
  if (!band) {
    return (
      <div className="pb-2">
        <h1 className="font-display text-4xl">No band by that name.</h1>
        <Link href="/phone/bands" className="mt-3 inline-block text-sm font-semibold text-rust">
          Back to bands
        </Link>
      </div>
    );
  }
  const gigs = snapshot.bookings.filter((booking) => {
    if (booking.status === "declined") return false;
    if (booking.bandId === band.id) return true;
    const bill = booking.billId ? snapshot.bills.find((item) => item.id === booking.billId) : undefined;
    return bill?.members.some((member) => member.bandId === band.id) ?? false;
  });
  const bills = snapshot.bills.filter((bill) => bill.members.some((member) => member.bandId === band.id));

  return (
    <div className="grid gap-4 pb-2">
      <Link href="/phone/bands" className="text-sm font-semibold text-rust">
        ← Bands
      </Link>
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">{band.city}</p>
        <h1 className="mt-1 font-display text-4xl leading-none tracking-tight">{band.name}</h1>
        <div className="mt-2">
          <BandMarks bandId={band.id} withInfo />
        </div>
        <p className="mt-2 text-sm leading-relaxed">{band.bio}</p>
      </div>
      <ul className="grid gap-2">
        {band.members.map((member) => (
          <li key={member.name} className="rounded-2xl border bg-card px-4 py-3">
            <p className="font-medium">{member.name}</p>
            <p className="text-sm text-muted-foreground">{member.role}</p>
          </li>
        ))}
      </ul>
      <BandLinks bandId={band.id} surface="phone" />
      {bills.length > 0 ? (
        <section>
          <h2 className="font-display text-2xl">Bills</h2>
          <ul className="mt-2 grid gap-2">
            {bills.map((bill) => (
              <li key={bill.id}>
                <Link href={`/phone/book/bills/${bill.id}`} className="block rounded-2xl border bg-card px-4 py-3">
                  <p className="font-medium">{bill.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {bill.members.find((member) => member.bandId === band.id)?.role} ·{" "}
                    {bill.members.find((member) => member.bandId === band.id)?.splitPercent}%
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {gigs.length > 0 ? (
        <section>
          <h2 className="font-display text-2xl">On the book</h2>
          <ul className="mt-2 grid gap-2">
            {gigs.map((booking) => {
              const openDate = snapshot.openDates.find((item) => item.id === booking.openDateId);
              const venue = getVenue(booking.venueId);
              return (
                <li key={booking.id} className="rounded-2xl border bg-card px-4 py-3">
                  <Link href={`/phone/gig/${booking.id}`} className="flex items-center justify-between gap-2">
                    <span className="text-sm">
                      {openDate ? `${openDate.date} · ${slotLine(openDate.showTime, openDate.daypart)}` : "Date"} · {venue?.name}
                    </span>
                    <StatusPill status={booking.status} />
                  </Link>
                  <TurnaroundNote bookingId={booking.id} className="mt-2" />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
