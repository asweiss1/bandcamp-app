"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { SAMPLE_PLACE, type SavedPlace } from "@/lib/geo";
import { summarize, type LodgingPref, type PlanNight, type TourPlan } from "@/lib/planner";

type PlaceState = {
  place: SavedPlace;
  radiusMiles: number;
  lodging: LodgingPref;
  plan: TourPlan | null;
};

const KEY = "bandcamp.place.v1";

let memory: PlaceState = {
  place: SAMPLE_PLACE,
  radiusMiles: 150,
  lodging: "cheap",
  plan: null,
};
let loaded = false;

function valid(value: unknown): value is PlaceState {
  if (!value || typeof value !== "object") return false;
  const state = value as PlaceState;
  return Boolean(state.place && typeof state.place.lat === "number" && typeof state.radiusMiles === "number");
}

function readMemory() {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (valid(parsed)) {
          const lodging =
            parsed.lodging === "camp" || parsed.lodging === "cheap" || parsed.lodging === "hotel"
              ? parsed.lodging
              : memory.lodging;
          memory = {
            ...memory,
            ...parsed,
            lodging,
            plan: parsed.plan ?? null,
            place: { ...parsed.place, source: parsed.place.source ?? "search" },
          };
        }
      }
    } catch {
      memory = { ...memory };
    }
  }
  return memory;
}

function write(next: PlaceState) {
  memory = next;
  loaded = true;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("bandcamp-place"));
}

function subscribe(onChange: () => void) {
  window.addEventListener("bandcamp-place", onChange);
  return () => window.removeEventListener("bandcamp-place", onChange);
}

type PlaceApi = PlaceState & {
  setPlace: (place: SavedPlace) => void;
  setRadius: (radiusMiles: number) => void;
  setLodging: (lodging: LodgingPref) => void;
  savePlan: (plan: TourPlan | null) => void;
  setNight: (index: number, night: PlanNight) => void;
};

const PlaceContext = createContext<PlaceApi | null>(null);

export function PlaceProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribe, readMemory, () => memory);
  const api = useMemo<PlaceApi>(() => {
    const update = (patch: Partial<PlaceState>) => write({ ...readMemory(), ...patch });
    return {
      ...state,
      setPlace: (place) => update({ place }),
      setRadius: (radiusMiles) => update({ radiusMiles }),
      setLodging: (lodging) => update({ lodging }),
      savePlan: (plan) => update({ plan }),
      setNight: (index, night) => {
        const current = readMemory().plan;
        if (!current) return;
        const nights = current.nights.map((item, itemIndex) => (itemIndex === index ? night : item));
        update({ plan: summarize(nights) });
      },
    };
  }, [state]);
  return <PlaceContext.Provider value={api}>{children}</PlaceContext.Provider>;
}

export function usePlace() {
  const context = useContext(PlaceContext);
  if (!context) throw new Error("usePlace must be used within PlaceProvider");
  return context;
}
