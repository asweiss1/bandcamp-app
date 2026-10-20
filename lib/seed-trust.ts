import type { Review, Verification } from "@/lib/types";

export const seedReviews: Review[] = [
  {
    id: "rv-yucca-mesa-0918",
    bookingId: "bk-yucca-0918",
    fromRole: "venue",
    fromId: "yucca-room",
    toRole: "band",
    toId: "mesa-dust",
    rating: 5,
    note: "Full room, on time, and the set matched the originals they sent.",
    createdAt: "2026-09-19T16:00:00.000Z",
  },
];

export const seedVerifications: Verification[] = [
  { profileId: "mesa-dust", email: true, phone: true, address: false },
  { profileId: "yucca-room", email: true, phone: true, address: true },
  { profileId: "high-country", email: true, phone: false, address: true },
  { profileId: "lena-ortiz", email: true, phone: true, address: false },
];
