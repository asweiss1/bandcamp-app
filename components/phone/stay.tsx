"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cities, getCity, getMusician } from "@/lib/catalog";
import { formatDay } from "@/lib/deal";
import { rulesFor, searchLinks, searchLinksFor, STAY_GROUPS, staysFor } from "@/lib/lodging";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { liveStops, nextStop, viewerStops } from "@/components/phone/stops";

export function PhoneStay() {
  const router = useRouter();
  const params = useSearchParams();
  const { snapshot } = useApp();
  const requested = params.get("city");
  const label = params.get("label");
  const stops = liveStops(viewerStops(snapshot));
  const upcoming = nextStop(stops);
  const homeSlug =
    snapshot.role === "musician" ? getMusician(snapshot.musicianId)?.citySlug : upcoming?.citySlug;
  const known = cities.some((city) => city.slug === requested);
  const slug = known && requested ? requested : homeSlug ?? "flagstaff-az";
  const city = getCity(slug);
  const rules = rulesFor(slug);
  const stays = staysFor(slug);
  const dated = stops.find((stop) => stop.citySlug === slug);
  const links = searchLinks(slug, dated?.openDate.date);

  function pick(next: string) {
    router.replace(`/phone/stay?city=${next}`);
  }

  if (label && !(known && requested)) {
    const outbound = searchLinksFor(label);
    return (
      <div className="grid gap-4 pb-2">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Stay · sample links</p>
          <h1 className="mt-1 font-display text-4xl leading-none tracking-tight">{label}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No seeded lodging cards or local-rules briefing for this town. The buttons still search maps and places to sleep.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {outbound.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="grid h-11 place-items-center rounded-lg border bg-card px-2 text-center text-xs font-semibold"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 pb-2">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Stay</p>
        <h1 className="mt-1 font-display text-4xl leading-none tracking-tight">
          {city ? city.city : "Pick a city"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {dated
            ? `Gig night ${formatDay(dated.openDate.date)} at ${dated.venueName}.`
            : city?.blurb}
        </p>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {cities.map((item) => {
          const selected = item.slug === slug;
          return (
            <button
              key={item.slug}
              type="button"
              aria-pressed={selected}
              onClick={() => pick(item.slug)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium",
                selected ? "bg-ink text-cream" : "bg-card text-foreground ring-1 ring-border",
              )}
            >
              {item.city}
            </button>
          );
        })}
      </div>

      {rules ? (
        <section className="rounded-3xl bg-pine p-4 text-cream">
          <p className="text-xs font-semibold tracking-[0.16em] text-amber uppercase">
            Local rules · example only
          </p>
          <h2 className="mt-1 font-display text-2xl">Not legal advice</h2>
          <p className="mt-2 text-sm leading-relaxed text-cream/80">
            Sample briefing for {city?.label}. A production app would replace this with reviewed city and land-management sources.
          </p>
          <dl className="mt-4 grid gap-3 text-sm">
            <Rule label="Sleeping in a vehicle" value={rules.vehicleSleeping} />
            <Rule label="Streets and lots" value={rules.streetsAndLots} />
            <Rule label="Walmart, BLM, rest areas" value={rules.walmartBlmRest} />
            <Rule label="Permits" value={rules.permits} />
          </dl>
        </section>
      ) : (
        <p className="rounded-2xl border bg-card px-4 py-4 text-sm">No sample rules for this city.</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="grid h-11 place-items-center rounded-lg border bg-card px-2 text-center text-xs font-semibold"
          >
            {link.label}
          </a>
        ))}
      </div>

      {stays.length === 0 ? (
        <p className="rounded-2xl border bg-card px-4 py-3 text-sm">
          No sample lodging cards for {city?.city ?? "this town"}. Search buttons still open Airbnb, hotels, campgrounds, and a map.
        </p>
      ) : null}

      {STAY_GROUPS.map((group) => {
        const items = stays.filter((stay) => stay.type === group.type);
        if (items.length === 0) return null;
        return (
          <section key={group.type} className="grid gap-2">
            <div>
              <h2 className="font-display text-2xl">{group.label}</h2>
              <p className="text-sm text-muted-foreground">{group.blurb}</p>
            </div>
            {items.map((stay) => (
              <article key={stay.id} className="rounded-2xl border bg-card px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium leading-snug">{stay.name}</h3>
                  <p className="shrink-0 text-right text-xs font-semibold">{stay.price}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stay.area} · {stay.distance}
                </p>
                <p className="mt-2 text-sm leading-relaxed">{stay.notes}</p>
              </article>
            ))}
          </section>
        );
      })}
    </div>
  );
}

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-amber">{label}</dt>
      <dd className="mt-1 leading-relaxed text-cream/85">{value}</dd>
    </div>
  );
}
