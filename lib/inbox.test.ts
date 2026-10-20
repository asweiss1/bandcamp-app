import assert from "node:assert/strict";
import test from "node:test";
import {
  blockFanAccount,
  directorySearch,
  ensureBookingThread,
  inboxRows,
  markRead,
  messageGuard,
  partyLabel,
  sendDirectMessage,
  sendFanMessage,
  setFanMailEnabled,
  unreadTotal,
} from "@/lib/inbox";
import { initialSnapshot } from "@/lib/seed";
import type { Pitch, Snapshot } from "@/lib/types";

const today = "2026-10-20";

function asFan(snapshot: Snapshot, fanId = "avery-quinn"): Snapshot {
  return { ...snapshot, role: "fan", fanId };
}

test("a direct thread is visible to both bands and hidden from a third", () => {
  const mesa = inboxRows(initialSnapshot, "work").map((row) => row.id);
  assert.ok(mesa.includes("th-mesa-salt"));
  assert.ok(mesa.includes("th-high-mesa"));
  assert.equal(mesa.includes("th-avery-mesa"), false);

  const salt = inboxRows({ ...initialSnapshot, bandId: "salt-choir" }, "work").map((row) => row.id);
  assert.ok(salt.includes("th-mesa-salt"));
  assert.equal(salt.includes("th-high-mesa"), false);

  const verde = inboxRows({ ...initialSnapshot, bandId: "verde-line" }, "work").map((row) => row.id);
  assert.equal(verde.includes("th-mesa-salt"), false);
  assert.equal(verde.includes("th-high-mesa"), false);
});

test("a thread stays unread until it is marked read", () => {
  const before = inboxRows(initialSnapshot, "work").find((row) => row.id === "th-mesa-salt");
  assert.equal(before?.unread, true);
  assert.equal(unreadTotal(initialSnapshot), 3);
  const read = markRead(initialSnapshot, "th-mesa-salt", new Date("2026-10-20T18:00:00.000Z"));
  assert.equal(read.ok, true);
  if (!read.ok) return;
  const after = inboxRows(read.snapshot, "work").find((row) => row.id === "th-mesa-salt");
  assert.equal(after?.unread, false);
  assert.equal(unreadTotal(read.snapshot), 2);
});

test("fan mail stays out of booking talk and shows in the fan box", () => {
  const work = inboxRows(initialSnapshot, "work");
  const fan = inboxRows(initialSnapshot, "fan");
  assert.equal(work.some((row) => row.kind === "fan"), false);
  assert.equal(fan.some((row) => row.id === "th-avery-mesa"), true);
  assert.equal(fan.some((row) => row.kind !== "fan"), false);

  const avery = inboxRows(asFan(initialSnapshot), "work");
  assert.equal(avery.some((row) => row.id === "th-avery-mesa"), true);
  assert.equal(inboxRows(asFan(initialSnapshot), "fan").length, 0);
});

