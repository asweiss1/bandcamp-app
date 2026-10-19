"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { getBand, getMusician, getVenue } from "@/lib/catalog";
import { clearAudioTracks } from "@/lib/audio-db";
import { termsError, uid } from "@/lib/deal";
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
  StreamService,
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
    !Array.isArray(memory.streamLinks)
  ) {
    memory = {
      ...memory,
      opportunities: Array.isArray(memory.opportunities) ? memory.opportunities : initialSnapshot.opportunities,
      applications: Array.isArray(memory.applications) ? memory.applications : initialSnapshot.applications,
      repertoires: Array.isArray(memory.repertoires) ? memory.repertoires : initialSnapshot.repertoires,
      streamLinks: Array.isArray(memory.streamLinks) ? memory.streamLinks : initialSnapshot.streamLinks,
    };
  }
  return memory;
}

function writeMemory(next: Snapshot) {
  memory = next;
  loaded = true;
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

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

type AppContextValue = {
  ready: boolean;
  snapshot: Snapshot;
  setRole: (role: Role) => void;
  setBandId: (id: string) => void;
  setVenueId: (id: string) => void;
  setMusicianId: (id: string) => void;
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
    >,
  ) => Result<string>;
  expressInterest: (input: {
    listingId?: string;
    profileMusicianId?: string;
    message: string;
  }) => Result<string>;
  applyToOpportunity: (opportunityId: string, input: { setup: string; note: string }) => Result<string>;
  withdrawApplication: (applicationId: string) => Result<string>;
  setRepertoire: (bandId: string, patch: Partial<Omit<Repertoire, "bandId">>) => Result<string>;
  addStreamLink: (bandId: string, service: StreamService, url: string) => Result<string>;
  removeStreamLink: (id: string) => Result<string>;
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, readMemory, serverSnapshot);

  const api = useMemo<AppContextValue>(() => {
    const update = (next: Snapshot) => {
      writeMemory(next);
    };

    return {
      ready: true,
      snapshot,
      setRole: (role) => update({ ...readMemory(), role }),
      setBandId: (bandId) => update({ ...readMemory(), bandId }),
      setVenueId: (venueId) => update({ ...readMemory(), venueId }),
      setMusicianId: (musicianId) => update({ ...readMemory(), musicianId }),
      reset: () => {
        localRepository.clear();
        void clearAudioTracks();
        update(initialSnapshot);
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
        update({ ...current, bookings: [booking, ...current.bookings] });
        return { ok: true, data: booking.id };
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
        update({ ...current, bookings: [booking, ...current.bookings] });
        return { ok: true, data: booking.id };
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
        return { ok: true, data: booking.id };
      },
      accept: (bookingId) => {
        const current = readMemory();
        const booking = current.bookings.find((item) => item.id === bookingId);
        if (!booking) return { ok: false, error: "Booking not found." };
        const party = actingParty(current, booking);
        if (!party || booking.awaiting !== party) {
          return { ok: false, error: "It's not your turn to accept." };
        }
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
        const bookings = current.bookings.map((item) => {
          if (item.id === booking.id) return accepted;
          if (
            item.openDateId === booking.openDateId &&
            item.status !== "declined" &&
            item.status !== "accepted"
          ) {
            const declineNote = "The date was confirmed with another band.";
            return {
              ...item,
              status: "declined" as const,
              awaiting: null,
              events: [
                ...item.events,
                {
                  id: uid("ev"),
                  at: new Date().toISOString(),
                  actor: "venue" as const,
                  actorName: closer,
                  kind: "decline" as const,
                  terms: item.terms,
                  note: declineNote,
                },
              ],
            };
          }
          return item;
        });
        update({ ...current, bookings });
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
        };
        update({ ...current, interests: [interest, ...current.interests] });
        return { ok: true, data: interest.id };
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
        update({ ...current, applications: [application, ...current.applications] });
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
      setRepertoire: (bandId, patch) => {
        const current = readMemory();
        if (current.role !== "band" || current.bandId !== bandId) {
          return { ok: false, error: "Switch to this band to update the setlist." };
        }
        if (!getBand(bandId)) return { ok: false, error: "That band is not in the sample set." };
        const existing =
          current.repertoires.find((item) => item.bandId === bandId) ?? {
            bandId,
            originalsOnly: false,
            coversNote: "",
            rightsAttested: false,
          };
        const next = {
          ...existing,
          ...patch,
          bandId,
          coversNote: (patch.coversNote ?? existing.coversNote).slice(0, 240),
        };
        const repertoires = current.repertoires.some((item) => item.bandId === bandId)
          ? current.repertoires.map((item) => (item.bandId === bandId ? next : item))
          : [...current.repertoires, next];
        update({ ...current, repertoires });
        return { ok: true, data: bandId };
      },
      addStreamLink: (bandId, service, url) => {
        const current = readMemory();
        if (current.role !== "band" || current.bandId !== bandId) {
          return { ok: false, error: "Switch to this band to add a link." };
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
        if (current.role !== "band" || current.bandId !== link.bandId) {
          return { ok: false, error: "Switch to this band to remove a link." };
        }
        update({ ...current, streamLinks: current.streamLinks.filter((item) => item.id !== id) });
        return { ok: true, data: id };
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
