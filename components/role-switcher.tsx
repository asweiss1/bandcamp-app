"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { profileDetail, profileName } from "@/lib/account";
import { bands, getBand, getMusician, getVenue, musicians, venues } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
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

export function roleLabel(role: Role, bandId: string, venueId: string, musicianId: string) {
  if (role === "band") return getBand(bandId)?.name ?? "Band";
  if (role === "venue") return getVenue(venueId)?.name ?? "Venue";
  return getMusician(musicianId)?.name ?? "Musician";
}

export function RoleSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const { snapshot, setRole, setBandId, setVenueId, setMusicianId, reset, activateProfile, exploreDemo } = useApp();
  const [open, setOpen] = useState(false);
  const [samplesOpen, setSamplesOpen] = useState(false);
  const name = roleLabel(snapshot.role, snapshot.bandId, snapshot.venueId, snapshot.musicianId);
  const demo = snapshot.account.demo;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={`max-w-[46vw] rounded-full border bg-card px-3 py-1.5 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:max-w-none ${className ?? ""}`}
        >
          <span className="block text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {demo ? "Sample profile" : snapshot.role}
          </span>
          <span className="block truncate text-sm font-semibold">{name}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{demo ? "Sample book" : "Your profiles"}</DialogTitle>
          <DialogDescription>
            {demo
              ? "These are seeded Southwest profiles for trying the flows. Your own profiles stay saved on this device."
              : "Switch profiles, edit this one, or add another. Everything stays in this browser."}
          </DialogDescription>
        </DialogHeader>
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
                className={cn("rounded-xl border px-3 py-3 text-left", selected ? "border-rust bg-accent" : "bg-card")}
              >
                <span className="block font-semibold">{profileName(profile)}</span>
                <span className="text-sm text-muted-foreground">{profileDetail(profile)}</span>
              </button>
            );
          })}
          {snapshot.account.profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No profile of your own yet.</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {!demo && snapshot.account.activeId ? (
            <Button asChild className="h-10">
              <Link href={`/start?edit=${snapshot.account.activeId}`} onClick={() => setOpen(false)}>
                Edit profile
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" className="h-10">
            <Link href="/start" onClick={() => setOpen(false)}>
              Add a profile
            </Link>
          </Button>
          {demo ? null : (
            <Button variant="outline" className="h-10" onClick={() => exploreDemo(snapshot.role)}>
              Explore demo data
            </Button>
          )}
        </div>
        {demo ? (
          <div className="grid gap-2">
            <button type="button" className="text-left text-sm font-semibold text-rust" onClick={() => setSamplesOpen((open) => !open)}>
              {samplesOpen ? "Hide sample profiles" : "Switch sample profile"}
            </button>
            {samplesOpen ? (
              <div className="grid gap-3">
                <div className="grid gap-2">
                  {(["band", "venue", "musician"] as Role[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      aria-pressed={snapshot.role === role}
                      onClick={() => setRole(role)}
                      className={cn("rounded-xl border px-3 py-2 text-left text-sm", snapshot.role === role ? "border-rust bg-accent" : "bg-card")}
                    >
                      {role === "band" ? "Band" : role === "venue" ? "Venue" : "Musician"}
                    </button>
                  ))}
                </div>
                {snapshot.role === "band" ? (
                  <ProfileSelect label="Sample band" value={snapshot.bandId} onChange={setBandId} options={bands.map((band) => ({ id: band.id, label: `${band.name} · ${band.city}` }))} />
                ) : null}
                {snapshot.role === "venue" ? (
                  <ProfileSelect label="Sample venue" value={snapshot.venueId} onChange={setVenueId} options={venues.map((venue) => ({ id: venue.id, label: `${venue.name} · ${venue.city}` }))} />
                ) : null}
                {snapshot.role === "musician" ? (
                  <ProfileSelect label="Sample musician" value={snapshot.musicianId} onChange={setMusicianId} options={musicians.map((musician) => ({ id: musician.id, label: `${musician.name} · ${musician.instruments.join(", ")}` }))} />
                ) : null}
              </div>
            ) : null}
          </div>
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
