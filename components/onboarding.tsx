"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GENRES, INSTRUMENTS, STYLE_TAGS } from "@/lib/catalog";
import { dealHeadline, defaultTerms, uid } from "@/lib/deal";
import { searchPlaces, type Place, type SavedPlace } from "@/lib/geo";
import { readPhoto } from "@/lib/photo";
import { repertoireFor } from "@/lib/repertoire";
import { useApp } from "@/lib/store";
import type { OpenDate, OwnedProfile, Role, Terms } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DealFields } from "@/components/deal-fields";
import { BandSamples } from "@/components/samples";
import { VehiclePanel } from "@/components/vehicles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ROLES: { id: Role; label: string; hint: string }[] = [
  { id: "band", label: "Band", hint: "Request dates, answer offers, and price the drive." },
  { id: "venue", label: "Venue", hint: "Post nights and send offers to bands." },
  { id: "musician", label: "Musician", hint: "Pick up fill-ins or look for a band." },
];

type DateDraft = {
  date: string;
  showTime: string;
  slot: OpenDate["slot"];
  age: OpenDate["age"];
  notes: string;
  saved: boolean;
};

type Draft = {
  id: string;
  role: Role | null;
  photo: string | null;
  name: string;
  place: SavedPlace | null;
  address: string;
  genres: string[];
  styles: string[];
  members: { name: string; role: string }[];
  bio: string;
  feeMin: string;
  feeMax: string;
  touring: boolean;
  availability: string;
  originalsOnly: boolean;
  coversNote: string;
  capacity: string;
  backline: string;
  terms: Terms;
  bookerName: string;
  bookerEmail: string;
  bookerPhone: string;
  dates: DateDraft[];
  instruments: string[];
  radiusMiles: number;
  seeks: ("fill-in" | "member")[];
  email: string;
};

function blankDraft(): Draft {
  return {
    id: uid("prf"),
    role: null,
    photo: null,
    name: "",
    place: null,
    address: "",
    genres: [],
    styles: [],
    members: [{ name: "", role: "" }],
    bio: "",
    feeMin: "",
    feeMax: "",
    touring: true,
    availability: "",
    originalsOnly: false,
    coversNote: "",
    capacity: "",
    backline: "",
    terms: defaultTerms(),
    bookerName: "",
    bookerEmail: "",
    bookerPhone: "",
    dates: [],
    instruments: [],
    radiusMiles: 50,
    seeks: [],
    email: "",
  };
}

function draftFrom(profile: OwnedProfile, snapshotDates: OpenDate[], originals: { originalsOnly: boolean; coversNote: string }): Draft {
  const base = blankDraft();
  base.id = profile.id;
  base.role = profile.role;
  if (profile.band) {
    const band = profile.band;
    base.name = band.name;
    base.photo = band.photo ?? null;
    base.place = band.lat != null && band.lng != null
      ? { id: band.citySlug, label: band.city, city: band.city.split(",")[0]?.trim() || band.city, state: band.city.split(",")[1]?.trim() || "", lat: band.lat, lng: band.lng, source: "search" }
      : null;
    base.genres = [...band.genres];
    base.styles = [...band.styles];
    base.members = band.members.length > 0 ? band.members.map((member) => ({ ...member })) : [{ name: "", role: "" }];
    base.bio = band.bio;
    base.feeMin = String(band.feeMin);
    base.feeMax = String(band.feeMax);
    base.touring = band.touring;
    base.availability = band.availability;
    base.originalsOnly = originals.originalsOnly;
    base.coversNote = originals.coversNote;
  }
  if (profile.venue) {
    const venue = profile.venue;
    base.name = venue.name;
    base.photo = venue.photo ?? null;
    base.address = venue.address ?? "";
    base.place = venue.lat != null && venue.lng != null
      ? { id: venue.citySlug, label: venue.city, city: venue.city.split(",")[0]?.trim() || venue.city, state: venue.city.split(",")[1]?.trim() || "", lat: venue.lat, lng: venue.lng, source: "search" }
      : null;
    base.genres = [...venue.genres];
    base.capacity = String(venue.capacity);
    base.backline = venue.backline;
    base.bio = venue.bio;
    base.bookerName = venue.bookerName;
    base.bookerEmail = venue.bookerEmail;
    base.bookerPhone = venue.bookerPhone;
    base.dates = snapshotDates
      .filter((date) => date.venueId === venue.id)
      .map((date) => ({ date: date.date, showTime: date.showTime, slot: date.slot, age: date.age, notes: date.notes, saved: true }));
  }
  if (profile.musician) {
    const musician = profile.musician;
    base.name = musician.name;
    base.photo = musician.photo ?? null;
    base.instruments = [...musician.instruments];
    base.styles = [...(musician.styles ?? musician.genres)];
    base.place = musician.lat != null && musician.lng != null
      ? { id: musician.citySlug, label: musician.city, city: musician.city.split(",")[0]?.trim() || musician.city, state: musician.city.split(",")[1]?.trim() || "", lat: musician.lat, lng: musician.lng, source: "search" }
      : null;
    base.radiusMiles = musician.radiusMiles ?? 50;
    base.seeks = [...(musician.seeks ?? [])];
    base.bio = musician.bio;
    base.availability = musician.availability;
    base.email = musician.email;
  }
  return base;
}

