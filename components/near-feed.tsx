"use client";

import Link from "next/link";
import { nearFeed } from "@/lib/near";
import { searchLinksFor } from "@/lib/lodging";
import { usePlace } from "@/lib/place";
import { useApp } from "@/lib/store";
import { PlacePicker } from "@/components/place-picker";

const sections = [
  { key: "dates", title: "Open dates", empty: "No open rooms inside this radius." },
  { key: "bands", title: "Bands in range", empty: "No touring or local bands in the sample set here." },
  { key: "calls", title: "Permits and fairs", empty: "No sample permits or fairs inside this radius." },
  { key: "posts", title: "Musician board", empty: "No board posts inside this radius." },
] as const;

export function NearFeed({ surface }: { surface: "desk" | "phone" }) {
  const { snapshot } = useApp();
  const { place, radiusMiles, setPlace, setRadius } = usePlace();
  const feed = nearFeed(snapshot, place, radiusMiles, surface);
  const links = searchLinksFor(place.label);
  const stayHref =
    surface === "phone"
      ? `/phone/stay?label=${encodeURIComponent(place.label)}`
      : `/lodging/outbound?label=${encodeURIComponent(place.label)}`;

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Near you · sample</p>
        <h1 className="mt-1 font-display text-4xl leading-none tracking-tight sm:text-5xl">
          Within {radiusMiles} miles
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Open rooms, bands passing through, permits, fairs, and board posts around {place.label}. Distances
          are straight-line miles. Listings are seeded sample data. A town with nothing seeded still gets map
          and lodging links.
        </p>
      </div>
      <PlacePicker place={place} onPlace={setPlace} radiusMiles={radiusMiles} onRadius={setRadius} />
      {!feed.seededNearby ? (
        <p className="rounded-2xl border border-amber/50 bg-accent px-4 py-3 text-sm">
          No sample listings inside {radiusMiles} miles of {place.city}. Maps and lodging search still work.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Link href={stayHref} className="inline-flex h-10 items-center rounded-lg border bg-card px-3 text-sm font-medium">
          Lodging links
        </Link>
        {links.slice(0, 2).map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center rounded-lg border bg-card px-3 text-sm font-medium"
          >
            {link.label}
          </a>
        ))}
      </div>
      {sections.map((section) => {
        const items = feed[section.key];
        return (
          <section key={section.key} className="grid gap-2">
            <h2 className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              {section.title}
            </h2>
            {items.length === 0 ? (
              <p className="rounded-2xl border bg-card px-4 py-3 text-sm text-muted-foreground">{section.empty}</p>
            ) : (
              items.map((item) => (
                <Link
                  key={item.id}
                  href={surface === "phone" ? item.phoneHref : item.href}
                  className="rounded-2xl border bg-card px-4 py-3"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="font-medium leading-snug">{item.title}</span>
                    <span className="shrink-0 rounded-full bg-sand px-2 py-1 text-[11px] font-semibold uppercase">
                      Sample
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">{item.meta}</span>
                  <span className="mt-1 block text-sm">{item.detail}</span>
                </Link>
              ))
            )}
          </section>
        );
      })}
    </div>
  );
}
