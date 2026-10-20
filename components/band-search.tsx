"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AUDIO_EVENT, listAllTracks } from "@/lib/audio-db";
import { findBands, type TrackTitle } from "@/lib/band-search";
import { getVenue, listBands, STYLE_TAGS } from "@/lib/catalog";
import { dateFill } from "@/lib/queries";
import { combinedDraw, splitPreset, type SplitKind } from "@/lib/full-night";
import { todayIso } from "@/lib/fans";
import { fanMailOpen, isBlocked } from "@/lib/inbox";
import { mediaFor } from "@/lib/media";
import { usePlace } from "@/lib/place";
import { useApp } from "@/lib/store";
import type { Band, MusicKind } from "@/lib/types";
import type { SavedPlace } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { TuneInButton } from "@/components/band-links";
import { HometownField } from "@/components/hometown-field";
import { OfferDialog } from "@/components/offer-dialog";
import { BandMarks, MusicFilter, SizeFilter } from "@/components/originals";
import { pitchHref } from "@/components/pitch-room";
import { SamplePlay } from "@/components/samples";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RADII = [25, 50, 100, 150, 300];

export function BandSearch({ surface }: { surface: "desk" | "phone" }) {
  const { snapshot, openDirectThread, sendFanMail, startPitch, saveBill } = useApp();
  const router = useRouter();
  const here = usePlace();
  const [name, setName] = useState("");
  const [styles, setStyles] = useState<string[]>([]);
  const [styleText, setStyleText] = useState("");
  const [origin, setOrigin] = useState<SavedPlace | null>(null);
  const [radius, setRadius] = useState(150);
  const [music, setMusic] = useState<"any" | MusicKind>("any");
  const [sizeMin, setSizeMin] = useState<number | null>(null);
  const [sizeMax, setSizeMax] = useState<number | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [hasSamples, setHasSamples] = useState(false);
  const [availableOn, setAvailableOn] = useState("");
  const [sort, setSort] = useState<"distance" | "rating" | "active">("distance");
  const [uploads, setUploads] = useState<TrackTitle[]>([]);
  const [offer, setOffer] = useState<Band | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [inviteFor, setInviteFor] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    const load = () => {
      listAllTracks()
        .then((rows) => {
          if (!cancel) setUploads(rows.map((row) => ({ bandId: row.bandId, title: row.title })));
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
  }, []);

  const rows = useMemo(
    () =>
      findBands(listBands(), snapshot, uploads, {
        name,
        styles,
        styleText,
        origin,
        radius,
        sizeMin,
        sizeMax,
        music,
        verified: verifiedOnly,
        hasSamples,
        availableOn,
        sort,
        excludeId: snapshot.role === "band" ? snapshot.bandId : undefined,
      }),
    [snapshot, uploads, name, styles, styleText, origin, radius, sizeMin, sizeMax, music, verifiedOnly, hasSamples, availableOn, sort],
  );

  function toggleStyle(value: string) {
    setStyles(styles.includes(value) ? styles.filter((item) => item !== value) : [...styles, value]);
  }

  function message(bandId: string) {
    if (snapshot.role === "fan") {
      setNoteFor(bandId);
      setNote("");
      return;
    }
    const result = openDirectThread(bandId, "band");
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    router.push(surface === "phone" ? `/phone/inbox/${result.data}` : `/inbox/${result.data}`);
  }

  function sendNote(event: React.FormEvent) {
    event.preventDefault();
    if (!noteFor) return;
    const result = sendFanMail(noteFor, null, note);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setNoteFor(null);
    setNote("");
    toast("Message sent");
    router.push(surface === "phone" ? `/phone/inbox/${result.data}` : `/inbox/${result.data}`);
  }

  const profileHref = (id: string) => (surface === "phone" ? `/phone/bands/${id}` : `/bands/${id}`);

  return (
    <div id="find-bands" className="grid gap-4">
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Name</span>
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Band name" className="h-11" />
      </label>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <HometownField key={origin?.id ?? "anywhere"} label="City" place={origin} onPlace={setOrigin} placeholder="City, ST" />
        <Button type="button" variant="outline" className="h-10" onClick={() => setOrigin(here.place)}>
          Near me
        </Button>
        <Button type="button" variant="outline" className="h-10" onClick={() => setOrigin(null)}>
          Anywhere
        </Button>
      </div>
      <label className="grid max-w-xs gap-1 text-sm">
        <span className="font-medium">Radius</span>
        <Select value={String(radius)} onValueChange={(value) => setRadius(Number(value))}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RADII.map((miles) => (
              <SelectItem key={miles} value={String(miles)}>
                {miles} miles
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <div className="grid gap-1.5">
        <p className="text-sm font-medium">Genre and style</p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {STYLE_TAGS.map((option) => {
            const on = styles.includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={on}
                onClick={() => toggleStyle(option)}
                className={cn("shrink-0 rounded-full border px-3 py-1 text-xs font-semibold", on ? "border-ink bg-ink text-cream" : "bg-card")}
              >
                {option}
              </button>
            );
          })}
        </div>
        <Input
          value={styleText}
          onChange={(event) => setStyleText(event.target.value)}
          placeholder="Or type a style"
          className="h-10"
        />
      </div>
      <MusicFilter value={music} onChange={setMusic} />
      <SizeFilter
        min={sizeMin}
        max={sizeMax}
        onChange={(min, max) => {
          setSizeMin(min);
          setSizeMax(max);
        }}
      />
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={verifiedOnly} onChange={(event) => setVerifiedOnly(event.target.checked)} />
          Verified
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={hasSamples} onChange={(event) => setHasSamples(event.target.checked)} />
          Has samples
        </label>
      </div>
      <label className="grid max-w-xs gap-1 text-sm">
        <span className="font-medium">Available on</span>
        <Input type="date" value={availableOn} onChange={(event) => setAvailableOn(event.target.value)} className="h-10" />
      </label>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["distance", "Distance"],
            ["rating", "Rating"],
            ["active", "Recently active"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={sort === id}
            onClick={() => setSort(id)}
            className={cn("h-9 rounded-full px-3 text-sm font-medium", sort === id ? "bg-ink text-cream" : "bg-sand")}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {rows.length} {rows.length === 1 ? "band" : "bands"}
        {origin ? ` within ${radius} miles of ${origin.city}` : ""}. Distance is from hometown.
      </p>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
          No band matches that search. Clear a style, pick Anywhere, or widen the radius.
        </p>
      ) : (
        <div className={cn("grid gap-3", surface === "desk" && "sm:grid-cols-2")}>
          {rows.map((row) => (
            <BandCard
              key={row.band.id}
              row={row}
              surface={surface}
              profileHref={profileHref(row.band.id)}
              noting={noteFor === row.band.id}
              inviting={inviteFor === row.band.id}
              note={note}
              onNote={setNote}
              onMessage={() => message(row.band.id)}
              onCancelNote={() => setNoteFor(null)}
              onSendNote={sendNote}
              onOffer={() => setOffer(row.band)}
              onInvite={() => setInviteFor(inviteFor === row.band.id ? null : row.band.id)}
              onPitch={(openDateId) => {
                const result = startPitch(openDateId, [row.band.id], "headliner" satisfies SplitKind);
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                router.push(pitchHref(result.data, surface));
              }}
              onBill={(billId) => {
                const bill = snapshot.bills.find((item) => item.id === billId);
                if (!bill) return;
                const lineup = [
                  ...bill.members,
                  { bandId: row.band.id, role: "Opener" as const, setTime: "7:00pm", splitPercent: 10 },
                ];
                const splits = splitPreset(lineup.length, "headliner");
                if (!splits) {
                  toast.error("That bill is already full.");
                  return;
                }
                const result = saveBill({
                  id: bill.id,
                  name: bill.name,
                  members: lineup.map((member, index) => ({ ...member, splitPercent: splits[index] ?? member.splitPercent })),
                });
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast("Added to the bill");
                router.push(surface === "phone" ? `/phone/book/bills/${bill.id}` : `/bills/${bill.id}`);
              }}
            />
          ))}
        </div>
      )}
      <ReadyBills surface={surface} />
      <OfferDialog
        band={offer}
        open={Boolean(offer)}
        onOpenChange={(next) => {
          if (!next) setOffer(null);
        }}
        bookingHref={(id) => (surface === "phone" ? `/phone/gig/${id}` : `/bookings/${id}`)}
        postHref={surface === "phone" ? "/phone/book/new" : "/dates/new"}
      />
    </div>
  );
}

function BandCard({
  row,
  surface,
  profileHref,
  noting,
  inviting,
  note,
  onNote,
  onMessage,
  onCancelNote,
  onSendNote,
  onOffer,
  onInvite,
  onPitch,
  onBill,
}: {
  row: ReturnType<typeof findBands>[number];
  surface: "desk" | "phone";
  profileHref: string;
  noting: boolean;
  inviting: boolean;
  note: string;
  onNote: (value: string) => void;
  onMessage: () => void;
  onCancelNote: () => void;
  onSendNote: (event: React.FormEvent) => void;
  onOffer: () => void;
  onInvite: () => void;
  onPitch: (openDateId: string) => void;
  onBill: (billId: string) => void;
}) {
  const { snapshot } = useApp();
  const band = row.band;
  const media = mediaFor(band.id, snapshot.media);
  const image = media.logo || media.photos[0]?.src || band.photo || "";
  const closed = snapshot.role === "fan" && !fanMailOpen(snapshot.fanMail, band.id);
  const blocked = snapshot.role === "fan" && isBlocked(snapshot.fanBlocks, band.id, snapshot.fanId);
  const today = todayIso();
  const dates =
    snapshot.role === "band"
      ? snapshot.openDates.filter((date) => date.date >= today && dateFill(date.id, snapshot.bookings) !== "filled").slice(0, 6)
      : [];
  const bills =
    snapshot.role === "band"
      ? snapshot.bills.filter((bill) => {
          if (bill.leadBandId !== snapshot.bandId) return false;
          if (bill.members.some((member) => member.bandId === band.id)) return false;
          if (bill.members.length >= 4) return false;
          const booking = bill.bookingId ? snapshot.bookings.find((item) => item.id === bill.bookingId) : undefined;
          return !booking || booking.status !== "accepted";
        })
      : [];

  return (
    <article className="rounded-2xl border bg-card p-4">
      <div className="flex items-start gap-3">
        {image ? (
          <img src={image} alt="" className="size-16 shrink-0 rounded-2xl object-cover" />
        ) : (
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-ink font-display text-xl text-amber">
            {band.name.slice(0, 1)}
          </span>
        )}
        <div className="min-w-0">
          <Link href={profileHref} className="font-display text-2xl leading-none hover:text-rust">
            {band.name}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            {band.city}
            {row.miles != null ? ` · ${row.miles} mi` : ""}
          </p>
          {row.verified ? (
            <p className="mt-1 text-xs font-semibold tracking-wide text-pine uppercase">Verified</p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {band.genres.map((genre) => (
          <span key={genre} className="rounded-full bg-sand px-2 py-1 text-[11px] font-medium">
            {genre}
          </span>
        ))}
        <BandMarks bandId={band.id} />
      </div>
      <p className="mt-2 text-sm font-medium">{row.ratingLabel}</p>
      <div className="mt-2">
        <SamplePlay bandId={band.id} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {closed ? <p className="text-sm">This band isn&apos;t taking fan mail.</p> : null}
        {blocked ? <p className="text-sm">You can&apos;t message this band.</p> : null}
        {!closed && !blocked ? (
          <Button type="button" className="h-10" onClick={onMessage}>
            Message
          </Button>
        ) : null}
        <TuneInButton bandId={band.id} />
        {snapshot.role === "band" ? (
          <Button type="button" variant="outline" className="h-10" onClick={onInvite}>
            Invite to a night
          </Button>
        ) : null}
        {snapshot.role === "venue" ? (
          <Button type="button" className="h-10" onClick={onOffer}>
            Make offer
          </Button>
        ) : null}
      </div>
      {noting ? (
        <form onSubmit={onSendNote} className="mt-3 grid gap-2">
          <Textarea value={note} onChange={(event) => onNote(event.target.value)} placeholder="A short note" className="min-h-20" />
          <p className="text-xs text-muted-foreground">Your email and phone stay private.</p>
          <div className="flex gap-2">
            <Button type="submit" className="h-10">
              Send
            </Button>
            <Button type="button" variant="outline" className="h-10" onClick={onCancelNote}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
      {inviting ? (
        <div className="mt-3 grid gap-2 rounded-xl bg-sand/70 p-3">
          {dates.length > 0 ? (
            <div className="grid gap-1">
              <p className="text-sm font-medium">Invite onto a date</p>
              {dates.map((date) => {
                const venue = getVenue(date.venueId);
                return (
                  <button
                    key={date.id}
                    type="button"
                    className="rounded-lg bg-card px-3 py-2 text-left text-sm hover:border-rust"
                    onClick={() => onPitch(date.id)}
                  >
                    {date.date} · {venue?.name ?? "Room"} · {date.showTime}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm">
              No open date to invite them onto.{" "}
              <Link href={surface === "phone" ? "/phone/book" : "/book"} className="font-semibold text-rust">
                Book a gig
              </Link>
            </p>
          )}
          {bills.length > 0 ? (
            <div className="grid gap-1">
              <p className="text-sm font-medium">Add to a bill</p>
              {bills.map((bill) => (
                <button
                  key={bill.id}
                  type="button"
                  className="rounded-lg bg-card px-3 py-2 text-left text-sm"
                  onClick={() => onBill(bill.id)}
                >
                  {bill.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm">
              <Link href={surface === "phone" ? "/phone/book/bills/new" : "/bills/new"} className="font-semibold text-rust">
                Start a bill
              </Link>{" "}
              and add them as an opener.
            </p>
          )}
        </div>
      ) : null}
    </article>
  );
}

function ReadyBills({ surface }: { surface: "desk" | "phone" }) {
  const { snapshot } = useApp();
  const rows = [...snapshot.bills].sort((a, b) => Number(Boolean(a.bookingId)) - Number(Boolean(b.bookingId)));
  if (rows.length === 0) return null;
  return (
    <section id="ready-bills" className="grid gap-3">
      <div>
        <h2 className="font-display text-3xl tracking-tight">Ready-made bills</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          One offer fills a small bar&apos;s whole night. These packages already have a headliner, openers, and a pay split.
        </p>
      </div>
      <div className={cn("grid gap-3", surface === "desk" && "sm:grid-cols-2")}>
        {rows.map((bill) => {
          const booking = bill.bookingId ? snapshot.bookings.find((item) => item.id === bill.bookingId) : undefined;
          const active = Boolean(booking && booking.status !== "declined");
          const bands = bill.members.map((member) => listBands().find((item) => item.id === member.bandId)).filter((band) => Boolean(band));
          const total = combinedDraw(bands.map((band) => ({ draw: band?.draw ?? "" })));
          const href = surface === "phone" ? `/phone/book/bills/${bill.id}` : `/bills/${bill.id}`;
          return (
            <Link key={bill.id} href={href} className="rounded-2xl border bg-card p-4 hover:border-rust/40">
              <h3 className="font-display text-2xl">{bill.name}</h3>
              <p className="mt-2 text-sm">
                {bill.members
                  .map((member) => `${listBands().find((item) => item.id === member.bandId)?.name ?? "Band"} ${member.splitPercent}%`)
                  .join(" · ")}
              </p>
              {total > 0 ? <p className="mt-2 text-sm font-medium">Typical draw about {total.toLocaleString()}</p> : null}
              <p className="mt-2 text-sm text-muted-foreground">{active ? "This package already has a conversation." : "Open it and send one offer."}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
