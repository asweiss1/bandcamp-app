import assert from "node:assert/strict";
import test from "node:test";
import { applyMemberChange, buildPitchMembers, peerReviewDraft, sendBlock, trustGlance } from "@/lib/pitch";
import { initialSnapshot } from "@/lib/seed";
import type { Pitch, PitchMember } from "@/lib/types";

const today = "2026-10-20";

function member(partial: Partial<PitchMember> & Pick<PitchMember, "bandId" | "role" | "splitPercent" | "status">): PitchMember {
  return { setTime: "8:00pm", ...partial };
}

test("a co-pitch invite is not a venue offer", () => {
  const members = buildPitchMembers("mesa-dust", ["salt-choir"], "8:00pm", "headliner");
  assert.ok(members);
  assert.equal(members[0]?.status, "accepted");
  assert.equal(members[1]?.status, "invited");
  assert.deepEqual(
    members.map((item) => item.splitPercent),
    [70, 30],
  );
  const pitch: Pitch = {
    id: "pitch-1",
    leadBandId: "mesa-dust",
    openDateId: "od-salt-1116",
    venueId: "salt-river",
    members: members,
    terms: initialSnapshot.bookings[0]!.terms,
    messages: [],
    bookingId: null,
    createdAt: "2026-10-20T00:00:00.000Z",
  };
  assert.match(sendBlock(pitch) ?? "", /every band accepts/);
  pitch.members = pitch.members.map((item) => ({ ...item, status: "accepted" }));
  assert.equal(sendBlock(pitch), null);
});

test("a suggested split change asks the other bands to accept again", () => {
  const changed = applyMemberChange(
    [
      member({ bandId: "mesa-dust", role: "Headliner", splitPercent: 70, status: "accepted", setTime: "8:00pm" }),
      member({ bandId: "salt-choir", role: "Opener", splitPercent: 30, status: "invited", setTime: "7:00pm" }),
    ],
    "salt-choir",
    "7:30pm",
    40,
  );
  assert.equal(changed.ok, true);
  if (!changed.ok) return;
  assert.equal(changed.members.find((item) => item.bandId === "salt-choir")?.splitPercent, 40);
  assert.equal(changed.members.find((item) => item.bandId === "mesa-dust")?.splitPercent, 60);
  assert.equal(changed.members.find((item) => item.bandId === "salt-choir")?.status, "accepted");
  assert.equal(changed.members.find((item) => item.bandId === "mesa-dust")?.status, "invited");
  assert.equal(
    changed.members.reduce((sum, item) => sum + item.splitPercent, 0),
    100,
  );
});

test("Salt Choir's card shows shared history and Verde Line's does not", () => {
  const salt = trustGlance(initialSnapshot, "mesa-dust", "salt-choir", today);
  assert.equal(salt.verified, true);
  assert.match(salt.rating, /from 1 room and 1 band/);
  assert.equal(salt.gigs, 1);
  assert.ok(salt.connections.includes("You both played The Yucca Room"));
  assert.ok(salt.connections.includes("Tuned in with you"));

  const verde = trustGlance(initialSnapshot, "mesa-dust", "verde-line", today);
  assert.equal(verde.verified, false);
  assert.equal(verde.rating, "No reviews yet");
  assert.equal(verde.gigs, 0);
  assert.deepEqual(verde.connections, []);
});

test("band-to-band reviews wait until the gig has been played", () => {
  const early = peerReviewDraft(
    initialSnapshot,
    "bk-yucca-mesa",
    "salt-choir",
    { onTime: true, sharedGear: true, broughtCrowd: true, easyToWorkWith: true },
    "",
    today,
  );
  assert.equal(early.ok, false);
  const again = peerReviewDraft(
    initialSnapshot,
    "bk-yucca-0918",
    "salt-choir",
    { onTime: true, sharedGear: true, broughtCrowd: true, easyToWorkWith: true },
    "Easy night.",
    today,
  );
  assert.equal(again.ok, false);
});
