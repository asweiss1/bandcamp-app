"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GENRES, getVenue } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import type { OpenDate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PageFrame, PageIntro } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function PostDateForm() {
  const router = useRouter();
  const { snapshot, postDate } = useApp();
  const venue = getVenue(snapshot.venueId);
  const [date, setDate] = useState("2026-12-19");
  const [showTime, setShowTime] = useState("8:30pm");
  const [slot, setSlot] = useState<OpenDate["slot"]>("Headline");
  const [age, setAge] = useState<OpenDate["age"]>("21+");
  const [genres, setGenres] = useState<string[]>(["Americana"]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (snapshot.role !== "venue" || !venue) {
    return (
      <PageFrame>
        <PageIntro
          eyebrow="Venues"
          title="Post an open date"
          lede="Switch to a venue to put a night on the board."
        />
        <Button asChild className="h-10">
          <Link href="/dates">Browse dates instead</Link>
        </Button>
      </PageFrame>
    );
  }

  function toggle(genre: string) {
    setGenres((current) =>
      current.includes(genre) ? current.filter((item) => item !== genre) : [...current, genre],
    );
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = postDate({ date, showTime, slot, age, genres, notes });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast("Date posted");
    router.push(`/dates/${result.data}`);
  }

  return (
    <PageFrame>
      <PageIntro
        eyebrow={venue.city}
        title={`Post a night at ${venue.name}`}
        lede="This stays in the prototype board. A production venue account would notify bands who match the city and genre."
      />
      <form onSubmit={submit} className="grid max-w-2xl gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Date</span>
            <Input className="h-10" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Show time</span>
            <Input className="h-10" value={showTime} onChange={(event) => setShowTime(event.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Slot</span>
            <select
              className="h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={slot}
              onChange={(event) => setSlot(event.target.value as OpenDate["slot"])}
            >
              <option>Headline</option>
              <option>Support</option>
              <option>Local support</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Age</span>
            <select
              className="h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={age}
              onChange={(event) => setAge(event.target.value as OpenDate["age"])}
            >
              <option>21+</option>
              <option>All ages</option>
            </select>
          </label>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Genres you want</legend>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => {
              const on = genres.includes(genre);
              return (
                <button
                  key={genre}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(genre)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm",
                    on ? "border-ink bg-ink text-cream" : "bg-card",
                  )}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </fieldset>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Notes for bands</span>
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Set length, curfew, what you will and won't pay." />
        </label>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="h-11 w-fit">
          Post open date
        </Button>
      </form>
    </PageFrame>
  );
}
