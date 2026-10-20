"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatWhen } from "@/lib/deal";
import {
  canMessageBooking,
  directorySearch,
  fanMailOpen,
  inboxRows,
  showsFanTab,
  threadView,
  type DirectoryHit,
  type MailBox,
} from "@/lib/inbox";
import { useApp } from "@/lib/store";
import { PageFrame } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function threadHref(surface: "desk" | "phone", id: string) {
  const root = surface === "phone" ? "/phone/inbox" : "/inbox";
  return `${root}/${encodeURIComponent(id)}`;
}

function bookingHref(surface: "desk" | "phone", id: string) {
  return surface === "phone" ? `/phone/gig/${id}` : `/bookings/${id}`;
}

function pitchHref(surface: "desk" | "phone", id: string) {
  return surface === "phone" ? `/phone/book/pitch/${id}` : `/pitch/${id}`;
}

export function InboxIndex({ surface }: { surface: "desk" | "phone" }) {
  const { snapshot, sendDirect, setFanMail } = useApp();
  const router = useRouter();
  const fanTab = showsFanTab(snapshot.role);
  const [box, setBox] = useState<MailBox>("work");
  const [composing, setComposing] = useState(false);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<DirectoryHit | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const work = inboxRows(snapshot, "work");
  const fan = fanTab ? inboxRows(snapshot, "fan") : [];
  const rows = box === "fan" ? fan : work;
  const workUnread = work.filter((row) => row.unread).length;
  const fanUnread = fan.filter((row) => row.unread).length;
  const mailOn = snapshot.role === "band" ? fanMailOpen(snapshot.fanMail, snapshot.bandId) : true;

  function send(event: React.FormEvent) {
    event.preventDefault();
    if (!picked) {
      setError("Pick someone to write.");
      return;
    }
    const result = sendDirect(picked.id, picked.role, body);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setBody("");
    setError(null);
    toast("Message sent");
    router.push(threadHref(surface, result.data));
  }

  const bodyNode = (
    <div id="inbox" className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Inbox</p>
          <h1 className="mt-1 font-display text-4xl leading-none tracking-tight">
            {box === "fan" ? "Fan mail" : "Messages"}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {box === "fan"
              ? "Notes from fans. Booking talk stays in Messages."
              : "Direct notes between bands, rooms, and players. A booking or a pitch stays attached when the note belongs to one."}
          </p>
        </div>
        {snapshot.role === "fan" ? null : (
          <Button type="button" variant="outline" className="h-10" onClick={() => setComposing((open) => !open)}>
            {composing ? "Close" : "New message"}
          </Button>
        )}
      </div>
      {fanTab ? (
        <div className="flex gap-2">
          <BoxTab label="Messages" count={workUnread} selected={box === "work"} onClick={() => setBox("work")} />
          <BoxTab label="Fan mail" count={fanUnread} selected={box === "fan"} onClick={() => setBox("fan")} />
        </div>
      ) : null}
      {box === "fan" && snapshot.role === "band" ? (
        <button
          id="fan-mail-toggle"
          type="button"
          aria-pressed={mailOn}
          className="w-fit rounded-full border bg-card px-3 py-1.5 text-sm font-medium"
          onClick={() => {
            const result = setFanMail(!mailOn);
            if (!result.ok) toast.error(result.error);
            else toast(mailOn ? "Fan mail is off" : "Fan mail is on");
          }}
        >
          {mailOn ? "Fan mail is on" : "Fan mail is off"}
        </button>
      ) : null}
      {composing && snapshot.role !== "fan" ? (
        <form id="new-message" onSubmit={send} className="grid max-w-xl gap-3 rounded-2xl border bg-card p-4">
          <label className="grid gap-1 text-sm font-medium">
            To
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPicked(null);
              }}
              placeholder="Band, room, or player"
              className="h-11"
            />
          </label>
          {picked ? <p className="text-sm">Writing to {picked.name}</p> : null}
          {query.trim().length >= 2 && !picked ? (
            <ul className="grid gap-1">
              {directorySearch(snapshot, query).map((hit) => (
                <li key={`${hit.role}-${hit.id}`}>
                  <button
                    type="button"
                    className="flex w-full items-baseline justify-between rounded-lg px-2 py-2 text-left hover:bg-sand"
                    onClick={() => {
                      setPicked(hit);
                      setQuery(hit.name);
                    }}
                  >
                    <span className="font-medium">{hit.name}</span>
                    <span className="text-xs text-muted-foreground">{hit.place}</span>
                  </button>
                </li>
              ))}
              {directorySearch(snapshot, query).length === 0 ? (
                <li className="px-2 text-sm text-muted-foreground">No one by that name.</li>
              ) : null}
            </ul>
          ) : null}
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write a message"
            className="min-h-24"
          />
          <p className="text-xs text-muted-foreground">Email and phone stay off this thread.</p>
          {error ? <p className="text-sm text-rust">{error}</p> : null}
          <Button type="submit" className="h-10 w-fit">
            Send
          </Button>
        </form>
      ) : null}
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
          {box === "fan"
            ? "No fan mail yet. Notes from fans land here, away from booking talk."
            : snapshot.role === "fan"
              ? "You haven't written a band yet. Open a band or a show and send a note."
              : "No messages yet. Write a band, a room, or a player directly."}
        </p>
      ) : (
        <ul id={box === "fan" ? "fan-mail" : "message-list"} className="grid max-w-2xl gap-2">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={threadHref(surface, row.id)}
                className="block rounded-2xl border bg-card px-4 py-3 hover:border-rust/40"
              >
                <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {row.unread ? <span className="size-2 rounded-full bg-amber" aria-label="Unread" /> : null}
                  {row.chip}
                </p>
                <p className={row.unread ? "mt-1 font-semibold" : "mt-1 font-medium"}>{row.title}</p>
                {row.place ? <p className="text-xs text-muted-foreground">{row.place}</p> : null}
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{row.preview}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return surface === "phone" ? bodyNode : <PageFrame>{bodyNode}</PageFrame>;
}

