"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatDay } from "@/lib/deal";
import { todayIso } from "@/lib/fans";
import { profileId } from "@/lib/queries";
import { useApp } from "@/lib/store";
import { isVerified, pendingReviews, reviewsAbout, verificationFor } from "@/lib/trust";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function TrustPanel() {
  const { snapshot, addReview, setVerification } = useApp();
  const id = profileId(snapshot);
  const check = verificationFor(snapshot.verifications, id);
  const verified = isVerified(snapshot.role, check);
  const about = reviewsAbout(snapshot.reviews, id);
  const pending = snapshot.role === "band" || snapshot.role === "venue" ? pendingReviews(snapshot, todayIso()) : [];
  const fields =
    snapshot.role === "venue"
      ? (["email", "phone", "address"] as const)
      : snapshot.role === "fan"
        ? (["email"] as const)
        : (["email", "phone"] as const);

  return (
    <section id="trust-panel" className="mt-8 grid gap-4 rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-3xl">Trust</h2>
        {verified ? (
          <span className="rounded-full bg-pine px-2.5 py-1 text-[11px] font-semibold tracking-wide text-cream uppercase">
            Verified
          </span>
        ) : (
          <span className="rounded-full bg-sand px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase">
            Not verified yet
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Demo checks only. Nothing is sent to a real inbox, phone, or address file. A room is verified when email, phone, and the street address are checked. A band or player needs email and phone.
      </p>
      <ul className="grid gap-2">
        {fields.map((field) => (
          <li key={field}>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-rust"
                checked={check[field]}
                onChange={(event) => {
                  const result = setVerification(id, field, event.target.checked);
                  if (!result.ok) toast.error(result.error);
                }}
              />
              {field === "email" ? "Email checked" : field === "phone" ? "Phone checked" : "Venue address checked"}
            </label>
          </li>
        ))}
      </ul>
      <div>
        <h3 className="font-display text-2xl">Reviews</h3>
        {about.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No reviews yet. They show up here after a played date.</p>
        ) : (
          <ul className="mt-2 grid gap-2">
            {about.map((review) => (
              <li key={review.id} className="rounded-xl bg-sand px-3 py-3 text-sm">
                <p className="font-semibold">{review.rating} of 5</p>
                <p className="mt-1 leading-relaxed">{review.note}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      {pending.map((item) => (
        <ReviewForm
          key={item.bookingId}
          bookingId={item.bookingId}
          label={`${formatDay(item.date)} · ${item.bandName} at ${item.venueName}`}
          onSubmit={addReview}
        />
      ))}
    </section>
  );
}

function ReviewForm({
  bookingId,
  label,
  onSubmit,
}: {
  bookingId: string;
  label: string;
  onSubmit: (bookingId: string, rating: number, note: string) => { ok: boolean; error?: string };
}) {
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-2 rounded-xl border px-3 py-3"
      onSubmit={(event) => {
        event.preventDefault();
        const result = onSubmit(bookingId, rating, note);
        if (!result.ok) {
          setError(result.error ?? "Could not save that review.");
          return;
        }
        setError(null);
        setNote("");
        toast("Review saved");
      }}
    >
      <p className="text-sm font-medium">Review {label}</p>
      <div className="flex gap-1" role="group" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={rating === value}
            onClick={() => setRating(value)}
            className={`h-9 min-w-9 rounded-lg border text-sm font-semibold ${rating === value ? "border-ink bg-ink text-cream" : "bg-card"}`}
          >
            {value}
          </button>
        ))}
      </div>
      <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="How did the date go?" />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="h-10 w-fit">
        Save review
      </Button>
    </form>
  );
}
