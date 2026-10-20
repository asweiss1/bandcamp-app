"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getFan } from "@/lib/catalog";
import { followedShows, nearShows, todayIso } from "@/lib/fans";
import { useApp } from "@/lib/store";
import type { PublicShow } from "@/lib/fans";
import { cn } from "@/lib/utils";
import { PageFrame, PageIntro } from "@/components/shell";

const ShowMap = dynamic(() => import("@/components/show-map").then((mod) => mod.ShowMap), {
  ssr: false,
  loading: () => <div className="h-80 rounded-2xl border bg-sand" />,
});

const RADII = [25, 50, 100, 200];

export function FanHome({ surface, focus }: { surface: "desk" | "phone"; focus: "feed" | "near" }) {
  const { snapshot } = useApp();
  const fan = snapshot.role === "fan" ? getFan(snapshot.fanId) : null;
  const [radius, setRadius] = useState(fan?.radiusMiles ?? 100);
  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState("");
  const [view, setView] = useState<"list" | "map">("list");
  const happening = fan ? followedShows(snapshot, fan.id, from) : [];
  const nearby = fan ? nearShows(snapshot, fan, radius, from, to) : nearShowsForGuest(snapshot, radius, from, to);
  const showHref = (id: string) => (surface === "phone" ? `/phone/shows/${id}` : `/shows/${id}`);

  const body = (
    <div id="fan-feed" className="grid gap-8">
      {focus === "feed" ? (
        <section className="grid gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">What&apos;s happening</p>
            <h2 className="mt-1 font-display text-3xl">From bands and rooms you follow</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Confirmed shows only. Offers and counters stay private until someone accepts.
            </p>
          </div>
          {fan ? (
            <ShowList shows={happening} hrefFor={showHref} empty="Follow a band or a room. Their confirmed shows show up here." />
          ) : (
            <p className="rounded-2xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
              Switch to a fan profile to follow bands and rooms.
            </p>
          )}
        </section>
      ) : null}
      <section className="grid gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Near you</p>
          <h2 className="mt-1 font-display text-3xl">{fan ? fan.city : "Confirmed shows"}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Public shows inside {radius} miles{fan ? ` of ${fan.name}'s hometown` : ""}. Sample fans live in the seeded Southwest cities.
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {RADII.map((miles) => (
            <button
              key={miles}
              type="button"
              aria-pressed={radius === miles}
              onClick={() => setRadius(miles)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium",
                radius === miles ? "border-ink bg-ink text-cream" : "bg-card",
              )}
            >
              {miles} mi
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">From</span>
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-10 rounded-lg border border-input bg-transparent px-2 text-sm" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">To</span>
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-10 rounded-lg border border-input bg-transparent px-2 text-sm" />
          </label>
        </div>
        <div className="flex gap-2">
          {(["list", "map"] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={view === item}
              onClick={() => setView(item)}
              className={cn("rounded-full px-3 py-1.5 text-sm font-semibold", view === item ? "bg-ink text-cream" : "bg-sand")}
            >
              {item === "list" ? "List" : "Map"}
            </button>
          ))}
        </div>
        {view === "map" ? (
          <ShowMap shows={nearby.map((show) => ({ ...show, href: showHref(show.bookingId) }))} />
        ) : (
          <ShowList shows={nearby} hrefFor={showHref} empty="No confirmed shows in that radius and those dates." />
        )}
      </section>
    </div>
  );

  if (surface === "phone") {
    return (
      <div className="grid gap-4 pb-2">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">{focus === "near" ? "Near you" : "What's happening"}</p>
          <h1 className="mt-1 font-display text-4xl leading-none tracking-tight">{fan?.name ?? "Shows"}</h1>
        </div>
        {body}
      </div>
    );
  }

  return (
    <PageFrame>
      <PageIntro
        eyebrow="Fans"
        title={focus === "near" ? "Near you" : "What's happening"}
        lede={
          fan
            ? `${fan.name} follows bands and rooms from ${fan.city}. Confirmed shows are public. Negotiations stay off this page.`
            : "Confirmed shows are public. Switch to a fan profile to follow bands and rooms."
        }
      />
      {body}
    </PageFrame>
  );
}

function ShowList({
  shows,
  hrefFor,
  empty,
}: {
  shows: (PublicShow & { miles?: number })[];
  hrefFor: (id: string) => string;
  empty: string;
}) {
  if (shows.length === 0) {
    return <p className="rounded-2xl border border-dashed px-4 py-8 text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="grid gap-2">
      {shows.map((show) => (
        <li key={show.bookingId}>
          <Link href={hrefFor(show.bookingId)} className="block rounded-2xl border bg-card px-4 py-3 hover:border-rust/40">
            <p className="font-medium">{show.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {show.dateLabel} · {show.when}
              {show.miles != null ? ` · ${show.miles} mi` : ""}
            </p>
            <p className="mt-1 text-sm">
              {show.venueName} · {show.city} · {show.cover} · {show.age}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function nearShowsForGuest(snapshot: Parameters<typeof nearShows>[0], radius: number, from: string, to: string) {
  const fan = getFan("avery-quinn");
  if (!fan) return [];
  return nearShows(snapshot, { ...fan, radiusMiles: radius }, radius, from, to);
}
