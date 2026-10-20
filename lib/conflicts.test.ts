import assert from "node:assert/strict";
import test from "node:test";
import {
  candidateForApplication,
  candidateForBooking,
  candidateForFillIn,
  confirmedClash,
  datesMentioned,
  DRIVE_LIMIT_HOURS,
  lodgingClash,
  competingIds,
  pendingOverlap,
  planBatchClash,
} from "@/lib/conflicts";
import { daypartFor } from "@/lib/daypart";
import { defaultTerms } from "@/lib/deal";
import type { Application, Booking, Interest, Listing, NightStay, OpenDate, Opportunity, Snapshot } from "@/lib/types";

function night(id: string, venueId: string, date: string, showTime: string): OpenDate {
  return {
    id,
    venueId,
    date,
    showTime,
    genres: ["Americana"],
    slot: "Headline",
    age: "21+",
    notes: "",
    daypart: daypartFor(showTime),
  };
}

function booking(partial: Partial<Booking> & Pick<Booking, "id" | "openDateId" | "bandId" | "venueId" | "status">): Booking {
  return {
    awaiting: partial.status === "accepted" ? null : "venue",
    terms: defaultTerms(),
    events: [],
    createdAt: "2026-10-01T00:00:00.000Z",
    ...partial,
  };
}

function snapshot(partial: Partial<Snapshot>): Snapshot {
  return {
    role: "band",
    bandId: "mesa-dust",
    venueId: "yucca-room",
    musicianId: "lena-ortiz",
    fanId: "avery-quinn",
    openDates: [],
    bookings: [],
    listings: [],
    interests: [],
    opportunities: [],
    applications: [],
    repertoires: [],
    streamLinks: [],
    nightStays: [],
    vehicles: [],
    fuelOverrides: [],
    bandLinks: [],
    bills: [],
    sizes: [],
    capacities: [],
    media: [],
    follows: [],
    rsvps: [],
    alerts: [],
    account: { phase: "ready", demo: true, activeId: null, profiles: [] },
    ...partial,
  };
}

const yucca = night("od-yucca", "yucca-room", "2026-11-06", "8:30pm");
const chapelSameNight = night("od-chapel", "neon-chapel", "2026-11-06", "10:00pm");
const chapelNext = night("od-chapel-next", "neon-chapel", "2026-11-07", "8:00pm");
const flagstaffNext = night("od-flag", "high-country", "2026-11-07", "8:00pm");
const early = night("od-early", "yucca-room", "2026-11-06", "2:00pm");
const late = night("od-late", "yucca-room", "2026-11-06", "10:00pm");

test("a band cannot confirm a second gig the same date when the drive does not fit", () => {
  const current = snapshot({
    openDates: [yucca, chapelSameNight],
    bookings: [booking({ id: "bk-1", openDateId: yucca.id, bandId: "mesa-dust", venueId: "yucca-room", status: "accepted" })],
  });
  const next = booking({ id: "bk-2", openDateId: chapelSameNight.id, bandId: "mesa-dust", venueId: "neon-chapel", status: "offered" });
  const candidate = candidateForBooking(current, next, "confirmed");
  assert.ok(candidate);
  const message = confirmedClash(current, candidate);
  assert.ok(message);
  assert.match(message, /Mesa Dust/);
  assert.match(message, /Yucca Room/);
  assert.match(message, /Nov 6/);
});

test("a band cannot confirm a next-night gig past the planner drive limit", () => {
  const current = snapshot({
    openDates: [yucca, chapelNext],
    bookings: [booking({ id: "bk-1", openDateId: yucca.id, bandId: "mesa-dust", venueId: "yucca-room", status: "accepted" })],
  });
  const next = booking({ id: "bk-2", openDateId: chapelNext.id, bandId: "mesa-dust", venueId: "neon-chapel", status: "offered" });
  const candidate = candidateForBooking(current, next, "confirmed");
  assert.ok(candidate);
  const message = confirmedClash(current, candidate);
  assert.ok(message);
  assert.match(message, /Neon Chapel|Las Vegas|planner/);
  assert.match(message, new RegExp(String(DRIVE_LIMIT_HOURS)));
});

