"use client";

import { useState } from "react";
import { toast } from "sonner";
import { uid } from "@/lib/deal";
import {
  MEDIA_WHY,
  PROMO_TOGGLE,
  canEditMedia,
  embedSrc,
  mediaFor,
  profileStrength,
  type StrengthItem,
} from "@/lib/media";
import { readPhoto } from "@/lib/photo";
import { useApp } from "@/lib/store";
import type { ProfilePhoto, ProfileVideo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type MediaDraft = {
  logo: string | null;
  photos: ProfilePhoto[];
  videos: ProfileVideo[];
  promoUse: boolean;
};

export function MediaFields({
  name,
  role,
  bio,
  hasMembers,
  hasSample,
  hasMusic,
  hasAddress,
  hasBackline,
  value,
  onChange,
}: {
  name: string;
  role: "band" | "venue";
  bio: string;
  hasMembers: boolean;
  hasSample: boolean;
  hasMusic: boolean;
  hasAddress: boolean;
  hasBackline: boolean;
  value: MediaDraft;
  onChange: (next: MediaDraft) => void;
}) {
  const strength = profileStrength({
    role,
    bio,
    hasMembers,
    hasSample,
    hasMusic,
    hasAddress,
    hasBackline,
    media: value,
  });
  return (
    <div className="grid gap-4">
      <p className="text-sm leading-relaxed text-muted-foreground">{MEDIA_WHY}</p>
      <StrengthMeter score={strength.score} items={strength.items} nudges={strength.nudges} />
      <LogoField
        name={name}
        logo={value.logo}
        onLogo={(logo) => onChange({ ...value, logo })}
      />
      <PhotoList photos={value.photos} onChange={(photos) => onChange({ ...value, photos })} />
      <VideoList videos={value.videos} onChange={(videos) => onChange({ ...value, videos })} />
      <label className="flex items-start gap-3 rounded-2xl border bg-card p-3 text-sm">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-rust"
          checked={value.promoUse}
          onChange={(event) => onChange({ ...value, promoUse: event.target.checked })}
        />
        <span>{PROMO_TOGGLE}</span>
      </label>
    </div>
  );
}

export function ProfileMediaView({
  profileId,
  role,
  name,
  bio,
  hasMembers,
  hasSample,
  hasMusic,
  hasAddress,
  hasBackline,
}: {
  profileId: string;
  role: "band" | "venue";
  name: string;
  bio: string;
  hasMembers: boolean;
  hasSample: boolean;
  hasMusic: boolean;
  hasAddress: boolean;
  hasBackline: boolean;
}) {
  const { snapshot, setProfileMedia } = useApp();
  const media = mediaFor(profileId, snapshot.media);
  const editable = canEditMedia(snapshot, profileId);
  const strength = profileStrength({
    role,
    bio,
    hasMembers,
    hasSample,
    hasMusic,
    hasAddress,
    hasBackline,
    media,
  });

  function save(next: MediaDraft) {
    const result = setProfileMedia(profileId, next);
    if (!result.ok) toast.error(result.error);
  }

  if (!editable && !media.logo && media.photos.length === 0 && media.videos.length === 0 && strength.score === 100) {
    return null;
  }

  return (
    <section className="mt-6 grid max-w-2xl gap-4">
      {editable ? (
        <MediaFields
          name={name}
          role={role}
          bio={bio}
          hasMembers={hasMembers}
          hasSample={hasSample}
          hasMusic={hasMusic}
          hasAddress={hasAddress}
          hasBackline={hasBackline}
          value={media}
          onChange={save}
        />
      ) : (
        <>
          <StrengthMeter score={strength.score} items={strength.items} nudges={[]} />
          <MediaGallery name={name} media={media} />
        </>
      )}
    </section>
  );
}

export function StrengthMeter({
  score,
  items,
  nudges,
}: {
  score: number;
  items: StrengthItem[];
  nudges: StrengthItem[];
}) {
  return (
    <div id="profile-strength" className="rounded-2xl border bg-card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-medium">Profile strength</p>
        <p className="font-display text-2xl">{score}%</p>
      </div>
      <div
        role="meter"
        aria-label="Profile strength"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        className="mt-2 h-2 overflow-hidden rounded-full bg-sand"
      >
        <div className="h-full rounded-full bg-pine" style={{ width: `${score}%` }} />
      </div>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className={
              item.done
                ? "rounded-full bg-pine px-2 py-0.5 text-xs font-medium text-cream"
                : "rounded-full bg-sand px-2 py-0.5 text-xs font-medium"
            }
          >
            {item.label}
          </li>
        ))}
      </ul>
      {nudges.length > 0 ? (
        <ul className="mt-3 grid gap-1 text-sm text-muted-foreground">
          {nudges.slice(0, 3).map((item) => (
            <li key={item.id}>{item.nudge}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function MediaGallery({
  name,
  media,
}: {
  name: string;
  media: MediaDraft;
}) {
  if (!media.logo && media.photos.length === 0 && media.videos.length === 0) return null;
  return (
    <div className="grid gap-3">
      {media.logo ? (
        <img src={media.logo} alt={`${name} logo`} className="size-24 rounded-2xl border object-cover" />
      ) : null}
      {media.photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2">
          {media.photos.map((photo) => (
            <li key={photo.id}>
              <img src={photo.src} alt={photo.caption || `${name} photo`} className="aspect-square w-full rounded-xl object-cover" />
              {photo.caption ? <p className="mt-1 text-xs text-muted-foreground">{photo.caption}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
      {media.videos.map((video) => {
        const src = embedSrc(video.url);
        return src ? (
          <iframe
            key={video.id}
            src={src}
            title={video.title || "Video"}
            className="aspect-video w-full rounded-xl border"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <a key={video.id} href={video.url} className="text-sm text-rust underline" target="_blank" rel="noreferrer">
            {video.title || video.url}
          </a>
        );
      })}
    </div>
  );
}

function LogoField({
  name,
  logo,
  onLogo,
}: {
  name: string;
  logo: string | null;
  onLogo: (logo: string | null) => void;
}) {
  const [link, setLink] = useState("");
  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">Logo</p>
      {logo ? <img src={logo} alt={`${name || "Profile"} logo`} className="size-20 rounded-2xl border object-cover" /> : null}
      <div className="flex flex-wrap gap-2">
        <FileButton
          accept="image/*"
          label={logo ? "Replace logo" : "Upload logo"}
          onFile={(file) => readImage(file, onLogo)}
        />
        {logo ? (
          <Button type="button" variant="outline" className="h-10" onClick={() => onLogo(null)}>
            Remove logo
          </Button>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Input
          className="h-10"
          value={link}
          placeholder="Or paste an https image link"
          onChange={(event) => setLink(event.target.value)}
        />
        <Button
          type="button"
          variant="secondary"
          className="h-10"
          onClick={() => {
            const next = link.trim();
            if (!/^https:\/\/\S+$/i.test(next)) {
              toast.error("Paste an https link for the logo.");
              return;
            }
            onLogo(next);
            setLink("");
          }}
        >
          Use link
        </Button>
      </div>
    </div>
  );
}

function PhotoList({
  photos,
  onChange,
}: {
  photos: ProfilePhoto[];
  onChange: (photos: ProfilePhoto[]) => void;
}) {
  const [link, setLink] = useState("");
  const [caption, setCaption] = useState("");
  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">Photos</p>
      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2">
          {photos.map((photo) => (
            <li key={photo.id} className="rounded-xl border bg-card p-2">
              <img src={photo.src} alt={photo.caption || "Profile photo"} className="aspect-square w-full rounded-lg object-cover" />
              <Input
                className="mt-2 h-9"
                value={photo.caption}
                placeholder="Caption"
                onChange={(event) =>
                  onChange(photos.map((item) => (item.id === photo.id ? { ...item, caption: event.target.value } : item)))
                }
              />
              <Button
                type="button"
                variant="ghost"
                className="mt-1 h-8 px-2"
                onClick={() => onChange(photos.filter((item) => item.id !== photo.id))}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <FileButton
        accept="image/*"
        label="Upload a photo"
        onFile={(file) =>
          readImage(file, (src) => {
            if (!src) return;
            onChange([...photos, { id: uid("ph"), src, caption: "" }]);
          })
        }
      />
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Input className="h-10" value={link} placeholder="https image link" onChange={(event) => setLink(event.target.value)} />
        <Input className="h-10" value={caption} placeholder="Caption" onChange={(event) => setCaption(event.target.value)} />
        <Button
          type="button"
          variant="secondary"
          className="h-10"
          onClick={() => {
            const next = link.trim();
            if (!/^https:\/\/\S+$/i.test(next)) {
              toast.error("Paste an https link for the photo.");
              return;
            }
            onChange([...photos, { id: uid("ph"), src: next, caption: caption.slice(0, 80) }]);
            setLink("");
            setCaption("");
          }}
        >
          Add link
        </Button>
      </div>
    </div>
  );
}

function VideoList({
  videos,
  onChange,
}: {
  videos: ProfileVideo[];
  onChange: (videos: ProfileVideo[]) => void;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">Video</p>
      <p className="text-sm text-muted-foreground">Paste a YouTube or Vimeo link. A file is too large to keep in this browser.</p>
      <ul className="grid gap-2">
        {videos.map((video) => {
          const src = embedSrc(video.url);
          return (
            <li key={video.id} className="grid gap-2 rounded-xl border bg-card p-2">
              {src ? (
                <iframe
                  src={src}
                  title={video.title || "Video"}
                  className="aspect-video w-full rounded-lg"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <p className="text-sm">{video.url}</p>
              )}
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm">{video.title || "Untitled clip"}</p>
                <Button type="button" variant="ghost" className="h-8" onClick={() => onChange(videos.filter((item) => item.id !== video.id))}>
                  Remove
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Input className="h-10" value={url} placeholder="https://www.youtube.com/watch?v=…" onChange={(event) => setUrl(event.target.value)} />
        <Input className="h-10" value={title} placeholder="Title" onChange={(event) => setTitle(event.target.value)} />
        <Button
          type="button"
          variant="secondary"
          className="h-10"
          onClick={() => {
            const next = url.trim();
            if (!/^https:\/\/\S+$/i.test(next)) {
              toast.error("Paste a YouTube or Vimeo https link.");
              return;
            }
            onChange([...videos, { id: uid("vid"), url: next, title: title.slice(0, 80) }]);
            setUrl("");
            setTitle("");
          }}
        >
          Add video
        </Button>
      </div>
      <label className="text-sm text-muted-foreground">
        Upload a video file
        <input
          type="file"
          accept="video/*"
          className="mt-1 block w-full text-sm"
          onChange={() => {
            toast.message("Paste a YouTube or Vimeo link. Video files are too large to keep in this browser.");
          }}
        />
      </label>
    </div>
  );
}

function FileButton({
  accept,
  label,
  onFile,
}: {
  accept: string;
  label: string;
  onFile: (file: File) => void;
}) {
  return (
    <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border bg-card px-3 text-sm font-medium">
      {label}
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
    </label>
  );
}

function readImage(file: File, onLogo: (src: string | null) => void) {
  readPhoto(file)
    .then((src) => onLogo(src))
    .catch((error: unknown) => toast.error(error instanceof Error ? error.message : "That photo could not be opened."));
}
