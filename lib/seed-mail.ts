import type { MailMessage, MailThread } from "@/lib/types";

export const seedThreads: MailThread[] = [
  {
    id: "th-mesa-salt",
    kind: "direct",
    parties: [
      { id: "mesa-dust", role: "band" },
      { id: "salt-choir", role: "band" },
    ],
    bookingId: null,
    pitchId: null,
    createdAt: "2026-10-17T15:40:00.000Z",
  },
  {
    id: "th-high-mesa",
    kind: "booking",
    parties: [
      { id: "mesa-dust", role: "band" },
      { id: "high-country", role: "venue" },
    ],
    bookingId: "bk-high-mesa",
    pitchId: null,
    createdAt: "2026-10-18T19:50:00.000Z",
  },
  {
    id: "th-avery-mesa",
    kind: "fan",
    parties: [
      { id: "avery-quinn", role: "fan" },
      { id: "mesa-dust", role: "band" },
    ],
    bookingId: null,
    pitchId: null,
    createdAt: "2026-10-19T15:20:00.000Z",
  },
];

export const seedMessages: MailMessage[] = [
  {
    id: "msg-mesa-salt-1",
    threadId: "th-mesa-salt",
    fromId: "mesa-dust",
    fromRole: "band",
    body: "If we share a Monday, I'll headline and you open.",
    createdAt: "2026-10-17T16:00:00.000Z",
  },
  {
    id: "msg-mesa-salt-2",
    threadId: "th-mesa-salt",
    fromId: "salt-choir",
    fromRole: "band",
    body: "We're in. Send the invite when you find the room.",
    createdAt: "2026-10-18T18:30:00.000Z",
  },
  {
    id: "msg-high-mesa-1",
    threadId: "th-high-mesa",
    fromId: "high-country",
    fromRole: "venue",
    body: "Friday load-in is 5pm. Park by the garage on Butler and the backline will be in the room.",
    createdAt: "2026-10-18T20:15:00.000Z",
  },
  {
    id: "msg-avery-mesa-1",
    threadId: "th-avery-mesa",
    fromId: "avery-quinn",
    fromRole: "fan",
    body: "The Yucca show was the best night I've had all fall. Are you back in Phoenix in November?",
    createdAt: "2026-10-19T15:40:00.000Z",
  },
];
