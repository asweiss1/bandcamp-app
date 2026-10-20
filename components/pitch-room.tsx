"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getBand, getVenue, listBands } from "@/lib/catalog";
import { formatDay, formatDayLong, money } from "@/lib/deal";
import { slotLine } from "@/lib/daypart";
import { combinedDraw, splitPreset, suggestPartners, type SplitKind } from "@/lib/full-night";
import { sendBlock, trustGlance } from "@/lib/pitch";
import { MUSIC_LABEL, repertoireFor } from "@/lib/repertoire";
import { sizeLabel } from "@/lib/size";
import { useApp } from "@/lib/store";
import type { Band, Pitch } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SamplePlay } from "@/components/samples";
import { PageFrame } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function nightHref(id: string, surface: "desk" | "phone") {
  return surface === "phone" ? `/phone/book/${id}/night` : `/dates/${id}/night`;
}

export function pitchHref(id: string, surface: "desk" | "phone") {
  return surface === "phone" ? `/phone/book/pitch/${id}` : `/pitch/${id}`;
}

function dateHref(id: string, surface: "desk" | "phone") {
  return surface === "phone" ? `/phone/book/${id}` : `/dates/${id}`;
}

export function PitchTeaser({
  openDateId,
  venueName,
  surface,
}: {
  openDateId: string;
  venueName: string;
  surface: "desk" | "phone";
}) {
  return (
    <section className="mt-5 rounded-2xl border bg-card p-4">
      <h2 className="font-display text-2xl">Pitch the night together</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Invite a nearby band. {venueName} sees nothing until every band accepts.
      </p>
      <Button asChild className="mt-3 h-11">
        <Link href={nightHref(openDateId, surface)}>See who fits</Link>
      </Button>
    </section>
  );
}

