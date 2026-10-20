"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { capacityLabel, capacityMatches, shownCapacity } from "@/lib/capacity";
import { cities, GENRES, getBand, getCity, getMusician, getVenue, listMusicians, listVenues } from "@/lib/catalog";
import { dateFill, sortByDate } from "@/lib/queries";
import { useApp } from "@/lib/store";
import type { Venue } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BandSearch } from "@/components/band-search";
import { BandLinks } from "@/components/band-links";
import { OfferDialog } from "@/components/offer-dialog";
import { slotLine } from "@/lib/daypart";
import { BandMarks, RepertoirePanel } from "@/components/originals";
import { CapacityFilter } from "@/components/capacity-filter";
import { ProfileMediaView } from "@/components/profile-media";
import { repertoireFor } from "@/lib/repertoire";
import { TurnaroundNote } from "@/components/turnaround-note";
import { VehiclePanel } from "@/components/vehicles";
import { BandSamples } from "@/components/samples";
import { PageFrame, PageIntro } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function BandIndex() {
  return (
    <PageFrame>
      <PageIntro
        eyebrow="For venues"
        title="Find a band"
        lede="Search by the band, a member, or a song title. Narrow by style, city, the dates they're routing, fee, music, size, and whether you can hear a sample."
      />
      <BandSearch surface="desk" />
    </PageFrame>
  );
}

