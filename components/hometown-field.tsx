"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { searchPlaces, type Place, type SavedPlace } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

function mergePlaces(local: Place[], remote: Place[]) {
  const seen = new Set<string>();
  const places: Place[] = [];
  for (const place of [...local, ...remote]) {
    const key = place.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    places.push(place);
    if (places.length === 5) break;
  }
  return places;
}

export function HometownField({
  label,
  place,
  onPlace,
  placeholder = "City, ST",
}: {
  label: string;
  place: SavedPlace | null;
  onPlace: (place: SavedPlace) => void;
  placeholder?: string;
}) {
  const inputId = useId();
  const listId = useId();
  const [text, setText] = useState(place?.label ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [remote, setRemote] = useState<Place[]>([]);
  const [looking, setLooking] = useState(false);
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const committed = (place?.label ?? "").toLowerCase();
  const editing = text.trim().toLowerCase() !== committed;

  useEffect(() => {
    const query = text.trim();
    if (!editing || query.length < 2) return;
    const controller = new AbortController();
    const handle = window.setTimeout(async () => {
      setLooking(true);
      try {
        const response = await fetch(`/api/places?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = (await response.json()) as { places?: Place[] };
        if (!controller.signal.aborted) setRemote(data.places ?? []);
      } catch {
        if (!controller.signal.aborted) setRemote([]);
      } finally {
        if (!controller.signal.aborted) setLooking(false);
      }
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [text, editing]);

  const suggestions = useMemo(() => {
    if (!editing || text.trim().length < 2) return [];
    return mergePlaces(searchPlaces(text), remote);
  }, [editing, text, remote]);
  const highlighted = suggestions.length === 0 ? 0 : Math.min(active, suggestions.length - 1);

  function select(next: Place, source: SavedPlace["source"]) {
    onPlace({ ...next, source });
    setText(next.label);
    setOpen(false);
    setRemote([]);
    setNote(null);
  }

  function locate() {
    if (!navigator.geolocation) {
      setNote("This browser can't read a location. Type a city instead.");
      return;
    }
    setLocating(true);
    setNote(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `/api/places?lat=${position.coords.latitude}&lng=${position.coords.longitude}`,
          );
          const data = (await response.json()) as { places?: Place[] };
          const found = data.places?.[0];
          if (!found) {
            setNote("That location isn't a US town we can name. Type a city instead.");
            return;
          }
          select(found, "geo");
        } catch {
          setNote("The town lookup failed. Type a city instead.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setNote("Location stayed off. Type a city instead.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(index + 1, Math.max(suggestions.length - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      setText(place?.label ?? "");
      return;
    }
    if (event.key === "Enter" && open && suggestions[highlighted]) {
      event.preventDefault();
      select(suggestions[highlighted], "search");
    }
  }

  const showList = open && editing && text.trim().length >= 2;

  return (
    <div className="grid gap-2">
      <div className="relative">
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </label>
        <Input
          id={inputId}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && suggestions.length > 0 ? `${listId}-${highlighted}` : undefined}
          value={text}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="mt-1.5 h-11"
          onChange={(event) => {
            setText(event.target.value);
            setRemote([]);
            setActive(0);
            setOpen(true);
            setNote(null);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            setText(place?.label ?? "");
          }}
          onKeyDown={onKeyDown}
        />
        {showList ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border bg-card shadow-lg"
          >
            {suggestions.length === 0 ? (
              <li className="px-3 py-3 text-sm text-muted-foreground">
                {looking ? "Looking up US towns…" : "No matching US town. Try the city name."}
              </li>
            ) : (
              suggestions.map((item, index) => (
                <li key={item.id} role="presentation">
                  <button
                    id={`${listId}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={index === highlighted}
                    className={cn(
                      "flex min-h-11 w-full items-center px-3 text-left text-sm",
                      index === highlighted ? "bg-sand" : "bg-card",
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => select(item, "search")}
                  >
                    {item.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
      <button
        type="button"
        onClick={locate}
        disabled={locating}
        className="h-11 w-fit rounded-lg px-1 text-sm font-semibold text-rust disabled:opacity-60"
      >
        {locating ? "Finding this location…" : "Use my current location"}
      </button>
      {note ? (
        <p role="status" className="text-sm text-muted-foreground">
          {note}
        </p>
      ) : null}
    </div>
  );
}
