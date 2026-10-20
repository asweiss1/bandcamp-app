import assert from "node:assert/strict";
import test from "node:test";
import { listBands } from "@/lib/catalog";
import { combinedDraw, setTimes, splitPreset, suggestPartners, typicalDraw } from "@/lib/full-night";
import { initialSnapshot } from "@/lib/seed";
import type { BandLink } from "@/lib/types";

function band(id: string) {
  const found = listBands().find((item) => item.id === id);
  if (!found) throw new Error(id);
  return found;
}

test("typical draw uses the midpoint of the first range", () => {
  assert.equal(typicalDraw("80–160 in Phoenix, 40–90 on the road"), 120);
  assert.equal(typicalDraw("50–110 in Flagstaff"), 80);
  assert.equal(typicalDraw("30–70 locally"), 50);
  assert.equal(typicalDraw("40–90 in Phoenix"), 65);
  assert.equal(typicalDraw("a quiet room"), null);
});

test("combined draw adds each band's typical crowd", () => {
  assert.equal(combinedDraw([band("mesa-dust"), band("salt-choir")]), 200);
  assert.equal(combinedDraw([band("mesa-dust"), band("verde-line")]), 170);
});

test("pay split presets stay whole percents that total 100", () => {
  assert.deepEqual(splitPreset(2, "even"), [50, 50]);
  assert.deepEqual(splitPreset(3, "even"), [34, 33, 33]);
  assert.deepEqual(splitPreset(4, "even"), [25, 25, 25, 25]);
  assert.deepEqual(splitPreset(2, "headliner"), [70, 30]);
  assert.deepEqual(splitPreset(3, "headliner"), [50, 30, 20]);
  assert.deepEqual(splitPreset(4, "headliner"), [50, 20, 20, 10]);
  assert.equal(splitPreset(1, "even"), null);
  assert.equal(splitPreset(5, "headliner"), null);
});

test("a Phoenix date suggests nearby linked and compatible bands", () => {
  const picks = suggestPartners({
    bandId: "mesa-dust",
    venueCitySlug: "phoenix-az",
    bands: listBands(),
    links: initialSnapshot.bandLinks,
    repertoires: initialSnapshot.repertoires,
  });
  const ids = picks.map((pick) => pick.bandId);
  assert.deepEqual(ids.slice(0, 2), ["salt-choir", "verde-line"]);
  assert.equal(ids.includes("lamp-quarter"), false);
  assert.equal(ids.includes("canyon-line"), false);
  assert.equal(ids.includes("night-market"), false);
  assert.equal(ids.includes("rio-ghosts"), false);
  assert.equal(picks[0]?.linked, true);
  assert.ok((picks[0]?.miles ?? 999) <= 200);
  assert.ok(picks[0]?.overlap.includes("Americana"));
});

test("an accepted link can put a covers band on an originals bill", () => {
  const link: BandLink = {
    id: "link-mesa-lamp",
    fromBandId: "mesa-dust",
    toBandId: "lamp-quarter",
    status: "accepted",
    createdAt: "2026-10-01T00:00:00.000Z",
  };
  const picks = suggestPartners({
    bandId: "mesa-dust",
    venueCitySlug: "phoenix-az",
    bands: listBands(),
    links: [...initialSnapshot.bandLinks, link],
    repertoires: initialSnapshot.repertoires,
  });
  assert.equal(picks.some((pick) => pick.bandId === "lamp-quarter" && pick.linked), true);
});

test("set times walk backward from the posted downbeat", () => {
  assert.deepEqual(setTimes("8:00pm", 3), ["8:00pm", "7:00pm", "6:00pm"]);
});
