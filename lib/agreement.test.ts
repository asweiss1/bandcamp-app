import assert from "node:assert/strict";
import test from "node:test";
import { agreementFor } from "@/lib/agreement";
import { datesNear } from "@/lib/book-near";
import { placeForSlug } from "@/lib/geo";
import { initialSnapshot } from "@/lib/seed";

test("a confirmed gig has a one-page agreement and a private offer does not", () => {
  const agreed = agreementFor(initialSnapshot, "bk-yucca-mesa");
  assert.ok(agreed);
  assert.match(agreed.pay, /\$1,100/);
  assert.match(agreed.tickets, /\$18/);
  assert.match(agreed.loadIn, /3:30pm/);
  assert.match(agreed.gear, /Backline/);
  assert.match(agreed.cancellation, /14 days/);
  assert.match(agreed.when, /8:30pm/);
  assert.equal(agreed.bandName, "Mesa Dust");
  assert.equal(agreed.venueName, "The Yucca Room");
  assert.equal(agreementFor(initialSnapshot, "bk-high-mesa"), null);
  assert.equal(agreementFor(initialSnapshot, "bk-bill-1120"), null);
});

test("book a gig lists open dates near home and skips far rooms", () => {
  const phoenix = placeForSlug("phoenix-az");
  assert.ok(phoenix);
  const near = datesNear(initialSnapshot, phoenix, 50, "2026-10-20");
  assert.ok(near.some((row) => row.openDate.id === "od-salt-1116"));
  assert.equal(near.some((row) => row.venue.citySlug === "albuquerque-nm"), false);
  assert.equal(near.some((row) => row.openDate.date < "2026-10-20"), false);
});
