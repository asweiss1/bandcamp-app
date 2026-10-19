"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatWhen } from "@/lib/deal";
import { JamDistance } from "@/components/board-views";
import { interestsForListing, listingOwner, profileId } from "@/lib/queries";
import { useApp } from "@/lib/store";
import type { ListingKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { InterestConfirm } from "@/components/board-views";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const filters: { id: "all" | ListingKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "fill-in", label: "Fill-in" },
  { id: "member", label: "Permanent" },
  { id: "jam", label: "Jam" },
];

export function PhoneBoard() {
  const { snapshot } = useApp();
  const [kind, setKind] = useState<(typeof filters)[number]["id"]>("all");
  const listings = snapshot.listings
    .filter((listing) => kind === "all" || listing.kind === kind)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="grid gap-4 pb-2">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Board</p>
        <h1 className="mt-1 font-display text-4xl leading-none tracking-tight">Players wanted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Fill-in nights, permanent chairs, and want-to-jam posts. A note is how you answer.
        </p>
      </div>
      <div className="flex gap-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            aria-pressed={kind === filter.id}
            onClick={() => setKind(filter.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium",
              kind === filter.id ? "bg-ink text-cream" : "bg-card ring-1 ring-border",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>
      {listings.length === 0 ? (
        <p className="rounded-2xl border bg-card px-4 py-4 text-sm text-muted-foreground">
          Nothing in this filter. Post one from the desk if you need a player.
        </p>
      ) : (
        <ul className="grid gap-2">
          {listings.map((listing) => (
            <li key={listing.id}>
              <Link href={`/phone/board/${listing.id}`} className="block rounded-2xl border bg-card px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  <Tag>{listing.kind === "jam" ? "Jam" : listing.kind === "fill-in" ? "Fill-in" : "Permanent"}</Tag>
                  <Tag tone={listing.paid ? "paid" : "plain"}>{listing.paid ? "Paid" : "Unpaid"}</Tag>
                </div>
                <p className="mt-2 font-medium leading-snug">{listing.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {listing.instrument} · {listing.genre} · {listing.city}
                </p>
                <JamDistance listing={listing} />
                <p className="mt-1 text-xs text-muted-foreground">{listing.dates}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/board/new" className="text-sm font-semibold text-rust">
        Post a listing on the desk
      </Link>
    </div>
  );
}

export function PhoneListing({ id }: { id: string }) {
  const router = useRouter();
  const { snapshot, expressInterest, confirmInterest } = useApp();
  const listing = snapshot.listings.find((item) => item.id === id);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!listing) {
    return (
      <div className="pb-2">
        <h1 className="font-display text-4xl">That listing is gone.</h1>
        <Link href="/phone/board" className="mt-3 inline-block text-sm font-semibold text-rust">
          Back to the board
        </Link>
      </div>
    );
  }

  const notes = interestsForListing(snapshot.interests, listing.id);
  const mine = listingOwner(listing, snapshot);
  const already = snapshot.interests.some(
    (interest) =>
      interest.listingId === listing.id &&
      interest.fromRole === snapshot.role &&
      interest.fromId === profileId(snapshot),
  );

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = expressInterest({ listingId: listing!.id, message });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("");
    setError(null);
    toast(result.warning ?? "Interest sent");
    router.refresh();
  }

  return (
    <div className="grid gap-4 pb-2">
      <Link href="/phone/board" className="text-sm font-semibold text-rust">
        ← Board
      </Link>
      <div>
        <div className="flex flex-wrap gap-1.5">
          <Tag>{listing.kind === "jam" ? "Jam" : listing.kind === "fill-in" ? "Fill-in" : "Permanent"}</Tag>
          <Tag tone={listing.paid ? "paid" : "plain"}>{listing.paid ? "Paid" : "Unpaid"}</Tag>
        </div>
        <h1 className="mt-2 font-display text-4xl leading-[0.95] tracking-tight">{listing.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {listing.instrument} · {listing.genre} · {listing.city}
        </p>
      </div>
      <p className="text-sm leading-relaxed">{listing.description}</p>
      <dl className="grid gap-2 text-sm">
        <Info label="When" value={listing.dates} />
        <Info label="Pay" value={listing.paid ? listing.payNote : "Unpaid"} />
        <Info label="Posted by" value={`${listing.postedByName} · ${formatWhen(listing.createdAt)}`} />
      </dl>
      <a className="text-sm font-semibold text-rust" href={`mailto:${listing.contact}`}>
        {listing.contact}
      </a>

      <section>
        <h2 className="font-display text-2xl">{mine ? "Notes received" : "I'm interested"}</h2>
        {mine ? (
          notes.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            <ul className="mt-2 grid gap-2">
              {notes.map((interest) => (
                <li key={interest.id} className="rounded-2xl border bg-card px-4 py-3">
                  <p className="font-medium">{interest.fromName}</p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{interest.message}</p>
                  <InterestConfirm
                    listingKind={listing.kind}
                    interest={interest}
                    onConfirm={() => {
                      const result = confirmInterest(interest.id);
                      if (!result.ok) toast.error(result.error);
                      else toast("Player confirmed. Other talks on that night are closed.");
                    }}
                  />
                </li>
              ))}
            </ul>
          )
        ) : already ? (
          <p className="mt-2 rounded-2xl bg-sand px-4 py-3 text-sm">
            You already sent a note. It is saved with the rest of this browser&apos;s demo data.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-2 grid gap-3">
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Instrument, the date you can make, and whether the pay works."
            />
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="h-11">
              Send interest
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}

function Tag({ children, tone = "ink" }: { children: React.ReactNode; tone?: "ink" | "paid" | "plain" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
        tone === "ink" && "bg-ink text-cream",
        tone === "paid" && "bg-pine text-cream",
        tone === "plain" && "bg-sand text-ink",
      )}
    >
      {children}
    </span>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card px-3 py-2 ring-1 ring-border">
      <dt className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}
