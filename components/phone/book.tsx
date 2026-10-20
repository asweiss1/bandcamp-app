"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { capacityLabel, capacityMatches, shownCapacity } from "@/lib/capacity";
import { GENRES, cities, getBand, getVenue, listBands } from "@/lib/catalog";
import { slotLine } from "@/lib/daypart";
import { dealHeadline, defaultTerms, formatDayLong, money, monthParts } from "@/lib/deal";
import { activeApplication, activeBooking, dateFill, sortByDate } from "@/lib/queries";
import { repertoireFor } from "@/lib/repertoire";
import { bandSize } from "@/lib/size";
import { useApp } from "@/lib/store";
import type { Daypart, MusicKind, OpenDate, OpportunityKind, Terms } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DaypartField } from "@/components/daypart-field";
import { CapacityFilter } from "@/components/capacity-filter";
import { BandMarks, MusicFilter, SizeFilter } from "@/components/originals";
import { TurnaroundNote } from "@/components/turnaround-note";
import { BandSamples } from "@/components/samples";
import { DealFields } from "@/components/deal-fields";
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
import { Textarea } from "@/components/ui/textarea";

export function PhoneBook() {
  const { snapshot } = useApp();
  const [kind, setKind] = useState<"all" | "room" | OpportunityKind>("all");
  const [city, setCity] = useState("all");
  const [genre, setGenre] = useState("all");
  const [from, setFrom] = useState("");
  const [hideFilled, setHideFilled] = useState(true);
  const [capacityMin, setCapacityMin] = useState<number | null>(null);
  const [capacityMax, setCapacityMax] = useState<number | null>(null);
  const [sort, setSort] = useState("date");

  const rows = useMemo(() => {
    const rooms =
      kind === "permit" || kind === "festival"
        ? []
        : sortByDate(snapshot.openDates).flatMap((openDate) => {
            const venue = getVenue(openDate.venueId);
            if (!venue) return [];
            const fill = dateFill(openDate.id, snapshot.bookings);
            if (hideFilled && fill === "filled") return [];
            if (city !== "all" && venue.citySlug !== city) return [];
            if (genre !== "all" && !openDate.genres.includes(genre)) return [];
            if (from && openDate.date < from) return [];
            const mine =
              snapshot.role === "band"
                ? activeBooking(openDate.id, snapshot.bandId, snapshot.bookings)
                : undefined;
            return [{ sort: `${openDate.date}-room-${openDate.id}`, kind: "room" as const, openDate, venue, fill, mine }];
          });
    const calls =
      kind === "room"
        ? []
        : snapshot.opportunities.flatMap((opportunity) => {
            if (kind !== "all" && opportunity.kind !== kind) return [];
            if (city !== "all" && opportunity.citySlug !== city) return [];
            if (genre !== "all" && !opportunity.genres.includes(genre)) return [];
            if (from && opportunity.endDate < from) return [];
            const application =
              snapshot.role === "band"
                ? activeApplication(opportunity.id, snapshot.bandId, snapshot.applications)
                : undefined;
            return [{ sort: `${opportunity.startDate}-call-${opportunity.id}`, kind: "call" as const, opportunity, application }];
          });
    const capacityOn = capacityMin != null || capacityMax != null;
    const visible = [...rooms, ...calls].filter((row) => {
      if (row.kind !== "room") return !capacityOn;
      return capacityMatches(shownCapacity(row.venue, snapshot.capacities), { min: capacityMin, max: capacityMax });
    });
    if (sort === "capacity") {
      return visible.sort((a, b) => {
        const left = a.kind === "room" ? shownCapacity(a.venue, snapshot.capacities) : -1;
        const right = b.kind === "room" ? shownCapacity(b.venue, snapshot.capacities) : -1;
        return right - left || a.sort.localeCompare(b.sort);
      });
    }
    return visible.sort((a, b) => a.sort.localeCompare(b.sort));
  }, [snapshot, kind, city, genre, from, hideFilled, capacityMin, capacityMax, sort]);

  return (
    <div className="grid gap-4 pb-2">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Book</p>
        <h1 className="mt-1 font-display text-4xl leading-none tracking-tight">Opportunities</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {snapshot.role === "band"
            ? "Club dates, street-performance permits, and fairs. Request a room or apply for a permit or a stage."
            : snapshot.role === "venue"
              ? "Your open dates are here, next to sample permits and fairs a band might play the same day."
              : "Rooms, permits, and fairs. Switch to a band on You to request or apply."}
        </p>
      </div>
      <Link
        href="/phone/book/bills"
        className="grid h-11 place-items-center rounded-lg border text-sm font-semibold"
      >
        Shared bills
      </Link>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {(
          [
            ["all", "All"],
            ["room", "Rooms"],
            ["permit", "Permits"],
            ["festival", "Fairs"],
          ] as const
        ).map(([id, label]) => (
          <Chip key={id} pressed={kind === id} onClick={() => setKind(id)}>
            {label}
          </Chip>
        ))}
      </div>

      {snapshot.role === "venue" ? (
        <div className="grid gap-2">
          <Link
            href="/phone/bands"
            className="grid h-11 place-items-center rounded-lg bg-ink text-sm font-semibold text-cream"
          >
            Find a band
          </Link>
          <Link
            href="/phone/book/new"
            className="grid h-11 place-items-center rounded-lg border text-sm font-semibold"
          >
            Post a date
          </Link>
        </div>
      ) : null}

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip pressed={city === "all"} onClick={() => setCity("all")}>
          All
        </Chip>
        {cities.map((item) => (
          <Chip key={item.slug} pressed={city === item.slug} onClick={() => setCity(item.slug)}>
            {item.city}
          </Chip>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Genre</span>
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any genre</SelectItem>
              {GENRES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">From</span>
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="h-10 rounded-lg border border-input bg-transparent px-2 text-sm"
          />
        </label>
      </div>
      <CapacityFilter
        min={capacityMin}
        max={capacityMax}
        sort={sort}
        sorts={[
          { id: "date", label: "Date" },
          { id: "capacity", label: "Capacity" },
        ]}
        onRange={(min, max) => {
          setCapacityMin(min);
          setCapacityMax(max);
        }}
        onSort={setSort}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-rust"
          checked={hideFilled}
          onChange={(event) => setHideFilled(event.target.checked)}
        />
        Hide filled dates
      </label>
      <p className="text-sm text-muted-foreground">
        {rows.length} listing{rows.length === 1 ? "" : "s"}
      </p>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card px-4 py-8 text-center">
          <p className="font-display text-2xl">Nothing matches.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Widen the city, the kind, or the date. Filled club dates stay hidden until you uncheck that box.
          </p>
        </div>
      ) : (
        <ul className="grid gap-2">
          {rows.map((row) => {
            if (row.kind === "call") {
              const parts = monthParts(row.opportunity.startDate);
              return (
                <li key={row.opportunity.id}>
                  <Link
                    href={`/phone/book/opp/${row.opportunity.id}`}
                    className="grid grid-cols-[64px_1fr] gap-3 rounded-2xl border bg-card p-3"
                  >
                    <div className="rounded-xl bg-pine px-1 py-2 text-center text-cream">
                      <p className="text-[10px] tracking-[0.14em] text-amber">{parts.month}</p>
                      <p className="font-display text-2xl leading-none">{parts.day}</p>
                      <p className="text-[10px] text-cream/70">{row.opportunity.kind === "permit" ? "Permit" : "Fair"}</p>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium leading-snug">{row.opportunity.title}</p>
                        <StatusPill status={row.application?.status ?? "open"} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {row.opportunity.city} · {row.opportunity.timeWindow}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{row.opportunity.compensation}</p>
                    </div>
                  </Link>
                </li>
              );
            }
            const parts = monthParts(row.openDate.date);
            return (
              <li key={row.openDate.id}>
                <Link
                  href={`/phone/book/${row.openDate.id}`}
                  className="grid grid-cols-[64px_1fr] gap-3 rounded-2xl border bg-card p-3"
                >
                  <div className="rounded-xl bg-ink px-1 py-2 text-center text-cream">
                    <p className="text-[10px] tracking-[0.14em] text-amber">{parts.month}</p>
                    <p className="font-display text-2xl leading-none">{parts.day}</p>
                    <p className="text-[10px] text-cream/70">{parts.weekday}</p>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium leading-snug">{row.venue.name}</p>
                      <StatusPill status={row.mine?.status ?? row.fill} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {row.venue.city} · {capacityLabel(shownCapacity(row.venue, snapshot.capacities))} · {slotLine(row.openDate.showTime, row.openDate.daypart)} · {row.openDate.slot}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{row.venue.typicalDeal}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function PhoneDate({ id }: { id: string }) {
  const router = useRouter();
  const { snapshot, requestDate, sendOffer } = useApp();
  const openDate = snapshot.openDates.find((item) => item.id === id);
  const venue = openDate ? getVenue(openDate.venueId) : undefined;
  const band = getBand(snapshot.bandId);
  const [asking, setAsking] = useState(false);
  const [offering, setOffering] = useState(false);
  const [terms, setTerms] = useState<Terms>(() =>
    defaultTerms({
      guarantee: band ? Math.round((band.feeMin + band.feeMax) / 2) : 800,
      note: "",
    }),
  );
  const [chosenBand, setChosenBand] = useState("");
  const [music, setMusic] = useState<"any" | MusicKind>("any");
  const [sizeMin, setSizeMin] = useState<number | null>(null);
  const [sizeMax, setSizeMax] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!openDate || !venue) {
    return (
      <div className="pb-2">
        <h1 className="font-display text-4xl">That date isn&apos;t listed.</h1>
        <Link href="/phone/book" className="mt-3 inline-block text-sm font-semibold text-rust">
          Back to open dates
        </Link>
      </div>
    );
  }

  const fill = dateFill(openDate.id, snapshot.bookings);
  const mine =
    snapshot.role === "band"
      ? activeBooking(openDate.id, snapshot.bandId, snapshot.bookings)
      : undefined;
  const ownsVenue = snapshot.role === "venue" && snapshot.venueId === venue.id;
  const related = snapshot.bookings.filter(
    (booking) => booking.openDateId === openDate.id && booking.status !== "declined",
  );
  const visibleTalks = related.filter(
    (booking) => ownsVenue || (snapshot.role === "band" && booking.bandId === snapshot.bandId),
  );
  const availableBands = listBands().filter((item) => {
    if (related.some((booking) => booking.bandId === item.id)) return false;
    if (music !== "any" && repertoireFor(item.id, snapshot.repertoires).music !== music) return false;
    const pieces = bandSize(item, snapshot.sizes);
    if (sizeMin != null && pieces < sizeMin) return false;
    if (sizeMax != null && pieces > sizeMax) return false;
    return true;
  });

  function submitRequest(event: React.FormEvent) {
    event.preventDefault();
    const result = requestDate(openDate!.id, terms);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast(result.warning ?? "Request sent");
    router.push(`/phone/gig/${result.data}`);
  }

  function submitOffer(event: React.FormEvent) {
    event.preventDefault();
    const result = sendOffer(openDate!.id, chosenBand, terms);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast(result.warning ?? "Offer sent");
    router.push(`/phone/gig/${result.data}`);
  }

  function pickBand(bandId: string) {
    setChosenBand(bandId);
    const next = getBand(bandId);
    setTerms(defaultTerms({ guarantee: next?.feeMin ?? 800, note: "" }));
    setError(null);
  }

  return (
    <div className="grid gap-4 pb-2">
      <Link href="/phone/book" className="text-sm font-semibold text-rust">
        ← Open dates
      </Link>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={fill} />
          <span className="text-sm text-muted-foreground">
            {openDate.age} · {openDate.slot}
          </span>
        </div>
        <h1 className="mt-2 font-display text-4xl leading-[0.95] tracking-tight">{venue.name}</h1>
        <p className="mt-2 text-sm">
          {formatDayLong(openDate.date)} · {slotLine(openDate.showTime, openDate.daypart)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {venue.neighborhood}, {venue.city} · {capacityLabel(shownCapacity(venue, snapshot.capacities))}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {openDate.genres.map((genre) => (
            <span key={genre} className="rounded-full bg-sand px-2.5 py-1 text-xs font-medium">
              {genre}
            </span>
          ))}
        </div>
      </div>
      <p className="text-sm leading-relaxed">{openDate.notes}</p>
      <dl className="grid gap-2 text-sm">
        <Fact label="Typical deal" value={venue.typicalDeal} />
        <Fact label="Backline" value={venue.backline} />
        <Fact label="Booker" value={`${venue.bookerName} · ${venue.bookerPhone}`} />
      </dl>
      <Link
        href={`/phone/stay?city=${venue.citySlug}`}
        className="text-sm font-semibold text-rust"
      >
        Sleeping notes for {venue.city}
      </Link>

      {visibleTalks.length > 0 ? (
        <section className="grid gap-2">
          <h2 className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            In talks
          </h2>
          {visibleTalks.map((booking) => {
            const other = getBand(booking.bandId);
            return (
              <article key={booking.id} className="rounded-2xl border bg-card px-4 py-3">
                <Link href={`/phone/gig/${booking.id}`} className="flex items-center justify-between gap-3">
                  <span>
                    <span className="block font-medium">
                      {other?.name} {other ? <BandMarks bandId={other.id} /> : null}
                    </span>
                    <span className="text-sm text-muted-foreground">{dealHeadline(booking.terms)}</span>
                  </span>
                  <StatusPill status={booking.status} />
                </Link>
                <TurnaroundNote bookingId={booking.id} className="mt-2" />
                {other ? <BandSamples bandId={other.id} variant="compact" /> : null}
              </article>
            );
          })}
        </section>
      ) : related.length > 0 && !ownsVenue && snapshot.role === "band" ? (
        <p className="rounded-2xl bg-sand px-4 py-3 text-sm">
          Another band is already talking with this room. You can still send your own request.
        </p>
      ) : null}

      {mine ? (
        <div className="rounded-2xl border bg-card p-4">
          <h2 className="font-display text-2xl">
            {mine.status === "accepted" ? "You're confirmed" : "You're already in talks"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Open the booking instead of sending a second request.
          </p>
          <Button asChild className="mt-3 h-11 w-full">
            <Link href={`/phone/gig/${mine.id}`}>Open the booking</Link>
          </Button>
        </div>
      ) : fill === "filled" ? (
        <p className="rounded-2xl bg-sand px-4 py-3 text-sm">This date is confirmed. The room is off the market.</p>
      ) : snapshot.role === "band" ? (
        asking ? (
          <form onSubmit={submitRequest} className="grid gap-3 rounded-2xl border bg-cream p-4">
            <h2 className="font-display text-2xl">Request this date</h2>
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              Sending as {band?.name}.
              {band ? <BandMarks bandId={band.id} withInfo /> : null}
            </p>
            <DealFields value={terms} onChange={setTerms} />
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="h-11">
              Send gig request
            </Button>
            <Button type="button" variant="ghost" className="h-10" onClick={() => setAsking(false)}>
              Cancel
            </Button>
          </form>
        ) : (
          <Button className="h-11" onClick={() => setAsking(true)}>
            Request this date
          </Button>
        )
      ) : ownsVenue ? (
        offering ? (
          <form onSubmit={submitOffer} className="grid gap-3 rounded-2xl border bg-cream p-4">
            <h2 className="font-display text-2xl">Offer a band</h2>
            <p className="text-sm text-muted-foreground">
              From {venue.name}. They can accept, counter, or decline.
            </p>
            <MusicFilter value={music} onChange={setMusic} />
            <SizeFilter
              min={sizeMin}
              max={sizeMax}
              onChange={(min, max) => {
                setSizeMin(min);
                setSizeMax(max);
              }}
            />
            {availableBands.length === 0 ? (
              <p className="text-sm">Every sample band already has a conversation on this date.</p>
            ) : (
              <div className="grid gap-2">
                {availableBands.map((item) => {
                  const selected = chosenBand === item.id;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-xl border px-3 py-2",
                        selected ? "border-rust bg-accent" : "bg-card",
                      )}
                    >
                      <button type="button" aria-pressed={selected} onClick={() => pickBand(item.id)} className="w-full text-left">
                        <span className="flex flex-wrap items-center gap-2 font-medium">
                          {item.name}
                          <BandMarks bandId={item.id} />
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.city} · {money(item.feeMin)}–{money(item.feeMax)} · {item.genres[0]}
                        </span>
                      </button>
                      <BandSamples bandId={item.id} variant="compact" />
                    </div>
                  );
                })}
              </div>
            )}
            {chosenBand ? <DealFields value={terms} onChange={setTerms} /> : null}
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="h-11" disabled={!chosenBand}>
              Send offer
            </Button>
            <Button type="button" variant="ghost" className="h-10" onClick={() => setOffering(false)}>
              Cancel
            </Button>
          </form>
        ) : (
          <Button className="h-11" onClick={() => setOffering(true)}>
            Offer this date to a band
          </Button>
        )
      ) : (
        <p className="rounded-2xl bg-sand px-4 py-3 text-sm">
          Switch to a band on the You tab to request this date
          {snapshot.role === "venue" ? ", or to this room if you book it" : ""}.
        </p>
      )}
    </div>
  );
}

export function PhonePostDate() {
  const router = useRouter();
  const { snapshot, postDate } = useApp();
  const venue = getVenue(snapshot.venueId);
  const [date, setDate] = useState("2026-12-19");
  const [showTime, setShowTime] = useState("8:30pm");
  const [daypart, setDaypart] = useState<Daypart>("evening");
  const [slot, setSlot] = useState<OpenDate["slot"]>("Headline");
  const [age, setAge] = useState<OpenDate["age"]>("21+");
  const [genres, setGenres] = useState<string[]>(["Americana"]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (snapshot.role !== "venue" || !venue) {
    return (
      <div className="grid gap-3 pb-2">
        <h1 className="font-display text-4xl">Post an open date</h1>
        <p className="text-sm text-muted-foreground">Switch to a venue on the You tab to put a date up.</p>
        <Button asChild className="h-11">
          <Link href="/phone/you">Switch who you are</Link>
        </Button>
      </div>
    );
  }

  function toggle(genre: string) {
    setGenres((current) =>
      current.includes(genre) ? current.filter((item) => item !== genre) : [...current, genre],
    );
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = postDate({ date, showTime, daypart, slot, age, genres, notes });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast("Date posted");
    router.push(`/phone/book/${result.data}`);
  }

  return (
    <form onSubmit={submit} className="grid gap-4 pb-2">
      <Link href="/phone/book" className="text-sm font-semibold text-rust">
        ← Open dates
      </Link>
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">{venue.city}</p>
        <h1 className="mt-1 font-display text-4xl leading-none tracking-tight">Post a date</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          At {venue.name}. It shows up on this phone and on the desk.
        </p>
      </div>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Date</span>
        <Input className="h-11" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </label>
      <DaypartField
        daypart={daypart}
        showTime={showTime}
        onChange={(next) => {
          setDaypart(next.daypart);
          setShowTime(next.showTime);
        }}
      />
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Slot</span>
        <select
          className="h-11 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          value={slot}
          onChange={(event) => setSlot(event.target.value as OpenDate["slot"])}
        >
          <option>Headline</option>
          <option>Support</option>
          <option>Local support</option>
        </select>
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Age</span>
        <select
          className="h-11 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          value={age}
          onChange={(event) => setAge(event.target.value as OpenDate["age"])}
        >
          <option>21+</option>
          <option>All ages</option>
        </select>
      </label>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Genres you want</legend>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => {
            const on = genres.includes(genre);
            return (
              <button
                key={genre}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(genre)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm",
                  on ? "border-ink bg-ink text-cream" : "bg-card",
                )}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </fieldset>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Notes for bands</span>
        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Set length, curfew, what you will and won't pay."
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="h-11">
        Post open date
      </Button>
    </form>
  );
}

function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium",
        pressed ? "bg-ink text-cream" : "bg-card ring-1 ring-border",
      )}
    >
      {children}
    </button>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card px-3 py-2 ring-1 ring-border">
      <dt className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-0.5 leading-relaxed">{value}</dd>
    </div>
  );
}
