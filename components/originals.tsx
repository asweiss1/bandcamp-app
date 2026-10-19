"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ORIGINALS_INFO, repertoireFor } from "@/lib/repertoire";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

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

export function OriginalsBadge({ bandId, withInfo = false }: { bandId: string; withInfo?: boolean }) {
  const { snapshot } = useApp();
  const repertoire = repertoireFor(bandId, snapshot.repertoires);
  if (!repertoire.originalsOnly) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="rounded-full bg-pine px-2 py-1 text-[11px] font-semibold tracking-wide text-cream uppercase">
        All original
      </span>
      {repertoire.rightsAttested ? (
        <span className="text-[11px] font-medium text-muted-foreground">Rights attested</span>
      ) : null}
      {withInfo ? <OriginalsInfo /> : null}
    </span>
  );
}

export function OriginalsFilter({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      Originals only
      <OriginalsInfo />
    </label>
  );
}

export function RepertoirePanel({ bandId }: { bandId: string }) {
  const { snapshot, setRepertoire } = useApp();
  const repertoire = repertoireFor(bandId, snapshot.repertoires);
  const editable = snapshot.role === "band" && snapshot.bandId === bandId;

  function save(patch: { originalsOnly?: boolean; coversNote?: string; rightsAttested?: boolean }) {
    const result = setRepertoire(bandId, patch);
    if (!result.ok) toast.error(result.error);
  }

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-2xl">Setlist</h2>
        <OriginalsBadge bandId={bandId} withInfo />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ORIGINALS_INFO}</p>
      {editable ? (
        <div className="mt-4 grid gap-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={repertoire.originalsOnly}
              onChange={(event) =>
                save({
                  originalsOnly: event.target.checked,
                  rightsAttested: event.target.checked ? repertoire.rightsAttested : false,
                })
              }
            />
            All original music, no covers
          </label>
          {repertoire.originalsOnly ? (
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={repertoire.rightsAttested}
                onChange={(event) => save({ rightsAttested: event.target.checked })}
              />
              <span>
                We own or control the rights to this setlist.
                <span className="mt-1 block text-muted-foreground">
                  A sample attestation stored in this browser. It is not a license, a registration, or legal advice.
                </span>
              </span>
            </label>
          ) : (
            <label className="grid gap-1 text-sm font-medium">
              Covers we play
              <Textarea
                value={repertoire.coversNote}
                onChange={(event) => save({ coversNote: event.target.value })}
                placeholder="Name the covers, or leave this blank."
                className="min-h-20 font-normal"
              />
            </label>
          )}
        </div>
      ) : repertoire.originalsOnly ? (
        <p className="mt-3 text-sm">
          {repertoire.rightsAttested
            ? "This band says the set is all original and that they own or control the rights."
            : "This band says the set is all original. They have not attested the rights."}
        </p>
      ) : repertoire.coversNote ? (
        <p className={cn("mt-3 text-sm")}>
          <span className="font-medium">Covers we play. </span>
          {repertoire.coversNote}
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No originals flag and no covers note on this profile.</p>
      )}
    </section>
  );
}
