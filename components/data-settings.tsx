"use client";

import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { buildBackup, parseBackup, type PlaceBackup } from "@/lib/backup";
import { OUTBOX_EVENT, readOutbox, writeOutbox } from "@/lib/outbox";
import { usePlace } from "@/lib/place";
import { initialSnapshot } from "@/lib/seed";
import { useApp } from "@/lib/store";
import type { TourPlan } from "@/lib/planner";
import { Button } from "@/components/ui/button";
import { useOnline } from "@/components/offline-banner";

function subscribeOutbox(onChange: () => void) {
  window.addEventListener(OUTBOX_EVENT, onChange);
  return () => window.removeEventListener(OUTBOX_EVENT, onChange);
}

export function DataSettings() {
  const { snapshot, reset, importBackup } = useApp();
  const place = usePlace();
  const online = useOnline();
  const pending = useSyncExternalStore(subscribeOutbox, () => readOutbox().length, () => 0);

  function exportJson() {
    const placeBackup: PlaceBackup = {
      place: place.place,
      radiusMiles: place.radiusMiles,
      lodging: place.lodging,
      plan: place.plan,
    };
    const file = buildBackup({
      snapshot,
      place: placeBackup,
      outbox: readOutbox(),
      exportedAt: new Date().toISOString(),
    });
    const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bandcamp-backup.json";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Exported bandcamp-backup.json");
  }

  async function onImport(file: File | undefined) {
    if (!file) return;
    const parsed = parseBackup(await file.text(), initialSnapshot);
    if (!parsed.ok) {
      toast.error(parsed.error);
      return;
    }
    importBackup(parsed.data.snapshot);
    if (parsed.data.place) {
      place.hydrate({
        place: parsed.data.place.place,
        radiusMiles: parsed.data.place.radiusMiles,
        lodging: parsed.data.place.lodging,
        plan: (parsed.data.place.plan ?? null) as TourPlan | null,
      });
    }
    writeOutbox(parsed.data.outbox);
    toast.success("Imported your BandCamp backup.");
  }

  return (
    <section className="grid gap-3 rounded-2xl border bg-card p-4" aria-labelledby="data-settings-title">
      <div>
        <h2 id="data-settings-title" className="font-display text-2xl">
          This device
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {online
            ? "Bookings, the tour, and messages stay in this browser."
            : "Offline. Bookings and the tour already on this phone stay readable. New changes wait here and sync when Wi-Fi returns."}
        </p>
        {pending > 0 ? (
          <p className="mt-2 text-sm font-medium">
            {pending} {pending === 1 ? "change" : "changes"} will sync later.
          </p>
        ) : null}
      </div>
      <Button type="button" className="h-11" onClick={exportJson}>
        Export JSON
      </Button>
      <label className="grid gap-1.5 text-sm font-medium">
        Import JSON
        <input
          type="file"
          accept="application/json,.json"
          aria-label="Import JSON"
          className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-sand file:px-3 file:py-2 file:text-sm file:font-semibold"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            void onImport(file);
          }}
        />
      </label>
      <p className="text-xs leading-relaxed text-muted-foreground">
        The file holds profiles, dates, messages, and the saved tour. Audio samples stay in this browser.
      </p>
      <Button
        type="button"
        variant="outline"
        className="h-11"
        onClick={() => {
          reset();
          toast("Demo data reset");
        }}
      >
        Reset demo data
      </Button>
    </section>
  );
}
