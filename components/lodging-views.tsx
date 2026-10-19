"use client";

import Link from "next/link";
import { cities, getCity } from "@/lib/catalog";
import { formatDayLong } from "@/lib/deal";
import { rulesFor, searchLinks, STAY_GROUPS, staysFor } from "@/lib/lodging";
import { PageFrame, PageIntro } from "@/components/shell";
import { Button } from "@/components/ui/button";

export function LodgingIndex() {
  return (
    <PageFrame>
      <PageIntro
        eyebrow="After the gig"
        title="Where the van sleeps"
        lede="Hotels, motels, short-term rentals, campgrounds, and overnight parking notes for the sample cities. Every rate and legal line on these pages is example data."
      />
      <div className="mb-6 rounded-2xl border border-amber/50 bg-accent px-4 py-4 text-sm leading-relaxed">
        <p className="font-semibold">Example data, not legal advice.</p>
        <p className="mt-1">
          A production version would pull availability from lodging APIs and camping or parking
          rules from reviewed municipal and land-management sources. Nothing here is a statement
          of current law.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {cities.map((city) => (
          <Link
            key={city.slug}
            href={`/lodging/${city.slug}`}
            className="rounded-2xl border bg-card p-4 transition hover:border-rust/40"
          >
            <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">{city.state}</p>
            <h2 className="mt-1 font-display text-3xl">{city.city}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{city.blurb}</p>
          </Link>
        ))}
      </div>
    </PageFrame>
  );
}

export function LodgingCity({ slug, date }: { slug: string; date?: string }) {
  const city = getCity(slug);
  const rules = rulesFor(slug);
  const stays = staysFor(slug);
  if (!city) {
    return (
      <PageFrame>
        <h1 className="font-display text-4xl">That city isn&apos;t in the sample set.</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Search any US town from Near you. Maps and lodging links still open for a place that has no seeded rooms.
        </p>
        <Button asChild className="mt-4 h-10">
          <Link href="/near">Search a town</Link>
        </Button>
      </PageFrame>
    );
  }
  const links = searchLinks(slug, date);
  if (!rules) {
    return (
      <PageFrame>
        <Link href="/lodging" className="text-sm font-medium text-rust">
          ← All cities
        </Link>
        <p className="mt-4 text-xs font-semibold tracking-[0.16em] text-rust uppercase">Sample city</p>
        <h1 className="mt-2 font-display text-5xl tracking-tight">{city.label}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{city.blurb}</p>
        <div className="mt-5 rounded-2xl border border-amber/60 bg-accent px-4 py-4 text-sm leading-relaxed">
          <p className="font-semibold">No sample lodging cards for this town.</p>
          <p className="mt-1">
            Rooms in the catalog can still be booked. These buttons search Airbnb, hotels, campgrounds, and a map.
            They are outbound links, not live rates.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {links.map((link) => (
            <Button key={link.label} asChild variant="outline" className="h-10">
              <a href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </Button>
          ))}
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <Link href="/lodging" className="text-sm font-medium text-rust">
        ← All cities
      </Link>
      <p className="mt-4 text-xs font-semibold tracking-[0.16em] text-rust uppercase">
        {date ? `Around ${formatDayLong(date)}` : "Sample city guide"}
      </p>
      <h1 className="mt-2 font-display text-5xl tracking-tight">{city.label}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{city.blurb}</p>
      <div className="mt-5 rounded-2xl border border-amber/60 bg-accent px-4 py-4 text-sm leading-relaxed">
        <p className="font-semibold">Example data — not legal advice and not a live listing.</p>
        <p className="mt-1">
          Rates, campgrounds, and the local-rules panel are written for this prototype. They are
          not reviewed ordinances, store policies, or bookable inventory. Outbound buttons search
          the real sites for {city.city}
          {date ? ` around ${date}` : ""}.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {links.map((link) => (
          <Button key={link.label} asChild variant="outline" className="h-10">
            <a href={link.href} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          </Button>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
        <aside className="rounded-2xl bg-pine p-4 text-cream lg:sticky lg:top-20">
          <p className="text-xs font-semibold tracking-[0.16em] text-amber uppercase">
            Local rules · sample briefing
          </p>
          <h2 className="mt-2 font-display text-3xl">Camping and overnight parking</h2>
          <p className="mt-2 text-sm text-cream/75">
            Example answers for the prototype. Confirm with the city, the county, and the land
            manager before you park.
          </p>
          <Rule title="Sleeping in a vehicle" body={rules.vehicleSleeping} />
          <Rule title="Streets and lots" body={rules.streetsAndLots} />
          <Rule title="Big-box, BLM, rest areas" body={rules.walmartBlmRest} />
          <Rule title="Permits" body={rules.permits} />
        </aside>
        <div className="grid gap-8">
          {STAY_GROUPS.map((group) => {
            const items = stays.filter((stay) => stay.type === group.type);
            return (
              <section key={group.type}>
                <h2 className="font-display text-3xl">{group.label}</h2>
                <p className="mt-1 mb-3 text-sm text-muted-foreground">{group.blurb}</p>
                <div className="grid gap-3">
                  {items.map((stay) => (
                    <article key={stay.id} className="rounded-2xl border bg-card p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="font-semibold">{stay.name}</h3>
                        <span className="rounded-full bg-sand px-2 py-1 text-xs font-medium">
                          Example
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {stay.area} · {stay.distance}
                      </p>
                      <p className="mt-2 text-sm font-medium">{stay.price}</p>
                      <p className="mt-2 text-sm leading-relaxed">{stay.notes}</p>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </PageFrame>
  );
}

function Rule({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-4 border-t border-cream/15 pt-3">
      <h3 className="text-sm font-semibold text-amber">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-cream/90">{body}</p>
    </div>
  );
}