function BoxTab({
  label,
  count,
  selected,
  onClick,
}: {
  label: string;
  count: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={
        selected
          ? "rounded-full bg-ink px-3 py-1.5 text-sm font-medium text-cream"
          : "rounded-full bg-sand px-3 py-1.5 text-sm font-medium"
      }
    >
      {label}
      {count > 0 ? (
        <span className="ml-1 inline-flex min-w-5 justify-center rounded-full bg-amber px-1 text-[11px] text-ink">
          {count}
        </span>
      ) : null}
    </button>
  );
}

export function InboxThread({ id, surface }: { id: string; surface: "desk" | "phone" }) {
  const { snapshot, replyThread, markThreadRead, blockFan } = useApp();
  const router = useRouter();
  const view = threadView(snapshot, id);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    markThreadRead(id);
  }, [id, markThreadRead]);

  const back = surface === "phone" ? "/phone/inbox" : "/inbox";
  const missing = (
    <div>
      <h1 className="font-display text-4xl">That thread isn&apos;t in this browser.</h1>
      <Link href={back} className="mt-4 inline-block text-sm font-semibold text-rust">
        Back to the inbox
      </Link>
    </div>
  );

  if (!view) return surface === "phone" ? missing : <PageFrame>{missing}</PageFrame>;

  function send(event: React.FormEvent) {
    event.preventDefault();
    const result = replyThread(id, body);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setBody("");
    setError(null);
  }

  function moderate(report: boolean) {
    if (!view?.fanId) return;
    const result = blockFan(view.fanId, report);
    if (!result.ok) toast.error(result.error);
    else toast(report ? "Reported and blocked" : "Blocked");
  }

  const node = (
    <div id="inbox-thread" className="grid max-w-2xl gap-4">
      <Link href={back} className="text-sm font-medium text-rust">
        ← Inbox
      </Link>
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">
          {view.kind === "direct"
            ? "Direct"
            : view.kind === "booking"
              ? "Booking"
              : view.kind === "pitch"
                ? "Pitch"
                : "Fan mail"}
        </p>
        <h1 className="mt-1 font-display text-4xl leading-none tracking-tight">{view.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{view.people}</p>
      </div>
      <div className="flex flex-wrap gap-3 text-sm font-medium">
        {view.bookingId ? (
          <Link href={bookingHref(surface, view.bookingId)} className="text-rust">
            About this booking
          </Link>
        ) : null}
        {view.pitchId ? (
          <Link href={pitchHref(surface, view.pitchId)} className="text-rust">
            Open the pitch
          </Link>
        ) : null}
      </div>
      {view.kind === "fan" && snapshot.role !== "fan" ? (
        <p className="text-sm text-muted-foreground">You can reply, or leave it.</p>
      ) : null}
      {view.blocked && snapshot.role === "band" ? <p className="text-sm">This fan is blocked.</p> : null}
      {view.reported && snapshot.role === "band" ? <p className="text-sm">You reported this note.</p> : null}
      <ul className="grid gap-2">
        {view.lines.map((line) => (
          <li
            key={line.id}
            className={
              line.mine
                ? "ml-8 rounded-2xl bg-ink px-4 py-3 text-cream"
                : "mr-8 rounded-2xl border bg-card px-4 py-3"
            }
          >
            <p className="text-xs font-semibold">{line.name}</p>
            <p className="mt-1 text-sm leading-relaxed">{line.body}</p>
            <p className={line.mine ? "mt-1 text-xs text-cream/70" : "mt-1 text-xs text-muted-foreground"}>
              {formatWhen(line.createdAt)}
            </p>
          </li>
        ))}
      </ul>
      {view.closed ? (
        <p className="text-sm text-muted-foreground">This thread closed when the offer went to the venue.</p>
      ) : null}
      {view.fanMailOff && snapshot.role === "fan" ? (
        <p className="text-sm">This band isn&apos;t taking fan mail.</p>
      ) : null}
      {view.blocked && snapshot.role === "fan" ? <p className="text-sm">You can&apos;t message this band.</p> : null}
      {view.canReply ? (
        <form onSubmit={send} className="grid gap-3">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write a reply"
            className="min-h-24"
          />
          {error ? <p className="text-sm text-rust">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="h-10">
              Reply
            </Button>
            {view.kind === "fan" && snapshot.role === "band" && view.fanId ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  disabled={view.blocked}
                  onClick={() => moderate(false)}
                >
                  {view.blocked ? "Blocked" : "Block"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  disabled={view.reported}
                  onClick={() => moderate(true)}
                >
                  {view.reported ? "Reported" : "Report"}
                </Button>
              </>
            ) : null}
          </div>
        </form>
      ) : null}
      <p className="text-xs text-muted-foreground">Email and phone stay off this thread.</p>
      <Button type="button" variant="ghost" className="h-10 w-fit px-0" onClick={() => router.push(back)}>
        Back to messages
      </Button>
    </div>
  );

  return surface === "phone" ? node : <PageFrame>{node}</PageFrame>;
}

export function BookingMessage({ bookingId, surface }: { bookingId: string; surface: "desk" | "phone" }) {
  const { snapshot, openBookingThread } = useApp();
  const router = useRouter();
  if (!canMessageBooking(snapshot, bookingId)) return null;
  return (
    <Button
      type="button"
      variant="outline"
      className="mt-3 h-10"
      onClick={() => {
        const result = openBookingThread(bookingId);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        router.push(threadHref(surface, result.data));
      }}
    >
      Message
    </Button>
  );
}
