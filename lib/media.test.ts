import assert from "node:assert/strict";
import test from "node:test";
import { venues } from "@/lib/catalog";
import { CAPACITY_PRESETS, capacityMatches } from "@/lib/capacity";
import { profileStrength, youtubeId } from "@/lib/media";
import { imagesAllowed, promoFromBill, promoFromBooking } from "@/lib/promo";
import { initialSnapshot } from "@/lib/seed";
import { mediaFor } from "@/lib/media";

test("youtube links keep the video id", () => {
  assert.equal(youtubeId("https://www.youtube.com/watch?v=aqz-KE-bpKQ"), "aqz-KE-bpKQ");
  assert.equal(youtubeId("https://youtu.be/aqz-KE-bpKQ"), "aqz-KE-bpKQ");
  assert.equal(youtubeId("https://www.youtube.com/shorts/aqz-KE-bpKQ"), "aqz-KE-bpKQ");
});

test("a confirmed show uses logos only when every party allows promo", () => {
  const yucca = promoFromBooking(initialSnapshot, "bk-yucca-mesa");
  assert.ok(yucca);
  assert.equal(yucca.useImages, true);
  assert.match(yucca.caption, /Mesa Dust/);
  assert.match(yucca.caption, /8:30pm/);
  assert.match(yucca.caption, /\$18/);
  assert.match(yucca.caption, /21\+/);
  assert.match(yucca.caption, /Originals/);
  assert.equal(yucca.address, "1234 Grand Avenue, Phoenix, AZ");

  const verde = promoFromBooking(initialSnapshot, "bk-verde-1106");
  assert.ok(verde);
  assert.equal(verde.useImages, false);
  assert.ok(verde.marks.every((mark) => mark.src === null));
  assert.match(verde.caption, /4:00pm/);

  const bill = promoFromBill(initialSnapshot, "bill-high-desert");
  assert.ok(bill);
  assert.match(bill.lineup, /Salt Choir/);
  assert.match(bill.lineup, /8:00pm/);
  assert.equal(bill.useImages, false);
  assert.equal(imagesAllowed(initialSnapshot, ["mesa-dust", "salt-choir", "yucca-room"]), false);
  assert.equal(imagesAllowed(initialSnapshot, ["mesa-dust", "yucca-room"]), true);
});

test("profile strength nudges a band that is one photo short", () => {
  const media = mediaFor("mesa-dust", initialSnapshot.media);
  const strength = profileStrength({
    role: "band",
    bio: "A long enough bio for the meter to count the writing as done for this sample band.",
    hasMembers: true,
    hasSample: true,
    hasMusic: true,
    hasAddress: false,
    hasBackline: false,
    media,
  });
  assert.ok(strength.score < 100);
  assert.ok(strength.nudges.some((item) => /another photo/i.test(item.nudge)));
  assert.equal(media.promoUse, true);
  assert.equal(mediaFor("verde-taproom", initialSnapshot.media).promoUse, false);
});

test("capacity presets and a min-max range filter seeded rooms", () => {
  const under = CAPACITY_PRESETS.find((item) => item.id === "under-50");
  const mid = CAPACITY_PRESETS.find((item) => item.id === "150-300");
  const large = CAPACITY_PRESETS.find((item) => item.id === "300+");
  assert.ok(under && mid && large);
  const smallRooms = venues.filter((venue) => capacityMatches(venue.capacity, { min: under.min, max: under.max }));
  assert.ok(smallRooms.some((venue) => venue.id === "listening-bar"));
  assert.ok(smallRooms.every((venue) => venue.capacity < 50));
  const hall = venues.filter((venue) => capacityMatches(venue.capacity, { min: mid.min, max: mid.max }));
  assert.ok(hall.some((venue) => venue.id === "yucca-room"));
  assert.ok(hall.every((venue) => venue.id !== "rail-yard"));
  const sorted = [...hall].sort((a, b) => b.capacity - a.capacity || a.name.localeCompare(b.name));
  assert.equal(sorted[0]?.id, "yucca-room");
  const big = venues.filter((venue) => capacityMatches(venue.capacity, { min: large.min, max: large.max }));
  assert.deepEqual(big.map((venue) => venue.id), ["rail-yard"]);
  const custom = venues.filter((venue) => capacityMatches(venue.capacity, { min: 100, max: 120 }));
  assert.ok(custom.some((venue) => venue.id === "verde-taproom"));
  assert.ok(custom.every((venue) => venue.id !== "yucca-room"));
});
