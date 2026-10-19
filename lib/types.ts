export type Role = "band" | "venue" | "musician";

export type DealType = "guarantee" | "door" | "guarantee_plus";

export type BookingStatus =
  | "requested"
  | "offered"
  | "countered"
  | "accepted"
  | "declined";

export type Party = "band" | "venue";

export type Terms = {
  dealType: DealType;
  guarantee: number | null;
  doorSplitBand: number | null;
  ticketPrice: number | null;
  backline: boolean;
  loadIn: string;
  note: string;
};

export type BookingEvent = {
  id: string;
  at: string;
  actor: Party;
  actorName: string;
  kind: "request" | "offer" | "counter" | "accept" | "decline";
  terms: Terms;
  note: string;
};

export type Booking = {
  id: string;
  openDateId: string;
  bandId: string;
  venueId: string;
  status: BookingStatus;
  awaiting: Party | null;
  terms: Terms;
  events: BookingEvent[];
  createdAt: string;
  billId?: string | null;
};

export type BandLink = {
  id: string;
  fromBandId: string;
  toBandId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
};

export type BillRole = "Headliner" | "Opener";

export type BillMember = {
  bandId: string;
  role: BillRole;
  setTime: string;
  splitPercent: number;
};

export type Bill = {
  id: string;
  name: string;
  leadBandId: string;
  members: BillMember[];
  openDateId: string | null;
  venueId: string | null;
  bookingId: string | null;
  createdAt: string;
};

export type OpenDate = {
  id: string;
  venueId: string;
  date: string;
  showTime: string;
  genres: string[];
  slot: "Headline" | "Support" | "Local support";
  age: "All ages" | "21+";
  notes: string;
};

export type Member = { name: string; role: string };

export type SampleLink = { label: string; href: string };

export type Band = {
  id: string;
  name: string;
  genres: string[];
  styles: string[];
  city: string;
  citySlug: string;
  touring: boolean;
  feeMin: number;
  feeMax: number;
  members: Member[];
  links: SampleLink[];
  availability: string;
  bio: string;
  draw: string;
  routeFrom: string | null;
  routeTo: string | null;
  routeCities: string[];
  photo?: string | null;
  lat?: number;
  lng?: number;
};

export type Venue = {
  id: string;
  name: string;
  city: string;
  citySlug: string;
  neighborhood: string;
  capacity: number;
  genres: string[];
  typicalDeal: string;
  bookerName: string;
  bookerEmail: string;
  bookerPhone: string;
  bio: string;
  backline: string;
  loadInNotes: string;
  address?: string;
  photo?: string | null;
  lat?: number;
  lng?: number;
};

export type Musician = {
  id: string;
  name: string;
  instruments: string[];
  genres: string[];
  city: string;
  citySlug: string;
  bio: string;
  email: string;
  availability: string;
  paidPreference: string;
  styles?: string[];
  radiusMiles?: number;
  seeks?: ("fill-in" | "member")[];
  photo?: string | null;
  lat?: number;
  lng?: number;
};

export type OwnedProfile = {
  id: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  band: Band | null;
  venue: Venue | null;
  musician: Musician | null;
};

export type Account = {
  phase: "welcome" | "ready";
  demo: boolean;
  activeId: string | null;
  profiles: OwnedProfile[];
};

export type ListingKind = "fill-in" | "member" | "jam";

export type Listing = {
  id: string;
  kind: ListingKind;
  title: string;
  instrument: string;
  genre: string;
  city: string;
  citySlug: string;
  lat?: number;
  lng?: number;
  paid: boolean;
  payNote: string;
  dates: string;
  postedByName: string;
  posterRole: Role;
  posterId: string;
  description: string;
  contact: string;
  createdAt: string;
};

export type Interest = {
  id: string;
  listingId: string | null;
  profileMusicianId: string | null;
  fromName: string;
  fromRole: Role;
  fromId: string;
  message: string;
  createdAt: string;
  status?: "pending" | "confirmed" | "declined";
};

export type OpportunityKind = "permit" | "festival";

export type Opportunity = {
  id: string;
  kind: OpportunityKind;
  title: string;
  host: string;
  contact: string;
  city: string;
  citySlug: string;
  startDate: string;
  endDate: string;
  timeWindow: string;
  location: string;
  genres: string[];
  compensation: string;
  spots: string;
  deadline: string | null;
  rules: string;
  notes: string;
};

export type ApplicationStatus = "applied" | "accepted" | "declined" | "waitlisted";

export type Application = {
  id: string;
  opportunityId: string;
  bandId: string;
  status: ApplicationStatus;
  setup: string;
  note: string;
  createdAt: string;
};

export type Repertoire = {
  bandId: string;
  originalsOnly: boolean;
  coversNote: string;
  rightsAttested: boolean;
};

export type StreamService = "bandcamp" | "soundcloud" | "youtube" | "spotify";

export type StreamLink = {
  id: string;
  bandId: string;
  service: StreamService;
  url: string;
};

export type FuelType = "gas" | "diesel";

export type VehicleType = "van" | "trailer" | "rv" | "car";

export type Vehicle = {
  id: string;
  bandId: string;
  name: string;
  vehicleType: VehicleType;
  mpg: number;
  fuel: FuelType;
  towMpg: number | null;
};

export type FuelOverride = {
  id: string;
  bandId: string;
  legId: string;
  price: number;
};

export type NightStay = {
  id: string;
  bandId: string;
  date: string;
  status: "booked" | "held";
  stayId: string | null;
  name: string;
  stayType: StayType;
  address: string;
  confirmation: string;
  cost: number;
};

export type StayType = "hotel" | "motel" | "rental" | "campground" | "van";

export type Stay = {
  id: string;
  citySlug: string;
  type: StayType;
  name: string;
  area: string;
  price: string;
  distance: string;
  notes: string;
};

export type LocalRules = {
  citySlug: string;
  vehicleSleeping: string;
  streetsAndLots: string;
  walmartBlmRest: string;
  permits: string;
};

export type City = {
  slug: string;
  city: string;
  state: string;
  label: string;
  blurb: string;
};

export type Snapshot = {
  role: Role;
  bandId: string;
  venueId: string;
  musicianId: string;
  openDates: OpenDate[];
  bookings: Booking[];
  listings: Listing[];
  interests: Interest[];
  opportunities: Opportunity[];
  applications: Application[];
  repertoires: Repertoire[];
  streamLinks: StreamLink[];
  nightStays: NightStay[];
  vehicles: Vehicle[];
  fuelOverrides: FuelOverride[];
  bandLinks: BandLink[];
  bills: Bill[];
  account: Account;
};

export type DateFill = "open" | "in-talks" | "filled";
