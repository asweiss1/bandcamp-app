"use client";

import Link from "next/link";
import { toast } from "sonner";
import { getBand, listBands } from "@/lib/catalog";
import { linkedBandIds, pairLinks } from "@/lib/links";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";

function profileHref(id: string, surface: "desk" | "phone") {
  return surface === "phone" ? `/phone/bands/${id}` : `/bands/${id}`;
}

export function BandLinks({ bandId, surface }: { bandId: string; surface: "desk" | "phone" }) {
  const { snapshot, requestBandLink, respondBandLink } = useApp();
  const band = getBand(bandId);
  if (!band) return null;
  const related = snapshot.bandLinks.filter(
    (link) => link.fromBandId === bandId || link.toBandId === bandId,
  );
  const accepted = linkedBandIds(snapshot.bandLinks, bandId)
    .map((id) => getBand(id))
    .filter((item) => item != null);
  const incoming = related.filter((link) => link.status === "pending" && link.toBandId === bandId);
  const outgoing = related.filter((link) => link.status === "pending" && link.fromBandId === bandId);
  const mine = snapshot.role === "band" && snapshot.bandId === bandId;
  const otherBand = snapshot.role === "band" && snapshot.bandId !== bandId;
  const already = otherBand && pairLinks(snapshot.bandLinks, snapshot.bandId, bandId).length > 0;
  const choices = mine
    ? listBands().filter(
        (item) => item.id !== bandId && pairLinks(snapshot.bandLinks, bandId, item.id).length === 0,
      )
    : [];

  function ask(toBandId: string) {
    const result = requestBandLink(toBandId);
    if (!result.ok) toast.error(result.error);
    else toast("Link request sent");
  }

  function answer(id: string, status: "accepted" | "declined") {
    const result = respondBandLink(id, status);
    if (!result.ok) toast.error(result.error);
    else toast(status === "accepted" ? "Bands linked" : "Request declined");
  }

  return (
    <section className="mt-8">
      <h2 className="font-display text-3xl">Linked bands</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        A link is a standing yes to share bills and tours. Either band can ask. The other accepts.
      </p>
      {accepted.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No linked bands yet.</p>
      ) : (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {accepted.map((linked) => (
            <li key={linked.id}>
              <Link
                href={profileHref(linked.id, surface)}
                className="block rounded-xl border bg-card px-4 py-3 hover:border-rust/40"
              >
                <p className="font-medium">{linked.name}</p>
                <p className="text-sm text-muted-foreground">{linked.city}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {incoming.length > 0 && mine ? (
        <ul className="mt-3 grid gap-2">
          {incoming.map((link) => {
            const from = getBand(link.fromBandId);
            return (
              <li key={link.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3">
                <p className="text-sm">
                  <span className="font-medium">{from?.name ?? "A band"}</span> wants to link up.
                </p>
                <div className="flex gap-2">
                  <Button type="button" className="h-9" onClick={() => answer(link.id, "accepted")}>
                    Accept
                  </Button>
                  <Button type="button" variant="outline" className="h-9" onClick={() => answer(link.id, "declined")}>
                    Decline
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
      {outgoing.length > 0 && mine ? (
        <ul className="mt-3 grid gap-2">
          {outgoing.map((link) => {
            const to = getBand(link.toBandId);
            return (
              <li key={link.id} className="rounded-xl bg-sand px-4 py-3 text-sm">
                Waiting on {to?.name ?? "that band"} to accept.
              </li>
            );
          })}
        </ul>
      ) : null}
      {otherBand && !already ? (
        <Button type="button" className="mt-3 h-10" onClick={() => ask(bandId)}>
          Request a link
        </Button>
      ) : null}
      {otherBand && already ? (
        <p className="mt-3 text-sm text-muted-foreground">A link with this band is already open.</p>
      ) : null}
      {mine && choices.length > 0 ? (
        <form
          className="mt-3 flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const toBandId = String(data.get("band") ?? "");
            if (toBandId) ask(toBandId);
          }}
        >
          <label className="sr-only" htmlFor={`link-${bandId}`}>
            Band to link
          </label>
          <select
            id={`link-${bandId}`}
            name="band"
            className="h-10 max-w-full rounded-md border bg-card px-3 text-sm"
            defaultValue={choices[0]?.id}
          >
            {choices.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline" className="h-10">
            Request a link
          </Button>
        </form>
      ) : null}
    </section>
  );
}
