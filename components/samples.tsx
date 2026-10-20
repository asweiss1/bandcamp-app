"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { toast } from "sonner";
import {
  AUDIO_EVENT,
  audioFileError,
  countTracks,
  deleteTrack,
  listTracks,
  MAX_AUDIO_BYTES,
  MAX_UPLOADS,
  saveTrack,
  type StoredTrack,
} from "@/lib/audio-db";
import { uid } from "@/lib/deal";
import { SEED_TRACKS } from "@/lib/seed-tracks";
import { ownsProfile } from "@/lib/account";
import { useApp } from "@/lib/store";
import type { StreamService } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SERVICES: { id: StreamService; label: string }[] = [
  { id: "bandcamp", label: "Bandcamp" },
  { id: "soundcloud", label: "SoundCloud" },
  { id: "youtube", label: "YouTube" },
  { id: "spotify", label: "Spotify" },
];

type Playable = {
  id: string;
  title: string;
  notes: string;
  src: string;
  placeholder: boolean;
};

function clock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export function usePlayableTracks(bandId: string) {
  const [uploads, setUploads] = useState<StoredTrack[]>([]);
  useEffect(() => {
    let cancel = false;
    const load = () => {
      listTracks(bandId)
        .then((rows) => {
          if (!cancel) setUploads(rows);
        })
        .catch(() => {
          if (!cancel) setUploads([]);
        });
    };
    load();
    window.addEventListener(AUDIO_EVENT, load);
    return () => {
      cancel = true;
      window.removeEventListener(AUDIO_EVENT, load);
    };
  }, [bandId]);

  const uploaded = useMemo(
    () =>
      uploads.map((track) => ({
        id: track.id,
        title: track.title,
        notes: track.notes,
        src: URL.createObjectURL(track.blob),
        placeholder: false,
      })),
    [uploads],
  );
  useEffect(
    () => () => {
      uploaded.forEach((track) => URL.revokeObjectURL(track.src));
    },
    [uploaded],
  );

  const seeded: Playable[] = SEED_TRACKS.filter((track) => track.bandId === bandId).map((track) => ({
    ...track,
    placeholder: true,
  }));
  return [...seeded, ...uploaded];
}

