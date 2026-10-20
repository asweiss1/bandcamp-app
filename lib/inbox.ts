import { getBand, getFan, getMusician, getVenue, listBands, listMusicians, listVenues } from "@/lib/catalog";
import { uid } from "@/lib/deal";
import { profileId } from "@/lib/queries";
import type {
  Booking,
  FanBlock,
  FanMailSetting,
  MailMessage,
  MailParty,
  MailThread,
  Pitch,
  Role,
  Snapshot,
} from "@/lib/types";

export const FAN_MAIL_DAILY_LIMIT = 3;
export const NEW_ACCOUNT_DAYS = 14;

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE = /(?:\d[\s().-]*){10,}/;
const LINK = /\b(?:https?:\/\/|www\.)\S+|\b[\w-]+\.(?:com|net|org|io|fm|band|link|co)\b/i;

export type MailBox = "work" | "fan";

export type MailResult<T> = { ok: true; data: T; snapshot: Snapshot } | { ok: false; error: string };

export type InboxRow = {
  id: string;
  kind: MailThread["kind"];
  title: string;
  place: string;
  preview: string;
  chip: string;
  unread: boolean;
  updatedAt: string;
  bookingId: string | null;
  pitchId: string | null;
};

export type DirectoryHit = {
  id: string;
  role: "band" | "venue" | "musician";
  name: string;
  place: string;
};

export type ThreadLine = {
  id: string;
  mine: boolean;
  name: string;
  body: string;
  createdAt: string;
};

export type ThreadView = {
  id: string;
  kind: MailThread["kind"];
  title: string;
  people: string;
  lines: ThreadLine[];
  bookingId: string | null;
  pitchId: string | null;
  fanId: string | null;
  blocked: boolean;
  reported: boolean;
  closed: boolean;
  fanMailOff: boolean;
  canReply: boolean;
};

type Bundle = { thread: MailThread; messages: MailMessage[] };

function viewer(snapshot: Pick<Snapshot, "role" | "bandId" | "venueId" | "musicianId" | "fanId">): MailParty {
  return { id: profileId(snapshot), role: snapshot.role };
}

function isParty(parties: MailParty[], party: MailParty) {
  return parties.some((item) => item.id === party.id && item.role === party.role);
}

function sameParties(left: MailParty[], right: MailParty[]) {
  if (left.length !== right.length) return false;
  return left.every((party) => isParty(right, party));
}

export function partyName(party: MailParty) {
  if (party.role === "band") return getBand(party.id)?.name ?? "Band";
  if (party.role === "venue") return getVenue(party.id)?.name ?? "Venue";
  if (party.role === "musician") return getMusician(party.id)?.name ?? "Musician";
  return getFan(party.id)?.name ?? "Fan";
}

export function partyPlace(party: MailParty) {
  if (party.role === "band") return getBand(party.id)?.city ?? "";
  if (party.role === "venue") return getVenue(party.id)?.city ?? "";
  if (party.role === "musician") return getMusician(party.id)?.city ?? "";
  return getFan(party.id)?.city ?? "";
}

export function partyLabel(party: MailParty) {
  const name = partyName(party);
  const place = partyPlace(party);
  return place ? `${name} · ${place}` : name;
}

export function contactProblem(body: string) {
  if (EMAIL.test(body)) return "Leave email addresses off the message.";
  if (PHONE.test(body)) return "Leave phone numbers off the message.";
  return null;
}

