"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ownsProfile } from "@/lib/account";
import { getBand } from "@/lib/catalog";
import { MUSIC_LABEL, ORIGINALS_INFO, repertoireFor } from "@/lib/repertoire";
import { bandSize, SIZE_PRESETS, sizeLabel } from "@/lib/size";
import { useApp } from "@/lib/store";
import type { MusicKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const MUSIC: MusicKind[] = ["covers", "originals", "mix"];

export function OriginalsInfo() {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-expanded={open}
        aria-label="About originals and performance rights"
        onClick={() => setOpen((value) => !value)}
        className="grid size-5 place-items-center rounded-full border bg-card text-[11px] font-semibold"
      >
        i
      </button>
      {open ? (
        <span
          role="tooltip"
          className="absolute top-7 left-0 z-30 w-64 rounded-xl border bg-card p-3 text-left text-xs leading-relaxed font-normal tracking-normal text-foreground normal-case shadow-lg"
        >
          {ORIGINALS_INFO}
        </span>
      ) : null}
    </span>
  );
}

export function MusicBadge({ bandId, withInfo = false }: { bandId: string; withInfo?: boolean }) {
  const { snapshot } = useApp();
  const music = repertoireFor(bandId, snapshot.repertoires).music;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="rounded-full bg-pine px-2 py-1 text-[11px] font-semibold tracking-wide text-cream uppercase">
        {MUSIC_LABEL[music]}
      </span>
      {withInfo && music === "originals" ? <OriginalsInfo /> : null}
    </span>
  );
}

export function SizeBadge({ bandId }: { bandId: string }) {
  const { snapshot } = useApp();
  const band = getBand(bandId);
  if (!band) return null;
  return (
    <span className="rounded-full bg-sand px-2 py-1 text-[11px] font-semibold tracking-wide uppercase">
      {sizeLabel(bandSize(band, snapshot.sizes))}
    </span>
  );
}

export function BandMarks({ bandId, withInfo = false }: { bandId: string; withInfo?: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <SizeBadge bandId={bandId} />
      <MusicBadge bandId={bandId} withInfo={withInfo} />
    </span>
  );
}

export function MusicFilter({
  value,
  onChange,
}: {
  value: "any" | MusicKind;
  onChange: (value: "any" | MusicKind) => void;
}) {
  const options: { id: "any" | MusicKind; label: string }[] = [
    { id: "any", label: "Any" },
    { id: "covers", label: "Covers" },
    { id: "originals", label: "Originals" },
    { id: "mix", label: "Mix" },
  ];
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Music</span>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={value === option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              value === option.id ? "bg-ink text-cream" : "bg-sand",
            )}
          >
            {option.label}
          </button>
        ))}
        {value === "originals" ? <OriginalsInfo /> : null}
      </div>
      {value === "originals" ? <p className="text-xs leading-relaxed text-muted-foreground">{ORIGINALS_INFO}</p> : null}
    </div>
  );
}

export function SizeFilter({
  min,
  max,
  onChange,
}: {
  min: number | null;
  max: number | null;
  onChange: (min: number | null, max: number | null) => void;
}) {
  const active = SIZE_PRESETS.find((preset) => preset.min === min && preset.max === max)?.id ?? "";
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Size</span>
        <button
          type="button"
          aria-pressed={min == null && max == null}
          onClick={() => onChange(null, null)}
          className={cn("rounded-full px-3 py-1 text-xs font-semibold", min == null && max == null ? "bg-ink text-cream" : "bg-sand")}
        >
          Any
        </button>
        {SIZE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-pressed={active === preset.id}
            onClick={() => onChange(preset.min, preset.max)}
            className={cn("rounded-full px-3 py-1 text-xs font-semibold", active === preset.id ? "bg-ink text-cream" : "bg-sand")}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Min pieces</span>
          <Input
            inputMode="numeric"
            value={min ?? ""}
            placeholder="Any"
            className="h-10"
            onChange={(event) => onChange(numberOrNull(event.target.value), max)}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Max pieces</span>
          <Input
            inputMode="numeric"
            value={max ?? ""}
            placeholder="Any"
            className="h-10"
            onChange={(event) => onChange(min, numberOrNull(event.target.value))}
          />
        </label>
      </div>
    </div>
  );
}

function numberOrNull(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return Math.round(parsed);
}

export function MusicChoice({
  value,
  onChange,
}: {
  value: MusicKind | null;
  onChange: (value: MusicKind) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {MUSIC.map((music) => (
          <button
            key={music}
            type="button"
            aria-pressed={value === music}
            onClick={() => onChange(music)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold",
              value === music ? "bg-ink text-cream" : "bg-sand",
            )}
          >
            {MUSIC_LABEL[music]}
          </button>
        ))}
      </div>
      {value === "originals" ? (
        <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
          <OriginalsInfo />
          <span>{ORIGINALS_INFO}</span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Pick one. Venues filter the board by this label.</p>
      )}
    </div>
  );
}

export function RepertoirePanel({ bandId }: { bandId: string }) {
  const { snapshot, setRepertoire, setBandSize } = useApp();
  const repertoire = repertoireFor(bandId, snapshot.repertoires);
  const band = getBand(bandId);
  const editable = ownsProfile(snapshot, bandId) && snapshot.role === "band";
  const size = band ? bandSize(band, snapshot.sizes) : 1;

  function saveMusic(music: MusicKind) {
    const result = setRepertoire(bandId, { music });
    if (!result.ok) toast.error(result.error);
  }

  function saveSize(next: number) {
    const result = setBandSize(bandId, next);
    if (!result.ok) toast.error(result.error);
  }

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-2xl">Setlist</h2>
        <BandMarks bandId={bandId} withInfo />
      </div>
      {editable ? (
        <div className="mt-4 grid gap-4">
          <MusicChoice value={repertoire.music} onChange={saveMusic} />
          <label className="grid max-w-xs gap-1 text-sm font-medium">
            How many pieces
            <Input
              className="h-11 font-normal"
              inputMode="numeric"
              value={String(size)}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (next >= 1) saveSize(Math.round(next));
              }}
            />
          </label>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          {sizeLabel(size)} · {MUSIC_LABEL[repertoire.music]}
          {repertoire.music === "originals" ? `. ${ORIGINALS_INFO}` : ""}
        </p>
      )}
    </section>
  );
}

/** @deprecated Use MusicBadge. Kept so older call sites keep compiling during the rename. */
export const OriginalsBadge = MusicBadge;