export function VenueIndex() {
  const { snapshot } = useApp();
  const [city, setCity] = useState("all");
  const [genre, setGenre] = useState("all");
  const [capacityMin, setCapacityMin] = useState<number | null>(null);
  const [capacityMax, setCapacityMax] = useState<number | null>(null);
  const [sort, setSort] = useState("name");
  const rows = listVenues()
    .filter((venue) => {
      if (city !== "all" && venue.citySlug !== city) return false;
      if (genre !== "all" && !venue.genres.includes(genre)) return false;
      return capacityMatches(shownCapacity(venue, snapshot.capacities), { min: capacityMin, max: capacityMax });
    })
    .sort((a, b) => {
      if (sort === "capacity") {
        return shownCapacity(b, snapshot.capacities) - shownCapacity(a, snapshot.capacities) || a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
  return (
    <PageFrame>
      <PageIntro
        eyebrow="Profiles"
        title="Venues"
        lede="Capacity, the genres they actually book, and the deal they usually open with."
      />
      <Filters city={city} setCity={setCity} genre={genre} setGenre={setGenre} />
      <div className="mb-5">
        <CapacityFilter
          min={capacityMin}
          max={capacityMax}
          sort={sort}
          sorts={[
            { id: "name", label: "Name" },
            { id: "capacity", label: "Capacity" },
          ]}
          onRange={(min, max) => {
            setCapacityMin(min);
            setCapacityMax(max);
          }}
          onSort={setSort}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((venue) => (
          <VenueCard key={venue.id} venue={venue} />
        ))}
      </div>
      {rows.length === 0 ? <Empty /> : null}
    </PageFrame>
  );
}

export function BandProfile({ id }: { id: string }) {
  const { snapshot } = useApp();
  const band = getBand(id);
  const [offerOpen, setOfferOpen] = useState(false);
  if (!band) return <Missing href="/bands" label="Back to bands" title="No band by that name." />;
  const gigs = snapshot.bookings.filter((booking) => {
    if (booking.status === "declined") return false;
    if (booking.bandId === band.id) return true;
    const bill = booking.billId ? snapshot.bills.find((item) => item.id === booking.billId) : undefined;
    return bill?.members.some((member) => member.bandId === band.id) ?? false;
  });
  const bills = snapshot.bills.filter((bill) => bill.members.some((member) => member.bandId === band.id));
  return (
    <PageFrame>
      <Link href="/bands" className="text-sm font-medium text-rust">
        ← Bands
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold tracking-wide text-cream uppercase">
          {band.touring ? "Touring" : "Local"}
        </span>
        {band.genres.map((genre) => (
          <span key={genre} className="rounded-full bg-sand px-2.5 py-1 text-xs font-medium">
            {genre}
          </span>
        ))}
      </div>
      {band.photo ? <img src={band.photo} alt="" className="mt-4 size-24 rounded-2xl object-cover" /> : null}
      <h1 className="mt-3 font-display text-5xl tracking-tight">{band.name}</h1>
      <div className="mt-3">
        <BandMarks bandId={band.id} withInfo />
      </div>
      <ProfileMediaView
        profileId={band.id}
        role="band"
        name={band.name}
        bio={band.bio}
        hasMembers={band.members.length > 0}
        hasSample={snapshot.streamLinks.some((link) => link.bandId === band.id)}
        hasMusic={Boolean(repertoireFor(band.id, snapshot.repertoires).music)}
        hasAddress={false}
        hasBackline={false}
      />
      <div className="mt-3 flex flex-wrap gap-1.5">
        {band.styles.map((style) => (
          <span key={style} className="rounded-full border px-2.5 py-1 text-xs font-medium">
            {style}
          </span>
        ))}
      </div>
      <p className="mt-2 text-lg text-muted-foreground">Home city {band.city}</p>
      <p className="mt-4 max-w-2xl text-base leading-relaxed">{band.bio}</p>
      <div className="mt-6 max-w-2xl">
        <BandSamples bandId={band.id} />
      </div>
      <div className="mt-6">
        <RepertoirePanel bandId={band.id} />
      </div>
      <div className="mt-6 max-w-2xl">
        <VehiclePanel bandId={band.id} />
      </div>
      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Typical fee" value={`$${band.feeMin.toLocaleString()}–$${band.feeMax.toLocaleString()}`} />
        <Stat label="Draw" value={band.draw} />
        <Stat label="Availability" value={band.availability} />
      </dl>
      <div className="mt-6 flex flex-wrap gap-2">
        {snapshot.role === "venue" ? (
          <Button className="h-10" onClick={() => setOfferOpen(true)}>
            Send an offer
          </Button>
        ) : null}
        <Button asChild variant="outline" className="h-10">
          <Link href="/tour">Route</Link>
        </Button>
        <Button asChild variant="outline" className="h-10">
          <Link href="/bills">Shared bills</Link>
        </Button>
      </div>
      <section className="mt-8">
        <h2 className="font-display text-3xl">Members</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {band.members.map((member) => (
            <li key={member.name} className="rounded-xl border bg-card px-4 py-3">
              <p className="font-medium">{member.name}</p>
              <p className="text-sm text-muted-foreground">{member.role}</p>
            </li>
          ))}
        </ul>
      </section>
      <BandLinks bandId={band.id} surface="desk" />
      {bills.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-display text-3xl">Bills</h2>
          <div className="mt-3 grid gap-2">
            {bills.map((bill) => (
              <Link key={bill.id} href={`/bills/${bill.id}`} className="rounded-xl border bg-card px-4 py-3">
                <p className="font-medium">{bill.name}</p>
                <p className="text-sm text-muted-foreground">
                  {bill.members.find((member) => member.bandId === band.id)?.role} ·{" "}
                  {bill.members.find((member) => member.bandId === band.id)?.splitPercent}% of the date
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <section className="mt-8">
        <h2 className="font-display text-3xl">Sample links</h2>
        <ul className="mt-3 grid gap-2">
          {band.links.map((link) => (
            <li key={link.href}>
              <a className="text-rust underline-offset-4 hover:underline" href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
              <span className="ml-2 text-xs text-muted-foreground">Placeholder URL</span>
            </li>
          ))}
        </ul>
      </section>
      {gigs.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-display text-3xl">On the book</h2>
          <div className="mt-3 grid gap-2">
            {gigs.map((booking) => {
              const openDate = snapshot.openDates.find((item) => item.id === booking.openDateId);
              const venue = getVenue(booking.venueId);
              return (
                <div key={booking.id} className="rounded-xl border bg-card px-4 py-3">
                  <Link href={`/bookings/${booking.id}`} className="flex items-center justify-between gap-3">
                    <span>
                      {openDate ? `${openDate.date} · ${slotLine(openDate.showTime, openDate.daypart)}` : "Date"} · {venue?.name}
                    </span>
                    <StatusPill status={booking.status} />
                  </Link>
                  <TurnaroundNote bookingId={booking.id} className="mt-2" />
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
      <OfferDialog
        band={band}
        open={offerOpen}
        onOpenChange={setOfferOpen}
        bookingHref={(id) => `/bookings/${id}`}
        postHref="/dates/new"
      />
    </PageFrame>
  );
}

export function VenueProfile({ id }: { id: string }) {
  const { snapshot, setVenueCapacity } = useApp();
  const venue = getVenue(id);
  if (!venue) return <Missing href="/venues" label="Back to venues" title="No venue by that name." />;
  const dates = sortByDate(snapshot.openDates.filter((item) => item.venueId === venue.id));
  const capacity = shownCapacity(venue, snapshot.capacities);
  const canEdit = snapshot.role === "venue" && snapshot.venueId === venue.id;
  return (
    <PageFrame>
      <Link href="/venues" className="text-sm font-medium text-rust">
        ← Venues
      </Link>
      {venue.photo ? <img src={venue.photo} alt="" className="mt-4 size-24 rounded-2xl object-cover" /> : null}
      <h1 className="mt-3 font-display text-5xl tracking-tight">{venue.name}</h1>
      {venue.address ? <p className="mt-2 text-sm text-muted-foreground">{venue.address}</p> : null}
      {canEdit ? (
        <label className="mt-3 grid max-w-xs gap-1 text-sm font-medium">
          Capacity
          <Input
            className="h-11 font-normal"
            inputMode="numeric"
            value={String(capacity)}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (next >= 1) {
                const result = setVenueCapacity(venue.id, Math.round(next));
                if (!result.ok) toast.error(result.error);
              }
            }}
          />
        </label>
      ) : (
        <p className="mt-2 text-lg text-muted-foreground">
          {venue.neighborhood}, {venue.city} · {capacityLabel(capacity, true)}
        </p>
      )}
      {canEdit ? (
        <p className="mt-2 text-lg text-muted-foreground">
          {venue.neighborhood}, {venue.city}
        </p>
      ) : null}
      <ProfileMediaView
        profileId={venue.id}
        role="venue"
        name={venue.name}
        bio={venue.bio}
        hasMembers={false}
        hasSample={false}
        hasMusic={false}
        hasAddress={Boolean(venue.address && venue.address.trim().length >= 4)}
        hasBackline={venue.backline.trim().length > 8}
      />
      <p className="mt-4 max-w-2xl leading-relaxed">{venue.bio}</p>
      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <Stat label="Genres booked" value={venue.genres.join(", ")} />
        <Stat label="Typical pay" value={venue.typicalDeal} />
        <Stat label="Backline" value={venue.backline} />
        <Stat label="Load-in" value={venue.loadInNotes} />
      </dl>
      <section className="mt-6 rounded-2xl bg-ink px-5 py-5 text-cream">
        <p className="text-xs font-semibold tracking-[0.16em] text-amber uppercase">Booker</p>
        <p className="mt-2 font-display text-3xl">{venue.bookerName}</p>
        <p className="mt-2 text-sm">
          <a className="underline" href={`mailto:${venue.bookerEmail}`}>{venue.bookerEmail}</a>
          <span className="mx-2">·</span>
          <a className="underline" href={`tel:${venue.bookerPhone}`}>{venue.bookerPhone}</a>
        </p>
      </section>
      <div className="mt-4">
        <Button asChild variant="outline" className="h-10">
          <Link href={`/lodging/${venue.citySlug}`}>Lodging in {venue.city}</Link>
        </Button>
      </div>
      <section className="mt-8">
        <h2 className="font-display text-3xl">Open dates</h2>
        <div className="mt-3 grid gap-2">
          {dates.map((openDate) => (
            <Link key={openDate.id} href={`/dates/${openDate.id}`} className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
              <span>
                <span className="block font-medium">
                  {openDate.date} · {slotLine(openDate.showTime, openDate.daypart)} · {openDate.slot}
                </span>
                <span className="text-sm text-muted-foreground">
                  {capacityLabel(capacity)} · {openDate.genres.join(", ")}
                </span>
              </span>
              <StatusPill status={dateFill(openDate.id, snapshot.bookings)} />
            </Link>
          ))}
        </div>
      </section>
    </PageFrame>
  );
}

export function MusicianIndex() {
  return (
    <PageFrame>
      <PageIntro eyebrow="Players" title="Musicians" lede="People behind the board listings. Reach out from a profile or from a specific gig." />
      <div className="grid gap-3 sm:grid-cols-2">
        {listMusicians().map((musician) => (
          <Link key={musician.id} href={`/musicians/${musician.id}`} className="rounded-2xl border bg-card p-4 hover:border-rust/40">
            <p className="font-display text-2xl">{musician.name}</p>
            <p className="text-sm text-muted-foreground">
              {musician.instruments.join(", ")} · {musician.city}
            </p>
            <p className="mt-2 text-sm">{musician.paidPreference}</p>
          </Link>
        ))}
      </div>
    </PageFrame>
  );
}

export function MusicianProfile({ id }: { id: string }) {
  const { snapshot, expressInterest } = useApp();
  const musician = getMusician(id);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  if (!musician) return <Missing href="/board" label="Back to the board" title="No player by that name." />;
  const listings = snapshot.listings.filter((listing) => listing.posterId === musician.id && listing.posterRole === "musician");
  const self = snapshot.role === "musician" && snapshot.musicianId === musician.id;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = expressInterest({ profileMusicianId: musician!.id, message });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast("Note sent");
    setMessage("");
    router.push("/dashboard");
  }

  return (
    <PageFrame>
      <Link href="/board" className="text-sm font-medium text-rust">
        ← Board
      </Link>
      {musician.photo ? <img src={musician.photo} alt="" className="mt-4 size-24 rounded-2xl object-cover" /> : null}
      <h1 className="mt-3 font-display text-5xl">{musician.name}</h1>
      <p className="mt-2 text-muted-foreground">
        {musician.instruments.join(", ")} · {(musician.styles ?? musician.genres).join(", ")} · {musician.city}
        {musician.radiusMiles ? ` · ${musician.radiusMiles} mi` : ""}
      </p>
      {musician.seeks && musician.seeks.length > 0 ? (
        <p className="mt-2 text-sm">
          {musician.seeks.includes("fill-in") ? "Fill-ins" : ""}
          {musician.seeks.includes("fill-in") && musician.seeks.includes("member") ? " · " : ""}
          {musician.seeks.includes("member") ? "Joining a band" : ""}
        </p>
      ) : null}
      <p className="mt-4 max-w-2xl leading-relaxed">{musician.bio}</p>
      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <Stat label="Availability" value={musician.availability} />
        <Stat label="Pay" value={musician.paidPreference} />
      </dl>
      <p className="mt-4 text-sm">
        <a className="text-rust underline" href={`mailto:${musician.email}`}>{musician.email}</a>
      </p>
      {self ? (
        <div className="mt-6 max-w-2xl">
          <BandSamples bandId={musician.id} />
        </div>
      ) : null}
      {listings.length > 0 ? (
        <div className="mt-6 grid gap-2">
          {listings.map((listing) => (
            <Link key={listing.id} href={`/board/${listing.id}`} className="rounded-xl border bg-card px-4 py-3">
              {listing.title}
            </Link>
          ))}
        </div>
      ) : null}
      {self ? null : (
        <form onSubmit={submit} className="mt-8 max-w-xl rounded-2xl border bg-card p-4">
          <h2 className="font-display text-2xl">Say you&apos;re interested</h2>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="mt-3 min-h-28 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            placeholder={`Tell ${musician.name} the date, the room, and what it pays.`}
          />
          {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="mt-3 h-10">
            Send note
          </Button>
        </form>
      )}
    </PageFrame>
  );
}

function Filters({
  city,
  setCity,
  genre,
  setGenre,
  touring,
  setTouring,
}: {
  city: string;
  setCity: (value: string) => void;
  genre: string;
  setGenre: (value: string) => void;
  touring?: "all" | "touring" | "local";
  setTouring?: (value: "all" | "touring" | "local") => void;
}) {
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
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
      <Select value={genre} onValueChange={setGenre}>
        <SelectTrigger className="h-10 w-full">
          <SelectValue placeholder="Genre" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All genres</SelectItem>
          {GENRES.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {setTouring ? (
        <Select value={touring} onValueChange={(value) => setTouring(value as "all" | "touring" | "local")}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Touring and local</SelectItem>
            <SelectItem value="touring">Touring</SelectItem>
            <SelectItem value="local">Local</SelectItem>
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}

function VenueCard({ venue }: { venue: Venue }) {
  const { snapshot } = useApp();
  const city = getCity(venue.citySlug);
  return (
    <Link href={`/venues/${venue.id}`} className={cn("rounded-2xl border bg-card p-4 transition hover:border-rust/40")}>
      <h2 className="font-display text-2xl">{venue.name}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {city?.label} · {capacityLabel(shownCapacity(venue, snapshot.capacities))}
      </p>
      <p className="mt-3 text-sm">{venue.genres.slice(0, 3).join(" · ")}</p>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{venue.typicalDeal}</p>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-sand/80 px-3 py-3">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 text-sm leading-relaxed">{value}</p>
    </div>
  );
}

function Empty() {
  return <p className="rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground">Nothing matches those filters.</p>;
}

function Missing({ title, href, label }: { title: string; href: string; label: string }) {
  return (
    <PageFrame>
      <h1 className="font-display text-4xl">{title}</h1>
      <Button asChild className="mt-4 h-10">
        <Link href={href}>{label}</Link>
      </Button>
    </PageFrame>
  );
}
