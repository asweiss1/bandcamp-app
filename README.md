# BandCamp

Working prototype of a booking desk for bands, small venues, and fill-in musicians. It runs as a Next.js app with seeded Southwest dates. There is no account and no server of your own: role switching stands in for login, and negotiations, listings, and notes stay in this browser.

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317). The phone companion is [http://127.0.0.1:4317/phone](http://127.0.0.1:4317/phone).

## Phone companion

`/phone` is a road view of the same app, not a second codebase. It shares `useApp()` and the `bandcamp.prototype.v1` localStorage key, so an accept on the phone updates the desk and the other way around.

- **Next** shows the next gig and anything waiting on you. Musicians see board calls that match their instrument.
- **Book** is the marketplace on the phone. Filter open dates by city, genre, and start date. A band sends a gig request. A venue posts a night and offers it to a band. Accept, counter, and decline stay on the gig screen.
- **Route** lines a band's holds up by date and city. A venue sees nights at the room, plus dates still open.
- **Stay** is lodging and the sample local-rules briefing for the gig city (or any of the six sample cities).
- **Board** is fill-ins and permanent chairs, with the same interest note as the desk.
- **You** switches the role and profile, resets demo data, and links back to the full desk.

On a phone, Add to Home Screen opens `/phone` standalone. The web app manifest sets that start URL. It is not an App Store or Play binary.

Production build, still with no database:

```bash
npm run build
npm start
```

Deploy the Next.js app (for example on Vercel or any Node host). New bookings use dynamic routes, so a pure static file dump is a later step, not the default. Lodging and legal copy are example data and do not call outside APIs.

## What you can click through

- **Profiles.** Bands list genre, home city, members, sample links, a fee range, touring vs local, and availability. Venues list city, capacity, genres, typical pay, booker contact, backline, and open dates. Musicians have their own short profiles.
- **Marketplace.** Venues post nights. Bands filter by city, date, and genre, then request a gig. Venues send offers from a band profile. Deals are a guarantee, a door split, or a guarantee plus a percentage, with ticket price, backline, and load-in. Either side can counter, accept, or decline. Accepting confirms the night and closes other talks on that date.
- **Desks and a route.** Each role has a desk for requests, offers, and confirmed gigs. A band's tour view lines those nights up by date and city and points at lodging.
- **Lodging.** Phoenix, Flagstaff, Cottonwood, Tucson, Albuquerque, and Las Vegas have sample hotels, motels, short-term rentals, campgrounds, and van or overnight-parking notes, plus a local-rules panel. Outbound buttons search Airbnb, hotel, campground, and map sites. The rules are labeled example data, not legal advice.
- **Musician board.** Fill-in gigs and permanent chairs, filterable by instrument, genre, city, and pay. Interest is a note saved locally.
- **Phone companion.** `/phone` is the road slice: next gig, booking open dates, route, lodging rules, quick accept or counter, and the board. The header phone icon and the landing page both open it.

Switch roles with **View as** in the header. **Reset demo data** there puts the seeded conversations back.

## Where a backend would plug in

Pages talk to `useApp()` in `lib/store.tsx`. That store reads the seed in `lib/seed.ts` and persists through `LocalRepository` in `lib/repository.ts`. Replace the repository with API calls that load and save the same snapshot (open dates, bookings, listings, interests) and the screens can stay. Catalog records for bands, venues, musicians, and cities live in `lib/catalog.ts`; lodging copy lives in `lib/lodging.ts`.

## Production roadmap

- **Accounts.** Real login for bands, venues, and players, with more than one person on a band or a room.
- **Payments and contracts.** Deposits, settlement of guarantees and door splits, and a signed deal instead of an in-app accept button.
- **Messaging.** A thread that is not just the offer history, with email or SMS when it is your move.
- **Lodging APIs.** Live hotel, short-term rental, and campground availability and prices for the gig date, instead of sample cards.
- **Legal data.** Camping and overnight-parking rules sourced from reviewed city, county, and land-management material, dated, and kept current. The copy in this prototype must not ship as advice.
- **Trust and ops.** Cancellations, insurance, moderation of board posts, and calendar or ticketing sync.
