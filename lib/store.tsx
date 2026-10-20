"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { syncCatalog, ownsProfile, isAccount } from "@/lib/account";
import { billConfirmedClash, billPendingWarning, billProblem, memberBandIds } from "@/lib/bills";
import {
  candidateForApplication,
  candidateForBooking,
  candidateForFillIn,
  competingIds,
  confirmedClash,
  lodgingClash,
  pendingOverlap,
  type Commitment,
} from "@/lib/conflicts";
import { pairLinks, tuneOutLink } from "@/lib/links";
import { getBand, getFan, getMusician, getVenue } from "@/lib/catalog";
import { clearAudioTracks } from "@/lib/audio-db";
import { alertsForConfirmation, isFollowing, nextRsvp, publicShow, todayIso } from "@/lib/fans";
import {
  blockFanAccount,
  contactProblem,
  ensureBookingThread,
  ensureDirectThread,
  markRead,
  replyToThread,
  sendDirectMessage,
  sendFanMessage,
  setFanMailEnabled,
} from "@/lib/inbox";
import { reviewDraft } from "@/lib/trust";
import { applyMemberChange, peerReviewDraft, pitchGuarantee, buildPitchMembers, sendBlock } from "@/lib/pitch";
import type { SplitKind } from "@/lib/full-night";
import { canEditMedia, cleanLogo, cleanPhotos, cleanVideos } from "@/lib/media";
import { daypartFor } from "@/lib/daypart";
import { defaultTerms, formatDayLong, termsError, uid } from "@/lib/deal";
import { normalizeRepertoires } from "@/lib/repertoire";
import { localRepository } from "@/lib/repository";
import { dateFill } from "@/lib/queries";
import { initialSnapshot } from "@/lib/seed";
import type {
  Booking,
  BookingEvent,
  Interest,
  Listing,
  OpenDate,
  Party,
  Role,
  Snapshot,
  Terms,
  Application,
  Repertoire,
  NightStay,
  StreamService,
  Vehicle,
  VehicleType,
  FuelType,
  FuelOverride,
  OwnedProfile,
  BillMember,
  MusicKind,
  ProfileMedia,
  RsvpStatus,
} from "@/lib/types";

const SYNC_EVENT = "bandcamp-sync";

let memory: Snapshot = initialSnapshot;
let loaded = false;

function readMemory() {
  if (!loaded && typeof window !== "undefined") {
    memory = localRepository.load(initialSnapshot);
    loaded = true;
  }
  if (
    !Array.isArray(memory.opportunities) ||
    !Array.isArray(memory.applications) ||
    !Array.isArray(memory.repertoires) ||
    !Array.isArray(memory.streamLinks) ||
    !Array.isArray(memory.nightStays) ||
    !Array.isArray(memory.vehicles) ||
    !Array.isArray(memory.fuelOverrides)
  ) {
    memory = {
      ...memory,
      opportunities: Array.isArray(memory.opportunities) ? memory.opportunities : initialSnapshot.opportunities,
      applications: Array.isArray(memory.applications) ? memory.applications : initialSnapshot.applications,
      repertoires: Array.isArray(memory.repertoires) ? memory.repertoires : initialSnapshot.repertoires,
      streamLinks: Array.isArray(memory.streamLinks) ? memory.streamLinks : initialSnapshot.streamLinks,
      nightStays: Array.isArray(memory.nightStays) ? memory.nightStays : initialSnapshot.nightStays,
      vehicles: Array.isArray(memory.vehicles) ? memory.vehicles : initialSnapshot.vehicles,
      fuelOverrides: Array.isArray(memory.fuelOverrides) ? memory.fuelOverrides : initialSnapshot.fuelOverrides,
    };
  }
  if (
    !Array.isArray(memory.bandLinks) ||
    !Array.isArray(memory.bills) ||
    !Array.isArray(memory.sizes) ||
    !Array.isArray(memory.capacities) ||
    !Array.isArray(memory.media) ||
    !Array.isArray(memory.follows) ||
    !Array.isArray(memory.rsvps) ||
    !Array.isArray(memory.alerts) ||
    !Array.isArray(memory.reviews) ||
    !Array.isArray(memory.verifications) ||
    !Array.isArray(memory.pitches) ||
    !Array.isArray(memory.peerReviews) ||
    !Array.isArray(memory.threads) ||
    !Array.isArray(memory.messages) ||
    !Array.isArray(memory.reads) ||
    !Array.isArray(memory.fanMail) ||
    !Array.isArray(memory.fanBlocks)
  ) {
    memory = {
      ...memory,
      bandLinks: Array.isArray(memory.bandLinks) ? memory.bandLinks : initialSnapshot.bandLinks,
      bills: Array.isArray(memory.bills) ? memory.bills : initialSnapshot.bills,
      sizes: Array.isArray(memory.sizes) ? memory.sizes : [],
      capacities: Array.isArray(memory.capacities) ? memory.capacities : [],
      media: Array.isArray(memory.media) ? memory.media : initialSnapshot.media,
      follows: Array.isArray(memory.follows) ? memory.follows : initialSnapshot.follows,
      rsvps: Array.isArray(memory.rsvps) ? memory.rsvps : initialSnapshot.rsvps,
      alerts: Array.isArray(memory.alerts) ? memory.alerts : initialSnapshot.alerts,
      reviews: Array.isArray(memory.reviews) ? memory.reviews : initialSnapshot.reviews,
      verifications: Array.isArray(memory.verifications) ? memory.verifications : initialSnapshot.verifications,
      pitches: Array.isArray(memory.pitches) ? memory.pitches : initialSnapshot.pitches,
      peerReviews: Array.isArray(memory.peerReviews) ? memory.peerReviews : initialSnapshot.peerReviews,
      threads: Array.isArray(memory.threads) ? memory.threads : initialSnapshot.threads,
      messages: Array.isArray(memory.messages) ? memory.messages : initialSnapshot.messages,
      reads: Array.isArray(memory.reads) ? memory.reads : initialSnapshot.reads,
      fanMail: Array.isArray(memory.fanMail) ? memory.fanMail : initialSnapshot.fanMail,
      fanBlocks: Array.isArray(memory.fanBlocks) ? memory.fanBlocks : initialSnapshot.fanBlocks,
    };
  }
  if (!memory.fanId) {
    memory = { ...memory, fanId: initialSnapshot.fanId };
  }
  if (memory.openDates.some((date) => !date.daypart) || memory.repertoires.some((item) => !item.music)) {
    memory = {
      ...memory,
      openDates: memory.openDates.map((date) => (date.daypart ? date : { ...date, daypart: daypartFor(date.showTime) })),
      repertoires: normalizeRepertoires(memory.repertoires),
    };
  }
  if (!isAccount(memory.account)) {
    memory = {
      ...memory,
      account: { phase: "ready", demo: true, activeId: null, profiles: [] },
    };
  }
  syncCatalog(memory);
  return memory;
}

function writeMemory(next: Snapshot) {
  memory = next;
  loaded = true;
  syncCatalog(next);
  localRepository.save(next);
  window.dispatchEvent(new Event(SYNC_EVENT));
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(SYNC_EVENT, onStoreChange);
  return () => window.removeEventListener(SYNC_EVENT, onStoreChange);
}

function serverSnapshot() {
  return initialSnapshot;
}

type Result<T> = { ok: true; data: T; warning?: string } | { ok: false; error: string };