test("fan mail that is off or blocked does not go through", () => {
  const closed = setFanMailEnabled(initialSnapshot, false);
  assert.equal(closed.ok, true);
  if (!closed.ok) return;
  const off = sendFanMessage(asFan(closed.snapshot), "mesa-dust", null, "Are you playing in town", today);
  assert.equal(off.ok, false);
  if (off.ok) return;
  assert.match(off.error, /isn't taking fan mail/);

  const blocked = blockFanAccount(initialSnapshot, "avery-quinn", true);
  assert.equal(blocked.ok, true);
  if (!blocked.ok) return;
  assert.equal(blocked.snapshot.fanBlocks.some((item) => item.report), true);
  const denied = sendFanMessage(asFan(blocked.snapshot), "mesa-dust", null, "Are you playing in town", today);
  assert.equal(denied.ok, false);
  if (denied.ok) return;
  assert.match(denied.error, /can't message this band/);
});

test("a fan can send three notes a day, and older notes do not count", () => {
  let snapshot = asFan(initialSnapshot);
  for (let index = 0; index < 3; index += 1) {
    const sent = sendFanMessage(
      snapshot,
      "salt-choir",
      null,
      `See you in November ${index}`,
      today,
      new Date(`2026-10-20T15:0${index}:00.000Z`),
    );
    assert.equal(sent.ok, true);
    if (!sent.ok) return;
    snapshot = sent.snapshot;
  }
  const fourth = sendFanMessage(snapshot, "verde-line", null, "One more note for the band", today);
  assert.equal(fourth.ok, false);
  if (fourth.ok) return;
  assert.match(fourth.error, /3 fan messages a day/);
});

test("new accounts cannot send links, and contact details stay off every message", () => {
  const linked = messageGuard({
    role: "fan",
    body: "tickets at mesa.example.com tonight",
    joinedAt: today,
    sentToday: 0,
    today,
  });
  assert.equal(linked.ok, false);
  if (linked.ok) return;
  assert.match(linked.error, /can't send links/);

  const avery = messageGuard({
    role: "fan",
    body: "The Yucca show was wonderful",
    joinedAt: "2026-06-01",
    sentToday: 0,
    today,
  });
  assert.equal(avery.ok, true);

  const mailed = messageGuard({
    role: "band",
    body: "write june@mesa.example when you can",
    sentToday: 0,
    today,
  });
  assert.equal(mailed.ok, false);

  const phoned = messageGuard({
    role: "venue",
    body: "call (480) 555-0142 after load-in",
    sentToday: 0,
    today,
  });
  assert.equal(phoned.ok, false);

  const dated = messageGuard({
    role: "band",
    body: "Back on 2026-10-20 for the porch set",
    sentToday: 0,
    today,
  });
  assert.equal(dated.ok, true);
});

test("a thread label uses the name and city", () => {
  const room = partyLabel({ id: "high-country", role: "venue" });
  const player = partyLabel({ id: "lena-ortiz", role: "musician" });
  assert.equal(room.includes("@"), false);
  assert.equal(room.includes("555"), false);
  assert.match(room, /High Country Social/);
  assert.match(room, /Flagstaff/);
  assert.equal(player.includes("@"), false);
  assert.match(player, /Lena Ortiz/);
  const hits = directorySearch(initialSnapshot, "high");
  assert.ok(hits.some((hit) => hit.id === "high-country"));
  assert.ok(hits.every((hit) => !hit.name.includes("@") && !hit.place.includes("@")));
  assert.equal(directorySearch(initialSnapshot, "hannah").some((hit) => hit.id === "high-country"), false);
});

test("a booking thread opens for the people on it, and a pitch stays in the work inbox", () => {
  const opened = ensureBookingThread(initialSnapshot, "bk-high-mesa");
  assert.equal(opened.ok, true);
  if (!opened.ok) return;
  assert.equal(opened.data, "th-high-mesa");
  const outsider = ensureBookingThread({ ...initialSnapshot, bandId: "verde-line" }, "bk-high-mesa");
  assert.equal(outsider.ok, false);

  const withVenue = sendFanMessage(asFan(initialSnapshot), "mesa-dust", "yucca-room", "Loved the room that night", today);
  assert.equal(withVenue.ok, true);
  if (!withVenue.ok) return;
  const venue = inboxRows({ ...withVenue.snapshot, role: "venue", venueId: "yucca-room" }, "fan");
  assert.equal(venue.length, 1);
  const bandWork = inboxRows({ ...withVenue.snapshot, role: "band", bandId: "mesa-dust" }, "work");
  assert.equal(bandWork.some((row) => row.kind === "fan"), false);

  const pitch: Pitch = {
    id: "pitch-demo",
    leadBandId: "mesa-dust",
    openDateId: "od-salt-1116",
    venueId: "salt-river",
    members: [
      { bandId: "mesa-dust", role: "Headliner", setTime: "8:00pm", splitPercent: 70, status: "accepted" },
      { bandId: "salt-choir", role: "Opener", setTime: "7:00pm", splitPercent: 30, status: "invited" },
    ],
    terms: initialSnapshot.bookings[0]!.terms,
    messages: [
      {
        id: "pm-demo",
        fromBandId: "salt-choir",
        body: "Can we move the opener to 7:30?",
        createdAt: "2026-10-20T12:00:00.000Z",
      },
    ],
    bookingId: null,
    createdAt: "2026-10-20T11:00:00.000Z",
  };
  const rows = inboxRows({ ...initialSnapshot, pitches: [pitch] }, "work");
  const row = rows.find((item) => item.id === "pitch:pitch-demo");
  assert.ok(row);
  assert.equal(row?.chip, "Pitch");
  assert.equal(row?.unread, true);
  const saltRows = inboxRows({ ...initialSnapshot, bandId: "salt-choir", pitches: [pitch] }, "work");
  assert.equal(saltRows.some((item) => item.id === "pitch:pitch-demo" && item.unread === false), true);
});

test("two bands can open a direct thread", () => {
  const sent = sendDirectMessage(initialSnapshot, "verde-line", "band", "Want to share a Tuesday in Cottonwood?", today);
  assert.equal(sent.ok, true);
  if (!sent.ok) return;
  const mesa = inboxRows(sent.snapshot, "work").some((row) => row.id === sent.data);
  const verde = inboxRows({ ...sent.snapshot, bandId: "verde-line" }, "work").some((row) => row.id === sent.data);
  const salt = inboxRows({ ...sent.snapshot, bandId: "salt-choir" }, "work").some((row) => row.id === sent.data);
  assert.equal(mesa, true);
  assert.equal(verde, true);
  assert.equal(salt, false);
  const leaked = sendDirectMessage(initialSnapshot, "salt-choir", "band", "text me at 4805550142", today);
  assert.equal(leaked.ok, false);
});
