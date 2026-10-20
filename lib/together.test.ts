import assert from "node:assert/strict";
import test from "node:test";
import { billConfirmedClash, billProblem } from "@/lib/bills";
import { defaultTerms } from "@/lib/deal";
import { linkedBandIds, pairLinks } from "@/lib/links";
import { initialSnapshot } from "@/lib/seed";
import type { BandLink, BillMember, Booking } from "@/lib/types";

function member(partial: Partial<BillMember> & Pick<BillMember, "bandId" | "role" | "splitPercent">): BillMember {
  return { setTime: "9:00pm", ...partial };
}

function booking(partial: Partial<Booking> & Pick<Booking, "id" | "openDateId" | "bandId" | "venueId">): Booking {
  return {
    status: "requested",
    awaiting: "venue",
    terms: defaultTerms(),
    events: [],
    createdAt: "2026-10-19T00:00:00.000Z",
    ...partial,
  };
}

test("rejects a split that does not add up to 100", () => {
  const problem = billProblem([
    member({ bandId: "mesa-dust", role: "Headliner", splitPercent: 60 }),
    member({ bandId: "salt-choir", role: "Opener", setTime: "8:00pm", splitPercent: 30 }),
  ]);
  assert.match(problem ?? "", /100/);
});

test("rejects a one-band package and a five-band package", () => {
  assert.match(billProblem([member({ bandId: "mesa-dust", role: "Headliner", splitPercent: 100 })]) ?? "", /2 to 4/);
  assert.match(
    billProblem(
      ["a", "b", "c", "d", "e"].map((bandId, index) =>
        member({
          bandId,
          role: index === 0 ? "Headliner" : "Opener",
          splitPercent: 20,
        }),
      ),
    ) ?? "",
    /2 to 4/,
  );
});

test("requires exactly one headliner", () => {
  const problem = billProblem([
    member({ bandId: "mesa-dust", role: "Opener", setTime: "8:00pm", splitPercent: 40 }),
    member({ bandId: "salt-choir", role: "Opener", setTime: "9:00pm", splitPercent: 60 }),
  ]);
  assert.match(problem ?? "", /headliner/i);
});

test("blocks a bill when an opener already has that night confirmed", () => {
  const current = {
    ...initialSnapshot,
    openDates: [
      ...initialSnapshot.openDates,
      {
        id: "od-yucca-1114",
        venueId: "yucca-room",
        date: "2026-11-14",
        showTime: "9:00pm",
        genres: ["Desert rock"],
        slot: "Headline" as const,
        age: "21+" as const,
        daypart: "evening" as const,
        notes: "",
      },
    ],
  };
  const message = billConfirmedClash(
    current,
    ["mesa-dust", "salt-choir"],
    booking({
      id: "bk-clash",
      openDateId: "od-yucca-1114",
      bandId: "mesa-dust",
      venueId: "yucca-room",
    }),
  );
  assert.ok(message);
  assert.match(message ?? "", /Salt Choir/);
  assert.match(message ?? "", /confirmed/);
});

test("a clear night does not clash for either band on the bill", () => {
  const message = billConfirmedClash(
    initialSnapshot,
    ["mesa-dust", "salt-choir"],
    booking({
      id: "bk-clear",
      openDateId: "od-yucca-1120",
      bandId: "mesa-dust",
      venueId: "yucca-room",
    }),
  );
  assert.equal(message, null);
});

test("an open link blocks a second request either direction", () => {
  const links: BandLink[] = [
    {
      id: "link-1",
      fromBandId: "night-market",
      toBandId: "mesa-dust",
      status: "pending",
      createdAt: "2026-10-18T00:00:00.000Z",
    },
  ];
  assert.equal(pairLinks(links, "mesa-dust", "night-market").length, 1);
  const declined = links.map((link) => ({ ...link, status: "declined" as const }));
  assert.equal(pairLinks(declined, "mesa-dust", "night-market").length, 0);
});

test("linked band ids are the accepted pairs", () => {
  const links: BandLink[] = [
    {
      id: "link-ok",
      fromBandId: "mesa-dust",
      toBandId: "salt-choir",
      status: "accepted",
      createdAt: "2026-10-12T00:00:00.000Z",
    },
    {
      id: "link-wait",
      fromBandId: "night-market",
      toBandId: "mesa-dust",
      status: "pending",
      createdAt: "2026-10-18T00:00:00.000Z",
    },
  ];
  assert.deepEqual(linkedBandIds(links, "mesa-dust"), ["salt-choir"]);
});
