import type { Fan, FanAlert, Follow, Rsvp } from "@/lib/types";

const phx = { lat: 33.4484, lng: -112.074 };
const flag = { lat: 35.1983, lng: -111.6513 };
const cottonwood = { lat: 34.7392, lng: -112.0099 };

export const seedFans: Fan[] = [
  {
    id: "avery-quinn",
    name: "Avery Quinn",
    city: "Phoenix, AZ",
    citySlug: "phoenix-az",
    ...phx,
    styles: ["Desert rock", "Americana"],
    radiusMiles: 100,
  },
  {
    id: "nia-cole",
    name: "Nia Cole",
    city: "Phoenix, AZ",
    citySlug: "phoenix-az",
    ...phx,
    styles: ["Desert rock", "Indie rock"],
    radiusMiles: 40,
  },
  {
    id: "jules-park",
    name: "Jules Park",
    city: "Phoenix, AZ",
    citySlug: "phoenix-az",
    ...phx,
    styles: ["Americana", "Alt-country"],
    radiusMiles: 60,
  },
  {
    id: "owen-diaz",
    name: "Owen Diaz",
    city: "Phoenix, AZ",
    citySlug: "phoenix-az",
    ...phx,
    styles: ["Indie rock"],
    radiusMiles: 25,
  },
  {
    id: "rio-bell",
    name: "Rio Bell",
    city: "Flagstaff, AZ",
    citySlug: "flagstaff-az",
    ...flag,
    styles: ["Desert rock", "Americana"],
    radiusMiles: 50,
  },
  {
    id: "sam-holt",
    name: "Sam Holt",
    city: "Flagstaff, AZ",
    citySlug: "flagstaff-az",
    ...flag,
    styles: ["Indie folk", "Americana"],
    radiusMiles: 40,
  },
  {
    id: "mia-chen",
    name: "Mia Chen",
    city: "Flagstaff, AZ",
    citySlug: "flagstaff-az",
    ...flag,
    styles: ["Desert rock"],
    radiusMiles: 30,
  },
  {
    id: "lane-okada",
    name: "Lane Okada",
    city: "Cottonwood, AZ",
    citySlug: "cottonwood-az",
    ...cottonwood,
    styles: ["Americana", "Alt-country"],
    radiusMiles: 50,
  },
];

export const seedFollows: Follow[] = [
  follow("fl-avery-mesa", "avery-quinn", "mesa-dust", "band"),
  follow("fl-avery-yucca", "avery-quinn", "yucca-room", "venue"),
  follow("fl-avery-salt", "avery-quinn", "salt-choir", "band"),
  follow("fl-nia-mesa", "nia-cole", "mesa-dust", "band"),
  follow("fl-jules-mesa", "jules-park", "mesa-dust", "band"),
  follow("fl-jules-yucca", "jules-park", "yucca-room", "venue"),
  follow("fl-owen-yucca", "owen-diaz", "yucca-room", "venue"),
  follow("fl-rio-mesa", "rio-bell", "mesa-dust", "band"),
  follow("fl-sam-mesa", "sam-holt", "mesa-dust", "band"),
  follow("fl-mia-mesa", "mia-chen", "mesa-dust", "band"),
  follow("fl-lane-mesa", "lane-okada", "mesa-dust", "band"),
];

export const seedRsvps: Rsvp[] = [
  { id: "rsvp-avery-yucca", fanId: "avery-quinn", bookingId: "bk-yucca-mesa", status: "going", createdAt: "2026-10-12T18:00:00.000Z" },
  { id: "rsvp-nia-yucca", fanId: "nia-cole", bookingId: "bk-yucca-mesa", status: "interested", createdAt: "2026-10-13T18:00:00.000Z" },
  { id: "rsvp-jules-yucca", fanId: "jules-park", bookingId: "bk-yucca-mesa", status: "going", createdAt: "2026-10-14T18:00:00.000Z" },
];

export const seedAlerts: FanAlert[] = [
  {
    id: "al-avery-yucca-band",
    fanId: "avery-quinn",
    bookingId: "bk-yucca-mesa",
    kind: "band-near",
    title: "Mesa Dust booked a date near you",
    body: "Friday, Nov 6 at The Yucca Room in Phoenix, AZ. This confirmed show is inside your radius.",
    createdAt: "2026-10-04T16:00:00.000Z",
    read: false,
  },
  {
    id: "al-avery-yucca-room",
    fanId: "avery-quinn",
    bookingId: "bk-yucca-mesa",
    kind: "venue-lineup",
    title: "The Yucca Room posted a lineup",
    body: "Mesa Dust is confirmed for Friday, Nov 6 at 8:30pm.",
    createdAt: "2026-10-04T16:05:00.000Z",
    read: false,
  },
  {
    id: "al-avery-verde",
    fanId: "avery-quinn",
    bookingId: "bk-verde-1106",
    kind: "band-near",
    title: "Mesa Dust booked a date near you",
    body: "Friday, Nov 6 at Verde Taproom in Cottonwood, AZ. This confirmed show is inside your radius.",
    createdAt: "2026-10-08T16:00:00.000Z",
    read: false,
  },
];

function follow(id: string, fanId: string, targetId: string, targetRole: "band" | "venue"): Follow {
  return { id, fanId, targetId, targetRole, createdAt: "2026-10-01T15:00:00.000Z" };
}
