"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cities, GENRES, getBand, getMusician, getVenue, INSTRUMENTS } from "@/lib/catalog";
import { milesFromHome } from "@/lib/jam";
import { formatWhen } from "@/lib/deal";
import { interestsForListing, listingOwner } from "@/lib/queries";
import { useApp } from "@/lib/store";
import type { Interest, Listing, ListingKind } from "@/lib/types";
import type { SavedPlace } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { HometownField } from "@/components/hometown-field";
import { PageFrame, PageIntro } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export function BoardBrowser() {
  const { snapshot } = useApp();
  const [kind, setKind] = useState<"all" | ListingKind>("all");
  const [city, setCity] = useState("all");
  const [instrument, setInstrument] = useState("all");
  const [paid, setPaid] = useState("all");
  const rows = snapshot.listings.filter((listing) => {
    if (kind !== "all" && listing.kind !== kind) return false;
    if (city !== "all" && listing.citySlug !== city) return false;
    if (instrument !== "all" && listing.instrument !== instrument) return false;
    if (paid === "paid" && !listing.paid) return false;
    if (paid === "unpaid" && listing.paid) return false;
    return true;
  });

  return (
    <PageFrame>
      <PageIntro
        eyebrow="Musician board"
        title="Fill a chair or find one"
        lede="Sub gigs, open chairs, and want-to-jam posts. A note is how a nearby band or player answers."
        actions={
          <>
            <Button asChild variant="outline" className="h-10">
              <Link href="/musicians">Players</Link>
            </Button>
            <Button asChild className="h-10">
              <Link href="/board/new">Post a listing</Link>
            </Button>
          </>
        }
      />
      <Tabs value={kind} onValueChange={(value) => setKind(value as "all" | ListingKind)}>
        <TabsList className="h-10">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="fill-in">Fill-in gigs</TabsTrigger>
          <TabsTrigger value="member">Permanent members</TabsTrigger>
          <TabsTrigger value="jam">Jam</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="mt-4 mb-5 grid gap-3 sm:grid-cols-3">
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {cities.map((item) => (
              <SelectItem key={item.slug} value={item.slug}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={instrument} onValueChange={setInstrument}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Instrument" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All instruments</SelectItem>
            {INSTRUMENTS.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paid} onValueChange={setPaid}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Paid and unpaid</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
          No listings match. Clear a filter or post one.
        </p>
      ) : (
        <div className="grid gap-3">
          {rows.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </PageFrame>
  );
}

export function ListingDetail({ id }: { id: string }) {
  const router = useRouter();
  const { snapshot, expressInterest, confirmInterest } = useApp();
  const listing = snapshot.listings.find((item) => item.id === id);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (!listing) {
    return (
      <PageFrame>
        <h1 className="font-display text-4xl">That listing is gone.</h1>
        <Button asChild className="mt-4 h-10">
          <Link href="/board">Back to the board</Link>
        </Button>
      </PageFrame>
    );
  }
  const notes = interestsForListing(snapshot.interests, listing.id);
  const mine = listingOwner(listing, snapshot);
  const already = snapshot.interests.some(
    (interest) =>
      interest.listingId === listing.id &&
      interest.fromRole === snapshot.role &&
      interest.fromId ===
        (snapshot.role === "band"
          ? snapshot.bandId
          : snapshot.role === "venue"
            ? snapshot.venueId
            : snapshot.musicianId),
  );

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = expressInterest({ listingId: listing!.id, message });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast(result.warning ?? "Interest sent");
    router.push("/dashboard");
  }

  return (
    <PageFrame>
      <Link href="/board" className="text-sm font-medium text-rust">
        ← Board
      </Link>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold tracking-wide text-cream uppercase">
          {listing.kind === "jam" ? "Jam" : listing.kind === "fill-in" ? "Fill-in" : "Permanent"}
        </span>
        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase", listing.paid ? "bg-pine text-cream" : "bg-sand")}>
          {listing.paid ? "Paid" : "Unpaid"}
        </span>
      </div>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">{listing.title}</h1>
      <p className="mt-2 text-muted-foreground">
        {listing.instrument} · {listing.genre} · {listing.city}
      </p>
      <p className="mt-4 max-w-2xl leading-relaxed">{listing.description}</p>
      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        <Info label="When" value={listing.dates} />
        <Info label="Pay" value={listing.paid ? listing.payNote : "Unpaid"} />
        <Info label="Posted by" value={`${listing.postedByName} · ${formatWhen(listing.createdAt)}`} />
      </dl>
      <p className="mt-4 text-sm">
        Contact{" "}
        <a className="text-rust underline" href={`mailto:${listing.contact}`}>
          {listing.contact}
        </a>
      </p>
      {listing.posterRole === "musician" ? (
        <Button asChild variant="outline" className="mt-4 h-10">
          <Link href={`/musicians/${listing.posterId}`}>Player profile</Link>
        </Button>
      ) : listing.posterRole === "band" ? (
        <Button asChild variant="outline" className="mt-4 h-10">
          <Link href={`/bands/${listing.posterId}`}>Band profile</Link>
        </Button>
      ) : null}

      <section className="mt-8 max-w-xl">
        <h2 className="font-display text-3xl">{mine ? "Notes received" : "I'm interested"}</h2>
        {mine ? (
          notes.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {notes.map((interest) => (
                <li key={interest.id} className="rounded-xl border bg-card px-4 py-3">
                  <p className="font-medium">{interest.fromName}</p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{interest.message}</p>
                  <InterestConfirm
                    listingKind={listing.kind}
                    interest={interest}
                    onConfirm={() => {
                      const result = confirmInterest(interest.id);
                      if (!result.ok) toast.error(result.error);
                      else toast("Player confirmed. Other talks on that date are closed.");
                    }}
                  />
                </li>
              ))}
            </ul>
          )
        ) : already ? (
          <p className="mt-3 rounded-xl bg-sand px-4 py-3 text-sm">
            You already sent a note. It&apos;s on your desk.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-3 grid gap-3">
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Instrument, the date you can make, and whether the pay works."
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="h-11 w-fit">
              Send interest
            </Button>
          </form>
        )}
      </section>
    </PageFrame>
  );
}

export function InterestConfirm({
  listingKind,
  interest,
  onConfirm,
}: {
  listingKind: ListingKind;
  interest: Interest;
  onConfirm: () => void;
}) {
  if (listingKind !== "fill-in" || interest.fromRole !== "musician") return null;
  if (interest.status === "confirmed") {
    return <p className="mt-2 text-sm font-medium">Confirmed for this date.</p>;
  }
  if (interest.status === "declined") {
    return <p className="mt-2 text-sm text-muted-foreground">Closed.</p>;
  }
  return (
    <Button type="button" className="mt-3 h-10" onClick={onConfirm}>
      Confirm
    </Button>
  );
}

export function ListingForm() {
  const router = useRouter();
  const { postListing } = useApp();
  const [kind, setKind] = useState<ListingKind>("fill-in");
  const [title, setTitle] = useState("");
  const [instrument, setInstrument] = useState<string>(INSTRUMENTS[0]);
  const [genre, setGenre] = useState<string>(GENRES[0]);
  const [citySlug, setCitySlug] = useState(cities[0].slug);
  const [paid, setPaid] = useState(true);
  const [payNote, setPayNote] = useState("$150");
  const [dates, setDates] = useState("");
  const [description, setDescription] = useState("");
  const [jamPlace, setJamPlace] = useState<SavedPlace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const city = cities.find((item) => item.slug === citySlug) ?? cities[0];

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (kind === "jam" && !jamPlace) {
      setError("Pick a city.");
      return;
    }
    const result = postListing({
      kind,
      title: kind === "jam" ? title.trim() || `Want to jam in ${jamPlace?.city ?? "town"}` : title,
      instrument: kind === "jam" ? "Any" : instrument,
      genre,
      city: kind === "jam" && jamPlace ? jamPlace.label : city.label,
      citySlug: kind === "jam" && jamPlace ? jamPlace.id : citySlug,
      lat: kind === "jam" ? jamPlace?.lat : undefined,
      lng: kind === "jam" ? jamPlace?.lng : undefined,
      paid: kind === "jam" ? false : paid,
      payNote: kind === "jam" || !paid ? "Unpaid" : payNote,
      dates,
      description,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast("Listing posted");
    router.push(`/board/${result.data}`);
  }

  return (
    <PageFrame>
      <PageIntro
        eyebrow="Musician board"
        title="Post a listing"
        lede="A fill-in is one date. A member post is a chair. A jam is a place, a time, and a style."
      />
      <form onSubmit={submit} className="grid max-w-2xl gap-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <button type="button" aria-pressed={kind === "fill-in"} onClick={() => setKind("fill-in")} className={cn("rounded-xl border px-3 py-3 text-left", kind === "fill-in" && "border-rust bg-accent")}>
            <span className="block font-semibold">Fill-in gig</span>
            <span className="text-xs text-muted-foreground">One date, then done.</span>
          </button>
          <button type="button" aria-pressed={kind === "member"} onClick={() => setKind("member")} className={cn("rounded-xl border px-3 py-3 text-left", kind === "member" && "border-rust bg-accent")}>
            <span className="block font-semibold">Permanent member</span>
            <span className="text-xs text-muted-foreground">A chair, not a sub.</span>
          </button>
          <button
            type="button"
            aria-pressed={kind === "jam"}
            onClick={() => {
              setKind("jam");
              setPaid(false);
              setInstrument("Any");
              setTitle((current) => current || "Want to jam");
            }}
            className={cn("rounded-xl border px-3 py-3 text-left", kind === "jam" && "border-rust bg-accent")}
          >
            <span className="block font-semibold">Want to jam</span>
            <span className="text-xs text-muted-foreground">Place, time, and style.</span>
          </button>
        </div>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Title</span>
          <Input className="h-10" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Drummer for a Friday in Tucson" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          {kind === "jam" ? (
            <div className="sm:col-span-2">
              <HometownField
                label="Place"
                place={jamPlace}
                onPlace={(place) => {
                  setJamPlace(place);
                  setTitle((current) =>
                    current === "" || current.startsWith("Want to jam") ? `Want to jam in ${place.city}` : current,
                  );
                }}
              />
            </div>
          ) : (
            <FieldSelect label="Instrument" value={instrument} onChange={setInstrument} options={INSTRUMENTS} />
          )}
          <FieldSelect label={kind === "jam" ? "Style" : "Genre"} value={genre} onChange={setGenre} options={GENRES} />
          {kind === "jam" ? null : (
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">City</span>
              <Select value={citySlug} onValueChange={setCitySlug}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((item) => (
                    <SelectItem key={item.slug} value={item.slug}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          )}
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">{kind === "jam" ? "Time" : "Dates"}</span>
            <Input className="h-10" value={dates} onChange={(event) => setDates(event.target.value)} placeholder={kind === "jam" ? "Fri, Nov 6, 2026 · 2:00pm" : "Nov 21, or ongoing"} />
          </label>
        </div>
        {kind === "jam" ? null : (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-rust" checked={paid} onChange={(event) => setPaid(event.target.checked)} />
          This is paid
        </label>
        )}
        {paid ? (
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Pay note</span>
            <Input className="h-10" value={payNote} onChange={(event) => setPayNote(event.target.value)} />
          </label>
        ) : null}
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Description</span>
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Set length, rehearsal, what you expect them to bring." />
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="h-11 w-fit">
          Post listing
        </Button>
      </form>
    </PageFrame>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/board/${listing.id}`} className="rounded-2xl border bg-card p-4 transition hover:border-rust/40">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-cream uppercase">
          {listing.kind === "jam" ? "Jam" : listing.kind === "fill-in" ? "Fill-in" : "Member"}
        </span>
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase", listing.paid ? "bg-pine text-cream" : "bg-sand")}>
          {listing.paid ? "Paid" : "Unpaid"}
        </span>
      </div>
      <h2 className="mt-2 font-display text-2xl">{listing.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {listing.instrument} · {listing.genre} · {listing.city}
      </p>
      <p className="mt-2 text-sm">{listing.dates}</p>
      <JamDistance listing={listing} />
      <p className="mt-1 text-sm font-medium">{listing.paid ? listing.payNote : "Unpaid"}</p>
      <p className="mt-2 text-xs text-muted-foreground">Posted by {listing.postedByName}</p>
    </Link>
  );
}

export function JamDistance({ listing }: { listing: Listing }) {
  const { snapshot } = useApp();
  if (listing.kind !== "jam") return null;
  const home =
    snapshot.role === "band"
      ? getBand(snapshot.bandId)
      : snapshot.role === "venue"
        ? getVenue(snapshot.venueId)
        : getMusician(snapshot.musicianId);
  const miles = milesFromHome(listing, home);
  if (miles == null) return null;
  return <p className="mt-1 text-sm">{miles === 0 ? "In your city" : `${miles} mi from you`}</p>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-sand/80 px-3 py-3">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