type AppContextValue = {
  ready: boolean;
  snapshot: Snapshot;
  setRole: (role: Role) => void;
  setBandId: (id: string) => void;
  setVenueId: (id: string) => void;
  setMusicianId: (id: string) => void;
  setFanId: (id: string) => void;
  reset: () => void;
  requestDate: (openDateId: string, terms: Terms) => Result<string>;
  sendOffer: (openDateId: string, bandId: string, terms: Terms) => Result<string>;
  counter: (bookingId: string, terms: Terms) => Result<string>;
  accept: (bookingId: string) => Result<string>;
  decline: (bookingId: string, note: string) => Result<string>;
  postDate: (input: Omit<OpenDate, "id" | "venueId">) => Result<string>;
  postListing: (
    input: Pick<
      Listing,
      "kind" | "title" | "instrument" | "genre" | "city" | "citySlug" | "paid" | "payNote" | "dates" | "description"
    > & { lat?: number; lng?: number },
  ) => Result<string>;
  expressInterest: (input: {
    listingId?: string;
    profileMusicianId?: string;
    message: string;
  }) => Result<string>;
  applyToOpportunity: (opportunityId: string, input: { setup: string; note: string }) => Result<string>;
  confirmApplication: (applicationId: string) => Result<string>;
  withdrawApplication: (applicationId: string) => Result<string>;
  confirmInterest: (interestId: string) => Result<string>;
  setRepertoire: (bandId: string, patch: Partial<Omit<Repertoire, "bandId">>) => Result<string>;
  setBandSize: (bandId: string, size: number) => Result<string>;
  setVenueCapacity: (venueId: string, capacity: number) => Result<string>;
  setProfileMedia: (profileId: string, patch: Partial<Omit<ProfileMedia, "profileId">>) => Result<string>;
  addStreamLink: (bandId: string, service: StreamService, url: string) => Result<string>;
  removeStreamLink: (id: string) => Result<string>;
  setNightStay: (stay: Omit<NightStay, "id"> & { id?: string }) => Result<string>;
  saveVehicle: (vehicle: Omit<Vehicle, "id" | "towMpg"> & { id?: string; towMpg?: number | null }) => Result<string>;
  removeVehicle: (id: string) => Result<string>;
  setFuelPrice: (bandId: string, legId: string, price: number | null) => Result<string>;
  saveProfile: (
    profile: OwnedProfile,
    extras?: {
      finish?: boolean;
      music?: MusicKind;
      openDates?: Omit<OpenDate, "id" | "venueId">[];
    },
  ) => Result<string>;
  activateProfile: (id: string) => Result<string>;
  requestBandLink: (toBandId: string) => Result<string>;
  respondBandLink: (id: string, status: "accepted" | "declined") => Result<string>;
  tuneOut: (otherBandId: string) => Result<string>;
  saveBill: (input: { id?: string; name: string; members: BillMember[] }) => Result<string>;
  pitchBill: (billId: string, openDateId: string, terms: Terms) => Result<string>;
  offerBill: (billId: string, openDateId: string, terms: Terms) => Result<string>;
  exploreDemo: (role?: Role) => void;
  follow: (targetId: string, targetRole: "band" | "venue") => Result<string>;
  unfollow: (targetId: string) => Result<string>;
  setRsvp: (bookingId: string, status: RsvpStatus) => Result<string>;
  markAlertsRead: () => Result<string>;
  addReview: (bookingId: string, rating: number, note: string) => Result<string>;
  setVerification: (profileId: string, field: "email" | "phone" | "address", checked: boolean) => Result<string>;
  startPitch: (openDateId: string, partnerIds: string[], preset: SplitKind) => Result<string>;
  acceptPitch: (pitchId: string) => Result<string>;
  suggestPitchChange: (pitchId: string, input: { setTime: string; splitPercent: number; note: string }) => Result<string>;
  addPitchMessage: (pitchId: string, body: string) => Result<string>;
  sendPitchToVenue: (pitchId: string) => Result<string>;
  addPeerReview: (
    bookingId: string,
    toBandId: string,
    checks: { onTime: boolean; sharedGear: boolean; broughtCrowd: boolean; easyToWorkWith: boolean },
    note: string,
  ) => Result<string>;
  sendDirect: (toId: string, toRole: "band" | "venue" | "musician", body: string) => Result<string>;
  openDirectThread: (toId: string, toRole: "band" | "venue" | "musician") => Result<string>;
  sendFanMail: (bandId: string, venueId: string | null, body: string) => Result<string>;
  replyThread: (threadId: string, body: string) => Result<string>;
  markThreadRead: (threadId: string) => Result<string>;
  setFanMail: (enabled: boolean) => Result<string>;
  blockFan: (fanId: string, report: boolean) => Result<string>;
  openBookingThread: (bookingId: string) => Result<string>;
};

const AppContext = createContext<AppContextValue | null>(null);

function partyName(snapshot: Snapshot, party: Party) {
  if (party === "band") return getBand(snapshot.bandId)?.name ?? "Band";
  const venue = getVenue(snapshot.venueId);
  if (!venue) return "Venue";
  return `${venue.bookerName} · ${venue.name}`;
}

function eventFor(
  snapshot: Snapshot,
  party: Party,
  kind: BookingEvent["kind"],
  terms: Terms,
  note: string,
): BookingEvent {
  return {
    id: uid("ev"),
    at: new Date().toISOString(),
    actor: party,
    actorName: partyName(snapshot, party),
    kind,
    terms: { ...terms, note },
    note,
  };
}

function duplicateBooking(snapshot: Snapshot, openDateId: string, bandId: string) {
  return snapshot.bookings.find(
    (booking) =>
      booking.openDateId === openDateId &&
      booking.bandId === bandId &&
      booking.status !== "declined",
  );
}

function declineBooking(item: Booking, note: string, actorName: string): Booking {
  return {
    ...item,
    status: "declined",
    awaiting: null,
    events: [
      ...item.events,
      {
        id: uid("ev"),
        at: new Date().toISOString(),
        actor: "venue",
        actorName,
        kind: "decline",
        terms: item.terms,
        note,
      },
    ],
  };
}

