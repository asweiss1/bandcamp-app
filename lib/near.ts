import { bands, getVenue, venues } from "@/lib/catalog";
import { CITY_COORDS, milesBetween, placeForSlug, type Place } from "@/lib/geo";
import { dateFill } from "@/lib/queries";
import type { Snapshot } from "@/lib/types";

export type NearHit = {
  id: string;
  href: string;
  phoneHref: string;
  title: string;
  meta: string;
  detail: string;
  miles: number;
  kind: "date" | "band" | "permit" | "fair" | "board";
};

function milesToSlug(place: Place, slug: string) {
  const coords = CITY_COORDS[slug];
  if (!coords) return null;
  return Math.round(milesBetween(place, coords));
}

export function nearFeed(snapshot: Snapshot, place: Place, radiusMiles: number, surface: "desk" | "phone") {
  const dates: NearHit[] = [];
  for (const openDate of snapshot.openDates) {
    if (dateFill(openDate.id, snapshot.bookings) === "filled") continue;
    const venue = getVenue(openDate.venueId);
    if (!venue) continue;
    const miles = milesToSlug(place, venue.citySlug);
    if (miles == null || miles > radiusMiles) continue;
    dates.push({
      id: openDate.id,
      href: `/dates/${openDate.id}`,
      phoneHref: `/phone/book/${openDate.id}`,
      title: venue.name,
      meta: `${openDate.date} · ${venue.city} · ${miles} mi`,
      detail: `${openDate.showTime} · ${openDate.slot} · ${venue.typicalDeal}`,
      miles,
      kind: "date",
    });
  }
  dates.sort((a, b) => a.miles - b.miles || a.meta.localeCompare(b.meta));

  const bandHits: NearHit[] = [];
  for (const band of bands) {
    const home = milesToSlug(place, band.citySlug);
    const hold = snapshot.bookings.find((booking) => {
      if (booking.bandId !== band.id || booking.status === "declined") return false;
      const venue = getVenue(booking.venueId);
      if (!venue) return false;
      const miles = milesToSlug(place, venue.citySlug);
      return miles != null && miles <= radiusMiles;
    });
    const inHome = home != null && home <= radiusMiles;
    if (!inHome && !hold) continue;
    let miles = radiusMiles;
    if (inHome && home != null) {
      miles = home;
    } else if (hold) {
      const venue = getVenue(hold.venueId);
      miles = venue ? (milesToSlug(place, venue.citySlug) ?? radiusMiles) : radiusMiles;
    }
    bandHits.push({
      id: band.id,
      href: `/bands/${band.id}`,
      phoneHref: `/bands/${band.id}`,
      title: band.name,
      meta: `${band.city} · ${miles} mi${band.touring ? " · touring" : ""}`,
      detail: hold ? "Has a hold inside this radius." : band.availability,
      miles,
      kind: "band",
    });
  }
  bandHits.sort((a, b) => a.miles - b.miles);

  const calls: NearHit[] = [];
  for (const opportunity of snapshot.opportunities) {
    const miles = milesToSlug(place, opportunity.citySlug);
    if (miles == null || miles > radiusMiles) continue;
    calls.push({
      id: opportunity.id,
      href: `/opportunities/${opportunity.id}`,
      phoneHref: `/phone/book/opp/${opportunity.id}`,
      title: opportunity.title,
      meta: `${opportunity.startDate} · ${opportunity.city} · ${miles} mi`,
      detail: opportunity.compensation,
      miles,
      kind: opportunity.kind === "permit" ? "permit" : "fair",
    });
  }
  calls.sort((a, b) => a.miles - b.miles || a.meta.localeCompare(b.meta));

  const posts: NearHit[] = [];
  for (const listing of snapshot.listings) {
    const miles = milesToSlug(place, listing.citySlug);
    if (miles == null || miles > radiusMiles) continue;
    posts.push({
      id: listing.id,
      href: `/board/${listing.id}`,
      phoneHref: `/phone/board/${listing.id}`,
      title: listing.title,
      meta: `${listing.city} · ${listing.instrument} · ${miles} mi`,
      detail: listing.paid ? listing.payNote : "Unpaid",
      miles,
      kind: "board",
    });
  }
  posts.sort((a, b) => a.miles - b.miles);

  const known = venues.some((venue) => milesToSlug(place, venue.citySlug) != null && milesToSlug(place, venue.citySlug)! <= radiusMiles);
  return {
    dates: dates.slice(0, 12),
    bands: bandHits.slice(0, 8),
    calls: calls.slice(0, 8),
    posts: posts.slice(0, 8),
    seededNearby: known || calls.length > 0 || posts.length > 0,
    desk: surface === "desk",
  };
}

export function placeHasSampleCity(place: Place) {
  return Boolean(placeForSlug(place.id));
}
