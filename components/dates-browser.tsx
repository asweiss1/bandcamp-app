"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GENRES, cities, getVenue } from "@/lib/catalog";
import { monthParts } from "@/lib/deal";
import { dateFill, sortByDate } from "@/lib/queries";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { PageFrame, PageIntro } from "@/components/shell";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DatesBrowser() {
  const { snapshot } = useApp();
  const [city, setCity] = useState("all");
  const [genre, setGenre] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [hideFilled, setHideFilled] = useState(true);

  const rows = useMemo(() => {
    return sortByDate(snapshot.openDates).flatMap((openDate) => {
      const venue = getVenue(openDate.venueId);
      if (!venue) return [];
      const fill = dateFill(openDate.id, snapshot.bookings);
      if (hideFilled && fill === "filled") return [];
      if (city !== "all" && venue.citySlug !== city) return [];
      if (genre !== "all" && !openDate.genres.includes(genre)) return [];
      if (from && openDate.date < from) return [];
      if (to && openDate.date > to) return [];
      return [{ openDate, venue, fill }];
    });
  }, [snapshot, city, genre, from, to, hideFilled]);

  return (
    <PageFrame>
      <PageIntro
        eyebrow="Booking marketplace"
        title="Open dates"
        lede="Rooms posted by venues across a sample Southwest run. Filter by city, night, and genre, then send a request or an offer."
        actions={
          snapshot.role === "venue" ? (
            <Button asChild className="h-10">
              <Link href="/dates/new">Post a date</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="h-10">
              <Link href="/tour">See the route</Link>
            </Button>
          )
        }
      />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <Chip pressed={city === "all"} onClick={() => setCity("all")}>
          All cities
        </Chip>
        {cities.map((item) => (
          <Chip key={item.slug} pressed={city === item.slug} onClick={() => setCity(item.slug)}>
            {item.city}
          </Chip>
        ))}
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_160px_160px_auto] sm:items-end">
        <label className="grid gap-1.5 text-sm">
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
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">From</span>
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">To</span>
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          />
        </label>
        <label className="flex h-10 items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-rust"
            checked={hideFilled}
            onChange={(event) => setHideFilled(event.target.checked)}
          />
          Hide filled
        </label>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        {rows.length} date{rows.length === 1 ? "" : "s"}
      </p>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card px-4 py-10 text-center">
          <p className="font-display text-2xl">No rooms match.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Widen the city or the dates. Filled nights are hidden until you uncheck that box.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map(({ openDate, venue, fill }) => {
            const parts = monthParts(openDate.date);
            return (
              <Link
                key={openDate.id}
                href={`/dates/${openDate.id}`}
                className="grid grid-cols-[76px_1fr] gap-3 rounded-2xl border bg-card p-3 transition hover:border-rust/40 sm:grid-cols-[92px_1fr_auto] sm:items-center sm:p-4"
              >
                <div className="rounded-xl bg-ink px-2 py-2 text-center text-cream">
                  <p className="text-[10px] tracking-[0.16em] text-amber">{parts.month}</p>
                  <p className="font-display text-3xl leading-none">{parts.day}</p>
                  <p className="text-[11px] text-cream/70">{parts.weekday}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{venue.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {venue.city} · {venue.capacity} cap · {openDate.showTime} · {openDate.slot}
                  </p>
                  <p className="mt-1 line-clamp-1 text-sm">{venue.typicalDeal}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {openDate.genres.map((item) => (
                      <span key={item} className="rounded-full bg-sand px-2 py-0.5 text-xs">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1 sm:text-right">
                  <StatusPill status={fill} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PageFrame>
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
        "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        pressed ? "border-ink bg-ink text-cream" : "bg-card text-foreground hover:bg-sand",
      )}
    >
      {children}
    </button>
  );
}
