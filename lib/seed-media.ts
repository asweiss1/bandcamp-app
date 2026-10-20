import type { ProfileMedia } from "@/lib/types";

function poster(bg: string, fg: string, title: string, kicker: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><rect width="800" height="800" fill="${bg}"/><circle cx="400" cy="340" r="190" fill="none" stroke="${fg}" stroke-width="10"/><text x="400" y="368" text-anchor="middle" font-family="Georgia, serif" font-size="92" fill="${fg}">${title}</text><text x="400" y="640" text-anchor="middle" font-family="Georgia, serif" font-size="28" letter-spacing="6" fill="${fg}">${kicker}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const seedMedia: ProfileMedia[] = [
  {
    profileId: "mesa-dust",
    promoUse: true,
    logo: poster("#1f3d34", "#e2a322", "MD", "MESA DUST"),
    photos: [
      {
        id: "ph-mesa-1",
        src: poster("#c4492c", "#fffaf3", "LIVE", "SAMPLE PHOTO"),
        caption: "Sample patio set. Not a real photo.",
      },
    ],
    videos: [
      {
        id: "vid-mesa-1",
        url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
        title: "Sample live clip",
      },
    ],
  },
  {
    profileId: "yucca-room",
    promoUse: true,
    logo: poster("#1b1612", "#e7d7b1", "YR", "YUCCA ROOM"),
    photos: [
      {
        id: "ph-yucca-1",
        src: poster("#7a3144", "#fffaf3", "ROOM", "SAMPLE PHOTO"),
        caption: "Sample room shot. Not a real photo.",
      },
    ],
    videos: [],
  },
  {
    profileId: "verde-taproom",
    promoUse: false,
    logo: poster("#1f3d34", "#fffaf3", "VT", "VERDE"),
    photos: [],
    videos: [],
  },
  {
    profileId: "salt-choir",
    promoUse: false,
    logo: null,
    photos: [],
    videos: [],
  },
];
