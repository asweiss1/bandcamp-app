"use client";

import Link from "next/link";
import { toast } from "sonner";
import { getBand } from "@/lib/catalog";
import { linkedBandIds, pairLinks } from "@/lib/links";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";

function profileHref(id: string, surface: "desk" | "phone") {
  return surface === "phone" ? `/phone/bands/${id}` : `/bands/${id}`;
}

export function incomingTuneIns(bandId: string, links: { status: string; toBandId: string }[]) {
  return links.filter((link) => link.status === "pending" && link.toBandId === bandId);
}

export function TuneInRequests() {
  const { snapshot, respondBandLink } = useApp();
  if (snapshot.role !== "band") return null;
  const incoming = snapshot.bandLinks.filter((link) => link.status === "pending" && link.toBandId === snapshot.bandId);
  if (incoming.length === 0) return null;

  function answer(id: string, status: "accepted" | "declined") {
    const result = respondBandLink(id, status);
    if (!result.ok) toast.error(result.error);
    else toast(status === "accepted" ? "Tuned in" : "Not now");
  }

  return (
    <ul id="tune-in-requests" className="grid gap-2">
      {incoming.map((link) => {
        const from = getBand(link.fromBandId);
        return (
          <li key={link.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-card px-4 py-3">
            <p className="text-sm">
              <span className="font-medium">{from?.name ?? "A band"}</span> wants to tune in with you
            </p>
            <div className="flex gap-2">
              <Button type="button" className="h-9" onClick={() => answer(link.id, "accepted")}>
                Accept
              </Button>
              <Button type="button" variant="outline" className="h-9" onClick={() => answer(link.id, "declined")}>
                Not now
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function TuneInButton({ bandId }: { bandId: string }) {
  const { snapshot, requestBandLink, tuneOut } = useApp();
  if (snapshot.role !== "band" || snapshot.bandId === bandId) return null;
  const pair = pairLinks(snapshot.bandLinks, snapshot.bandId, bandId);
  const accepted = pair.some((link) => link.status === "accepted");
  const outgoing = pair.some((link) => link.status === "pending" && link.fromBandId === snapshot.bandId);
  const incoming = pair.some((link) => link.status === "pending" && link.toBandId === snapshot.bandId);

  function ask() {
    const result = requestBandLink(bandId);
    if (!result.ok) toast.error(result.error);
    else toast("Tune-in sent");
  }

  function leave() {
    const result = tuneOut(bandId);
    if (!result.ok) toast.error(result.error);
    else toast("Tuned out");
  }

  if (accepted) {
    return (
      <Button type="button" variant="outline" className="h-10" onClick={leave}>
        Tune out
      </Button>
    );
  }
  if (outgoing) {
    return (
      <Button type="button" variant="outline" className="h-10" disabled>
        Tune-in sent
      </Button>
    );
  }
  if (incoming) return null;
  return (
    <Button type="button" className="h-10" onClick={ask}>
      🎛️ Tune in
    </Button>
  );
}

export function BandLinks({ bandId, surface }: { bandId: string; surface: "desk" | "phone" }) {
  const { snapshot, tuneOut } = useApp();
  const band = getBand(bandId);
  if (!band) return null;
  const accepted = linkedBandIds(snapshot.bandLinks, bandId)
    .map((id) => getBand(id))
    .filter((item) => item != null);
  const outgoing = snapshot.bandLinks.filter((link) => link.status === "pending" && link.fromBandId === bandId);
  const mine = snapshot.role === "band" && snapshot.bandId === bandId;
  const findHref = surface === "phone" ? "/phone/bands" : "/bands";

  function leave(otherId: string) {
    const result = tuneOut(otherId);
    if (!result.ok) toast.error(result.error);
    else toast("Tuned out");
  }

  return (
    <section id="tuned-in" className="mt-8">
      <h2 className="font-display text-3xl">
        🎛️ Tuned in · {accepted.length} {accepted.length === 1 ? "band" : "bands"}
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Tuning in is a standing yes to share bills and tours. Either band can ask. The other accepts.
      </p>
      {mine ? <div className="mt-3"><TuneInRequests /></div> : null}
      {accepted.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No bands tuned in yet.</p>
      ) : (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {accepted.map((linked) => (
            <li key={linked.id} className="flex items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3">
              <Link href={profileHref(linked.id, surface)} className="min-w-0 hover:text-rust">
                <p className="font-medium">{linked.name}</p>
                <p className="text-sm text-muted-foreground">{linked.city}</p>
              </Link>
              {mine ? (
                <Button type="button" variant="outline" className="h-9 shrink-0" onClick={() => leave(linked.id)}>
                  Tune out
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {mine && outgoing.length > 0 ? (
        <ul className="mt-3 grid gap-2">
          {outgoing.map((link) => {
            const to = getBand(link.toBandId);
            return (
              <li key={link.id} className="rounded-xl bg-sand px-4 py-3 text-sm">
                Tune-in sent{to ? ` · ${to.name}` : ""}
              </li>
            );
          })}
        </ul>
      ) : null}
      {mine ? (
        <Link href={findHref} className="mt-3 inline-block text-sm font-semibold text-rust">
          Find bands to tune in with
        </Link>
      ) : (
        <div className="mt-3">
          <TuneInButton bandId={bandId} />
        </div>
      )}
    </section>
  );
}
