import assert from "node:assert/strict";
import test from "node:test";
import { searchPlaces } from "@/lib/geo";

test("a short hometown query does not dump a city list", () => {
  assert.deepEqual(searchPlaces(""), []);
  assert.deepEqual(searchPlaces("a"), []);
});

test("hometown suggestions are City, ST and prefer the closest name", () => {
  const austin = searchPlaces("aus");
  assert.ok(austin.length > 0);
  assert.ok(austin.length <= 5);
  assert.equal(austin[0]?.label, "Austin, TX");
  assert.match(austin[0]?.label ?? "", /^[^,]+, [A-Z]{2}$/);
  assert.equal(typeof austin[0]?.lat, "number");
  assert.equal(typeof austin[0]?.lng, "number");
  assert.equal(austin[0]?.state, "TX");
});

test("a southwest town still resolves with coordinates", () => {
  const found = searchPlaces("marfa");
  assert.equal(found[0]?.label, "Marfa, TX");
  assert.ok(found[0] && found[0].lat > 30 && found[0].lng < -100);
});