export function NightChoices({ id, surface }: { id: string; surface: "desk" | "phone" }) {
  const router = useRouter();
  const { snapshot, startPitch } = useApp();
  const openDate = snapshot.openDates.find((item) => item.id === id);
  const venue = openDate ? getVenue(openDate.venueId) : undefined;
  const band = snapshot.role === "band" ? getBand(snapshot.bandId) : undefined;
  const suggestions =
    band && venue
      ? suggestPartners({
          bandId: band.id,
          venueCitySlug: venue.citySlug,
          bands: listBands(),
          links: snapshot.bandLinks,
          repertoires: snapshot.repertoires,
        })
      : [];
  const [picked, setPicked] = useState<string[] | null>(null);
  const [preset, setPreset] = useState<SplitKind>("headliner");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!openDate || !venue) {
    return <Missing surface={surface} href={surface === "phone" ? "/phone/book" : "/dates"} label="That date is gone." />;
  }

  const selected = (picked ?? (suggestions[0] ? [suggestions[0].bandId] : [])).filter((item) =>
    suggestions.some((suggestion) => suggestion.bandId === item),
  );
  const lineup = [band, ...selected.map((item) => getBand(item)).filter((item): item is Band => Boolean(item))].filter(
    (item): item is Band => Boolean(item),
  );
  const splits = band ? splitPreset(lineup.length, preset) : null;
  const draw = combinedDraw(lineup);
  const existing = band
    ? snapshot.pitches.find((pitch) => pitch.leadBandId === band.id && pitch.openDateId === openDate.id && !pitch.bookingId)
    : undefined;

  function toggle(bandId: string) {
    const current = selected;
    if (current.includes(bandId)) {
      setPicked(current.filter((item) => item !== bandId));
      return;
    }
    if (current.length >= 3) return;
    setPicked([...current, bandId]);
  }

  function invite() {
    if (!band) return;
    setPending(true);
    const result = startPitch(openDate!.id, selected, preset);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(pitchHref(result.data, surface));
  }

  const body = (
    <div id="night-choices" className="grid gap-4">
      <Link href={dateHref(openDate.id, surface)} className="text-sm font-semibold text-rust">
        ← {venue.name}
      </Link>
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Full night</p>
        <h1 className="mt-1 font-display text-4xl leading-none tracking-tight">{venue.name}</h1>
        <p className="mt-2 text-sm">
          {formatDay(openDate.date)} · {slotLine(openDate.showTime, openDate.daypart)}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Pick a band you can stand behind. They see the slot and the split before {venue.name} hears anything.
        </p>
        <Link href={surface === "phone" ? "/phone/bands" : "/bands"} className="mt-2 inline-block text-sm font-semibold text-rust">
          Or search every band.
        </Link>
      </div>
      {snapshot.role !== "band" || !band ? (
        <p className="rounded-2xl bg-sand px-4 py-3 text-sm">Switch to a band to invite someone onto this night.</p>
      ) : suggestions.length === 0 ? (
        <p className="rounded-2xl bg-sand px-4 py-3 text-sm">
          No tuned-in or compatible bands within 200 miles.{" "}
          <Link href={surface === "phone" ? "/phone/bands" : "/bands"} className="font-semibold text-rust">
            Or search every band.
          </Link>
        </p>
      ) : (
        <ul className="grid gap-3">
          {suggestions.map((suggestion) => {
            const other = getBand(suggestion.bandId);
            if (!other) return null;
            const trust = trustGlance(snapshot, band.id, other.id);
            const on = selected.includes(other.id);
            const music = repertoireFor(other.id, snapshot.repertoires).music;
            const style = suggestion.overlap[0] ?? other.styles[0] ?? other.genres[0];
            return (
              <li key={other.id}>
                <article id={`partner-${other.id}`} className={cn("rounded-2xl border bg-card p-4", on && "border-rust")}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-2xl leading-none">{other.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {other.city} · {suggestion.miles} mi
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold tracking-wide uppercase",
                        trust.verified ? "bg-pine text-cream" : "bg-sand text-muted-foreground",
                      )}
                    >
                      {trust.verified ? "Verified" : "Not verified"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm">
                    {sizeLabel(suggestion.size)} · {style} · {MUSIC_LABEL[music]}
                  </p>
                  <div className="mt-3">
                    <SamplePlay bandId={other.id} />
                  </div>
                  <p className="mt-3 text-sm font-medium">{trust.rating}</p>
                  <p className="text-sm text-muted-foreground">{trust.gigsLabel}</p>
                  {trust.connections.length > 0 ? (
                    <ul className="mt-2 grid gap-1 text-sm">
                      {trust.connections.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">No shared rooms or tuned-in bands yet.</p>
                  )}
                  <Button
                    type="button"
                    variant={on ? "default" : "outline"}
                    className="mt-3 h-10"
                    aria-pressed={on}
                    onClick={() => toggle(other.id)}
                  >
                    {on ? "On the bill" : "Add"}
                  </Button>
                </article>
              </li>
            );
          })}
        </ul>
      )}
      {band && lineup.length > 1 && splits ? (
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={preset === "even" ? "default" : "outline"} className="h-10" onClick={() => setPreset("even")}>
              Even split
            </Button>
            <Button
              type="button"
              variant={preset === "headliner" ? "default" : "outline"}
              className="h-10"
              onClick={() => setPreset("headliner")}
            >
              Headliner 50/30/20
            </Button>
          </div>
          <p className="text-sm">{lineup.map((item, index) => `${item.name} ${splits[index]}%`).join(" · ")}</p>
          {draw > 0 ? <p className="text-sm">Typical draw about {draw.toLocaleString()}.</p> : null}
        </div>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {existing ? (
        <Button asChild className="h-12">
          <Link href={pitchHref(existing.id, surface)}>Open the pitch</Link>
        </Button>
      ) : band ? (
        <Button type="button" className="h-12" disabled={pending || selected.length === 0} onClick={invite}>
          {selected.length === 1 ? `Invite ${getBand(selected[0] ?? "")?.name ?? "this band"}` : "Invite these bands"}
        </Button>
      ) : null}
      <p className="text-sm text-muted-foreground">The venue is not told until every band says yes.</p>
    </div>
  );

  if (surface === "phone") return body;
  return (
    <PageFrame>
      <div className="max-w-lg">{body}</div>
    </PageFrame>
  );
}

export function PitchRoom({ id, surface }: { id: string; surface: "desk" | "phone" }) {
  const router = useRouter();
  const { snapshot, acceptPitch, suggestPitchChange, addPitchMessage, sendPitchToVenue } = useApp();
  const pitch = snapshot.pitches.find((item) => item.id === id);
  const [message, setMessage] = useState("");
  const [changing, setChanging] = useState(false);
  const [setTime, setSetTime] = useState("");
  const [split, setSplit] = useState("");
  const [changeNote, setChangeNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!pitch) {
    return <Missing surface={surface} href={surface === "phone" ? "/phone/book" : "/book"} label="That pitch is gone." />;
  }

  const venue = getVenue(pitch.venueId);
  const openDate = snapshot.openDates.find((item) => item.id === pitch.openDateId);
  const mine = pitch.members.find((member) => snapshot.role === "band" && member.bandId === snapshot.bandId);
  const lead = getBand(pitch.leadBandId);
  const invited = Boolean(mine && mine.status === "invited");
  const waiting = pitch.members.filter((member) => member.status !== "accepted");
  const blocked = sendBlock(pitch);
  const bands = pitch.members.flatMap((member) => {
    const band = getBand(member.bandId);
    return band ? [band] : [];
  });
  const draw = combinedDraw(bands);
  const sent = Boolean(pitch.bookingId);
  const onPitch = Boolean(mine);

  function accept() {
    const result = acceptPitch(pitch!.id);
    if (!result.ok) setError(result.error);
    else {
      setError(null);
      toast("You accepted");
    }
  }

  function sendChange(event: React.FormEvent) {
    event.preventDefault();
    const result = suggestPitchChange(pitch!.id, {
      setTime,
      splitPercent: Number(split),
      note: changeNote,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setChanging(false);
    setError(null);
    toast("Change sent. The others need to accept it.");
  }

  function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const result = addPitchMessage(pitch!.id, message);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("");
    setError(null);
  }

  function sendVenue() {
    const result = sendPitchToVenue(pitch!.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast(result.warning ?? "Sent to the venue");
    router.push(surface === "phone" ? `/phone/gig/${result.data}` : `/bookings/${result.data}`);
  }

  const body = (
    <div id={invited ? "pitch-invite" : "pitch-screen"} className="grid gap-4">
      <Link href={dateHref(pitch.openDateId, surface)} className="text-sm font-semibold text-rust">
        ← Date
      </Link>
      {invited ? (
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Invite</p>
          <h1 className="mt-1 font-display text-4xl leading-none tracking-tight">{lead?.name} invited you</h1>
          <p className="mt-3 text-lg">{venue?.name}</p>
          <p className="text-sm">{openDate ? `${formatDayLong(openDate.date)} · ${slotLine(openDate.showTime, openDate.daypart)}` : ""}</p>
          <p className="mt-3 text-base leading-relaxed">
            {mine?.role} · {mine?.setTime} · {mine?.splitPercent}% of {money(pitch.terms.guarantee)}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Nothing goes to {venue?.name} until every band accepts. You can suggest a different time or split.
          </p>
        </div>
      ) : (
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Pitch</p>
          <h1 className="mt-1 font-display text-4xl leading-none tracking-tight">{venue?.name}</h1>
          <p className="mt-2 text-sm">
            {openDate ? `${formatDayLong(openDate.date)} · ${slotLine(openDate.showTime, openDate.daypart)}` : ""}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {sent
              ? `${venue?.name} has the offer.`
              : `The venue does not see this until every band accepts.`}
          </p>
        </div>
      )}

      <ul className="grid gap-2">
        {pitch.members.map((member) => {
          const name = getBand(member.bandId)?.name ?? "Band";
          return (
            <li key={member.bandId} className="flex items-baseline justify-between gap-3 rounded-2xl border bg-card px-4 py-3 text-sm">
              <span>
                <span className="block font-medium">{name}</span>
                <span className="text-muted-foreground">
                  {member.role} · {member.setTime} · {member.splitPercent}%
                </span>
              </span>
              <span className="font-semibold">{member.status === "accepted" ? "Accepted" : "Waiting"}</span>
            </li>
          );
        })}
      </ul>

      <dl className="grid gap-1 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Guarantee</dt>
          <dd className="font-medium">{money(pitch.terms.guarantee)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Load-in</dt>
          <dd className="font-medium">{pitch.terms.loadIn}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Backline</dt>
          <dd className="font-medium">{pitch.terms.backline ? "Yes" : "No"}</dd>
        </div>
        {draw > 0 ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Typical draw</dt>
            <dd className="font-medium">About {draw.toLocaleString()}</dd>
          </div>
        ) : null}
      </dl>

      {!sent && invited ? (
        <div className="grid gap-2">
          <Button type="button" className="h-12" onClick={accept}>
            Accept
          </Button>
          <Button type="button" variant="outline" className="h-12" onClick={() => {
            setChanging((open) => !open);
            setSetTime(mine?.setTime ?? "");
            setSplit(String(mine?.splitPercent ?? ""));
          }}>
            Suggest a change
          </Button>
        </div>
      ) : null}

      {!sent && changing && mine ? (
        <form onSubmit={sendChange} className="grid gap-3 rounded-2xl border bg-card p-4">
          <p className="font-medium">Your set and your split</p>
          <label className="grid gap-1 text-sm">
            <span>Set time</span>
            <Input className="h-11" value={setTime} onChange={(event) => setSetTime(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Your split %</span>
            <Input className="h-11" inputMode="numeric" value={split} onChange={(event) => setSplit(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>What should change</span>
            <Textarea value={changeNote} onChange={(event) => setChangeNote(event.target.value)} />
          </label>
          <Button type="submit" className="h-11">
            Send this change
          </Button>
        </form>
      ) : null}

      {!sent && !invited && waiting.length > 0 ? (
        <p className="text-sm">
          Waiting on {waiting.map((member) => getBand(member.bandId)?.name ?? "a band").join(", ")}.
        </p>
      ) : null}

      {!sent && snapshot.role === "band" && snapshot.bandId === pitch.leadBandId && !blocked ? (
        <Button type="button" className="h-12" onClick={sendVenue}>
          Send to {venue?.name}
        </Button>
      ) : null}

      {sent && pitch.bookingId ? (
        <Button asChild className="h-12">
          <Link href={surface === "phone" ? `/phone/gig/${pitch.bookingId}` : `/bookings/${pitch.bookingId}`}>
            Open the offer
          </Link>
        </Button>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold">Messages</h2>
        <ul className="grid gap-2">
          {pitch.messages.map((item) => (
            <li key={item.id} className="rounded-2xl bg-sand px-4 py-3 text-sm">
              <p className="font-medium">{getBand(item.fromBandId)?.name ?? "Band"}</p>
              <p className="mt-1 leading-relaxed">{item.body}</p>
            </li>
          ))}
        </ul>
        {!sent && onPitch ? (
          <form onSubmit={sendMessage} className="grid gap-2">
            <Input
              className="h-11"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Message the other bands"
            />
            <Button type="submit" variant="outline" className="h-11">
              Send
            </Button>
          </form>
        ) : null}
        {!onPitch && snapshot.role === "venue" ? (
          <p className="text-sm text-muted-foreground">This stays between the bands until they send one offer.</p>
        ) : null}
      </section>
    </div>
  );

  if (surface === "phone") return body;
  return (
    <PageFrame>
      <div className="max-w-lg">{body}</div>
    </PageFrame>
  );
}

function Missing({ surface, href, label }: { surface: "desk" | "phone"; href: string; label: string }) {
  const body = (
    <div>
      <h1 className="font-display text-4xl">{label}</h1>
      <Link href={href} className="mt-3 inline-block text-sm font-semibold text-rust">
        Back
      </Link>
    </div>
  );
  if (surface === "phone") return body;
  return <PageFrame>{body}</PageFrame>;
}

export function pitchStatusLine(pitch: Pitch) {
  const waiting = pitch.members.filter((member) => member.status !== "accepted");
  if (pitch.bookingId) return "Sent to the venue";
  if (waiting.length === 0) return "Every band accepted";
  return `Waiting on ${waiting.length === 1 ? "1 band" : `${waiting.length} bands`}`;
}
