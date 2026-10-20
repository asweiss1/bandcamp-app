import assert from "node:assert/strict";
import test from "node:test";
import { findBands } from "@/lib/band-search";
import { listBands } from "@/lib/catalog";
import { placeForSlug } from "@/lib/geo";
import { initialSnapshot } from "@/lib/seed";
import type { FindQuery } from "@/lib/band-search";

const phoenix = placeForSlug("phoenix-az");

function query(partial: Partial<FindQuery> = {}): FindQuery {
  return {
    name: "",
    styles: [],
    styleText: "",
    origin: null,
    radius: 150,
    sizeMin: null,
    sizeMax: null,
    music: "any",
    verified: false,
    hasSamples: false,
    availableOn: "",
    sort: "distance",
    ...partial,
  };
}

function ids(partial: Partial<FindQuery> = {}) {
  return findBands(listBands(), initialSnapshot, [], query(partial)).map((row) => row.band.id);
}

test("a name search finds the band and leaves everyone else out", () => {
  assert.deepEqual(ids({ name: "Salt" }), ["salt-choir"]);
  assert.ok(ids({ name: "Pine Room" }).includes("salt-choir"));
});

test("style chips and free text both narrow the directory", () => {
  assert.ok(ids({ styles: ["Indie folk"] }).includes("salt-choir"));
  assert.equal(ids({ styles: ["Indie folk"] }).includes("lamp-quarter"), false);
  assert.deepEqual(ids({ styleText: "jazz" }), ["lamp-quarter"]);
});

test("size, originals, verified, and samples filter independently", () => {
  assert.ok(ids({ sizeMin: 4, sizeMax: 4 }).includes("mesa-dust"));
  assert.equal(ids({ sizeMin: 4, sizeMax: 4 }).includes("lamp-quarter"), false);
  assert.ok(ids({ music: "originals" }).includes("mesa-dust"));
  assert.equal(ids({ music: "originals" }).includes("lamp-quarter"), false);
  assert.ok(ids({ music: "covers" }).includes("lamp-quarter"));
  const verified = ids({ verified: true });
  assert.deepEqual(verified.slice().sort(), ["mesa-dust", "salt-choir"]);
  assert.ok(ids({ hasSamples: true }).includes("salt-choir"));
  assert.equal(ids({ hasSamples: true }).includes("verde-line"), false);
});

test("a band with a confirmed show that day is not available", () => {
  const open = ids({ availableOn: "2026-11-06" });
  assert.equal(open.includes("mesa-dust"), false);
  assert.ok(open.includes("lamp-quarter"));
});

test("radius uses hometown distance, and sorts follow distance, rating, and activity", () => {
  assert.ok(phoenix);
  const near = findBands(listBands(), initialSnapshot, [], query({ origin: phoenix, radius: 50, sort: "distance" }));
  assert.ok(near.some((row) => row.band.id === "mesa-dust" && row.miles === 0));
  assert.equal(near.some((row) => row.band.id === "salt-choir"), false);
  assert.equal(near.some((row) => row.band.id === "rio-ghosts"), false);
  const wide = findBands(listBands(), initialSnapshot, [], query({ origin: phoenix, radius: 200, sort: "distance" }));
  const mesa = wide.findIndex((row) => row.band.id === "mesa-dust");
  const salt = wide.findIndex((row) => row.band.id === "salt-choir");
  assert.ok(mesa >= 0 && salt > mesa);

  const rated = findBands(listBands(), initialSnapshot, [], query({ sort: "rating" }));
  assert.equal(rated[0]?.rating, 5);
  assert.ok(rated.findIndex((row) => row.band.id === "verde-line") > rated.findIndex((row) => row.band.id === "salt-choir"));

  const active = findBands(listBands(), initialSnapshot, [], query({ sort: "active" }));
  const mesaRow = active.find((row) => row.band.id === "mesa-dust");
  const saltRow = active.find((row) => row.band.id === "salt-choir");
  assert.equal(saltRow?.activeAt, "2026-10-18T23:05:00.000Z");
  assert.equal(mesaRow?.activeAt, "2026-10-19T18:00:00.000Z");
  assert.ok(active.findIndex((row) => row.band.id === "mesa-dust") < active.findIndex((row) => row.band.id === "salt-choir"));
});
