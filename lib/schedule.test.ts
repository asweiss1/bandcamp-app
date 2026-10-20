import assert from "node:assert/strict";
import test from "node:test";
import { searchBands } from "@/lib/band-search";
import { bands } from "@/lib/catalog";
import { musicFromStored } from "@/lib/repertoire";
import { sizeLabel } from "@/lib/size";
import { initialSnapshot } from "@/lib/seed";
import { buildTour } from "@/lib/tour";
import { noteForBooking } from "@/lib/turnaround";

const emptyQuery = {
  text: "",
  styles: [],
  substyles: [],
  citySlug: "any",
  radius: 300,
  from: "",
  to: "",
  feeMin: null,
  feeMax: null,
  music: "any" as const,
  sizeMin: null,
  sizeMax: null,
  hasSamples: false,
};

test("size labels read solo, duo, trio, and piece counts", () => {
  assert.equal(sizeLabel(1), "Solo");
  assert.equal(sizeLabel(2), "Duo");
  assert.equal(sizeLabel(3), "Trio");
  assert.equal(sizeLabel(4), "4-piece");
  assert.equal(sizeLabel(5), "5-piece");
});

test("a 4-piece filter drops a duo and keeps a five-piece", () => {
  const four = searchBands(bands, initialSnapshot, [], { ...emptyQuery, sizeMin: 4, sizeMax: 4 });
  assert.ok(four.some((band) => band.id === "mesa-dust"));
  assert.equal(four.some((band) => band.id === "verde-line"), false);
  const five = searchBands(bands, initialSnapshot, [], { ...emptyQuery, sizeMin: 5, sizeMax: null });
  assert.deepEqual(
    five.map((band) => band.id),
    ["night-market"],
  );
});

test("legacy repertoire rows migrate to covers, originals, or mix", () => {
  assert.equal(musicFromStored({ originalsOnly: true, coversNote: "", rightsAttested: true }), "originals");
  assert.equal(musicFromStored({ originalsOnly: false, coversNote: "A Motown medley" }), "mix");
  assert.equal(musicFromStored({ originalsOnly: false, coversNote: "" }), "covers");
  assert.equal(musicFromStored({ music: "mix" }), "mix");
});

test("seeded music matches the demo bands", () => {
  const music = Object.fromEntries(initialSnapshot.repertoires.map((item) => [item.bandId, item.music]));
  assert.equal(music["mesa-dust"], "originals");
  assert.equal(music["night-market"], "mix");
  assert.equal(music["lamp-quarter"], "covers");
  const originals = searchBands(bands, initialSnapshot, [], { ...emptyQuery, music: "originals" });
  assert.equal(originals.some((band) => band.id === "lamp-quarter"), false);
  assert.ok(originals.some((band) => band.id === "mesa-dust"));
});

test("Mesa Dust's Cottonwood afternoon and Phoenix headline share a tight turnaround", () => {
  const note = noteForBooking(initialSnapshot, "bk-verde-1106");
  assert.ok(note);
  assert.match(note, /Tight turnaround/);
  assert.match(note, /between sets/);
  assert.match(note, /drive/);
  assert.equal(noteForBooking(initialSnapshot, "bk-yucca-mesa"), note);
  const tour = buildTour(initialSnapshot, "mesa-dust");
  const day = tour.nights.find((night) => night.date === "2026-11-06");
  assert.ok(day);
  assert.equal(day.shows.length, 2);
  assert.equal(day.city, "Phoenix");
});
