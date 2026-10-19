"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { profileDetail, profileName } from "@/lib/account";
import { bands, getMusician, musicians, venues } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProfileWizard } from "@/components/onboarding";
import { RepertoirePanel } from "@/components/originals";
import { VehiclePanel } from "@/components/vehicles";
import { BandSamples } from "@/components/samples";
import { roleLabel } from "@/components/role-switcher";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PhoneYou() {
  const { snapshot, setRole, setBandId, setVenueId, setMusicianId, reset, activateProfile, exploreDemo } = useApp();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [samplesOpen, setSamplesOpen] = useState(false);
  const name = roleLabel(snapshot.role, snapshot.bandId, snapshot.venueId, snapshot.musicianId);
  const musician = getMusician(snapshot.musicianId);
  const demo = snapshot.account.demo;

  if (adding || editing) {
    return (
      <ProfileWizard
        surface="phone"
        profileId={editing ? snapshot.account.activeId : null}
        onDone={() => {
          setAdding(false);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <div className="grid gap-5 pb-2">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">You</p>
        <h1 className="mt-1 font-display text-4xl leading-none tracking-tight">{name}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {demo
            ? "You are exploring sample profiles. Create your own any time. It stays in this browser, shared with the desk."
            : "This profile stays in this browser, shared with the desk, until accounts exist."}
        </p>
      </div>

      <div className="grid gap-2">
        {snapshot.account.profiles.map((profile) => {
          const selected = !demo && snapshot.account.activeId === profile.id;
          return (
            <button
              key={profile.id}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                const result = activateProfile(profile.id);
                if (!result.ok) toast.error(result.error);
              }}
              className={cn("rounded-2xl border px-4 py-3 text-left", selected ? "border-rust bg-accent" : "bg-card")}
            >
              <span className="block font-semibold">{profileName(profile)}</span>
              <span className="text-sm text-muted-foreground">{profileDetail(profile)}</span>
            </button>
          );
        })}
      </div>

      {!demo && snapshot.role === "band" ? <BandSamples bandId={snapshot.bandId} /> : null}
      {!demo && snapshot.role === "band" ? <RepertoirePanel bandId={snapshot.bandId} /> : null}
      {!demo && snapshot.role === "band" ? <VehiclePanel bandId={snapshot.bandId} /> : null}
      {!demo && snapshot.role === "musician" && musician ? (
        <div className="grid gap-3">
          <p className="rounded-2xl bg-sand px-4 py-3 text-sm leading-relaxed">{musician.bio}</p>
          <BandSamples bandId={snapshot.musicianId} />
        </div>
      ) : null}

      <div className="grid gap-2">
        {!demo && snapshot.account.activeId ? (
          <Button className="h-11" onClick={() => setEditing(true)}>
            Edit profile
          </Button>
        ) : null}
        <Button variant="outline" className="h-11" onClick={() => setAdding(true)}>
          Add a profile
        </Button>
        {demo ? (
          <Button variant="outline" className="h-11" onClick={() => setSamplesOpen((open) => !open)}>
            {samplesOpen ? "Hide sample profiles" : "Switch sample profile"}
          </Button>
        ) : (
          <Button variant="outline" className="h-11" onClick={() => exploreDemo("band")}>
            Explore demo data
          </Button>
        )}
        <Button asChild variant="ghost" className="h-11">
          <Link href="/dashboard">Open the full desk</Link>
        </Button>
        <Button
          variant="ghost"
          className="h-11"
          onClick={() => {
            reset();
            toast("Demo data reset");
          }}
        >
          Reset demo data
        </Button>
      </div>

      {demo && samplesOpen ? (
        <div className="grid gap-3 rounded-2xl border bg-card p-3">
          <p className="text-sm text-muted-foreground">Seeded profiles for trying booking, the route, and the board.</p>
          {(["band", "venue", "musician"] as Role[]).map((role) => (
            <button
              key={role}
              type="button"
              aria-pressed={snapshot.role === role}
              onClick={() => setRole(role)}
              className={cn("rounded-xl border px-3 py-2 text-left text-sm", snapshot.role === role ? "border-rust bg-accent" : "bg-sand")}
            >
              {role === "band" ? "Band" : role === "venue" ? "Venue" : "Musician"}
            </button>
          ))}
          {snapshot.role === "band" ? (
            <SampleSelect label="Sample band" value={snapshot.bandId} onChange={setBandId} options={bands.map((band) => ({ id: band.id, label: band.name }))} />
          ) : null}
          {snapshot.role === "venue" ? (
            <SampleSelect label="Sample venue" value={snapshot.venueId} onChange={setVenueId} options={venues.map((venue) => ({ id: venue.id, label: venue.name }))} />
          ) : null}
          {snapshot.role === "musician" ? (
            <SampleSelect label="Sample musician" value={snapshot.musicianId} onChange={setMusicianId} options={musicians.map((player) => ({ id: player.id, label: player.name }))} />
          ) : null}
        </div>
      ) : null}

      <section className="rounded-2xl border bg-card px-4 py-4">
        <h2 className="font-display text-2xl">Add it to the home screen</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          In the phone browser, use Add to Home Screen. It opens on this road view, full screen, with the same bookings as the desk. It is a web app, not a store download.
        </p>
      </section>
    </div>
  );
}

function SampleSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
