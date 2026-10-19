"use client";

import { toast } from "sonner";
import { bands, getMusician, musicians, venues } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RepertoirePanel } from "@/components/originals";
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
import Link from "next/link";

const roles: { id: Role; label: string; hint: string }[] = [
  { id: "band", label: "Band", hint: "Next gig, the route, and offers." },
  { id: "venue", label: "Venue", hint: "Holds at the room and open nights." },
  { id: "musician", label: "Musician", hint: "The board and a city to sleep in." },
];

export function PhoneYou() {
  const { snapshot, setRole, setBandId, setVenueId, setMusicianId, reset } = useApp();
  const name = roleLabel(snapshot.role, snapshot.bandId, snapshot.venueId, snapshot.musicianId);
  const musician = getMusician(snapshot.musicianId);

  return (
    <div className="grid gap-5 pb-2">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">You</p>
        <h1 className="mt-1 font-display text-4xl leading-none tracking-tight">{name}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          No login in this prototype. Switching only changes which nights and which buttons you see. It stays in this browser, shared with the desk.
        </p>
      </div>

      <div className="grid gap-2">
        {roles.map((role) => {
          const selected = snapshot.role === role.id;
          return (
            <button
              key={role.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setRole(role.id)}
              className={cn(
                "rounded-2xl border px-4 py-3 text-left",
                selected ? "border-rust bg-accent" : "bg-card",
              )}
            >
              <span className="block font-semibold">{role.label}</span>
              <span className="text-sm text-muted-foreground">{role.hint}</span>
            </button>
          );
        })}
      </div>

      {snapshot.role === "band" ? (
        <ProfileSelect
          label="Band"
          value={snapshot.bandId}
          onChange={setBandId}
          options={bands.map((band) => ({ id: band.id, label: `${band.name} · ${band.city}` }))}
        />
      ) : null}
      {snapshot.role === "band" ? <BandSamples bandId={snapshot.bandId} /> : null}
      {snapshot.role === "band" ? <RepertoirePanel bandId={snapshot.bandId} /> : null}
      {snapshot.role === "venue" ? (
        <ProfileSelect
          label="Venue"
          value={snapshot.venueId}
          onChange={setVenueId}
          options={venues.map((venue) => ({ id: venue.id, label: `${venue.name} · ${venue.city}` }))}
        />
      ) : null}
      {snapshot.role === "musician" ? (
        <ProfileSelect
          label="Musician"
          value={snapshot.musicianId}
          onChange={setMusicianId}
          options={musicians.map((player) => ({
            id: player.id,
            label: `${player.name} · ${player.instruments.join(", ")}`,
          }))}
        />
      ) : null}

      {snapshot.role === "musician" && musician ? (
        <p className="rounded-2xl bg-sand px-4 py-3 text-sm leading-relaxed">{musician.bio}</p>
      ) : null}

      <div className="grid gap-2">
        <Button asChild className="h-11">
          <Link href="/phone">Back to next up</Link>
        </Button>
        <Button asChild variant="outline" className="h-11">
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

      <section className="rounded-2xl border bg-card px-4 py-4">
        <h2 className="font-display text-2xl">Add it to the home screen</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          In the phone browser, use Add to Home Screen. It opens on this road view, full screen, with the same bookings as the desk. It is a web app, not a store download.
        </p>
      </section>
    </div>
  );
}

function ProfileSelect({
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
