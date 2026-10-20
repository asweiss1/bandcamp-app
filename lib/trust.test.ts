import assert from "node:assert/strict";
import test from "node:test";
import { initialSnapshot } from "@/lib/seed";
import { isVerified, pendingReviews, reviewDraft, sizeFit, verificationFor } from "@/lib/trust";

const today = "2026-10-20";

test("a 4-piece fits a large room and is tight under 50", () => {
  assert.equal(sizeFit(4, 240).ok, true);
  assert.match(sizeFit(4, 240).line, /fits/i);
  assert.equal(sizeFit(4, 45).ok, false);
  assert.match(sizeFit(4, 45).line, /tight/i);
});

test("verified means email and phone, plus the street address for a room", () => {
  const mesa = verificationFor(initialSnapshot.verifications, "mesa-dust");
  const yucca = verificationFor(initialSnapshot.verifications, "yucca-room");
  const high = verificationFor(initialSnapshot.verifications, "high-country");
  assert.equal(isVerified("band", mesa), true);
  assert.equal(isVerified("venue", yucca), true);
  assert.equal(isVerified("venue", high), false);
});

test("reviews open the day after a confirmed date, once per side", () => {
  const early = reviewDraft(initialSnapshot, "bk-yucca-mesa", 5, "Great room and an on-time load-in.", today);
  assert.equal(early.ok, false);
  const ready = reviewDraft(initialSnapshot, "bk-yucca-0918", 4, "The room paid at settlement and the backline was up.", today);
  assert.equal(ready.ok, true);
  if (ready.ok) assert.equal(ready.data.toId, "yucca-room");
  const again = reviewDraft(
    { ...initialSnapshot, role: "venue", venueId: "yucca-room" },
    "bk-yucca-0918",
    5,
    "They already have our note.",
    today,
  );
  assert.equal(again.ok, false);
  const pending = pendingReviews(initialSnapshot, today);
  assert.ok(pending.some((item) => item.bookingId === "bk-yucca-0918"));
  assert.equal(pending.some((item) => item.bookingId === "bk-yucca-mesa"), false);
});
