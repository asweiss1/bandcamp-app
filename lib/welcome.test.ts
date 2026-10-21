import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { demoSnapshot } from "./demo-boot";

describe("phone welcome", () => {
  it("boots demo data as a ready band session", () => {
    const snapshot = demoSnapshot();
    assert.equal(snapshot.account.phase, "ready");
    assert.equal(snapshot.account.demo, true);
    assert.equal(snapshot.bandId, "mesa-dust");
    assert.ok(snapshot.bookings.some((booking) => booking.id === "bk-yucca-mesa"));
  });

  it("keeps the first screen off the seed and the store", () => {
    const screen = readFileSync(new URL("../components/welcome-screen.tsx", import.meta.url), "utf8");
    const choices = readFileSync(new URL("../components/welcome-choices.tsx", import.meta.url), "utf8");
    for (const source of [screen, choices]) {
      assert.equal(source.includes("@/lib/store"), false);
      assert.equal(source.includes("@/lib/seed"), false);
    }
    assert.match(choices, /import\("@\/lib\/demo-boot"\)/);
  });
});
