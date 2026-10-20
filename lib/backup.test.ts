import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildBackup, demoReset, parseBackup } from "./backup";
import { initialSnapshot } from "./seed";

describe("demo reset and backup", () => {
  it("puts a demo explorer back on the seeded book", () => {
    const current = {
      ...initialSnapshot,
      account: { phase: "ready" as const, demo: true, activeId: null, profiles: [] },
      bookings: [],
    };
    const next = demoReset(current, initialSnapshot);
    assert.equal(next.account.phase, "ready");
    assert.equal(next.account.demo, true);
    assert.equal(next.bandId, "mesa-dust");
    assert.ok(next.bookings.some((booking) => booking.id === "bk-yucca-mesa"));
  });

  it("keeps an owned profile when demo data is reset", () => {
    const current = {
      ...initialSnapshot,
      account: {
        phase: "ready" as const,
        demo: false,
        activeId: "prf-ada",
        profiles: [
          {
            id: "prf-ada",
            role: "band" as const,
            createdAt: "2026-10-01T00:00:00.000Z",
            updatedAt: "2026-10-01T00:00:00.000Z",
            band: {
              id: "prf-ada",
              name: "Ada Trio",
              genres: ["Americana"],
              styles: [],
              city: "Phoenix, AZ",
              citySlug: "phoenix-az",
              touring: false,
              feeMin: 100,
              feeMax: 400,
              size: 3,
              members: [],
              links: [],
              availability: "Weekends",
              bio: "Trio",
              draw: "Local",
              routeFrom: null,
              routeTo: null,
              routeCities: [],
            },
            venue: null,
            musician: null,
            fan: null,
          },
        ],
      },
      role: "band" as const,
      bandId: "prf-ada",
      bookings: [],
      vehicles: [
        { id: "veh-ada", bandId: "prf-ada", name: "Van", vehicleType: "van" as const, mpg: 18, fuel: "gas" as const, towMpg: null },
      ],
    };
    const next = demoReset(current, initialSnapshot);
    assert.equal(next.account.activeId, "prf-ada");
    assert.equal(next.bandId, "prf-ada");
    assert.ok(next.bookings.some((booking) => booking.id === "bk-yucca-mesa"));
    assert.ok(next.vehicles.some((vehicle) => vehicle.id === "veh-ada"));
  });

  it("round-trips a backup and rejects a stray file", () => {
    const file = buildBackup({
      snapshot: initialSnapshot,
      place: null,
      outbox: [{ id: "out-1", at: "2026-10-20T12:00:00.000Z", op: "save", summary: "Saved a change on this phone" }],
      exportedAt: "2026-10-20T12:00:00.000Z",
    });
    const parsed = parseBackup(JSON.stringify(file), initialSnapshot);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.data.snapshot.bandId, "mesa-dust");
    assert.equal(parsed.data.outbox.length, 1);
    assert.equal(parseBackup("[]", initialSnapshot).ok, false);
    assert.equal(parseBackup("{", initialSnapshot).ok, false);
  });
});
