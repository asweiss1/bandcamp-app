"use client";

import { useEffect, useState } from "react";
import { SNAPSHOT_KEY } from "@/lib/storage-key";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLES: { id: Role; label: string; hint: string }[] = [
  { id: "band", label: "Band", hint: "Request dates, answer offers, and price the drive." },
  { id: "venue", label: "Venue", hint: "Post dates and send offers to bands." },
  { id: "musician", label: "Musician", hint: "Pick up fill-ins or look for a band." },
  { id: "fan", label: "Fan", hint: "Follow bands and rooms, and see confirmed shows near home." },
];

export function WelcomeChoices() {
  const [role, setRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SNAPSHOT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { account?: { phase?: string } };
      if (parsed.account?.phase !== "ready") return;
      document.cookie = "bandcamp-phase=ready; Path=/; Max-Age=31536000; SameSite=Lax";
      window.location.replace("/phone");
    } catch {
      return;
    }
  }, []);

  async function explore() {
    const { startDemo } = await import("@/lib/demo-boot");
    startDemo();
    window.location.replace("/phone");
  }

  return (
    <div className="grid gap-2">
      {ROLES.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-pressed={role === item.id}
          onClick={() => {
            setRole(item.id);
            setError(null);
          }}
          className={cn(
            "rounded-2xl border px-4 py-4 text-left",
            role === item.id ? "border-rust bg-accent" : "bg-card",
          )}
        >
          <span className="block font-semibold">{item.label}</span>
          <span className="text-sm text-muted-foreground">{item.hint}</span>
        </button>
      ))}
      <button
        type="button"
        className="h-11 rounded-lg border bg-card text-sm font-medium"
        onClick={() => void explore()}
      >
        Explore demo data
      </button>
      {error ? <p className="text-sm text-rust">{error}</p> : null}
      <button
        type="button"
        className="h-11 rounded-lg bg-ink text-sm font-semibold text-cream"
        onClick={() => {
          if (!role) {
            setError("Choose band, venue, musician, or fan.");
            return;
          }
          window.location.replace(`/phone/start?welcome=${role}`);
        }}
      >
        Continue
      </button>
    </div>
  );
}