export function BandSamples({
  bandId,
  variant = "full",
}: {
  bandId: string;
  variant?: "full" | "compact" | "listen";
}) {
  const tracks = usePlayableTracks(bandId);
  if (variant === "compact") {
    const first = tracks[0];
    if (!first) return null;
    return (
      <div className="mt-3 grid gap-1">
        <TrackRow track={first} />
        {tracks.length > 1 ? (
          <p className="text-[11px] text-muted-foreground">{tracks.length - 1} more on the profile</p>
        ) : null}
      </div>
    );
  }
  if (tracks.length === 0 && variant === "listen") return null;
  return (
    <section className="grid gap-3">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">
          {variant === "listen" ? "Listen before you answer" : "Music"}
        </p>
        {variant === "full" ? (
          <h2 className="mt-1 font-display text-3xl">Samples</h2>
        ) : (
          <h2 className="mt-1 font-display text-2xl">Samples from this band</h2>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          Seeded tones are generated placeholders, not real recordings. Uploads stay in this browser.
        </p>
      </div>
      {tracks.length === 0 ? (
        <p className="rounded-xl border border-dashed px-3 py-3 text-sm text-muted-foreground">No audio yet.</p>
      ) : (
        <div className="grid gap-2">
          {tracks.map((track) => (
            <TrackRow key={track.id} track={track} showNotes />
          ))}
        </div>
      )}
      {variant === "full" ? <SampleEditor bandId={bandId} /> : null}
    </section>
  );
}

export function SamplePlay({ bandId }: { bandId: string }) {
  const tracks = usePlayableTracks(bandId);
  const track = tracks[0];
  if (!track) return <p className="text-sm text-muted-foreground">No sample yet</p>;
  return <TrackRow track={track} compact />;
}

function TrackRow({ track, showNotes = false, compact = false }: { track: Playable; showNotes?: boolean; compact?: boolean }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  function toggle() {
    const node = audio.current;
    if (!node) return;
    if (node.paused) void node.play();
    else node.pause();
  }

  return (
    <div
      className="rounded-xl bg-sand/80 px-3 py-2"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <audio
        ref={audio}
        src={track.src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setTime(0);
        }}
        onTimeUpdate={() => setTime(audio.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audio.current?.duration ?? 0)}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-cream"
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{track.title}</p>
          {compact ? null : (
            <p className="text-[11px] text-muted-foreground">
              {track.placeholder ? "Generated placeholder" : "Uploaded in this browser"}
              {duration > 0 ? ` · ${clock(time)} / ${clock(duration)}` : ""}
            </p>
          )}
          {showNotes && track.notes ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{track.notes}</p> : null}
        </div>
      </div>
    </div>
  );
}

function SampleEditor({ bandId }: { bandId: string }) {
  const { snapshot, addStreamLink, removeStreamLink } = useApp();
  const editable = ownsProfile(snapshot, bandId) && (snapshot.role === "band" || snapshot.role === "musician");
  const links = snapshot.streamLinks.filter((link) => link.bandId === bandId);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [service, setService] = useState<StreamService>("bandcamp");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [fileKey, setFileKey] = useState(0);

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      toast.error("Choose an mp3, wav, or m4a file.");
      return;
    }
    const invalid = audioFileError(file);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    if (title.trim().length < 2) {
      toast.error("Give the track a title.");
      return;
    }
    setBusy(true);
    try {
      const count = await countTracks(bandId);
      if (count >= MAX_UPLOADS) {
        toast.error(`This band already has ${MAX_UPLOADS} uploads in this browser.`);
        return;
      }
      await saveTrack({
        id: uid("trk"),
        bandId,
        title: title.trim().slice(0, 80),
        notes: notes.trim().slice(0, 240),
        mime: file.type || "audio/mpeg",
        byteLength: file.size,
        blob: file,
        createdAt: new Date().toISOString(),
      });
      setTitle("");
      setNotes("");
      setFile(null);
      setFileKey((value) => value + 1);
      toast("Track saved in this browser");
    } catch {
      toast.error("This browser could not store that file.");
    } finally {
      setBusy(false);
    }
  }

  function addLink(event: React.FormEvent) {
    event.preventDefault();
    const result = addStreamLink(bandId, service, url);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setUrl("");
    toast("Link saved");
  }

  return (
    <div className="grid gap-4">
      {links.length > 0 ? (
        <ul className="grid gap-2">
          {links.map((link) => (
            <li key={link.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2">
              <a href={link.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-rust">
                {SERVICES.find((item) => item.id === link.service)?.label} · sample link
              </a>
              {editable ? (
                <button type="button" className="text-xs font-semibold" onClick={() => removeStreamLink(link.id)}>
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No Bandcamp, SoundCloud, YouTube, or Spotify link yet.</p>
      )}
      {editable ? (
        <>
          <form onSubmit={upload} className="grid gap-2 rounded-2xl border bg-card p-3">
            <p className="text-sm font-medium">Upload a track</p>
            <p className="text-xs text-muted-foreground">mp3, wav, or m4a. Up to {Math.round(MAX_AUDIO_BYTES / (1024 * 1024))} MB. Stored only in this browser.</p>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" className="h-10" />
            <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional note" className="h-10" />
            <input
              key={fileKey}
              type="file"
              accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="text-sm"
            />
            <Button type="submit" className="h-10" disabled={busy}>
              {busy ? "Saving…" : "Save track"}
            </Button>
          </form>
          <form onSubmit={addLink} className="grid gap-2 rounded-2xl border bg-card p-3">
            <p className="text-sm font-medium">Streaming link</p>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={service === item.id}
                  onClick={() => setService(item.id)}
                  className={service === item.id ? "h-9 rounded-full bg-ink px-3 text-xs font-medium text-cream" : "h-9 rounded-full bg-sand px-3 text-xs font-medium"}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" className="h-10" />
            <Button type="submit" variant="outline" className="h-10">
              Add link
            </Button>
          </form>
          <UploadedRemovals bandId={bandId} />
        </>
      ) : null}
    </div>
  );
}

function UploadedRemovals({ bandId }: { bandId: string }) {
  const [uploads, setUploads] = useState<StoredTrack[]>([]);
  useEffect(() => {
    const load = () => {
      listTracks(bandId).then(setUploads).catch(() => setUploads([]));
    };
    load();
    window.addEventListener(AUDIO_EVENT, load);
    return () => window.removeEventListener(AUDIO_EVENT, load);
  }, [bandId]);
  if (uploads.length === 0) return null;
  return (
    <ul className="grid gap-1 text-sm">
      {uploads.map((track) => (
        <li key={track.id} className="flex items-center justify-between gap-2">
          <span>{track.title}</span>
          <button type="button" className="text-xs font-semibold text-rust" onClick={() => void deleteTrack(track.id)}>
            Remove upload
          </button>
        </li>
      ))}
    </ul>
  );
}
