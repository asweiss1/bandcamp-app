"use client";

import Link from "next/link";
import { toast } from "sonner";
import { calendarIcs, publicShow, rsvpCounts, rsvpFor } from "@/lib/fans";
import { useApp } from "@/lib/store";
import type { RsvpStatus } from "@/lib/types";
import { PromoStudio } from "@/components/promo-studio";
import { PageFrame } from "@/components/shell";
import { Button } from "@/components/ui/button";

export function ShowPage({ id, surface }: { id: string; surface: "desk" | "phone" }) {
  const { snapshot, setRsvp } = useApp();
  const show = publicShow(snapshot, id);
  const back = surface === "phone" ? "/phone" : "/shows";
  if (!show) {
    const missing = (
      <div>
        <h1 className="font-display text-4xl">This show isn&apos;t public.</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Pending talks stay between the band and the venue. A show appears here after it is confirmed.
        </p>
        <Link href={back} className="mt-4 inline-block text-sm font-semibold text-rust">
          Back to shows
        </Link>
      </div>
    );
    return surface === "phone" ? missing : <PageFrame>{missing}</PageFrame>;
  }
  const mine = snapshot.role === "fan" ? rsvpFor(snapshot.rsvps, snapshot.fanId, show.bookingId) : null;
  const counts = rsvpCounts(snapshot.rsvps, show.bookingId);
  const bandHref = (bandId: string) => (surface === "phone" ? `/phone/bands/${bandId}` : `/bands/${bandId}`);
  const venueHref = surface === "phone" ? `/venues/${show.venueId}` : `/venues/${show.venueId}`;

  function choose(status: RsvpStatus) {
    const result = setRsvp(show!.bookingId, status);
    if (!result.ok) toast.error(result.error);
  }

  async function share() {
    const url = `${window.location.origin}${surface === "phone" ? `/phone/shows/${show!.bookingId}` : `/shows/${show!.bookingId}`}`;
    const text = `${show!.title} · ${show!.dateLabel} · ${show!.when}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: show!.title, text, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Show link copied");
    } catch {
      toast.message(url);
    }
  }

  function downloadCalendar() {
    const blob = new Blob([calendarIcs(show!)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${show!.bookingId}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const body = (
    <div id="show-page" className="grid gap-4">
      <Link href={back} className="text-sm font-medium text-rust">
        ← Shows
      </Link>
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Confirmed show</p>
        <h1 className="mt-1 font-display text-4xl tracking-tight sm:text-5xl">{show.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {show.dateLabel} · {show.when}
        </p>
      </div>
      <ul className="grid gap-2">
        {show.lineup.map((act) => (
          <li key={`${act.bandId}-${act.setTime}`} className="rounded-2xl border bg-card px-4 py-3">
            <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">{act.role}</p>
            <Link href={bandHref(act.bandId)} className="font-display text-3xl hover:text-rust">
              {act.name}
            </Link>
            <p className="text-sm text-muted-foreground">Downbeat {act.setTime}</p>
          </li>
        ))}
      </ul>
      <div className="rounded-2xl border bg-card px-4 py-4">
        <Link href={venueHref} className="font-display text-3xl hover:text-rust">
          {show.venueName}
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">{show.address}</p>
        <p className="mt-2 text-sm">
          {show.age} · {show.cover}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {counts.going} going · {counts.interested} interested
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" className="h-11" variant={mine?.status === "going" ? "secondary" : "default"} onClick={() => choose("going")}>
          {mine?.status === "going" ? "You're going" : "I'm going"}
        </Button>
        <Button type="button" variant={mine?.status === "interested" ? "secondary" : "outline"} className="h-11" onClick={() => choose("interested")}>
          {mine?.status === "interested" ? "You're interested" : "I'm interested"}
        </Button>
        <Button type="button" variant="outline" className="h-11" onClick={downloadCalendar}>
          Add to calendar
        </Button>
        <Button type="button" variant="outline" className="h-11" onClick={() => void share()}>
          Share with fans
        </Button>
      </div>
      <PromoStudio kind="booking" id={show.bookingId} startOpen />
    </div>
  );

  return surface === "phone" ? body : <PageFrame>{body}</PageFrame>;
}
