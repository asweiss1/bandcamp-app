"use client";

import { useState } from "react";
import { toast } from "sonner";
import { getBand } from "@/lib/catalog";
import { todayIso } from "@/lib/fans";
import { bandsOnBooking } from "@/lib/pitch";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const CHECKS = [
  { key: "onTime", label: "Showed on time" },
  { key: "sharedGear", label: "Shared gear fairly" },
  { key: "broughtCrowd", label: "Brought the crowd" },
  { key: "easyToWorkWith", label: "Easy to work with" },
] as const;

export function PeerReviews({ bookingId }: { bookingId: string }) {
  const { snapshot } = useApp();
  const booking = snapshot.bookings.find((item) => item.id === bookingId);
  const openDate = booking ? snapshot.openDates.find((item) => item.id === booking.openDateId) : undefined;
  if (!booking || booking.status !== "accepted" || !openDate || openDate.date >= todayIso()) return null;
  if (snapshot.role !== "band") return null;
  const ids = bandsOnBooking(snapshot, booking);
  if (!ids.includes(snapshot.bandId) || ids.length < 2) return null;
  const others = ids.filter((id) => id !== snapshot.bandId);

  return (
    <section id="peer-reviews" className="mt-6 grid gap-3">
      <h2 className="font-display text-2xl">Review the other bands</h2>
      <p className="text-sm text-muted-foreground">After the gig. Yes or no. The next band they pitch with can see it.</p>
      {others.map((bandId) => (
        <PeerForm key={bandId} bookingId={bookingId} toBandId={bandId} />
      ))}
    </section>
  );
}

function PeerForm({ bookingId, toBandId }: { bookingId: string; toBandId: string }) {
  const { snapshot, addPeerReview } = useApp();
  const existing = snapshot.peerReviews.find(
    (review) => review.bookingId === bookingId && review.fromBandId === snapshot.bandId && review.toBandId === toBandId,
  );
  const name = getBand(toBandId)?.name ?? "Band";
  const [checks, setChecks] = useState<Record<(typeof CHECKS)[number]["key"], boolean | null>>({
    onTime: null,
    sharedGear: null,
    broughtCrowd: null,
    easyToWorkWith: null,
  });
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (existing) {
    return (
      <article className="rounded-2xl border bg-card p-4 text-sm">
        <p className="font-medium">{name}</p>
        <ul className="mt-2 grid gap-1">
          {CHECKS.map((item) => (
            <li key={item.key}>
              {item.label}: {existing[item.key] ? "Yes" : "No"}
            </li>
          ))}
        </ul>
        {existing.note ? <p className="mt-2 leading-relaxed">{existing.note}</p> : null}
      </article>
    );
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (CHECKS.some((item) => checks[item.key] == null)) {
      setError("Answer each one yes or no.");
      return;
    }
    const result = addPeerReview(
      bookingId,
      toBandId,
      {
        onTime: Boolean(checks.onTime),
        sharedGear: Boolean(checks.sharedGear),
        broughtCrowd: Boolean(checks.broughtCrowd),
        easyToWorkWith: Boolean(checks.easyToWorkWith),
      },
      note,
    );
    if (!result.ok) setError(result.error);
    else toast("Review saved");
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-2xl border bg-card p-4">
      <p className="font-medium">{name}</p>
      {CHECKS.map((item) => (
        <fieldset key={item.key} className="grid gap-2">
          <legend className="text-sm">{item.label}</legend>
          <div className="flex gap-2">
            {[true, false].map((value) => (
              <button
                key={String(value)}
                type="button"
                aria-pressed={checks[item.key] === value}
                onClick={() => setChecks((current) => ({ ...current, [item.key]: value }))}
                className={`h-10 rounded-full border px-4 text-sm font-semibold ${checks[item.key] === value ? "border-ink bg-ink text-cream" : "bg-card"}`}
              >
                {value ? "Yes" : "No"}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional note" />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="h-11">
        Save review
      </Button>
    </form>
  );
}