function settleConfirmed(
  current: Snapshot,
  winner: Commitment,
  next: Pick<Snapshot, "bookings" | "applications" | "interests">,
) {
  const rivals = competingIds({ ...current, ...next }, winner);
  const closeNote = `Closed because ${winner.label} was confirmed.`;
  const venue = getVenue(winner.venueId ?? "");
  const closer = venue ? `${venue.bookerName} · ${venue.name}` : "BandCamp";
  return {
    bookings: next.bookings.map((item) => {
      if (!rivals.bookingIds.includes(item.id)) return item;
      if (item.status === "declined" || item.status === "accepted") return item;
      return declineBooking(item, closeNote, closer);
    }),
    applications: next.applications.map((item) => {
      if (!rivals.applicationIds.includes(item.id)) return item;
      if (item.status === "declined" || item.status === "accepted") return item;
      return { ...item, status: "declined" as const, note: `${item.note} ${closeNote}`.trim() };
    }),
    interests: next.interests.map((item) => {
      if (!rivals.interestIds.includes(item.id)) return item;
      if (item.status === "declined" || item.status === "confirmed") return item;
      return { ...item, status: "declined" as const, message: `${item.message}\n${closeNote}` };
    }),
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, readMemory, serverSnapshot);

  const api = useMemo<AppContextValue>(() => {
    const update = (next: Snapshot) => {
      writeMemory(next);
    };

    return {
      ready: true,
      snapshot,
      setRole: (role) => {
        const current = readMemory();
        update({ ...current, role, fanId: current.fanId || initialSnapshot.fanId });
      },
      setFanId: (id) => {
        const current = readMemory();
        if (!getFan(id)) return;
        update({ ...current, fanId: id, role: "fan" });
      },
      setBandId: (bandId) => update({ ...readMemory(), bandId }),
      setVenueId: (venueId) => update({ ...readMemory(), venueId }),
      setMusicianId: (musicianId) => update({ ...readMemory(), musicianId }),
      reset: () => {
        const current = readMemory();
        const ownedIds = new Set(current.account.profiles.map((profile) => profile.id));
        if (ownedIds.size === 0) {
          localRepository.clear();
          void clearAudioTracks();
          update(initialSnapshot);
          return;
        }
        const demo = current.account.demo;
        update({
          ...initialSnapshot,
          account: { ...current.account, phase: "ready" },
          role: demo ? "band" : current.role,
          bandId: demo ? "mesa-dust" : current.bandId,
          venueId: demo ? "high-country" : current.venueId,
          musicianId: demo ? "lena-ortiz" : current.musicianId,
          vehicles: [
            ...initialSnapshot.vehicles,
            ...current.vehicles.filter((vehicle) => ownedIds.has(vehicle.bandId)),
          ],
          streamLinks: [
            ...initialSnapshot.streamLinks,
            ...current.streamLinks.filter((link) => ownedIds.has(link.bandId)),
          ],
          repertoires: [
            ...initialSnapshot.repertoires,
            ...current.repertoires.filter((item) => ownedIds.has(item.bandId)),
          ],
          openDates: [
            ...initialSnapshot.openDates,
            ...current.openDates.filter((date) => ownedIds.has(date.venueId)),
          ],
          nightStays: [
            ...initialSnapshot.nightStays,
            ...current.nightStays.filter((stay) => ownedIds.has(stay.bandId)),
          ],
          fuelOverrides: current.fuelOverrides.filter((item) => ownedIds.has(item.bandId)),
        });
      },
      requestDate: (openDateId, terms) => {
        const current = readMemory();
        const invalid = termsError(terms);
        if (invalid) return { ok: false, error: invalid };
        if (current.role !== "band") {
          return { ok: false, error: "Switch to a band to request a date." };
        }
        const openDate = current.openDates.find((item) => item.id === openDateId);
        if (!openDate) return { ok: false, error: "That date is no longer listed." };
        if (dateFill(openDate.id, current.bookings) === "filled") {
          return { ok: false, error: "That date is already confirmed." };
        }
        const existing = duplicateBooking(current, openDate.id, current.bandId);
        if (existing) {
          return { ok: false, error: "You already have a conversation on this date." };
        }
        const note = terms.note.trim() || "We'd like this date.";
        const booking: Booking = {
          id: uid("bk"),
          openDateId: openDate.id,
          bandId: current.bandId,
          venueId: openDate.venueId,
          status: "requested",
          awaiting: "venue",
          terms: { ...terms, note },
          events: [eventFor(current, "band", "request", terms, note)],
          createdAt: new Date().toISOString(),
        };
        const candidate = candidateForBooking(current, booking, "pending");
        if (!candidate) return { ok: false, error: "That date is no longer listed." };
        const clash = confirmedClash(current, candidate);
        if (clash) return { ok: false, error: clash };
        update({ ...current, bookings: [booking, ...current.bookings] });
        return { ok: true, data: booking.id, warning: pendingOverlap(current, candidate) ?? undefined };
      },
      sendOffer: (openDateId, bandId, terms) => {
        const current = readMemory();
        const invalid = termsError(terms);
        if (invalid) return { ok: false, error: invalid };
        if (current.role !== "venue") {
          return { ok: false, error: "Switch to a venue to send an offer." };
        }
        const openDate = current.openDates.find((item) => item.id === openDateId);
        if (!openDate || openDate.venueId !== current.venueId) {
          return { ok: false, error: "Pick one of your open dates." };
        }
        if (dateFill(openDate.id, current.bookings) === "filled") {
          return { ok: false, error: "That date is already confirmed." };
        }
        if (!getBand(bandId)) return { ok: false, error: "Pick a band." };
        const existing = duplicateBooking(current, openDate.id, bandId);
        if (existing) {
          return { ok: false, error: "There's already an active conversation with that band." };
        }
        const note = terms.note.trim() || "We'd like to offer you this date.";
        const booking: Booking = {
          id: uid("bk"),
          openDateId: openDate.id,
          bandId,
          venueId: current.venueId,
          status: "offered",
          awaiting: "band",
          terms: { ...terms, note },
          events: [eventFor(current, "venue", "offer", terms, note)],
          createdAt: new Date().toISOString(),
        };
        const candidate = candidateForBooking(current, booking, "pending");
        if (!candidate) return { ok: false, error: "That date is no longer listed." };
        const clash = confirmedClash(current, candidate);
        if (clash) return { ok: false, error: clash };
        update({ ...current, bookings: [booking, ...current.bookings] });
        return { ok: true, data: booking.id, warning: pendingOverlap(current, candidate) ?? undefined };
      },
      counter: (bookingId, terms) => {
        const current = readMemory();
        const invalid = termsError(terms);
        if (invalid) return { ok: false, error: invalid };
        const booking = current.bookings.find((item) => item.id === bookingId);
        if (!booking) return { ok: false, error: "Booking not found." };
        const party = actingParty(current, booking);
        if (!party || booking.awaiting !== party) {
          return { ok: false, error: "It's not your turn to counter." };
        }
        const note = terms.note.trim() || "Counter-offer.";
        const next: Booking = {
          ...booking,
          status: "countered",
          awaiting: party === "band" ? "venue" : "band",
          terms: { ...terms, note },
          events: [...booking.events, eventFor(current, party, "counter", terms, note)],
        };
        update({
          ...current,
          bookings: current.bookings.map((item) => (item.id === booking.id ? next : item)),
        });
        const candidate = candidateForBooking(current, next, "pending");
        return {
          ok: true,
          data: booking.id,
          warning: candidate ? pendingOverlap(current, candidate) ?? undefined : undefined,
        };
      },
      accept: (bookingId) => {
        const current = readMemory();
        const booking = current.bookings.find((item) => item.id === bookingId);
        if (!booking) return { ok: false, error: "Booking not found." };
        const party = actingParty(current, booking);
        if (!party || booking.awaiting !== party) {
          return { ok: false, error: "It's not your turn to accept." };
        }
        const candidate = candidateForBooking(current, booking, "confirmed");
        if (!candidate) return { ok: false, error: "That date is no longer listed." };
        const bill = booking.billId ? current.bills.find((item) => item.id === booking.billId) : undefined;
        const clash = bill
          ? billConfirmedClash(current, memberBandIds(bill.members), booking)
          : confirmedClash(current, candidate);
        if (clash) return { ok: false, error: clash };
        const note = "Accepted. This date is confirmed.";
        const accepted: Booking = {
          ...booking,
          status: "accepted",
          awaiting: null,
          terms: { ...booking.terms, note },
          events: [...booking.events, eventFor(current, party, "accept", booking.terms, note)],
        };
        const venue = getVenue(booking.venueId);
        const closer = venue ? `${venue.bookerName} · ${venue.name}` : "Venue";
        const sameNight = current.bookings.map((item) => {
          if (item.id === booking.id) return accepted;
          if (
            item.openDateId === booking.openDateId &&
            item.status !== "declined" &&
            item.status !== "accepted"
          ) {
            return declineBooking(item, "The date was confirmed with another band.", closer);
          }
          return item;
        });
        let settled = settleConfirmed(current, candidate, {
          bookings: sameNight,
          applications: current.applications,
          interests: current.interests,
        });
        if (bill) {
          for (const bandId of memberBandIds(bill.members)) {
            if (bandId === booking.bandId) continue;
            const member = candidateForBooking(
              current,
              { ...accepted, id: `${accepted.id}:${bandId}`, bandId },
              "confirmed",
            );
            if (!member) continue;
            settled = settleConfirmed(current, member, settled);
          }
        }
        const nextSnapshot = { ...current, ...settled };
        const alerts = [...current.alerts, ...alertsForConfirmation(nextSnapshot, booking.id)];
        update({ ...nextSnapshot, alerts });
        return { ok: true, data: booking.id };
      },
      decline: (bookingId, note) => {
        const current = readMemory();
        const booking = current.bookings.find((item) => item.id === bookingId);
        if (!booking) return { ok: false, error: "Booking not found." };
        const party = actingParty(current, booking);
        if (!party || booking.status === "accepted" || booking.status === "declined") {
          return { ok: false, error: "This conversation is already closed." };
        }
        const message = note.trim() || "Declined.";
        const next: Booking = {
          ...booking,
          status: "declined",
          awaiting: null,
          events: [...booking.events, eventFor(current, party, "decline", booking.terms, message)],
        };
        update({
          ...current,
          bookings: current.bookings.map((item) => (item.id === booking.id ? next : item)),
        });
        return { ok: true, data: booking.id };
      },
      postDate: (input) => {
        const current = readMemory();
        if (current.role !== "venue") {
          return { ok: false, error: "Switch to a venue to post a date." };
        }
        if (!input.date) return { ok: false, error: "Pick a date." };
        if (input.genres.length === 0) return { ok: false, error: "Pick at least one genre." };
        const openDate: OpenDate = {
          ...input,
          id: uid("od"),
          venueId: current.venueId,
        };
        update({ ...current, openDates: [openDate, ...current.openDates] });
        return { ok: true, data: openDate.id };
      },
      postListing: (input) => {
        const current = readMemory();
        if (!input.title.trim()) return { ok: false, error: "Add a title." };
        if (!input.instrument) return { ok: false, error: "Pick an instrument." };
        if (!input.citySlug) return { ok: false, error: "Pick a city." };
        const poster = posterIdentity(current);
        const listing: Listing = {
          ...input,
          title: input.title.trim(),
          id: uid("ls"),
          postedByName: poster.name,
          posterRole: current.role,
          posterId: poster.id,
          contact: poster.contact,
          createdAt: new Date().toISOString(),
        };
        update({ ...current, listings: [listing, ...current.listings] });
        return { ok: true, data: listing.id };
      },
      expressInterest: ({ listingId, profileMusicianId, message }) => {
        const current = readMemory();
        const text = message.trim();
        if (text.length < 8) {
          return { ok: false, error: "Write a short note so they know who you are." };
        }
        const from = posterIdentity(current);
        if (listingId) {
          const listing = current.listings.find((item) => item.id === listingId);
          if (!listing) return { ok: false, error: "That listing is gone." };
          if (listing.posterId === from.id && listing.posterRole === current.role) {
            return { ok: false, error: "That's your own listing." };
          }
          const already = current.interests.find(
            (interest) =>
              interest.listingId === listingId &&
              interest.fromId === from.id &&
              interest.fromRole === current.role,
          );
          if (already) return { ok: false, error: "You already sent a note on this listing." };
        }
        const interest: Interest = {
          id: uid("int"),
          listingId: listingId ?? null,
          profileMusicianId: profileMusicianId ?? null,
          fromName: from.name,
          fromRole: current.role,
          fromId: from.id,
          message: text,
          createdAt: new Date().toISOString(),
          status: "pending",
        };
        const listing = listingId ? current.listings.find((item) => item.id === listingId) : undefined;
        const candidate = listing ? candidateForFillIn(interest, listing, "pending") : null;
        if (candidate) {
          const clash = confirmedClash(current, candidate);
          if (clash) return { ok: false, error: clash };
        }
        update({ ...current, interests: [interest, ...current.interests] });
        return {
          ok: true,
          data: interest.id,
          warning: candidate ? pendingOverlap(current, candidate) ?? undefined : undefined,
        };
      },
      applyToOpportunity: (opportunityId, { setup, note }) => {
        const current = readMemory();
        if (current.role !== "band") {
          return { ok: false, error: "Switch to a band to apply." };
        }
        const opportunity = current.opportunities.find((item) => item.id === opportunityId);
        if (!opportunity) return { ok: false, error: "That listing is gone." };
        const text = note.trim();
        if (text.length < 8) {
          return { ok: false, error: "Write a short note so they know the setup and the time you need." };
        }
        if (!setup.trim()) return { ok: false, error: "Say how you'll set up." };
        const today = new Date();
        const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        if (opportunity.deadline && opportunity.deadline < todayIso) {
          return { ok: false, error: "The application deadline has passed." };
        }
        const existing = current.applications.find(
          (application) =>
            application.opportunityId === opportunityId &&
            application.bandId === current.bandId &&
            application.status !== "declined",
        );
        if (existing) return { ok: false, error: "You already have an application in." };
        const application: Application = {
          id: uid("app"),
          opportunityId,
          bandId: current.bandId,
          status: "applied",
          setup: setup.trim(),
          note: text,
          createdAt: new Date().toISOString(),
        };
        const candidate = candidateForApplication(application, opportunity, "pending");
        const clash = confirmedClash(current, candidate);
        if (clash) return { ok: false, error: clash };
        update({ ...current, applications: [application, ...current.applications] });
        return { ok: true, data: application.id, warning: pendingOverlap(current, candidate) ?? undefined };
      },
      confirmApplication: (applicationId) => {
        const current = readMemory();
        const application = current.applications.find((item) => item.id === applicationId);
        if (!application) return { ok: false, error: "That application is gone." };
        if (current.role !== "band" || current.bandId !== application.bandId) {
          return { ok: false, error: "Only the band on the application can confirm it." };
        }
        if (application.status === "accepted") return { ok: false, error: "This hold is already confirmed." };
        if (application.status !== "applied") return { ok: false, error: "This application is already closed." };
        const opportunity = current.opportunities.find((item) => item.id === application.opportunityId);
        if (!opportunity) return { ok: false, error: "That listing is gone." };
        const candidate = candidateForApplication(application, opportunity, "confirmed");
        const clash = confirmedClash(current, candidate);
        if (clash) return { ok: false, error: clash };
        const applications = current.applications.map((item) =>
          item.id === application.id ? { ...item, status: "accepted" as const } : item,
        );
        const settled = settleConfirmed(current, candidate, {
          bookings: current.bookings,
          applications,
          interests: current.interests,
        });
        update({ ...current, ...settled });
        return { ok: true, data: application.id };
      },
      withdrawApplication: (applicationId) => {
        const current = readMemory();
        const application = current.applications.find((item) => item.id === applicationId);
        if (!application) return { ok: false, error: "That application is gone." };
        if (current.role !== "band" || current.bandId !== application.bandId) {
          return { ok: false, error: "Only the band on the application can withdraw it." };
        }
        if (application.status === "declined") {
          return { ok: false, error: "This application is already closed." };
        }
        update({
          ...current,
          applications: current.applications.map((item) =>
            item.id === application.id ? { ...item, status: "declined" } : item,
          ),
        });
        return { ok: true, data: application.id };
      },
      confirmInterest: (interestId) => {
        const current = readMemory();
        const interest = current.interests.find((item) => item.id === interestId);
        if (!interest?.listingId) return { ok: false, error: "That note is gone." };
        const listing = current.listings.find((item) => item.id === interest.listingId);
        if (!listing) return { ok: false, error: "That listing is gone." };
        if (listing.kind !== "fill-in") return { ok: false, error: "Only a fill-in date can be confirmed." };
        const owner = posterIdentity(current);
        if (listing.posterId !== owner.id || listing.posterRole !== current.role) {
          return { ok: false, error: "Only the listing owner can confirm a player." };
        }
        if (interest.status === "confirmed") return { ok: false, error: "This player is already confirmed." };
        if (interest.status === "declined") return { ok: false, error: "This note is already closed." };
        const candidate = candidateForFillIn(interest, listing, "confirmed");
        if (!candidate) return { ok: false, error: "That listing needs a date before it can be confirmed." };
        const clash = confirmedClash(current, candidate);
        if (clash) return { ok: false, error: clash };
        const interests = current.interests.map((item) =>
          item.id === interest.id ? { ...item, status: "confirmed" as const } : item,
        );
        const settled = settleConfirmed(current, candidate, {
          bookings: current.bookings,
          applications: current.applications,
          interests,
        });
        update({ ...current, ...settled });
        return { ok: true, data: interest.id };
      },
      setRepertoire: (bandId, patch) => {
        const current = readMemory();
        if (current.role !== "band" || current.bandId !== bandId) {
          return { ok: false, error: "Switch to this band to update the setlist." };
        }
        if (!getBand(bandId)) return { ok: false, error: "Save the band profile first." };
        const existing = current.repertoires.find((item) => item.bandId === bandId) ?? {
          bandId,
          music: "mix" as const,
        };
        const music = patch.music ?? existing.music;
        if (music !== "covers" && music !== "originals" && music !== "mix") {
          return { ok: false, error: "Pick covers, originals, or a mix." };
        }
        const next = { bandId, music };
        const repertoires = current.repertoires.some((item) => item.bandId === bandId)
          ? current.repertoires.map((item) => (item.bandId === bandId ? next : item))
          : [...current.repertoires, next];
        update({ ...current, repertoires });
        return { ok: true, data: bandId };
      },
      setBandSize: (bandId, size) => {
        const current = readMemory();
        if (current.role !== "band" || current.bandId !== bandId) {
          return { ok: false, error: "Switch to this band to update the lineup size." };
        }
        if (!getBand(bandId)) return { ok: false, error: "Save the band profile first." };
        if (!(size >= 1) || size > 30) return { ok: false, error: "Enter a lineup of 1 to 30 pieces." };
        const count = Math.round(size);
        const sizes = current.sizes.some((item) => item.bandId === bandId)
          ? current.sizes.map((item) => (item.bandId === bandId ? { ...item, size: count } : item))
          : [...current.sizes, { bandId, size: count }];
        const profiles = current.account.profiles.map((profile) =>
          profile.band?.id === bandId ? { ...profile, band: { ...profile.band, size: count } } : profile,
        );
        update({ ...current, sizes, account: { ...current.account, profiles } });
        return { ok: true, data: bandId };
      },
      setVenueCapacity: (venueId, capacity) => {
        const current = readMemory();
        const demoVenue = current.account.demo && current.role === "venue" && current.venueId === venueId;
        if (!ownsProfile(current, venueId) && !demoVenue) {
          return { ok: false, error: "Switch to this venue to update the capacity." };
        }
        if (!(capacity >= 1) || capacity > 100_000) return { ok: false, error: "Enter the room capacity." };
        const count = Math.round(capacity);
        const capacities = current.capacities.some((item) => item.venueId === venueId)
          ? current.capacities.map((item) => (item.venueId === venueId ? { ...item, capacity: count } : item))
          : [...current.capacities, { venueId, capacity: count }];
        const profiles = current.account.profiles.map((profile) =>
          profile.venue?.id === venueId ? { ...profile, venue: { ...profile.venue, capacity: count } } : profile,
        );
        update({ ...current, capacities, account: { ...current.account, profiles } });
        return { ok: true, data: venueId };
      },
      setProfileMedia: (profileId, patch) => {
        const current = readMemory();
        if (!canEditMedia(current, profileId)) {
          return { ok: false, error: "Switch to this profile to update photos and video." };
        }
        const existing = current.media.find((item) => item.profileId === profileId) ?? {
          profileId,
          promoUse: false,
          logo: null,
          photos: [],
          videos: [],
        };
        let logo = existing.logo;
        if (patch.logo !== undefined) {
          if (patch.logo && !cleanLogo(patch.logo)) {
            return { ok: false, error: "Use a photo or an https link for the logo." };
          }
          logo = cleanLogo(patch.logo);
        }
        let photos = existing.photos;
        if (patch.photos) {
          const filled = patch.photos.filter((photo) => photo.src.trim());
          photos = cleanPhotos(filled);
          if (photos.length !== filled.length) {
            return { ok: false, error: "Photos need to be an upload or an https link." };
          }
        }
        let videos = existing.videos;
        if (patch.videos) {
          const filled = patch.videos.filter((video) => video.url.trim());
          videos = cleanVideos(filled);
          if (videos.length !== filled.length) {
            return { ok: false, error: "Paste a YouTube or Vimeo https link for each video." };
          }
        }
        const next = {
          profileId,
          promoUse: patch.promoUse ?? existing.promoUse,
          logo,
          photos,
          videos,
        };
        const media = current.media.some((item) => item.profileId === profileId)
          ? current.media.map((item) => (item.profileId === profileId ? next : item))
          : [...current.media, next];
        update({ ...current, media });
        return { ok: true, data: profileId };
      },
      addStreamLink: (bandId, service, url) => {
        const current = readMemory();
        if (!ownsProfile(current, bandId)) {
          return { ok: false, error: "Switch to this profile to add a link." };
        }
        const href = url.trim();
        if (!/^https?:\/\/\S+$/i.test(href) || href.length > 200) {
          return { ok: false, error: "Paste a full http or https link." };
        }
        const own = current.streamLinks.filter((link) => link.bandId === bandId);
        if (own.length >= 8) return { ok: false, error: "This band already has 8 links." };
        const link = { id: uid("sl"), bandId, service, url: href };
        update({ ...current, streamLinks: [...current.streamLinks, link] });
        return { ok: true, data: link.id };
      },
      removeStreamLink: (id) => {
        const current = readMemory();
        const link = current.streamLinks.find((item) => item.id === id);
        if (!link) return { ok: false, error: "That link is already gone." };
        if (!ownsProfile(current, link.bandId)) {
          return { ok: false, error: "Switch to this profile to remove a link." };
        }
        update({ ...current, streamLinks: current.streamLinks.filter((item) => item.id !== id) });
        return { ok: true, data: id };
      },
      setNightStay: (stay) => {
        const current = readMemory();
        if (current.role !== "band" || current.bandId !== stay.bandId) {
          return { ok: false, error: "Switch to this band to update lodging." };
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(stay.date)) return { ok: false, error: "That night is missing a date." };
        if (stay.name.trim().length < 2) return { ok: false, error: "Name the place." };
        if (stay.cost < 0 || Number.isNaN(stay.cost)) return { ok: false, error: "Enter a cost of zero or more." };
        if (stay.status === "booked" && stay.confirmation.trim().length < 4) {
          return { ok: false, error: "Add a confirmation note. Sample text is fine." };
        }
        const roomTaken = lodgingClash(current.nightStays, stay);
        if (roomTaken) return { ok: false, error: roomTaken };
        const next: NightStay = {
          id: stay.id ?? uid("ns"),
          bandId: stay.bandId,
          date: stay.date,
          status: stay.status,
          stayId: stay.stayId,
          name: stay.name.trim().slice(0, 80),
          stayType: stay.stayType,
          address: stay.address.trim().slice(0, 120),
          confirmation: stay.confirmation.trim().slice(0, 240),
          cost: Math.round(stay.cost),
        };
        const rest = current.nightStays.filter((item) => !(item.bandId === next.bandId && item.date === next.date));
        update({ ...current, nightStays: [...rest, next] });
        return { ok: true, data: next.id };
      },
      saveVehicle: (vehicle) => {
        const current = readMemory();
        if (current.role !== "band" || current.bandId !== vehicle.bandId) {
          return { ok: false, error: "Switch to this band to edit vehicles." };
        }
        const name = vehicle.name.trim();
        if (name.length < 2) return { ok: false, error: "Name the vehicle." };
        const types: VehicleType[] = ["van", "trailer", "rv", "car"];
        if (!types.includes(vehicle.vehicleType)) return { ok: false, error: "Pick a vehicle type." };
        const fuels: FuelType[] = ["gas", "diesel"];
        if (!fuels.includes(vehicle.fuel)) return { ok: false, error: "Pick gas or diesel." };
        if (!(vehicle.mpg > 0) || vehicle.mpg > 80) return { ok: false, error: "MPG needs to be between 1 and 80." };
        let towMpg: number | null = null;
        if (vehicle.towMpg != null) {
          if (!(vehicle.towMpg > 0) || vehicle.towMpg > 80) {
            return { ok: false, error: "Towing MPG needs to be between 1 and 80, or left blank." };
          }
          towMpg = Math.round(vehicle.towMpg * 10) / 10;
        }
        const own = current.vehicles.filter((item) => item.bandId === vehicle.bandId);
        const existing = vehicle.id ? current.vehicles.find((item) => item.id === vehicle.id) : undefined;
        if (existing && existing.bandId !== vehicle.bandId) {
          return { ok: false, error: "That vehicle belongs to another band." };
        }
        if (!existing && own.length >= 6) return { ok: false, error: "This band already lists 6 vehicles." };
        const next: Vehicle = {
          id: existing?.id ?? uid("veh"),
          bandId: vehicle.bandId,
          name: name.slice(0, 40),
          vehicleType: vehicle.vehicleType,
          mpg: Math.round(vehicle.mpg * 10) / 10,
          fuel: vehicle.fuel,
          towMpg,
        };
        const vehicles = existing
          ? current.vehicles.map((item) => (item.id === next.id ? next : item))
          : [...current.vehicles, next];
        update({ ...current, vehicles });
        return { ok: true, data: next.id };
      },
      removeVehicle: (id) => {
        const current = readMemory();
        const vehicle = current.vehicles.find((item) => item.id === id);
        if (!vehicle) return { ok: false, error: "That vehicle is already gone." };
        if (current.role !== "band" || current.bandId !== vehicle.bandId) {
          return { ok: false, error: "Switch to this band to remove a vehicle." };
        }
        update({ ...current, vehicles: current.vehicles.filter((item) => item.id !== id) });
        return { ok: true, data: id };
      },
      setFuelPrice: (bandId, legId, price) => {
        const current = readMemory();
        if (current.role !== "band" || current.bandId !== bandId) {
          return { ok: false, error: "Switch to this band to set a fuel price." };
        }
        const rest = current.fuelOverrides.filter((item) => !(item.bandId === bandId && item.legId === legId));
        if (price == null) {
          update({ ...current, fuelOverrides: rest });
          return { ok: true, data: legId };
        }
        if (!(price >= 0.5) || price > 20 || Number.isNaN(price)) {
          return { ok: false, error: "Enter a price between $0.50 and $20 a gallon." };
        }
        const existing = current.fuelOverrides.find((item) => item.bandId === bandId && item.legId === legId);
        const next: FuelOverride = {
          id: existing?.id ?? uid("fp"),
          bandId,
          legId,
          price: Math.round(price * 1000) / 1000,
        };
        update({ ...current, fuelOverrides: [...rest, next] });
        return { ok: true, data: next.id };
      },
      saveProfile: (profile, extras) => {
        const current = readMemory();
        const name =
          profile.role === "band"
            ? profile.band?.name
            : profile.role === "venue"
              ? profile.venue?.name
              : profile.role === "fan"
                ? profile.fan?.name
                : profile.musician?.name;
        if (!name || name.trim().length < 2) return { ok: false, error: "Give this profile a name." };
        const now = new Date().toISOString();
        const existing = current.account.profiles.find((item) => item.id === profile.id);
        const nextProfile: OwnedProfile = {
          ...profile,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };
        if (nextProfile.fan && !nextProfile.fan.joinedAt) {
          nextProfile.fan = { ...nextProfile.fan, joinedAt: existing?.fan?.joinedAt ?? now.slice(0, 10) };
        }
        const profiles = existing
          ? current.account.profiles.map((item) => (item.id === nextProfile.id ? nextProfile : item))
          : [...current.account.profiles, nextProfile];
        let repertoires = current.repertoires;
        if (profile.role === "band" && extras?.music) {
          const repertoire: Repertoire = {
            bandId: profile.id,
            music: extras.music,
          };
          repertoires = repertoires.some((item) => item.bandId === profile.id)
            ? repertoires.map((item) => (item.bandId === profile.id ? repertoire : item))
            : [...repertoires, repertoire];
        }
        let openDates = current.openDates;
        if (profile.role === "venue" && extras?.openDates) {
          const additions = extras.openDates
            .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date.date))
            .filter(
              (date) =>
                !openDates.some(
                  (item) => item.venueId === profile.id && item.date === date.date && item.showTime === date.showTime,
                ),
            )
            .map((date) => ({
              ...date,
              id: uid("od"),
              venueId: profile.id,
              genres: date.genres.length > 0 ? date.genres : profile.venue?.genres ?? [],
              notes: date.notes.slice(0, 240),
            }));
          openDates = [...openDates, ...additions];
        }
        const finish = Boolean(extras?.finish);
        let capacities = current.capacities;
        if (profile.venue && profile.venue.capacity >= 1) {
          const count = Math.round(profile.venue.capacity);
          capacities = capacities.some((item) => item.venueId === profile.id)
            ? capacities.map((item) => (item.venueId === profile.id ? { ...item, capacity: count } : item))
            : [...capacities, { venueId: profile.id, capacity: count }];
        }
        update({
          ...current,
          capacities,
          account: {
            phase: finish || current.account.phase === "ready" ? "ready" : "welcome",
            demo: false,
            activeId: profile.id,
            profiles,
          },
          role: profile.role,
          bandId: profile.role === "band" ? profile.id : current.bandId,
          venueId: profile.role === "venue" ? profile.id : current.venueId,
          musicianId: profile.role === "musician" ? profile.id : current.musicianId,
          fanId: profile.role === "fan" ? profile.id : current.fanId,
          repertoires,
          openDates,
        });
        return { ok: true, data: profile.id };
      },
      activateProfile: (id) => {
        const current = readMemory();
        const profile = current.account.profiles.find((item) => item.id === id);
        if (!profile) return { ok: false, error: "That profile is not on this device." };
        update({
          ...current,
          account: { ...current.account, phase: "ready", demo: false, activeId: profile.id },
          role: profile.role,
          bandId: profile.role === "band" ? profile.id : current.bandId,
          venueId: profile.role === "venue" ? profile.id : current.venueId,
          musicianId: profile.role === "musician" ? profile.id : current.musicianId,
          fanId: profile.role === "fan" ? profile.id : current.fanId,
        });
        return { ok: true, data: id };
      },
      requestBandLink: (toBandId) => {
        const current = readMemory();
        if (current.role !== "band") return { ok: false, error: "Switch to a band to tune in." };
        if (toBandId === current.bandId) return { ok: false, error: "Pick another band." };
        if (!getBand(toBandId)) return { ok: false, error: "That band isn't listed." };
        if (pairLinks(current.bandLinks, current.bandId, toBandId).length > 0) {
          return { ok: false, error: "A tune-in with that band is already open." };
        }
        const link = {
          id: uid("link"),
          fromBandId: current.bandId,
          toBandId,
          status: "pending" as const,
          createdAt: new Date().toISOString(),
        };
        update({ ...current, bandLinks: [link, ...current.bandLinks] });
        return { ok: true, data: link.id };
      },
      respondBandLink: (id, status) => {
        const current = readMemory();
        const link = current.bandLinks.find((item) => item.id === id);
        if (!link || link.status !== "pending") return { ok: false, error: "That request is already closed." };
        if (current.role !== "band" || current.bandId !== link.toBandId) {
          return { ok: false, error: "Only the band that was asked can answer." };
        }
        update({
          ...current,
          bandLinks: current.bandLinks.map((item) => (item.id === id ? { ...item, status } : item)),
        });
        return { ok: true, data: id };
      },
      tuneOut: (otherBandId) => {
        const current = readMemory();
        if (current.role !== "band") return { ok: false, error: "Switch to a band to tune out." };
        const next = tuneOutLink(current.bandLinks, current.bandId, otherBandId);
        if (!next.ok) return next;
        update({ ...current, bandLinks: next.links });
        return { ok: true, data: otherBandId };
      },
      saveBill: ({ id, name, members }) => {
        const current = readMemory();
        if (current.role !== "band") return { ok: false, error: "Switch to a band to build a bill." };
        const title = name.trim();
        if (title.length < 2) return { ok: false, error: "Name the bill." };
        const lineup = members.map((member) => ({ ...member, setTime: member.setTime.trim() }));
        if (!lineup.some((member) => member.bandId === current.bandId && member.role === "Headliner")) {
          return { ok: false, error: "The band building the bill is the headliner." };
        }
        const problem = billProblem(lineup);
        if (problem) return { ok: false, error: problem };
        if (id) {
          const existing = current.bills.find((item) => item.id === id);
          if (!existing || existing.leadBandId !== current.bandId) {
            return { ok: false, error: "Only the lead band can edit this bill." };
          }
          const booking = existing.bookingId
            ? current.bookings.find((item) => item.id === existing.bookingId)
            : undefined;
          if (booking && booking.status === "accepted") {
            return { ok: false, error: "This bill is already confirmed." };
          }
          update({
            ...current,
            bills: current.bills.map((item) => (item.id === id ? { ...item, name: title, members: lineup } : item)),
          });
          return { ok: true, data: id };
        }
        const bill = {
          id: uid("bill"),
          name: title,
          leadBandId: current.bandId,
          members: lineup,
          openDateId: null,
          venueId: null,
          bookingId: null,
          createdAt: new Date().toISOString(),
        };
        update({ ...current, bills: [bill, ...current.bills] });
        return { ok: true, data: bill.id };
      },
      pitchBill: (billId, openDateId, terms) => {
        const current = readMemory();
        const invalid = termsError(terms);
        if (invalid) return { ok: false, error: invalid };
        if (current.role !== "band") return { ok: false, error: "Switch to a band to pitch a bill." };
        const bill = current.bills.find((item) => item.id === billId);
        if (!bill) return { ok: false, error: "That bill is gone." };
        if (bill.leadBandId !== current.bandId) {
          return { ok: false, error: "Only the headlining band can pitch this bill." };
        }
        const problem = billProblem(bill.members);
        if (problem) return { ok: false, error: problem };
        const openDate = current.openDates.find((item) => item.id === openDateId);
        if (!openDate) return { ok: false, error: "That date is no longer listed." };
        if (dateFill(openDate.id, current.bookings) === "filled") {
          return { ok: false, error: "That date is already confirmed." };
        }
        const held = bill.bookingId ? current.bookings.find((item) => item.id === bill.bookingId) : undefined;
        if (held && held.status !== "declined") {
          return { ok: false, error: "This bill already has an active conversation." };
        }
        if (duplicateBooking(current, openDate.id, current.bandId)) {
          return { ok: false, error: "You already have a conversation on this date." };
        }
        const note = terms.note.trim() || "We'd like this date as a stacked bill.";
        const booking: Booking = {
          id: uid("bk"),
          openDateId: openDate.id,
          bandId: current.bandId,
          venueId: openDate.venueId,
          billId: bill.id,
          status: "requested",
          awaiting: "venue",
          terms: { ...terms, note },
          events: [eventFor(current, "band", "request", terms, note)],
          createdAt: new Date().toISOString(),
        };
        const clash = billConfirmedClash(current, memberBandIds(bill.members), booking);
        if (clash) return { ok: false, error: clash };
        const warning = billPendingWarning(current, memberBandIds(bill.members), booking) ?? undefined;
        update({
          ...current,
          bookings: [booking, ...current.bookings],
          bills: current.bills.map((item) =>
            item.id === bill.id
              ? { ...item, openDateId: openDate.id, venueId: openDate.venueId, bookingId: booking.id }
              : item,
          ),
        });
        return { ok: true, data: booking.id, warning };
      },
      offerBill: (billId, openDateId, terms) => {
        const current = readMemory();
        const invalid = termsError(terms);
        if (invalid) return { ok: false, error: invalid };
        if (current.role !== "venue") return { ok: false, error: "Switch to a venue to offer a bill." };
        const bill = current.bills.find((item) => item.id === billId);
        if (!bill) return { ok: false, error: "That bill is gone." };
        const problem = billProblem(bill.members);
        if (problem) return { ok: false, error: problem };
        const openDate = current.openDates.find((item) => item.id === openDateId);
        if (!openDate || openDate.venueId !== current.venueId) {
          return { ok: false, error: "Pick one of your open dates." };
        }
        if (dateFill(openDate.id, current.bookings) === "filled") {
          return { ok: false, error: "That date is already confirmed." };
        }
        const held = bill.bookingId ? current.bookings.find((item) => item.id === bill.bookingId) : undefined;
        if (held && held.status !== "declined") {
          return { ok: false, error: "This bill already has an active conversation." };
        }
        if (duplicateBooking(current, openDate.id, bill.leadBandId)) {
          return { ok: false, error: "There's already an active conversation with that band." };
        }
        const note = terms.note.trim() || "One offer for the whole bill.";
        const booking: Booking = {
          id: uid("bk"),
          openDateId: openDate.id,
          bandId: bill.leadBandId,
          venueId: current.venueId,
          billId: bill.id,
          status: "offered",
          awaiting: "band",
          terms: { ...terms, note },
          events: [eventFor(current, "venue", "offer", terms, note)],
          createdAt: new Date().toISOString(),
        };
        const clash = billConfirmedClash(current, memberBandIds(bill.members), booking);
        if (clash) return { ok: false, error: clash };
        const warning = billPendingWarning(current, memberBandIds(bill.members), booking) ?? undefined;
        update({
          ...current,
          bookings: [booking, ...current.bookings],
          bills: current.bills.map((item) =>
            item.id === bill.id
              ? { ...item, openDateId: openDate.id, venueId: current.venueId, bookingId: booking.id }
              : item,
          ),
        });
        return { ok: true, data: booking.id, warning };
      },
      follow: (targetId, targetRole) => {
        const current = readMemory();
        if (current.role !== "fan") return { ok: false, error: "Switch to a fan profile to follow." };
        if (!getFan(current.fanId)) return { ok: false, error: "Save a fan profile first." };
        const exists = targetRole === "band" ? getBand(targetId) : getVenue(targetId);
        if (!exists) return { ok: false, error: "That profile is not listed." };
        if (isFollowing(current.follows, current.fanId, targetId)) return { ok: true, data: targetId };
        update({
          ...current,
          follows: [
            ...current.follows,
            {
              id: uid("fl"),
              fanId: current.fanId,
              targetId,
              targetRole,
              createdAt: new Date().toISOString(),
            },
          ],
        });
        return { ok: true, data: targetId };
      },
      unfollow: (targetId) => {
        const current = readMemory();
        if (current.role !== "fan") return { ok: false, error: "Switch to a fan profile to follow." };
        update({
          ...current,
          follows: current.follows.filter((item) => !(item.fanId === current.fanId && item.targetId === targetId)),
        });
        return { ok: true, data: targetId };
      },
      setRsvp: (bookingId, status) => {
        const current = readMemory();
        if (current.role !== "fan") return { ok: false, error: "Switch to a fan profile to RSVP." };
        if (!publicShow(current, bookingId)) {
          return { ok: false, error: "Only a confirmed show can take an RSVP." };
        }
        const currentStatus = current.rsvps.find((item) => item.fanId === current.fanId && item.bookingId === bookingId)?.status ?? null;
        const next = nextRsvp(currentStatus, status);
        const rest = current.rsvps.filter((item) => !(item.fanId === current.fanId && item.bookingId === bookingId));
        update({
          ...current,
          rsvps: next
            ? [...rest, { id: uid("rsvp"), fanId: current.fanId, bookingId, status: next, createdAt: new Date().toISOString() }]
            : rest,
        });
        return { ok: true, data: bookingId };
      },
      markAlertsRead: () => {
        const current = readMemory();
        if (current.role !== "fan") return { ok: false, error: "Switch to a fan profile to read alerts." };
        update({
          ...current,
          alerts: current.alerts.map((alert) => (alert.fanId === current.fanId ? { ...alert, read: true } : alert)),
        });
        return { ok: true, data: current.fanId };
      },
      addReview: (bookingId, rating, note) => {
        const current = readMemory();
        const draft = reviewDraft(current, bookingId, rating, note);
        if (!draft.ok) return draft;
        const review = { ...draft.data, id: uid("rv"), createdAt: new Date().toISOString() };
        update({ ...current, reviews: [...current.reviews, review] });
        return { ok: true, data: review.id };
      },
      setVerification: (profileId, field, checked) => {
        const current = readMemory();
        const prior = current.verifications.find((item) => item.profileId === profileId) ?? {
          profileId,
          email: false,
          phone: false,
          address: false,
        };
        const next = { ...prior, [field]: checked };
        update({
          ...current,
          verifications: [...current.verifications.filter((item) => item.profileId !== profileId), next],
        });
        return { ok: true, data: profileId };
      },
      startPitch: (openDateId, partnerIds, preset) => {
        const current = readMemory();
        if (current.role !== "band") return { ok: false, error: "Switch to a band to invite someone." };
        const openDate = current.openDates.find((item) => item.id === openDateId);
        if (!openDate) return { ok: false, error: "That date is no longer listed." };
        if (dateFill(openDate.id, current.bookings) === "filled") {
          return { ok: false, error: "That date is already confirmed." };
        }
        const existing = current.pitches.find(
          (pitch) => pitch.leadBandId === current.bandId && pitch.openDateId === openDate.id && !pitch.bookingId,
        );
        if (existing) return { ok: true, data: existing.id };
        const members = buildPitchMembers(current.bandId, partnerIds, openDate.showTime, preset);
        if (!members) return { ok: false, error: "Pick one to three other bands." };
        if (members.some((member) => !getBand(member.bandId))) return { ok: false, error: "One of those bands is missing." };
        const venue = getVenue(openDate.venueId);
        if (!venue) return { ok: false, error: "That room is missing." };
        const bands = members.flatMap((member) => {
          const band = getBand(member.bandId);
          return band ? [band] : [];
        });
        const guarantee = pitchGuarantee(bands);
        const head = members[0];
        const openers = members.slice(1);
        const body = `${formatDayLong(openDate.date)} at ${venue.name}. ${openers
          .map((member) => `${getBand(member.bandId)?.name ?? "Band"} would open at ${member.setTime} for ${member.splitPercent}%`)
          .join(". ")}. I headline at ${head?.setTime} for ${head?.splitPercent}%. ${venue.name} is not in this conversation yet.`;
        const pitch = {
          id: uid("pitch"),
          leadBandId: current.bandId,
          openDateId: openDate.id,
          venueId: venue.id,
          members,
          terms: defaultTerms({
            guarantee,
            note: "One offer for the whole night, after every band accepts.",
          }),
          messages: [{ id: uid("pm"), fromBandId: current.bandId, body, createdAt: new Date().toISOString() }],
          bookingId: null,
          createdAt: new Date().toISOString(),
        };
        update({ ...current, pitches: [pitch, ...current.pitches] });
        return { ok: true, data: pitch.id };
      },
      acceptPitch: (pitchId) => {
        const current = readMemory();
        if (current.role !== "band") return { ok: false, error: "Switch to a band to accept." };
        const pitch = current.pitches.find((item) => item.id === pitchId);
        if (!pitch || pitch.bookingId) return { ok: false, error: "That invite is no longer open." };
        const mine = pitch.members.find((member) => member.bandId === current.bandId);
        if (!mine) return { ok: false, error: "This invite is for the bands on the pitch." };
        if (mine.status === "accepted") return { ok: true, data: pitch.id };
        update({
          ...current,
          pitches: current.pitches.map((item) =>
            item.id === pitch.id
              ? {
                  ...item,
                  members: item.members.map((member) =>
                    member.bandId === current.bandId ? { ...member, status: "accepted" as const } : member,
                  ),
                }
              : item,
          ),
        });
        return { ok: true, data: pitch.id };
      },
      suggestPitchChange: (pitchId, input) => {
        const current = readMemory();
        if (current.role !== "band") return { ok: false, error: "Switch to a band to suggest a change." };
        const pitch = current.pitches.find((item) => item.id === pitchId);
        if (!pitch || pitch.bookingId) return { ok: false, error: "That pitch was already sent." };
        if (!pitch.members.some((member) => member.bandId === current.bandId)) {
          return { ok: false, error: "This pitch is between the invited bands." };
        }
        const changed = applyMemberChange(pitch.members, current.bandId, input.setTime, input.splitPercent);
        if (!changed.ok) return changed;
        const note = input.note.trim();
        if (note.length < 4) return { ok: false, error: "Say what you want to change." };
        const leak = contactProblem(note);
        if (leak) return { ok: false, error: leak };
        const mine = changed.members.find((member) => member.bandId === current.bandId);
        const name = getBand(current.bandId)?.name ?? "Band";
        const body = `${name} suggested ${mine?.setTime} and ${mine?.splitPercent}%. ${note}`;
        update({
          ...current,
          pitches: current.pitches.map((item) =>
            item.id === pitch.id
              ? {
                  ...item,
                  members: changed.members,
                  messages: [
                    ...item.messages,
                    { id: uid("pm"), fromBandId: current.bandId, body, createdAt: new Date().toISOString() },
                  ],
                }
              : item,
          ),
        });
        return { ok: true, data: pitch.id };
      },
      addPitchMessage: (pitchId, body) => {
        const current = readMemory();
        if (current.role !== "band") return { ok: false, error: "Switch to a band to write in this thread." };
        const pitch = current.pitches.find((item) => item.id === pitchId);
        if (!pitch) return { ok: false, error: "That pitch is gone." };
        if (pitch.bookingId) return { ok: false, error: "This thread closed when the offer went to the venue." };
        if (!pitch.members.some((member) => member.bandId === current.bandId)) {
          return { ok: false, error: "Only the bands on this pitch can read it." };
        }
        const clean = body.trim();
        if (clean.length < 2) return { ok: false, error: "Write a message." };
        if (clean.length > 280) return { ok: false, error: "Keep it to a few sentences." };
        const leak = contactProblem(clean);
        if (leak) return { ok: false, error: leak };
        update({
          ...current,
          pitches: current.pitches.map((item) =>
            item.id === pitch.id
              ? {
                  ...item,
                  messages: [
                    ...item.messages,
                    { id: uid("pm"), fromBandId: current.bandId, body: clean, createdAt: new Date().toISOString() },
                  ],
                }
              : item,
          ),
        });
        return { ok: true, data: pitch.id };
      },
      sendPitchToVenue: (pitchId) => {
        const current = readMemory();
        if (current.role !== "band") return { ok: false, error: "Switch to a band to send this." };
        const pitch = current.pitches.find((item) => item.id === pitchId);
        if (!pitch) return { ok: false, error: "That pitch is gone." };
        if (pitch.leadBandId !== current.bandId) {
          return { ok: false, error: "The headlining band sends the offer." };
        }
        const block = sendBlock(pitch);
        if (block) return { ok: false, error: block };
        const invalid = termsError(pitch.terms);
        if (invalid) return { ok: false, error: invalid };
        const openDate = current.openDates.find((item) => item.id === pitch.openDateId);
        if (!openDate) return { ok: false, error: "That date is no longer listed." };
        if (dateFill(openDate.id, current.bookings) === "filled") {
          return { ok: false, error: "That date is already confirmed." };
        }
        if (duplicateBooking(current, openDate.id, current.bandId)) {
          return { ok: false, error: "You already have a conversation on this date." };
        }
        const venue = getVenue(openDate.venueId);
        const members = pitch.members.map(({ bandId, role, setTime, splitPercent }) => ({
          bandId,
          role,
          setTime,
          splitPercent,
        }));
        const problem = billProblem(members);
        if (problem) return { ok: false, error: problem };
        const note = pitch.terms.note.trim() || "Every band on this bill accepted. One offer for the night.";
        const bill = {
          id: uid("bill"),
          name: `${venue?.name ?? "Room"} full night`,
          leadBandId: current.bandId,
          members,
          openDateId: openDate.id,
          venueId: openDate.venueId,
          bookingId: null as string | null,
          createdAt: new Date().toISOString(),
        };
        const booking: Booking = {
          id: uid("bk"),
          openDateId: openDate.id,
          bandId: current.bandId,
          venueId: openDate.venueId,
          billId: bill.id,
          status: "requested",
          awaiting: "venue",
          terms: { ...pitch.terms, note },
          events: [eventFor(current, "band", "request", pitch.terms, note)],
          createdAt: new Date().toISOString(),
        };
        bill.bookingId = booking.id;
        const clash = billConfirmedClash(current, memberBandIds(members), booking);
        if (clash) return { ok: false, error: clash };
        const warning = billPendingWarning(current, memberBandIds(members), booking) ?? undefined;
        update({
          ...current,
          bookings: [booking, ...current.bookings],
          bills: [{ ...bill, bookingId: booking.id }, ...current.bills],
          pitches: current.pitches.map((item) => (item.id === pitch.id ? { ...item, bookingId: booking.id } : item)),
        });
        return { ok: true, data: booking.id, warning };
      },
      addPeerReview: (bookingId, toBandId, checks, note) => {
        const current = readMemory();
        const draft = peerReviewDraft(current, bookingId, toBandId, checks, note);
        if (!draft.ok) return draft;
        const review = { ...draft.data, id: uid("pr"), createdAt: new Date().toISOString() };
        update({ ...current, peerReviews: [...current.peerReviews, review] });
        return { ok: true, data: review.id };
      },
      sendDirect: (toId, toRole, body) => {
        const current = readMemory();
        const result = sendDirectMessage(current, toId, toRole, body, todayIso());
        if (!result.ok) return result;
        update(result.snapshot);
        return { ok: true, data: result.data };
      },
      openDirectThread: (toId, toRole) => {
        const current = readMemory();
        const result = ensureDirectThread(current, toId, toRole);
        if (!result.ok) return result;
        if (result.snapshot !== current) update(result.snapshot);
        return { ok: true, data: result.data };
      },
      sendFanMail: (bandId, venueId, body) => {
        const current = readMemory();
        const result = sendFanMessage(current, bandId, venueId, body, todayIso());
        if (!result.ok) return result;
        update(result.snapshot);
        return { ok: true, data: result.data };
      },
      replyThread: (threadId, body) => {
        const current = readMemory();
        const result = replyToThread(current, threadId, body, todayIso());
        if (!result.ok) return result;
        update(result.snapshot);
        return { ok: true, data: result.data };
      },
      markThreadRead: (threadId) => {
        const current = readMemory();
        const result = markRead(current, threadId);
        if (!result.ok) return result;
        if (result.snapshot !== current) update(result.snapshot);
        return { ok: true, data: threadId };
      },
      setFanMail: (enabled) => {
        const current = readMemory();
        const result = setFanMailEnabled(current, enabled);
        if (!result.ok) return result;
        update(result.snapshot);
        return { ok: true, data: result.data };
      },
      blockFan: (fanId, report) => {
        const current = readMemory();
        const result = blockFanAccount(current, fanId, report);
        if (!result.ok) return result;
        update(result.snapshot);
        return { ok: true, data: result.data };
      },
      openBookingThread: (bookingId) => {
        const current = readMemory();
        const result = ensureBookingThread(current, bookingId);
        if (!result.ok) return result;
        if (result.snapshot !== current) update(result.snapshot);
        return { ok: true, data: result.data };
      },
      exploreDemo: (role = "band") => {
        const current = readMemory();
        update({
          ...current,
          account: { ...current.account, phase: "ready", demo: true },
          role,
          bandId: "mesa-dust",
          venueId: "high-country",
          musicianId: "lena-ortiz",
          fanId: "avery-quinn",
        });
      },
    };
  }, [snapshot]);

  return <AppContext.Provider value={api}>{children}</AppContext.Provider>;
}

function actingParty(snapshot: Snapshot, booking: Booking): Party | null {
  if (snapshot.role === "band" && snapshot.bandId === booking.bandId) return "band";
  if (snapshot.role === "venue" && snapshot.venueId === booking.venueId) return "venue";
  return null;
}

function posterIdentity(snapshot: Snapshot) {
  if (snapshot.role === "band") {
    const band = getBand(snapshot.bandId);
    return {
      id: snapshot.bandId,
      name: band?.name ?? "Band",
      contact: `${(band?.name ?? "band").toLowerCase().replace(/[^a-z0-9]+/g, "")}@bands.example`,
    };
  }
  if (snapshot.role === "venue") {
    const venue = getVenue(snapshot.venueId);
    return {
      id: snapshot.venueId,
      name: venue?.name ?? "Venue",
      contact: venue?.bookerEmail ?? "booker@venue.example",
    };
  }
  const musician = getMusician(snapshot.musicianId);
  return {
    id: snapshot.musicianId,
    name: musician?.name ?? "Musician",
    contact: musician?.email ?? "player@players.example",
  };
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