test("a next-night gig inside the drive limit is allowed", () => {
  const current = snapshot({
    openDates: [yucca, flagstaffNext],
    bookings: [booking({ id: "bk-1", openDateId: yucca.id, bandId: "mesa-dust", venueId: "yucca-room", status: "accepted" })],
  });
  const next = booking({ id: "bk-2", openDateId: flagstaffNext.id, bandId: "mesa-dust", venueId: "high-country", status: "offered" });
  const candidate = candidateForBooking(current, next, "confirmed");
  assert.ok(candidate);
  assert.equal(confirmedClash(current, candidate), null);
});

test("a room can keep two set times on one date when they are different slots", () => {
  const current = snapshot({
    openDates: [early, late],
    bookings: [booking({ id: "bk-1", openDateId: early.id, bandId: "mesa-dust", venueId: "yucca-room", status: "accepted" })],
  });
  const next = booking({ id: "bk-2", openDateId: late.id, bandId: "salt-choir", venueId: "yucca-room", status: "offered" });
  const candidate = candidateForBooking(current, next, "confirmed");
  assert.ok(candidate);
  assert.equal(confirmedClash(current, candidate), null);
});

test("a band can play two shows the same date in one city when the times do not overlap", () => {
  const current = snapshot({
    openDates: [early, late],
    bookings: [booking({ id: "bk-1", openDateId: early.id, bandId: "mesa-dust", venueId: "yucca-room", status: "accepted" })],
  });
  const next = booking({ id: "bk-2", openDateId: late.id, bandId: "mesa-dust", venueId: "yucca-room", status: "offered" });
  const candidate = candidateForBooking(current, next, "confirmed");
  assert.ok(candidate);
  assert.equal(confirmedClash(current, candidate), null);
});

test("a room cannot confirm two bands for the same set time", () => {
  const second = night("od-yucca-2", "yucca-room", "2026-11-06", "8:00pm");
  const current = snapshot({
    openDates: [yucca, second],
    bookings: [booking({ id: "bk-1", openDateId: yucca.id, bandId: "mesa-dust", venueId: "yucca-room", status: "accepted" })],
  });
  const next = booking({ id: "bk-2", openDateId: second.id, bandId: "salt-choir", venueId: "yucca-room", status: "offered" });
  const candidate = candidateForBooking(current, next, "confirmed");
  assert.ok(candidate);
  const message = confirmedClash(current, candidate);
  assert.ok(message);
  assert.match(message, /Yucca Room/);
});

test("a pending overlap warns and does not read as a hard conflict", () => {
  const current = snapshot({
    openDates: [yucca, flagstaffNext],
    bookings: [booking({ id: "bk-1", openDateId: yucca.id, bandId: "mesa-dust", venueId: "yucca-room", status: "requested" })],
  });
  const next = booking({ id: "bk-2", openDateId: yucca.id, bandId: "mesa-dust", venueId: "yucca-room", status: "offered" });
  const candidate = candidateForBooking(current, next, "pending");
  assert.ok(candidate);
  assert.equal(confirmedClash(current, candidate), null);
  const warning = pendingOverlap(current, candidate);
  assert.ok(warning);
  assert.match(warning, /pending/);
});

test("a permit hold on a confirmed gig night is blocked", () => {
  const opportunity: Opportunity = {
    id: "opp-1",
    kind: "permit",
    title: "Roosevelt Row busker window",
    host: "City sample",
    contact: "permits@example",
    city: "Phoenix, AZ",
    citySlug: "phoenix-az",
    startDate: "2026-11-06",
    endDate: "2026-11-06",
    timeWindow: "4–8pm",
    location: "Roosevelt",
    genres: ["Americana"],
    compensation: "Tips",
    spots: "4",
    deadline: null,
    rules: "Sample",
    notes: "Sample",
  };
  const application: Application = {
    id: "app-1",
    opportunityId: opportunity.id,
    bandId: "mesa-dust",
    status: "applied",
    setup: "Acoustic",
    note: "We can play the sidewalk set.",
    createdAt: "2026-10-19T00:00:00.000Z",
  };
  const current = snapshot({
    openDates: [yucca],
    bookings: [booking({ id: "bk-1", openDateId: yucca.id, bandId: "mesa-dust", venueId: "yucca-room", status: "accepted" })],
    opportunities: [opportunity],
    applications: [application],
  });
  const message = confirmedClash(current, candidateForApplication(application, opportunity, "confirmed"));
  assert.ok(message);
  assert.match(message, /Yucca Room/);
});

