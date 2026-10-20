import { ownsProfile } from "@/lib/account";
import type { ProfileMedia, ProfilePhoto, ProfileVideo, Snapshot } from "@/lib/types";

export const MEDIA_WHY =
  "A logo, a few photos, and a video help the right people book you. Venues can see the vibe and the draw. Bands can see the room and the crowd. A stronger profile attracts more fitting shows on both sides.";

export const PROMO_TOGGLE =
  "Allow logos and photos to be used in flyers and promo posts for shows I'm booked on";

export function emptyMedia(profileId: string): ProfileMedia {
  return { profileId, promoUse: false, logo: null, photos: [], videos: [] };
}

export function mediaFor(profileId: string, list: ProfileMedia[] | undefined): ProfileMedia {
  return list?.find((item) => item.profileId === profileId) ?? emptyMedia(profileId);
}

export function canEditMedia(snapshot: Snapshot, profileId: string) {
  if (ownsProfile(snapshot, profileId)) return true;
  if (snapshot.account.demo && snapshot.role === "venue" && snapshot.venueId === profileId) return true;
  return snapshot.account.profiles.some((profile) => profile.id === profileId && snapshot.account.activeId === profileId);
}

export function youtubeId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1).split("/")[0] || null;
    if (parsed.hostname.endsWith("youtube.com")) {
      if (parsed.pathname.startsWith("/watch")) return parsed.searchParams.get("v");
      if (parsed.pathname.startsWith("/embed/")) return parsed.pathname.split("/")[2] || null;
      if (parsed.pathname.startsWith("/shorts/")) return parsed.pathname.split("/")[2] || null;
    }
  } catch {
    return null;
  }
  return null;
}

export function vimeoId(url: string) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("vimeo.com")) return null;
    const id = parsed.pathname.split("/").filter(Boolean).pop();
    return id && /^\d+$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function embedSrc(url: string) {
  const youtube = youtubeId(url);
  if (youtube) return `https://www.youtube-nocookie.com/embed/${youtube}`;
  const vimeo = vimeoId(url);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo}`;
  return null;
}

export type StrengthItem = { id: string; label: string; done: boolean; nudge: string };

export function profileStrength(input: {
  role: "band" | "venue";
  bio: string;
  hasMembers: boolean;
  hasSample: boolean;
  hasMusic: boolean;
  hasAddress: boolean;
  hasBackline: boolean;
  media: Pick<ProfileMedia, "logo" | "photos" | "videos">;
}) {
  const items: StrengthItem[] = [
    {
      id: "logo",
      label: "Logo",
      done: Boolean(input.media.logo),
      nudge: "Add a logo so your name is recognizable on a flyer.",
    },
    {
      id: "photos",
      label: "Photos",
      done: input.media.photos.length >= 2,
      nudge:
        input.role === "venue"
          ? "Add another photo of the room and the crowd."
          : "Add another photo so bookers can see the band and the draw.",
    },
    {
      id: "video",
      label: "Video",
      done: input.media.videos.length > 0,
      nudge: "Add a YouTube or Vimeo link. A minute of live video does more than a paragraph.",
    },
    {
      id: "bio",
      label: "Bio",
      done: input.bio.trim().length >= 40,
      nudge: "Write a short bio about the sound and who you play for.",
    },
  ];
  if (input.role === "band") {
    items.push(
      {
        id: "members",
        label: "Lineup",
        done: input.hasMembers,
        nudge: "Name the people on stage.",
      },
      {
        id: "music",
        label: "Covers, originals, or mix",
        done: input.hasMusic,
        nudge: "Pick covers, originals, or a mix so venues can filter for you.",
      },
      {
        id: "sample",
        label: "A sample",
        done: input.hasSample,
        nudge: "Add a song or a streaming link so they can hear you.",
      },
    );
  } else {
    items.push(
      {
        id: "address",
        label: "Address",
        done: input.hasAddress,
        nudge: "Add the street address so bands know where to load in.",
      },
      {
        id: "backline",
        label: "Backline",
        done: input.hasBackline,
        nudge: "Say what gear is in the room.",
      },
    );
  }
  const done = items.filter((item) => item.done).length;
  const score = Math.round((done / items.length) * 100);
  return { score, items, nudges: items.filter((item) => !item.done) };
}

export function cleanLogo(logo: string | null) {
  if (!logo) return null;
  const trimmed = logo.trim();
  if (trimmed.startsWith("data:image/") && trimmed.length < 300_000) return trimmed;
  if (/^https:\/\/\S+$/i.test(trimmed) && trimmed.length <= 500) return trimmed;
  return null;
}

export function cleanPhotos(photos: ProfilePhoto[]) {
  return photos
    .filter((photo) => photo.src.startsWith("data:image/") || /^https:\/\//.test(photo.src))
    .slice(0, 8)
    .map((photo) => ({ ...photo, caption: photo.caption.slice(0, 80) }));
}

export function cleanVideos(videos: ProfileVideo[]) {
  return videos
    .filter((video) => /^https:\/\/\S+$/i.test(video.url))
    .slice(0, 6)
    .map((video) => ({ ...video, url: video.url.slice(0, 200), title: video.title.slice(0, 80) }));
}