function accountAgeDays(joinedAt: string | null | undefined, today: string) {
  if (!joinedAt) return 0;
  const joined = joinedAt.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(joined) || !/^\d{4}-\d{2}-\d{2}$/.test(today)) return 0;
  return Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${joined}T00:00:00Z`)) / 86400000);
}

export function isNewAccount(joinedAt: string | null | undefined, today: string) {
  return accountAgeDays(joinedAt, today) < NEW_ACCOUNT_DAYS;
}

export function messageGuard(input: {
  role: Role;
  body: string;
  joinedAt?: string | null;
  sentToday: number;
  today: string;
}): { ok: true; body: string } | { ok: false; error: string } {
  const body = input.body.trim();
  if (body.length < 2) return { ok: false, error: "Write a message." };
  if (body.length > 500) return { ok: false, error: "Keep it to a few sentences." };
  const leak = contactProblem(body);
  if (leak) return { ok: false, error: leak };
  if (input.role === "fan") {
    if (isNewAccount(input.joinedAt, input.today) && LINK.test(body)) {
      return { ok: false, error: "New accounts can't send links yet." };
    }
    if (input.sentToday >= FAN_MAIL_DAILY_LIMIT) {
      return { ok: false, error: "You can send 3 fan messages a day." };
    }
  }
  return { ok: true, body };
}

export function fanMailOpen(settings: FanMailSetting[] | undefined, bandId: string) {
  const row = settings?.find((item) => item.bandId === bandId);
  return row ? row.enabled : true;
}

export function isBlocked(blocks: FanBlock[] | undefined, bandId: string, fanId: string) {
  return blocks?.some((item) => item.bandId === bandId && item.fanId === fanId) ?? false;
}

export function fanMessagesOnDay(messages: MailMessage[] | undefined, fanId: string, today: string) {
  return (messages ?? []).filter(
    (message) => message.fromRole === "fan" && message.fromId === fanId && message.createdAt.slice(0, 10) === today,
  ).length;
}

function pitchBundle(pitch: Pitch): Bundle {
  const thread: MailThread = {
    id: `pitch:${pitch.id}`,
    kind: "pitch",
    parties: pitch.members.map((member) => ({ id: member.bandId, role: "band" })),
    bookingId: pitch.bookingId,
    pitchId: pitch.id,
    createdAt: pitch.createdAt,
  };
  return {
    thread,
    messages: pitch.messages.map((message) => ({
      id: message.id,
      threadId: thread.id,
      fromId: message.fromBandId,
      fromRole: "band",
      body: message.body,
      createdAt: message.createdAt,
    })),
  };
}

function bundles(snapshot: Snapshot): Bundle[] {
  const stored = snapshot.threads.map((thread) => ({
    thread,
    messages: snapshot.messages.filter((message) => message.threadId === thread.id),
  }));
  const pitches = snapshot.pitches
    .filter((pitch) => !snapshot.threads.some((thread) => thread.pitchId === pitch.id))
    .map(pitchBundle);
  return [...stored, ...pitches];
}

function findBundle(snapshot: Snapshot, threadId: string) {
  return bundles(snapshot).find((bundle) => bundle.thread.id === threadId) ?? null;
}

function readAt(snapshot: Snapshot, threadId: string, profileIdValue: string) {
  return snapshot.reads.find((item) => item.threadId === threadId && item.profileId === profileIdValue)?.readAt ?? "";
}

function unread(snapshot: Snapshot, bundle: Bundle, party: MailParty) {
  const seen = readAt(snapshot, bundle.thread.id, party.id);
  return bundle.messages.some(
    (message) => (message.fromId !== party.id || message.fromRole !== party.role) && message.createdAt > seen,
  );
}

function chipFor(kind: MailThread["kind"]) {
  if (kind === "direct") return "Direct";
  if (kind === "booking") return "Booking";
  if (kind === "pitch") return "Pitch";
  return "Fan mail";
}

function inBox(kind: MailThread["kind"], box: MailBox, role: Role) {
  if (role === "fan") return box === "work";
  if (box === "fan") return kind === "fan" && (role === "band" || role === "venue");
  return kind !== "fan";
}

export function showsFanTab(role: Role) {
  return role === "band" || role === "venue";
}

export function inboxRows(snapshot: Snapshot, box: MailBox): InboxRow[] {
  const me = viewer(snapshot);
  return bundles(snapshot)
    .filter((bundle) => isParty(bundle.thread.parties, me) && inBox(bundle.thread.kind, box, me.role))
    .map((bundle) => {
      const others = bundle.thread.parties.filter((party) => !(party.id === me.id && party.role === me.role));
      const last = bundle.messages[bundle.messages.length - 1];
      return {
        id: bundle.thread.id,
        kind: bundle.thread.kind,
        title: others.length > 0 ? others.map(partyName).join(", ") : "You",
        place: others.map(partyPlace).filter(Boolean).join(", "),
        preview: last?.body ?? "No messages yet.",
        chip: chipFor(bundle.thread.kind),
        unread: unread(snapshot, bundle, me),
        updatedAt: last?.createdAt ?? bundle.thread.createdAt,
        bookingId: bundle.thread.bookingId,
        pitchId: bundle.thread.pitchId,
      };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function unreadTotal(snapshot: Snapshot) {
  const boxes: MailBox[] = ["work"];
  if (showsFanTab(snapshot.role)) boxes.push("fan");
  return boxes.reduce((sum, box) => sum + inboxRows(snapshot, box).filter((row) => row.unread).length, 0);
}

function bandOn(thread: MailThread) {
  return thread.parties.find((party) => party.role === "band") ?? null;
}

function fanOn(thread: MailThread) {
  return thread.parties.find((party) => party.role === "fan") ?? null;
}

function fanSendProblem(snapshot: Snapshot, thread: MailThread) {
  const band = bandOn(thread);
  const fan = fanOn(thread);
  if (!band || !fan) return "That note doesn't have a band on it.";
  if (!fanMailOpen(snapshot.fanMail, band.id)) return "This band isn't taking fan mail.";
  if (isBlocked(snapshot.fanBlocks, band.id, fan.id)) return "You can't message this band.";
  return null;
}

export function threadView(snapshot: Snapshot, threadId: string): ThreadView | null {
  const bundle = findBundle(snapshot, threadId);
  if (!bundle) return null;
  const me = viewer(snapshot);
  if (!isParty(bundle.thread.parties, me)) return null;
  const others = bundle.thread.parties.filter((party) => !(party.id === me.id && party.role === me.role));
  const fan = fanOn(bundle.thread);
  const band = bandOn(bundle.thread);
  const blocked = Boolean(fan && band && isBlocked(snapshot.fanBlocks, band.id, fan.id));
  const reported = Boolean(
    fan && band && snapshot.fanBlocks.some((item) => item.bandId === band.id && item.fanId === fan.id && item.report),
  );
  const fanMailOff = Boolean(band && bundle.thread.kind === "fan" && !fanMailOpen(snapshot.fanMail, band.id));
  const closed = bundle.thread.kind === "pitch" && Boolean(bundle.thread.bookingId);
  const fanLocked = me.role === "fan" && bundle.thread.kind === "fan" && (blocked || fanMailOff);
  return {
    id: bundle.thread.id,
    kind: bundle.thread.kind,
    title: others.length > 0 ? others.map(partyName).join(", ") : "You",
    people: (others.length > 0 ? others : bundle.thread.parties).map(partyLabel).join(" · "),
    lines: bundle.messages.map((message) => ({
      id: message.id,
      mine: message.fromId === me.id && message.fromRole === me.role,
      name: partyName({ id: message.fromId, role: message.fromRole }),
      body: message.body,
      createdAt: message.createdAt,
    })),
    bookingId: bundle.thread.bookingId,
    pitchId: bundle.thread.pitchId,
    fanId: fan?.id ?? null,
    blocked,
    reported,
    closed,
    fanMailOff,
    canReply: !closed && !fanLocked,
  };
}

function profileExists(id: string, role: MailParty["role"]) {
  if (role === "band") return Boolean(getBand(id));
  if (role === "venue") return Boolean(getVenue(id));
  if (role === "musician") return Boolean(getMusician(id));
  return Boolean(getFan(id));
}

function makeMessage(threadId: string, from: MailParty, body: string, now: Date): MailMessage {
  return {
    id: uid("msg"),
    threadId,
    fromId: from.id,
    fromRole: from.role,
    body,
    createdAt: now.toISOString(),
  };
}

export function directorySearch(snapshot: Snapshot, query: string): DirectoryHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const me = viewer(snapshot);
  const hits: DirectoryHit[] = [];
  const take = (id: string, role: DirectoryHit["role"], name: string, place: string) => {
    if (me.id === id && me.role === role) return;
    if (`${name} ${place}`.toLowerCase().includes(q)) hits.push({ id, role, name, place });
  };
  for (const band of listBands()) take(band.id, "band", band.name, band.city);
  for (const venue of listVenues()) take(venue.id, "venue", venue.name, venue.city);
  for (const musician of listMusicians()) take(musician.id, "musician", musician.name, musician.city);
  return hits.slice(0, 8);
}

export function sendDirectMessage(
  snapshot: Snapshot,
  toId: string,
  toRole: "band" | "venue" | "musician",
  body: string,
  today: string,
  now = new Date(),
): MailResult<string> {
  if (snapshot.role === "fan") return { ok: false, error: "Fans write from a band's page." };
  if (snapshot.role !== "band" && snapshot.role !== "venue" && snapshot.role !== "musician") {
    return { ok: false, error: "Switch to a band, a room, or a player to write." };
  }
  const me = viewer(snapshot);
  if (toId === me.id && toRole === me.role) return { ok: false, error: "Pick someone else." };
  if (!profileExists(toId, toRole)) return { ok: false, error: "That profile isn't listed." };
  const guard = messageGuard({ role: me.role, body, joinedAt: null, sentToday: 0, today });
  if (!guard.ok) return guard;
  const target: MailParty = { id: toId, role: toRole };
  const existing = snapshot.threads.find(
    (thread) => thread.kind === "direct" && sameParties(thread.parties, [me, target]),
  );
  const thread =
    existing ??
    ({
      id: uid("th"),
      kind: "direct",
      parties: [me, target],
      bookingId: null,
      pitchId: null,
      createdAt: now.toISOString(),
    } satisfies MailThread);
  const message = makeMessage(thread.id, me, guard.body, now);
  return {
    ok: true,
    data: thread.id,
    snapshot: {
      ...snapshot,
      threads: existing ? snapshot.threads : [thread, ...snapshot.threads],
      messages: [...snapshot.messages, message],
    },
  };
}

export function ensureDirectThread(
  snapshot: Snapshot,
  toId: string,
  toRole: "band" | "venue" | "musician",
  now = new Date(),
): MailResult<string> {
  if (snapshot.role === "fan") return { ok: false, error: "Fans write from a band's page." };
  if (snapshot.role !== "band" && snapshot.role !== "venue" && snapshot.role !== "musician") {
    return { ok: false, error: "Switch to a band, a room, or a player to write." };
  }
  const me = viewer(snapshot);
  if (toId === me.id && toRole === me.role) return { ok: false, error: "Pick someone else." };
  if (!profileExists(toId, toRole)) return { ok: false, error: "That profile isn't listed." };
  const target: MailParty = { id: toId, role: toRole };
  const existing = snapshot.threads.find(
    (thread) => thread.kind === "direct" && sameParties(thread.parties, [me, target]),
  );
  if (existing) return { ok: true, data: existing.id, snapshot };
  const thread: MailThread = {
    id: uid("th"),
    kind: "direct",
    parties: [me, target],
    bookingId: null,
    pitchId: null,
    createdAt: now.toISOString(),
  };
  return { ok: true, data: thread.id, snapshot: { ...snapshot, threads: [thread, ...snapshot.threads] } };
}

export function sendFanMessage(
  snapshot: Snapshot,
  bandId: string,
  venueId: string | null,
  body: string,
  today: string,
  now = new Date(),
): MailResult<string> {
  if (snapshot.role !== "fan") return { ok: false, error: "Switch to a fan profile to write." };
  if (!getBand(bandId)) return { ok: false, error: "That band isn't listed." };
  if (venueId && !getVenue(venueId)) return { ok: false, error: "That room isn't listed." };
  const me = viewer(snapshot);
  const parties: MailParty[] = [
    me,
    { id: bandId, role: "band" },
    ...(venueId ? [{ id: venueId, role: "venue" as const }] : []),
  ];
  const draft: MailThread = {
    id: "draft",
    kind: "fan",
    parties,
    bookingId: null,
    pitchId: null,
    createdAt: now.toISOString(),
  };
  const problem = fanSendProblem(snapshot, draft);
  if (problem) return { ok: false, error: problem };
  const fan = getFan(me.id);
  const guard = messageGuard({
    role: "fan",
    body,
    joinedAt: fan?.joinedAt ?? null,
    sentToday: fanMessagesOnDay(snapshot.messages, me.id, today),
    today,
  });
  if (!guard.ok) return guard;
  const existing = snapshot.threads.find((thread) => thread.kind === "fan" && sameParties(thread.parties, parties));
  const thread = existing ?? { ...draft, id: uid("th") };
  const message = makeMessage(thread.id, me, guard.body, now);
  return {
    ok: true,
    data: thread.id,
    snapshot: {
      ...snapshot,
      threads: existing ? snapshot.threads : [thread, ...snapshot.threads],
      messages: [...snapshot.messages, message],
    },
  };
}

function replyPitch(snapshot: Snapshot, pitchId: string, body: string, now: Date): MailResult<string> {
  if (snapshot.role !== "band") return { ok: false, error: "Switch to a band to write in this thread." };
  const pitch = snapshot.pitches.find((item) => item.id === pitchId);
  if (!pitch) return { ok: false, error: "That pitch is gone." };
  if (pitch.bookingId) return { ok: false, error: "This thread closed when the offer went to the venue." };
  if (!pitch.members.some((member) => member.bandId === snapshot.bandId)) {
    return { ok: false, error: "Only the bands on this pitch can read it." };
  }
  const clean = body.trim();
  if (clean.length < 2) return { ok: false, error: "Write a message." };
  if (clean.length > 280) return { ok: false, error: "Keep it to a few sentences." };
  const leak = contactProblem(clean);
  if (leak) return { ok: false, error: leak };
  return {
    ok: true,
    data: `pitch:${pitch.id}`,
    snapshot: {
      ...snapshot,
      pitches: snapshot.pitches.map((item) =>
        item.id === pitch.id
          ? {
              ...item,
              messages: [
                ...item.messages,
                { id: uid("pm"), fromBandId: snapshot.bandId, body: clean, createdAt: now.toISOString() },
              ],
            }
          : item,
      ),
    },
  };
}

export function replyToThread(
  snapshot: Snapshot,
  threadId: string,
  body: string,
  today: string,
  now = new Date(),
): MailResult<string> {
  if (threadId.startsWith("pitch:")) return replyPitch(snapshot, threadId.slice("pitch:".length), body, now);
  const thread = snapshot.threads.find((item) => item.id === threadId);
  if (!thread) return { ok: false, error: "That thread is gone." };
  const me = viewer(snapshot);
  if (!isParty(thread.parties, me)) return { ok: false, error: "This thread is for the people in it." };
  if (me.role === "fan" && thread.kind === "fan") {
    const problem = fanSendProblem(snapshot, thread);
    if (problem) return { ok: false, error: problem };
  }
  const guard = messageGuard({
    role: me.role,
    body,
    joinedAt: me.role === "fan" ? (getFan(me.id)?.joinedAt ?? null) : null,
    sentToday: me.role === "fan" ? fanMessagesOnDay(snapshot.messages, me.id, today) : 0,
    today,
  });
  if (!guard.ok) return guard;
  return {
    ok: true,
    data: thread.id,
    snapshot: { ...snapshot, messages: [...snapshot.messages, makeMessage(thread.id, me, guard.body, now)] },
  };
}

export function markRead(snapshot: Snapshot, threadId: string, now = new Date()): MailResult<string> {
  const bundle = findBundle(snapshot, threadId);
  if (!bundle) return { ok: false, error: "That thread is gone." };
  const me = viewer(snapshot);
  if (!isParty(bundle.thread.parties, me)) return { ok: false, error: "This thread is for the people in it." };
  if (!unread(snapshot, bundle, me)) return { ok: true, data: threadId, snapshot };
  const reads = snapshot.reads.filter((item) => !(item.threadId === threadId && item.profileId === me.id));
  return {
    ok: true,
    data: threadId,
    snapshot: {
      ...snapshot,
      reads: [...reads, { threadId, profileId: me.id, readAt: now.toISOString() }],
    },
  };
}

export function setFanMailEnabled(snapshot: Snapshot, enabled: boolean): MailResult<string> {
  if (snapshot.role !== "band") return { ok: false, error: "Switch to a band to change fan mail." };
  const rest = snapshot.fanMail.filter((item) => item.bandId !== snapshot.bandId);
  return {
    ok: true,
    data: snapshot.bandId,
    snapshot: { ...snapshot, fanMail: [...rest, { bandId: snapshot.bandId, enabled }] },
  };
}

export function blockFanAccount(snapshot: Snapshot, fanId: string, report: boolean, now = new Date()): MailResult<string> {
  if (snapshot.role !== "band") return { ok: false, error: "Switch to a band to block a fan." };
  if (!getFan(fanId)) return { ok: false, error: "That fan isn't listed." };
  const existing = snapshot.fanBlocks.find((item) => item.bandId === snapshot.bandId && item.fanId === fanId);
  const next: FanBlock = existing
    ? { ...existing, report: existing.report || report }
    : {
        id: uid("block"),
        bandId: snapshot.bandId,
        fanId,
        report,
        createdAt: now.toISOString(),
      };
  return {
    ok: true,
    data: fanId,
    snapshot: {
      ...snapshot,
      fanBlocks: [...snapshot.fanBlocks.filter((item) => item.id !== existing?.id), next],
    },
  };
}

function bookingParties(snapshot: Snapshot, booking: Booking): MailParty[] {
  const parties: MailParty[] = [
    { id: booking.bandId, role: "band" },
    { id: booking.venueId, role: "venue" },
  ];
  const bill = booking.billId ? snapshot.bills.find((item) => item.id === booking.billId) : undefined;
  for (const member of bill?.members ?? []) {
    if (!parties.some((party) => party.role === "band" && party.id === member.bandId)) {
      parties.push({ id: member.bandId, role: "band" });
    }
  }
  return parties;
}

export function canMessageBooking(snapshot: Snapshot, bookingId: string) {
  const booking = snapshot.bookings.find((item) => item.id === bookingId);
  if (!booking || snapshot.role === "fan") return false;
  return isParty(bookingParties(snapshot, booking), viewer(snapshot));
}

export function ensureBookingThread(snapshot: Snapshot, bookingId: string, now = new Date()): MailResult<string> {
  const booking = snapshot.bookings.find((item) => item.id === bookingId);
  if (!booking) return { ok: false, error: "That booking isn't in this browser." };
  const parties = bookingParties(snapshot, booking);
  if (!isParty(parties, viewer(snapshot))) return { ok: false, error: "This thread is for the people on the booking." };
  const existing = snapshot.threads.find((thread) => thread.kind === "booking" && thread.bookingId === bookingId);
  if (existing) return { ok: true, data: existing.id, snapshot };
  const thread: MailThread = {
    id: uid("th"),
    kind: "booking",
    parties,
    bookingId,
    pitchId: null,
    createdAt: now.toISOString(),
  };
  return { ok: true, data: thread.id, snapshot: { ...snapshot, threads: [thread, ...snapshot.threads] } };
}
