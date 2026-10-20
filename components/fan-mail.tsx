"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getBand } from "@/lib/catalog";
import { fanMailOpen, isBlocked } from "@/lib/inbox";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function FanMailCompose({
  bandId,
  bands,
  venueId,
  venueName,
}: {
  bandId: string;
  bands?: { id: string; name: string }[];
  venueId?: string | null;
  venueName?: string;
}) {
  const { snapshot, sendFanMail } = useApp();
  const router = useRouter();
  const [chosen, setChosen] = useState(bandId);
  const [alsoVenue, setAlsoVenue] = useState(false);
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (snapshot.role !== "fan" || !bandId) return null;
  const band = getBand(chosen);
  if (!band) return null;
  const closed = !fanMailOpen(snapshot.fanMail, chosen);
  const blocked = isBlocked(snapshot.fanBlocks, chosen, snapshot.fanId);
  const lineup = bands && bands.length > 1 ? bands : null;

  function send(event: React.FormEvent) {
    event.preventDefault();
    const result = sendFanMail(chosen, alsoVenue && venueId ? venueId : null, body);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setBody("");
    setError(null);
    toast("Message sent");
    const root = window.location.pathname.startsWith("/phone") ? "/phone/inbox" : "/inbox";
    router.push(`${root}/${result.data}`);
  }

  return (
    <div id="fan-mail-compose" className="mt-4 max-w-xl rounded-2xl border bg-card px-4 py-4">
      <p className="font-medium">Write to {band.name}</p>
      <p className="mt-1 text-sm text-muted-foreground">Your email and phone stay private.</p>
      {closed ? <p className="mt-3 text-sm">This band isn&apos;t taking fan mail.</p> : null}
      {blocked ? <p className="mt-3 text-sm">You can&apos;t message this band.</p> : null}
      {!closed && !blocked && !open ? (
        <Button type="button" className="mt-3 h-10" onClick={() => setOpen(true)}>
          Write to the band
        </Button>
      ) : null}
      {!closed && !blocked && open ? (
        <form onSubmit={send} className="mt-3 grid gap-3">
          {lineup ? (
            <label className="grid gap-1 text-sm font-medium">
              Band
              <select
                value={chosen}
                onChange={(event) => setChosen(event.target.value)}
                className="h-11 rounded-lg border bg-paper px-3 text-sm"
              >
                {lineup.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {venueId && venueName ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={alsoVenue}
                onChange={(event) => setAlsoVenue(event.target.checked)}
              />
              Also send to {venueName}
            </label>
          ) : null}
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="A short note"
            className="min-h-24"
          />
          {error ? <p className="text-sm text-rust">{error}</p> : null}
          <Button type="submit" className="h-10 w-fit">
            Send
          </Button>
        </form>
      ) : null}
    </div>
  );
}