test("a musician cannot confirm two fill-ins on the same night", () => {
  const listing = (id: string, title: string): Listing => ({
    id,
    kind: "fill-in",
    title,
    instrument: "Drums",
    genre: "Soul",
    city: "Phoenix, AZ",
    citySlug: "phoenix-az",
    paid: true,
    payNote: "$150",
    dates: "Fri, Nov 6, 2026 · downbeat 8:30pm",
    postedByName: "Mesa Dust",
    posterRole: "band",
    posterId: "mesa-dust",
    description: "Need a drummer.",
    contact: "june@example.com",
    createdAt: "2026-10-11T00:00:00.000Z",
  });
  const first = listing("ls-1", "Drums at Yucca");
  const second = listing("ls-2", "Drums at the chapel");
  second.city = "Las Vegas, NV";
  second.citySlug = "las-vegas-nv";
  const held: Interest = {
    id: "int-1",
    listingId: first.id,
    profileMusicianId: null,
    fromName: "Lena Ortiz",
    fromRole: "musician",
    fromId: "lena-ortiz",
    message: "I can make this.",
    createdAt: "2026-10-12T00:00:00.000Z",
    status: "confirmed",
  };
  const incoming: Interest = { ...held, id: "int-2", listingId: second.id, status: "pending" };
  const current = snapshot({ listings: [first, second], interests: [held] });
  const candidate = candidateForFillIn(incoming, second, "confirmed");
  assert.ok(candidate);
  const message = confirmedClash(current, candidate);
  assert.ok(message);
  assert.match(message, /Drums at Yucca/);
});

test("listing dates parse month names and iso days", () => {
  assert.deepEqual(datesMentioned("Fri, Nov 6, 2026 · load-in 3:30pm"), ["2026-11-06"]);
  assert.deepEqual(datesMentioned("including Nov 21"), ["2026-11-21"]);
});

test("the same lodging cannot be booked twice on one night", () => {
  const stays: NightStay[] = [
    {
      id: "ns-1",
      bandId: "mesa-dust",
      date: "2026-11-06",
      status: "booked",
      stayId: "paloma",
      name: "Paloma House",
      stayType: "hotel",
      address: "Phoenix",
      confirmation: "Sample",
      cost: 186,
    },
  ];
  const message = lodgingClash(stays, {
    bandId: "salt-choir",
    date: "2026-11-06",
    status: "booked",
    stayId: "paloma",
    name: "Paloma House",
  });
  assert.ok(message);
  assert.match(message, /Paloma House/);
  assert.match(message, /Mesa Dust/);
  assert.equal(
    lodgingClash(stays, { bandId: "mesa-dust", date: "2026-11-06", status: "booked", stayId: "paloma", name: "Paloma House" }),
    null,
  );
});

test("confirming one talk names the pending talks that should close", () => {
  const current = snapshot({
    openDates: [yucca, chapelSameNight, flagstaffNext],
    bookings: [
      booking({ id: "bk-pending", openDateId: chapelSameNight.id, bandId: "mesa-dust", venueId: "neon-chapel", status: "requested" }),
      booking({ id: "bk-other", openDateId: flagstaffNext.id, bandId: "salt-choir", venueId: "high-country", status: "requested" }),
    ],
  });
  const winner = candidateForBooking(
    current,
    booking({ id: "bk-win", openDateId: yucca.id, bandId: "mesa-dust", venueId: "yucca-room", status: "offered" }),
    "confirmed",
  );
  assert.ok(winner);
  assert.deepEqual(competingIds(current, winner).bookingIds, ["bk-pending"]);
});

test("a planner batch stops when a night is already confirmed", () => {
  const current = snapshot({
    openDates: [yucca, flagstaffNext],
    bookings: [booking({ id: "bk-1", openDateId: yucca.id, bandId: "mesa-dust", venueId: "yucca-room", status: "accepted" })],
  });
  const message = planBatchClash(current, "mesa-dust", [
    {
      openDateId: yucca.id,
      date: yucca.date,
      lat: 33.4484,
      lng: -112.074,
      citySlug: "phoenix-az",
      label: "The Yucca Room",
    },
  ]);
  assert.ok(message);
  assert.match(message, /Yucca Room/);
});
