export type SeedTrack = {
  id: string;
  bandId: string;
  title: string;
  notes: string;
  src: string;
};

export const SEED_TRACKS: SeedTrack[] = [
  {
    id: "seed-mesa-dry",
    bandId: "mesa-dust",
    title: "Dry River",
    notes: "Generated tone for the prototype. Not a Mesa Dust recording.",
    src: "/samples/mesa-dust-dry-river.wav",
  },
  {
    id: "seed-mesa-switch",
    bandId: "mesa-dust",
    title: "Switchbacks",
    notes: "Generated tone for the prototype. Not a real song.",
    src: "/samples/mesa-dust-switchbacks.wav",
  },
  {
    id: "seed-salt-pine",
    bandId: "salt-choir",
    title: "Pine Room",
    notes: "Generated tone for the prototype. Not a Salt Choir recording.",
    src: "/samples/salt-choir-pine.wav",
  },
  {
    id: "seed-rio-wind",
    bandId: "rio-ghosts",
    title: "Mesa Wind",
    notes: "Generated tone for the prototype. Not a Río Ghosts recording.",
    src: "/samples/rio-ghosts-mesa-wind.wav",
  },
  {
    id: "seed-night-late",
    bandId: "night-market",
    title: "Late Set",
    notes: "Generated tone for the prototype. Not a Night Market recording.",
    src: "/samples/night-market-late-set.wav",
  },
];
