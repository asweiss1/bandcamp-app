import assert from "node:assert/strict";
import test from "node:test";
import { getFan, getVenue } from "@/lib/catalog";
import {
  alertsForConfirmation,
  drawFor,
  followedShows,
  nearShows,
  nextRsvp,
  publicShow,
  rsvpCounts,
} from "@/lib/fans";
import { initialSnapshot } from "@/lib/seed";

test("only confirmed shows are public", () => {
  const yucca = publicShow(initialSnapshot, "bk-yucca-mesa");
  assert.ok(yucca);
  assert.equal(yucca.ticketPrice, 18);
  assert.match(yucca.when, /8:30pm/);
  assert.equal(yucca.lineup[0]?.name, "Mesa Dust");
  assert.equal(publicShow(initialSnapshot, "bk-high-mesa"), null);
  assert.equal(publicShow(initialSnapshot, "bk-bill-1120"), null);
});

test("a fan feed is followed confirmed shows, and near you respects radius", () => {
  const feed = followedShows(initialSnapshot, "avery-quinn", "2026-10-01");
  assert.ok(feed.some((show) => show.bookingId === "bk-yucca-mesa"));
  assert.ok(feed.some((show) => show.bookingId === "bk-verde-1106"));
  assert.equal(feed.some((show) => show.bookingId === "bk-bill-1120"), false);
  assert.equal(feed.some((show) => show.bookingId === "bk-high-mesa"), false);
  const fan = getFan("avery-quinn");
  assert.ok(fan);
  const near = nearShows(initialSnapshot, fan, 100, "2026-10-01");
  assert.ok(near.some((show) => show.bookingId === "bk-yucca-mesa"));
  assert.ok(near.some((show) => show.bookingId === "bk-verde-1106"));
  assert.equal(near.some((show) => show.bookingId === "bk-rail-mesa"), false);
});

test("expected draw counts followers within 50 miles and RSVPs", () => {
  const venue = getVenue("high-country");
  assert.ok(venue);
  const draw = drawFor(initialSnapshot, ["mesa-dust"], venue, "bk-high-mesa");
  assert.equal(draw.followers, 7);
  assert.equal(draw.nearby, 4);
  assert.equal(draw.going, 0);
  assert.equal(draw.interested, 0);
  const rsvp = rsvpCounts(initialSnapshot.rsvps, "bk-yucca-mesa");
  assert.equal(rsvp.going, 2);
  assert.equal(rsvp.interested, 1);
});

test("confirming a show alerts followers who do not already have that note", () => {
  const extra = alertsForConfirmation(initialSnapshot, "bk-yucca-mesa");
  assert.equal(extra.some((alert) => alert.fanId === "avery-quinn"), false);
  assert.ok(extra.some((alert) => alert.fanId === "owen-diaz" && alert.kind === "venue-lineup"));
  assert.ok(extra.some((alert) => alert.fanId === "nia-cole" && alert.kind === "band-near"));
  assert.equal(alertsForConfirmation(initialSnapshot, "bk-high-mesa").length, 0);
  assert.equal(nextRsvp("going", "going"), null);
  assert.equal(nextRsvp("going", "interested"), "interested");
});
