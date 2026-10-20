"use client";

import { getVenue } from "@/lib/catalog";
import { drawFor } from "@/lib/fans";
import { useApp } from "@/lib/store";

export function DrawNote({
  bandIds,
  venueId,
  bookingId = null,
  confirmed = false,
}: {
  bandIds: string[];
  venueId: string;
  bookingId?: string | null;
  confirmed?: boolean;
}) {
  const { snapshot } = useApp();
  const venue = getVenue(venueId);
  if (!venue || bandIds.length === 0) return null;
  const draw = drawFor(snapshot, bandIds, venue, bookingId);
  return (
    <section id="draw-note" className="mt-4 rounded-2xl border bg-card px-4 py-4">
      <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Expected draw</p>
      <p className="mt-2 font-display text-3xl">
        {draw.nearby} {draw.nearby === 1 ? "fan" : "fans"} within {draw.miles} miles
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {draw.followers} {draw.followers === 1 ? "follower" : "followers"} on the bill. {draw.going} going · {draw.interested} interested.
        {confirmed
          ? " RSVPs are from fans who marked this confirmed show."
          : " This talk is still private. Fans see the show, and can RSVP, after it is confirmed."}
      </p>
    </section>
  );
}
