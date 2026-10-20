import Link from "next/link";
import { EnterBar } from "@/components/enter-bar";
import { Button } from "@/components/ui/button";

const route = [
  { city: "Phoenix", date: "Nov 6", state: "Confirmed" },
  { city: "Flagstaff", date: "Nov 7", state: "Offer" },
  { city: "Cottonwood", date: "Nov 8", state: "Counter" },
  { city: "Albuquerque", date: "Nov 11", state: "Confirmed" },
  { city: "Las Vegas", date: "Nov 13", state: "Request" },
];

const features = [
  {
    title: "Book gigs",
    copy: "Bands and venues meet on open dates, street permits, and fair calls. A band requests the date. A venue sends the offer. Two shows the same date are fine when the times do not overlap and the drive fits.",
  },
  {
    title: "Negotiate deals",
    copy: "Guarantee, door split, or a guarantee plus a percentage. Ticket price, backline, and load-in stay on every counter until someone accepts.",
  },
  {
    title: "Plan tours",
    copy: "A start city and a number of days lines up rooms you can drive between. The route prices miles, lodging, and fuel from the van.",
  },
  {
    title: "Lodging",
    copy: "Hotels, motels, rentals, campgrounds, and van notes for the gig city, with a sample briefing of local overnight rules. A room marked booked stays booked.",
  },
  {
    title: "Find musicians",
    copy: "Fill-in dates and open chairs, with the instrument, the city, the pay, and the date. Confirming a player closes the other notes for that date.",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="bg-ink text-cream">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-amber uppercase">
              Bands, venues, and the players who sit in
            </p>
            <h1 className="mt-4 font-display text-5xl leading-[0.95] tracking-tight text-balance sm:text-7xl">
              Book gigs. Plan the tour.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-cream/75">
              Bands and venues find each other, negotiate terms, and confirm dates with no double
              bookings. Plan the tour from there: the route, lodging, and fuel. The musician board
              fills an empty chair.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="h-11 bg-amber px-5 text-ink hover:bg-amber/90">
                <Link href="/dates">Find gigs</Link>
              </Button>
              <Button asChild className="h-11 bg-amber px-5 text-ink hover:bg-amber/90">
                <Link href="/bands">Find bands</Link>
              </Button>
            </div>
            <p className="mt-3 max-w-xl text-sm text-cream/60">
              Find gigs is the band side. Find bands is the venue side. The same book is on the{" "}
              <Link href="/phone" className="font-semibold text-amber underline-offset-2 hover:underline">
                phone
              </Link>
              .
            </p>
          </div>
          <div className="rounded-3xl border border-cream/15 bg-cream/5 p-4">
            <p className="text-xs font-semibold tracking-[0.16em] text-amber uppercase">
              Sample route · Mesa Dust
            </p>
            <ol className="mt-3">
              {route.map((stop, index) => (
                <li
                  key={stop.city}
                  className="flex items-center justify-between gap-3 border-b border-cream/10 py-3 last:border-0"
                >
                  <span className="flex items-center gap-3">
                    <span className="font-display text-amber">{index + 1}</span>
                    <span>
                      <span className="block font-medium">{stop.city}</span>
                      <span className="text-sm text-cream/60">{stop.date}</span>
                    </span>
                  </span>
                  <span className="text-xs font-semibold tracking-wide text-cream/80 uppercase">
                    {stop.state}
                  </span>
                </li>
              ))}
            </ol>
            <Button asChild variant="outline" className="mt-2 h-10 w-full border-cream/20 bg-transparent text-cream hover:bg-cream/10">
              <Link href="/tour">Open the tour</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-4xl tracking-tight">Pick a side of the table</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Or open the sample Southwest book. These three profiles are already mid-conversation, so the desks are not empty.
        </p>
        <div className="mt-6 rounded-3xl bg-ink p-3 text-cream sm:p-4">
          <EnterBar />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-14 sm:grid-cols-2 sm:px-6">
        {features.map((feature, index) => (
          <article key={feature.title} className="rounded-2xl border bg-card p-5">
            <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">{index + 1}</p>
            <h3 className="mt-2 font-display text-2xl">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.copy}</p>
          </article>
        ))}
      </section>

      <section className="border-t bg-sand/50">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="font-display text-4xl">How a date becomes a gig</h2>
            <ol className="mt-4 grid gap-3 text-sm leading-relaxed">
              <li><span className="font-semibold">1. A venue posts a date.</span> City, daypart, start time, and what they usually pay.</li>
              <li><span className="font-semibold">2. A band requests it, or the room sends an offer.</span> Guarantee, door split, or both.</li>
              <li><span className="font-semibold">3. Either side counters.</span> Ticket price, backline, and load-in stay attached.</li>
              <li><span className="font-semibold">4. Accept prints a confirmation.</span> The other talks on that date close, and lodging for the city is one link away.</li>
            </ol>
          </div>
          <div className="rounded-3xl bg-card p-5 ring-1 ring-border">
            <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">On the board</p>
            <p className="mt-2 font-display text-3xl">Need a drummer for one Friday, or a guitarist for good?</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Listings say the instrument, the city, whether it pays, and the date. Interest is a note, not a contract.
            </p>
            <Button asChild className="mt-5 h-10">
              <Link href="/board">Open the musician board</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