function stepsFor(role: Role | null, editing: boolean) {
  const roleStep = editing ? [] : ["role"];
  if (role === "venue") return [...roleStep, "identity", "room", "deal", "dates", "review"];
  if (role === "musician") return [...roleStep, "identity", "place", "work", "review"];
  if (role === "band") return [...roleStep, "identity", "sound", "people", "work", "originals", "vehicles", "samples", "review"];
  return ["role"];
}

function toProfile(draft: Draft): OwnedProfile | null {
  if (!draft.role || !draft.place) return null;
  const now = new Date().toISOString();
  const photo = draft.photo;
  const place = draft.place;
  if (draft.role === "band") {
    return {
      id: draft.id,
      role: "band",
      createdAt: now,
      updatedAt: now,
      venue: null,
      musician: null,
      band: {
        id: draft.id,
        name: draft.name.trim(),
        genres: draft.genres,
        styles: draft.styles,
        city: place.label,
        citySlug: place.id,
        lat: place.lat,
        lng: place.lng,
        touring: draft.touring,
        feeMin: Number(draft.feeMin),
        feeMax: Number(draft.feeMax),
        members: draft.members
          .map((member) => ({ name: member.name.trim(), role: member.role.trim() || "Member" }))
          .filter((member) => member.name.length > 1),
        links: [],
        availability: draft.availability.trim(),
        bio: draft.bio.trim(),
        draw: "Draw not listed yet",
        routeFrom: null,
        routeTo: null,
        routeCities: [],
        photo,
      },
    };
  }
  if (draft.role === "venue") {
    return {
      id: draft.id,
      role: "venue",
      createdAt: now,
      updatedAt: now,
      band: null,
      musician: null,
      venue: {
        id: draft.id,
        name: draft.name.trim(),
        city: place.label,
        citySlug: place.id,
        lat: place.lat,
        lng: place.lng,
        neighborhood: draft.address.trim() || place.city,
        capacity: Number(draft.capacity),
        genres: draft.genres,
        typicalDeal: dealHeadline(draft.terms),
        bookerName: draft.bookerName.trim(),
        bookerEmail: draft.bookerEmail.trim(),
        bookerPhone: draft.bookerPhone.trim(),
        bio: draft.bio.trim() || `${draft.name.trim()} books ${draft.genres.join(", ") || "live music"}.`,
        backline: draft.backline.trim() || "Ask the booker.",
        loadInNotes: draft.terms.loadIn ? `Load-in ${draft.terms.loadIn}` : "Load-in arranged with the booker.",
        address: draft.address.trim(),
        photo,
      },
    };
  }
  const seeks = draft.seeks;
  const preference = [
    seeks.includes("fill-in") ? "Available for fill-ins" : "",
    seeks.includes("member") ? "Open to joining a band" : "",
  ].filter(Boolean).join(". ");
  return {
    id: draft.id,
    role: "musician",
    createdAt: now,
    updatedAt: now,
    band: null,
    venue: null,
    musician: {
      id: draft.id,
      name: draft.name.trim(),
      instruments: draft.instruments,
      genres: draft.styles,
      styles: draft.styles,
      city: place.label,
      citySlug: place.id,
      lat: place.lat,
      lng: place.lng,
      bio: draft.bio.trim(),
      email: draft.email.trim(),
      availability: draft.availability.trim(),
      paidPreference: preference,
      radiusMiles: draft.radiusMiles,
      seeks,
      photo,
    },
  };
}

