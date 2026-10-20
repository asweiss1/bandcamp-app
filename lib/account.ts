import { publishOwnedCatalog } from "@/lib/catalog";
import type { Account, OwnedProfile, Snapshot } from "@/lib/types";

export const welcomeAccount: Account = {
  phase: "welcome",
  demo: false,
  activeId: null,
  profiles: [],
};

export function isAccount(value: unknown): value is Account {
  if (!value || typeof value !== "object") return false;
  const account = value as Account;
  return (
    (account.phase === "welcome" || account.phase === "ready") &&
    typeof account.demo === "boolean" &&
    (account.activeId === null || typeof account.activeId === "string") &&
    Array.isArray(account.profiles)
  );
}

export function profileName(profile: OwnedProfile) {
  if (profile.role === "band") return profile.band?.name ?? "Band";
  if (profile.role === "venue") return profile.venue?.name ?? "Venue";
  if (profile.role === "fan") return profile.fan?.name ?? "Fan";
  return profile.musician?.name ?? "Musician";
}

export function profileDetail(profile: OwnedProfile) {
  const entity = profile.band ?? profile.venue ?? profile.musician ?? profile.fan;
  const city = entity?.city ?? "City not set";
  const role =
    profile.role === "band" ? "Band" : profile.role === "venue" ? "Venue" : profile.role === "fan" ? "Fan" : "Musician";
  return `${role} · ${city}`;
}

export function syncCatalog(snapshot: Pick<Snapshot, "account">) {
  const profiles = snapshot.account?.profiles ?? [];
  publishOwnedCatalog({
    bands: profiles.flatMap((profile) => (profile.band ? [profile.band] : [])),
    venues: profiles.flatMap((profile) => (profile.venue ? [profile.venue] : [])),
    musicians: profiles.flatMap((profile) => (profile.musician ? [profile.musician] : [])),
    fans: profiles.flatMap((profile) => (profile.fan ? [profile.fan] : [])),
    places: profiles.flatMap((profile) => {
      const entity = profile.band ?? profile.venue ?? profile.musician ?? profile.fan;
      if (!entity || entity.lat == null || entity.lng == null) return [];
      const [city, state] = entity.city.split(",").map((part) => part.trim());
      return [
        {
          id: entity.citySlug,
          label: entity.city,
          city: city || entity.city,
          state: state || "",
          lat: entity.lat,
          lng: entity.lng,
        },
      ];
    }),
  });
}

export function ownsProfile(snapshot: Snapshot, id: string) {
  if (snapshot.account?.demo) {
    if (snapshot.role === "band") return snapshot.bandId === id;
    if (snapshot.role === "musician") return snapshot.musicianId === id;
    return false;
  }
  return snapshot.account?.activeId === id;
}
