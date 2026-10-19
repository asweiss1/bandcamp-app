"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { bands, getBand, getMusician, getVenue, musicians, venues } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import type { Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const roles: { id: Role; label: string; hint: string }[] = [
  { id: "band", label: "Band", hint: "Request dates, answer offers, plan the route." },
  { id: "venue", label: "Venue", hint: "Post open dates and send or answer offers." },
  { id: "musician", label: "Musician", hint: "Browse the board and raise a hand." },
];

export function roleLabel(role: Role, bandId: string, venueId: string, musicianId: string) {
  if (role === "band") return getBand(bandId)?.name ?? "Band";
  if (role === "venue") return getVenue(venueId)?.name ?? "Venue";
  return getMusician(musicianId)?.name ?? "Musician";
}

export function RoleSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const { snapshot, setRole, setBandId, setVenueId, setMusicianId, reset } = useApp();
  const [open, setOpen] = useState(false);
  const name = roleLabel(snapshot.role, snapshot.bandId, snapshot.venueId, snapshot.musicianId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={`max-w-[46vw] rounded-full border bg-card px-3 py-1.5 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:max-w-none ${className ?? ""}`}
        >
          <span className="block text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            View as {snapshot.role}
          </span>
          <span className="block truncate text-sm font-semibold">{name}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Who are you tonight?</DialogTitle>
          <DialogDescription>
            There is no login in this prototype. Switching roles only changes which desk and
            which actions you see. Everything is saved in this browser.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {roles.map((role) => {
            const selected = snapshot.role === role.id;
            return (
              <button
                key={role.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setRole(role.id)}
                className={`rounded-xl border px-3 py-3 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${selected ? "border-rust bg-accent" : "bg-card hover:bg-sand"}`}
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
        {snapshot.role === "venue" ? (
          <ProfileSelect
            label="Venue"
            value={snapshot.venueId}
            onChange={setVenueId}
            options={venues.map((venue) => ({
              id: venue.id,
              label: `${venue.name} · ${venue.city}`,
            }))}
          />
        ) : null}
        {snapshot.role === "musician" ? (
          <ProfileSelect
            label="Musician"
            value={snapshot.musicianId}
            onChange={setMusicianId}
            options={musicians.map((musician) => ({
              id: musician.id,
              label: `${musician.name} · ${musician.instruments.join(", ")}`,
            }))}
          />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            className="h-10"
            onClick={() => {
              setOpen(false);
              router.push("/dashboard");
            }}
          >
            Open this desk
          </Button>
          <Button
            variant="outline"
            className="h-10"
            onClick={() => {
              reset();
              toast("Demo data reset");
            }}
          >
            Reset demo data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
        <SelectTrigger className="h-10 w-full">
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
