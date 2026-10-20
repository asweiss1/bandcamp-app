import { getBand, getFan, getVenue, listFans } from "@/lib/catalog";
import { slotLine } from "@/lib/daypart";
import { formatDayLong, money } from "@/lib/deal";
import { milesBetween, placeForSlug } from "@/lib/geo";
import type { Fan, FanAlert, Follow, Rsvp, RsvpStatus, Snapshot } from "@/lib/types";

export const DRAW_MILES = 50;

export type ShowAct = { bandId: string; name: string; role: string; setTime: string };

export type PublicShow = {
  bookingId: string;
  title: string;
  date: string;
  dateLabel: string;
  when: string;
  age: string;
  cover: string;
  ticketPrice: number | null;
  city: string;
  citySlug: string;
  address: string;
  lat: number;
  lng: number;
  venueId: string;
  venueName: string;
  bandIds: string[];
  lineup: ShowAct[];
};

export function todayIso(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function followerCount(follows: Follow[], targetId: string) {
  return follows.filter((item) => item.targetId === targetId).length;
}

export function isFollowing(follows: Follow[], fanId: string, targetId: string) {
  return follows.some((item) => item.fanId === fanId && item.targetId === targetId);
}

export function publicShow(snapshot: Snapshot, bookingId: string): PublicShow | null {
  const booking = snapshot.bookings.find((item) => item.id === bookingId);
  if (!booking || booking.status !== "accepted") return null;
  const venue = getVenue(booking.venueId);
  const openDate = snapshot.openDates.find((item) => item.id === booking.openDateId);
  const place = venue ? placeForSlug(venue.citySlug) : null;
  if (!venue || !openDate || !place) return null;
  const bill = booking.billId ? snapshot.bills.find((item) => item.id === booking.billId) : undefined;
  const lineup: ShowAct[] = bill
    ? bill.members.flatMap((member) => {
        const band = getBand(member.bandId);
        if (!band) return [];
        return [{ bandId: band.id, name: band.name, role: member.role, setTime: member.setTime }];
      })
    : (() => {
        const band = getBand(booking.bandId);
        if (!band) return [];
        return [{ bandId: band.id, name: band.name, role: "Headliner", setTime: openDate.showTime }];
      })();
  if (lineup.length === 0) return null;
  const head = lineup.find((act) => act.role === "Headliner") ?? lineup[0];
  return {
    bookingId: booking.id,
    title: bill?.name ?? `${head.name} at ${venue.name}`,
    date: openDate.date,
    dateLabel: formatDayLong(openDate.date),
    when: slotLine(openDate.showTime, openDate.daypart),
    age: openDate.age,
    cover: booking.terms.ticketPrice == null ? "Cover at the door" : `${money(booking.terms.ticketPrice)} cover`,
    ticketPrice: booking.terms.ticketPrice,
    city: venue.city,
    citySlug: venue.citySlug,
    address: venue.address?.trim() || `${venue.neighborhood}, ${venue.city}`,
    lat: place.lat,
    lng: place.lng,
    venueId: venue.id,
    venueName: venue.name,
    bandIds: lineup.map((act) => act.bandId),
    lineup,
  };
}

export function publicShows(snapshot: Snapshot, from = todayIso()) {
  return snapshot.bookings
    .flatMap((booking) => {
      const show = publicShow(snapshot, booking.id);
      if (!show || show.date < from) return [];
      return [show];
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.when.localeCompare(b.when));
}

export function followedShows(snapshot: Snapshot, fanId: string, from = todayIso()) {
  const targets = new Set(snapshot.follows.filter((item) => item.fanId === fanId).map((item) => item.targetId));
  return publicShows(snapshot, from).filter(
    (show) => targets.has(show.venueId) || show.bandIds.some((id) => targets.has(id)),
  );
}

export function fanHome(snapshot: Snapshot) {
  if (snapshot.role !== "fan") return null;
  return getFan(snapshot.fanId) ?? null;
}

export function milesFromFan(fan: Fan, lat: number, lng: number) {
  return Math.round(milesBetween(fan, { lat, lng }));
}

export function nearShows(snapshot: Snapshot, fan: Fan, radiusMiles: number, from = todayIso(), to = "") {
  return publicShows(snapshot, from)
    .filter((show) => !to || show.date <= to)
    .flatMap((show) => {
      const miles = milesFromFan(fan, show.lat, show.lng);
      if (miles > radiusMiles) return [];
      return [{ ...show, miles }];
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.miles - b.miles);
}

export function rsvpFor(rsvps: Rsvp[], fanId: string, bookingId: string) {
  return rsvps.find((item) => item.fanId === fanId && item.bookingId === bookingId) ?? null;
}

export function rsvpCounts(rsvps: Rsvp[], bookingId: string) {
  const rows = rsvps.filter((item) => item.bookingId === bookingId);
  return {
    going: rows.filter((item) => item.status === "going").length,
    interested: rows.filter((item) => item.status === "interested").length,
  };
}

function fanById(fanId: string) {
  return listFans().find((fan) => fan.id === fanId) ?? null;
}

export function drawFor(
  snapshot: Pick<Snapshot, "follows" | "rsvps">,
  bandIds: string[],
  venue: { citySlug: string; name: string },
  bookingId: string | null,
  miles = DRAW_MILES,
) {
  const place = placeForSlug(venue.citySlug);
  const bandSet = new Set(bandIds);
  const followers = snapshot.follows.filter((item) => item.targetRole === "band" && bandSet.has(item.targetId));
  const followerIds = new Set(followers.map((item) => item.fanId));
  const nearbyIds = new Set<string>();
  if (place) {
    for (const fanId of followerIds) {
      const fan = fanById(fanId);
      if (!fan) continue;
      if (milesFromFan(fan, place.lat, place.lng) <= miles) nearbyIds.add(fanId);
    }
  }
  const counts = bookingId ? rsvpCounts(snapshot.rsvps, bookingId) : { going: 0, interested: 0 };
  for (const rsvp of snapshot.rsvps) {
    if (bookingId && rsvp.bookingId === bookingId) nearbyIds.add(rsvp.fanId);
  }
  return {
    followers: followerIds.size,
    nearby: nearbyIds.size,
    going: counts.going,
    interested: counts.interested,
    miles,
    venueName: venue.name,
  };
}

export function alertsForConfirmation(snapshot: Snapshot, bookingId: string): FanAlert[] {
  const show = publicShow(snapshot, bookingId);
  if (!show) return [];
  const createdAt = new Date().toISOString();
  const next: FanAlert[] = [];
  for (const fan of listFans()) {
    const follows = snapshot.follows.filter((item) => item.fanId === fan.id);
    const followsBand = follows.some((item) => item.targetRole === "band" && show.bandIds.includes(item.targetId));
    const followsVenue = follows.some((item) => item.targetRole === "venue" && item.targetId === show.venueId);
    const miles = milesFromFan(fan, show.lat, show.lng);
    if (followsBand && miles <= fan.radiusMiles) {
      const band = getBand(show.bandIds[0]);
      next.push({
        id: `al-${fan.id}-${show.bookingId}-band`,
        fanId: fan.id,
        bookingId: show.bookingId,
        kind: "band-near",
        title: `${band?.name ?? "A band you follow"} booked a date near you`,
        body: `${show.dateLabel} at ${show.venueName} in ${show.city}. This confirmed show is inside your radius.`,
        createdAt,
        read: false,
      });
    }
    if (followsVenue) {
      const names = show.lineup.map((act) => act.name).join(", ");
      next.push({
        id: `al-${fan.id}-${show.bookingId}-venue`,
        fanId: fan.id,
        bookingId: show.bookingId,
        kind: "venue-lineup",
        title: `${show.venueName} posted a lineup`,
        body: `${names} ${show.lineup.length === 1 ? "is" : "are"} confirmed for ${show.dateLabel} at ${show.when}.`,
        createdAt,
        read: false,
      });
    }
  }
  return next.filter(
    (alert) =>
      !snapshot.alerts.some(
        (existing) =>
          existing.fanId === alert.fanId && existing.bookingId === alert.bookingId && existing.kind === alert.kind,
      ),
  );
}

export function calendarIcs(show: PublicShow) {
  const start = stamp(show.date, show.lineup[0]?.setTime ?? "8:00pm");
  const end = stamp(show.date, show.lineup[0]?.setTime ?? "8:00pm", 90);
  const summary = show.lineup.map((act) => act.name).join(", ") + ` at ${show.venueName}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BandCamp//Shows//EN",
    "BEGIN:VEVENT",
    `UID:${show.bookingId}@bandcamp.prototype`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(summary)}`,
    `LOCATION:${escapeIcs(`${show.venueName}, ${show.address}`)}`,
    `DESCRIPTION:${escapeIcs(`${show.when}. ${show.age}. ${show.cover}.`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

function stamp(date: string, time: string, addMinutes = 0) {
  const [y, m, d] = date.split("-").map(Number);
  const match = /^(\d{1,2}):(\d{2})(am|pm)$/i.exec(time.trim());
  let hours = 20;
  let minutes = 0;
  if (match) {
    hours = Number(match[1]) % 12;
    if (match[3].toLowerCase() === "pm") hours += 12;
    minutes = Number(match[2]);
  }
  const utc = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, hours, minutes + addMinutes));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${utc.getUTCFullYear()}${pad(utc.getUTCMonth() + 1)}${pad(utc.getUTCDate())}T${pad(utc.getUTCHours())}${pad(utc.getUTCMinutes())}00Z`;
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function nextRsvp(current: RsvpStatus | null, choice: RsvpStatus): RsvpStatus | null {
  return current === choice ? null : choice;
}