export function Onboarding({ surface }: { surface: "desk" | "phone" }) {
  const phone = surface === "phone";
  return (
    <div className={phone ? "min-h-dvh bg-ink md:grid md:place-items-center md:py-6" : "min-h-dvh bg-paper"}>
      <div
        className={
          phone
            ? "mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-paper md:h-[min(900px,calc(100dvh-3rem))] md:min-h-0 md:overflow-y-auto md:rounded-[2.2rem] md:shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
            : ""
        }
      >
        <div className={phone ? "px-4 py-6" : "mx-auto w-full max-w-xl px-4 py-10"}>
          <ProfileWizard surface={surface} welcome />
        </div>
      </div>
    </div>
  );
}

export function ProfileWizard({
  surface,
  welcome = false,
  profileId = null,
  onDone,
}: {
  surface: "desk" | "phone";
  welcome?: boolean;
  profileId?: string | null;
  onDone?: () => void;
}) {
  const router = useRouter();
  const { snapshot, saveProfile, exploreDemo } = useApp();
  const existing = useMemo(() => {
    if (profileId) return snapshot.account.profiles.find((profile) => profile.id === profileId) ?? null;
    if (welcome && snapshot.account.activeId) {
      return snapshot.account.profiles.find((profile) => profile.id === snapshot.account.activeId) ?? null;
    }
    return null;
  }, [profileId, welcome, snapshot.account.profiles, snapshot.account.activeId]);
  const [draft, setDraft] = useState<Draft>(() => {
    if (!existing) return blankDraft();
    const originals = repertoireFor(existing.id, snapshot.repertoires);
    return draftFrom(existing, snapshot.openDates, originals);
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const steps = stepsFor(draft.role, Boolean(profileId));
  const step = steps[Math.min(stepIndex, steps.length - 1)] ?? "role";

  function patch(partial: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...partial }));
    setError(null);
  }

  function problem(key: string) {
    if (key === "role") return draft.role ? null : "Choose band, venue, or musician.";
    if (key === "identity" && draft.role === "band") {
      if (draft.name.trim().length < 2) return "Enter the band name.";
      if (!draft.place) return "Search for a home town.";
      return null;
    }
    if (key === "identity" && draft.role === "venue") {
      if (draft.name.trim().length < 2) return "Enter the venue name.";
      if (draft.address.trim().length < 4) return "Enter the street address.";
      if (!draft.place) return "Search for the city.";
      return null;
    }
    if (key === "identity" && draft.role === "musician") {
      if (draft.name.trim().length < 2) return "Enter your name.";
      if (draft.instruments.length === 0) return "Add at least one instrument.";
      return null;
    }
    if (key === "sound") {
      if (draft.genres.length + draft.styles.length === 0) return "Pick at least one genre or style.";
      return null;
    }
    if (key === "people") {
      if (!draft.members.some((member) => member.name.trim().length > 1)) return "Add at least one member.";
      return null;
    }
    if (key === "work" && draft.role === "band") {
      const min = Number(draft.feeMin);
      const max = Number(draft.feeMax);
      if (!(min >= 0) || !(max >= min)) return "Enter a fee range, low to high.";
      if (draft.availability.trim().length < 2) return "Say when you can play.";
      return null;
    }
    if (key === "room") {
      if (!(Number(draft.capacity) > 0)) return "Enter the room capacity.";
      if (draft.genres.length === 0) return "Pick at least one genre you book.";
      return null;
    }
    if (key === "deal") {
      if (draft.bookerName.trim().length < 2) return "Enter the booker's name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.bookerEmail.trim())) return "Enter a booker email.";
      return null;
    }
    if (key === "place") {
      if (!draft.place) return "Search for your city.";
      return null;
    }
    if (key === "work" && draft.role === "musician") {
      if (draft.seeks.length === 0) return "Choose fill-ins, joining a band, or both.";
      if (draft.availability.trim().length < 2) return "Say when you are free.";
      return null;
    }
    if (key === "dates") {
      const open = draft.dates.find((date) => !date.saved && date.date && !/^\d{4}-\d{2}-\d{2}$/.test(date.date));
      if (open) return "Use a real date for each night.";
      return null;
    }
    return null;
  }

  function persist(finish: boolean) {
    const profile = toProfile(draft);
    if (!profile) {
      setError("Add a name and a city before saving.");
      return false;
    }
    const result = saveProfile(profile, {
      finish,
      originalsOnly: draft.originalsOnly,
      coversNote: draft.coversNote,
      openDates: finish
        ? draft.dates
            .filter((date) => !date.saved && date.date)
            .map((date) => ({
              date: date.date,
              showTime: date.showTime || "8:00pm",
              slot: date.slot,
              age: date.age,
              genres: draft.genres,
              notes: date.notes,
            }))
        : undefined,
    });
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    if (finish) {
      setDraft((current) => ({
        ...current,
        dates: current.dates.map((date) => ({ ...date, saved: true })),
      }));
    }
    return true;
  }

  function next() {
    const message = problem(step);
    if (message) {
      setError(message);
      return;
    }
    const upcoming = steps[stepIndex + 1];
    if (upcoming === "vehicles" || upcoming === "samples" || (draft.role === "musician" && upcoming === "work")) {
      if (!persist(false)) return;
    }
    if (step === "review") {
      if (!persist(true)) return;
      toast.success("Profile saved on this device.");
      if (onDone) onDone();
      else router.push(surface === "phone" ? "/phone" : "/dashboard");
      return;
    }
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  }

  function back() {
    setError(null);
    setStepIndex((index) => Math.max(0, index - 1));
  }

  const title =
    step === "role"
      ? "Who is this profile for?"
      : step === "identity"
        ? draft.role === "venue"
          ? "The room"
          : draft.role === "musician"
            ? "Your name"
            : "The band"
        : step === "sound"
          ? "Sound"
          : step === "people"
            ? "Who is on stage"
            : step === "work" && draft.role === "band"
              ? "Fees and the road"
              : step === "originals"
                ? "Originals"
                : step === "vehicles"
                  ? "The rig"
                  : step === "samples"
                    ? "Let them hear it"
                    : step === "room"
                      ? "What you book"
                      : step === "deal"
                        ? "The usual deal"
                        : step === "dates"
                          ? "Nights you can offer"
                          : step === "place"
                            ? "Where you play"
                            : step === "work"
                              ? "What you are looking for"
                              : "This is you";

  return (
    <div id="onboarding" className="grid gap-5">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">
          {profileId ? "Edit profile" : "Create a profile"} · {stepIndex + 1} of {steps.length}
        </p>
        <h1 className="mt-2 font-display text-4xl leading-none tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Saved in this browser for now. The same fields are ready for an account later.
        </p>
      </div>
      {step === "role" ? (
        <div className="grid gap-2">
          {ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              aria-pressed={draft.role === role.id}
              onClick={() => patch({ role: role.id })}
              className={cn(
                "rounded-2xl border px-4 py-4 text-left",
                draft.role === role.id ? "border-rust bg-accent" : "bg-card",
              )}
            >
              <span className="block font-semibold">{role.label}</span>
              <span className="text-sm text-muted-foreground">{role.hint}</span>
            </button>
          ))}
          {welcome ? (
            <Button type="button" variant="outline" className="h-11" onClick={() => exploreDemo("band")}>
              Explore demo data
            </Button>
          ) : null}
        </div>
      ) : null}
      {step === "identity" && draft.role === "band" ? (
        <div className="grid gap-3">
          <Field label="Band name">
            <Input className="h-11" value={draft.name} onChange={(event) => patch({ name: event.target.value })} />
          </Field>
          <PhotoField photo={draft.photo} onPhoto={(photo) => patch({ photo })} />
          <CitySearch place={draft.place} onPlace={(place) => patch({ place })} label="Home town" />
        </div>
      ) : null}
      {step === "identity" && draft.role === "venue" ? (
        <div className="grid gap-3">
          <Field label="Venue name">
            <Input className="h-11" value={draft.name} onChange={(event) => patch({ name: event.target.value })} />
          </Field>
          <PhotoField photo={draft.photo} onPhoto={(photo) => patch({ photo })} />
          <Field label="Street address">
            <Input className="h-11" value={draft.address} onChange={(event) => patch({ address: event.target.value })} />
          </Field>
          <CitySearch place={draft.place} onPlace={(place) => patch({ place })} label="City" />
        </div>
      ) : null}
      {step === "identity" && draft.role === "musician" ? (
        <div className="grid gap-3">
          <Field label="Your name">
            <Input className="h-11" value={draft.name} onChange={(event) => patch({ name: event.target.value })} />
          </Field>
          <PhotoField photo={draft.photo} onPhoto={(photo) => patch({ photo })} />
          <ChipGroup
            label="Instruments"
            options={INSTRUMENTS}
            selected={draft.instruments}
            onToggle={(value) => patch({ instruments: toggle(draft.instruments, value) })}
            onAdd={(value) => patch({ instruments: addTag(draft.instruments, value) })}
          />
        </div>
      ) : null}
      {step === "sound" ? (
        <div className="grid gap-4">
          <ChipGroup label="Genres" options={GENRES} selected={draft.genres} onToggle={(value) => patch({ genres: toggle(draft.genres, value) })} onAdd={(value) => patch({ genres: addTag(draft.genres, value) })} />
          <ChipGroup label="Style tags" options={STYLE_TAGS} selected={draft.styles} onToggle={(value) => patch({ styles: toggle(draft.styles, value) })} onAdd={(value) => patch({ styles: addTag(draft.styles, value) })} />
        </div>
      ) : null}
      {step === "people" ? (
        <div className="grid gap-3">
          {draft.members.map((member, index) => (
            <div key={index} className="grid gap-2 rounded-2xl border bg-card p-3 sm:grid-cols-2">
              <Field label="Name">
                <Input className="h-11" value={member.name} onChange={(event) => patch({ members: replaceAt(draft.members, index, { ...member, name: event.target.value }) })} />
              </Field>
              <Field label="Instrument">
                <Input className="h-11" value={member.role} onChange={(event) => patch({ members: replaceAt(draft.members, index, { ...member, role: event.target.value }) })} />
              </Field>
            </div>
          ))}
          <Button type="button" variant="outline" className="h-11" onClick={() => patch({ members: [...draft.members, { name: "", role: "" }] })}>
            Add a member
          </Button>
        </div>
      ) : null}
      {step === "work" && draft.role === "band" ? (
        <div className="grid gap-3">
          <Field label="Bio">
            <Textarea value={draft.bio} onChange={(event) => patch({ bio: event.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Fee from">
              <Input className="h-11" inputMode="numeric" value={draft.feeMin} onChange={(event) => patch({ feeMin: event.target.value })} />
            </Field>
            <Field label="Fee to">
              <Input className="h-11" inputMode="numeric" value={draft.feeMax} onChange={(event) => patch({ feeMax: event.target.value })} />
            </Field>
          </div>
          <div className="flex gap-2">
            <Chip on={draft.touring} onClick={() => patch({ touring: true })}>Touring</Chip>
            <Chip on={!draft.touring} onClick={() => patch({ touring: false })}>Local</Chip>
          </div>
          <Field label="Availability">
            <Input className="h-11" value={draft.availability} onChange={(event) => patch({ availability: event.target.value })} placeholder="Weekends in May, or home through June" />
          </Field>
        </div>
      ) : null}
      {step === "originals" ? (
        <div className="grid gap-3 rounded-2xl border bg-card p-4">
          <button type="button" aria-pressed={draft.originalsOnly} onClick={() => patch({ originalsOnly: !draft.originalsOnly })} className="text-left">
            <span className="block font-semibold">{draft.originalsOnly ? "Originals only" : "Originals and other songs"}</span>
            <span className="text-sm text-muted-foreground">Venues can filter for bands who play their own music. This is not legal advice about PROs.</span>
          </button>
          <Field label="Covers or other songs, if any">
            <Textarea value={draft.coversNote} onChange={(event) => patch({ coversNote: event.target.value })} />
          </Field>
        </div>
      ) : null}
      {step === "vehicles" ? <VehiclePanel bandId={draft.id} /> : null}
      {step === "samples" || (step === "work" && draft.role === "musician") ? (
        step === "samples" ? <BandSamples bandId={draft.id} /> : null
      ) : null}
      {step === "room" ? (
        <div className="grid gap-3">
          <Field label="Capacity">
            <Input className="h-11" inputMode="numeric" value={draft.capacity} onChange={(event) => patch({ capacity: event.target.value })} />
          </Field>
          <ChipGroup label="Genres booked" options={GENRES} selected={draft.genres} onToggle={(value) => patch({ genres: toggle(draft.genres, value) })} onAdd={(value) => patch({ genres: addTag(draft.genres, value) })} />
          <Field label="Backline">
            <Textarea value={draft.backline} onChange={(event) => patch({ backline: event.target.value })} placeholder="House drums, bass amp, two vocal mics" />
          </Field>
          <Field label="About the room">
            <Textarea value={draft.bio} onChange={(event) => patch({ bio: event.target.value })} />
          </Field>
        </div>
      ) : null}
      {step === "deal" ? (
        <div className="grid gap-3">
          <DealFields value={draft.terms} onChange={(terms) => patch({ terms })} />
          <Field label="Booker name">
            <Input className="h-11" value={draft.bookerName} onChange={(event) => patch({ bookerName: event.target.value })} />
          </Field>
          <Field label="Booker email">
            <Input className="h-11" value={draft.bookerEmail} onChange={(event) => patch({ bookerEmail: event.target.value })} />
          </Field>
          <Field label="Booker phone">
            <Input className="h-11" value={draft.bookerPhone} onChange={(event) => patch({ bookerPhone: event.target.value })} />
          </Field>
        </div>
      ) : null}
      {step === "dates" ? (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Add the nights you want bands to request. You can post more later.</p>
          {draft.dates.map((date, index) => (
            <div key={index} className="grid gap-2 rounded-2xl border bg-card p-3">
              <Field label="Date">
                <Input className="h-11" type="date" value={date.date} disabled={date.saved} onChange={(event) => patch({ dates: replaceAt(draft.dates, index, { ...date, date: event.target.value }) })} />
              </Field>
              <Field label="Show time">
                <Input className="h-11" value={date.showTime} disabled={date.saved} onChange={(event) => patch({ dates: replaceAt(draft.dates, index, { ...date, showTime: event.target.value }) })} />
              </Field>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() =>
              patch({
                dates: [...draft.dates, { date: "", showTime: "8:00pm", slot: "Headline", age: "21+", notes: "", saved: false }],
              })
            }
          >
            Add an open date
          </Button>
        </div>
      ) : null}
      {step === "place" ? (
        <div className="grid gap-3">
          <CitySearch place={draft.place} onPlace={(place) => patch({ place })} label="Home city" />
          <ChipGroup
            label="Styles"
            options={STYLE_TAGS}
            selected={draft.styles}
            onToggle={(value) => patch({ styles: toggle(draft.styles, value) })}
            onAdd={(value) => patch({ styles: addTag(draft.styles, value) })}
          />
          <Field label="Willing to travel (miles)">
            <Input className="h-11" inputMode="numeric" value={String(draft.radiusMiles)} onChange={(event) => patch({ radiusMiles: Number(event.target.value) || 0 })} />
          </Field>
        </div>
      ) : null}
      {step === "work" && draft.role === "musician" ? (
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            <Chip on={draft.seeks.includes("fill-in")} onClick={() => patch({ seeks: toggle(draft.seeks, "fill-in") })}>Fill-ins</Chip>
            <Chip on={draft.seeks.includes("member")} onClick={() => patch({ seeks: toggle(draft.seeks, "member") })}>Joining a band</Chip>
          </div>
          <Field label="Availability">
            <Input className="h-11" value={draft.availability} onChange={(event) => patch({ availability: event.target.value })} />
          </Field>
          <Field label="Contact email">
            <Input className="h-11" value={draft.email} onChange={(event) => patch({ email: event.target.value })} />
          </Field>
          <Field label="Short bio">
            <Textarea value={draft.bio} onChange={(event) => patch({ bio: event.target.value })} />
          </Field>
          <BandSamples bandId={draft.id} />
        </div>
      ) : null}
      {step === "review" ? <Review draft={draft} /> : null}
      {error ? <p className="text-sm text-rust">{error}</p> : null}
      <div className="flex gap-2">
        {stepIndex > 0 ? (
          <Button type="button" variant="outline" className="h-11" onClick={back}>
            Back
          </Button>
        ) : null}
        <Button type="button" className="h-11" onClick={next}>
          {step === "review" ? "Save profile" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

function Review({ draft }: { draft: Draft }) {
  const place = draft.place?.label ?? "No city yet";
  return (
    <div className="grid gap-2 rounded-2xl border bg-card p-4 text-sm">
      {draft.photo ? <img src={draft.photo} alt="" className="size-20 rounded-2xl object-cover" /> : null}
      <p className="font-display text-3xl">{draft.name || "Untitled"}</p>
      <p className="text-muted-foreground">{place}</p>
      {draft.role === "band" ? (
        <p>
          {draft.touring ? "Touring" : "Local"} · ${draft.feeMin || "0"}–${draft.feeMax || "0"} · {draft.genres.concat(draft.styles).join(", ") || "No tags yet"}
        </p>
      ) : null}
      {draft.role === "venue" ? <p>{draft.capacity || "0"} capacity · {draft.genres.join(", ") || "No genres yet"}</p> : null}
      {draft.role === "musician" ? <p>{draft.instruments.join(", ") || "No instruments yet"} · {draft.radiusMiles} miles</p> : null}
      {draft.bio ? <p>{draft.bio}</p> : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={cn("h-10 rounded-full px-3 text-sm font-medium", on ? "bg-ink text-cream" : "bg-sand")}>
      {children}
    </button>
  );
}

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
  onAdd,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  onAdd: (value: string) => void;
}) {
  const [custom, setCustom] = useState("");
  const extras = selected.filter((item) => !options.includes(item));
  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Chip key={option} on={selected.includes(option)} onClick={() => onToggle(option)}>
            {option}
          </Chip>
        ))}
        {extras.map((option) => (
          <Chip key={option} on onClick={() => onToggle(option)}>
            {option}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          className="h-11"
          value={custom}
          placeholder="Add your own"
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAdd(custom);
              setCustom("");
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={() => {
            onAdd(custom);
            setCustom("");
          }}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

function PhotoField({ photo, onPhoto }: { photo: string | null; onPhoto: (photo: string | null) => void }) {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">Photo</p>
      <div className="flex items-center gap-3">
        {photo ? <img src={photo} alt="" className="size-16 rounded-2xl object-cover" /> : <div className="grid size-16 place-items-center rounded-2xl bg-sand text-xs text-muted-foreground">None</div>}
        <label className="text-sm font-semibold text-rust">
          Choose a photo
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              readPhoto(file).then(onPhoto).catch((reason: Error) => toast.error(reason.message));
            }}
          />
        </label>
      </div>
    </div>
  );
}

function CitySearch({
  place,
  onPlace,
  label,
}: {
  place: SavedPlace | null;
  onPlace: (place: SavedPlace) => void;
  label: string;
}) {
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<Place[]>([]);
  const local = query.trim().length >= 2 ? searchPlaces(query) : [];
  const results = [...local];
  for (const item of remote) {
    if (results.some((known) => known.label.toLowerCase() === item.label.toLowerCase())) continue;
    results.push(item);
  }

  function search(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setRemote([]);
      return;
    }
    window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/places?q=${encodeURIComponent(value.trim())}`);
        const data = (await response.json()) as { places?: Place[] };
        setRemote(data.places ?? []);
      } catch {
        setRemote([]);
      }
    }, 500);
  }

  return (
    <div>
      <Field label={place ? `${label} · ${place.label}` : label}>
        <Input className="h-11" value={query} placeholder="Type a US city" onChange={(event) => search(event.target.value)} />
      </Field>
      {results.length > 0 ? (
        <ul className="mt-1 grid gap-1">
          {results.slice(0, 6).map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-sand"
                onClick={() => {
                  onPlace({ ...item, source: "search" });
                  setQuery("");
                  setRemote([]);
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function toggle<T extends string>(list: T[], value: T) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function addTag(list: string[], value: string) {
  const next = value.trim();
  if (next.length < 2 || list.some((item) => item.toLowerCase() === next.toLowerCase())) return list;
  return [...list, next];
}

function replaceAt<T>(list: T[], index: number, value: T) {
  return list.map((item, itemIndex) => (itemIndex === index ? value : item));
}
