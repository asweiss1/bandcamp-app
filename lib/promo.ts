import { getBand, getVenue } from "@/lib/catalog";
import { slotLine } from "@/lib/daypart";
import { formatDayLong, money } from "@/lib/deal";
import { mediaFor } from "@/lib/media";
import { MUSIC_LABEL, repertoireFor } from "@/lib/repertoire";
import type { Snapshot } from "@/lib/types";

export type PromoMark = {
  id: string;
  name: string;
  role: string | null;
  setTime: string | null;
  src: string | null;
};

export type PromoShow = {
  id: string;
  kind: "booking" | "bill";
  title: string;
  marks: PromoMark[];
  venueName: string;
  address: string;
  city: string;
  dateLabel: string;
  when: string;
  age: string;
  cover: string;
  music: string | null;
  useImages: boolean;
  lineup: string;
  caption: string;
};

function tag(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, "");
  return cleaned ? `#${cleaned}` : "";
}

function addressFor(venue: { address?: string; neighborhood: string; city: string }) {
  if (venue.address && venue.address.trim()) return venue.address.trim();
  return `${venue.neighborhood}, ${venue.city}`;
}

function coverLine(ticketPrice: number | null | undefined) {
  if (ticketPrice == null) return "Cover at the door";
  return `${money(ticketPrice)} cover`;
}

function hashLine(names: string[], city: string) {
  const tags = [...names.map(tag), tag(city.split(",")[0] ?? city), "#LiveMusic"].filter(Boolean);
  return [...new Set(tags)].join(" ");
}

function finish(partial: Omit<PromoShow, "caption" | "lineup"> & { lineup: string }): PromoShow {
  const caption = [
    partial.title,
    `${partial.dateLabel} · ${partial.when}`,
    partial.lineup,
    `${partial.venueName} · ${partial.address}`,
    [partial.age, partial.cover, partial.music].filter(Boolean).join(" · "),
    "",
    hashLine(
      partial.marks.map((mark) => mark.name).concat(partial.venueName),
      partial.city,
    ),
  ]
    .filter((line) => line !== "")
    .join("\n");
  return { ...partial, caption };
}

export function imagesAllowed(snapshot: Pick<Snapshot, "media">, ids: string[]) {
  if (ids.length === 0) return false;
  return ids.every((id) => mediaFor(id, snapshot.media).promoUse);
}

export function promoFromBooking(snapshot: Snapshot, bookingId: string): PromoShow | null {
  const booking = snapshot.bookings.find((item) => item.id === bookingId);
  if (!booking || booking.status !== "accepted") return null;
  if (booking.billId) {
    const fromBill = promoFromBill(snapshot, booking.billId);
    if (fromBill) return { ...fromBill, id: booking.id, kind: "booking" };
  }
  const band = getBand(booking.bandId);
  const venue = getVenue(booking.venueId);
  const openDate = snapshot.openDates.find((item) => item.id === booking.openDateId);
  if (!band || !venue || !openDate) return null;
  const allowed = imagesAllowed(snapshot, [band.id, venue.id]);
  const music = MUSIC_LABEL[repertoireFor(band.id, snapshot.repertoires).music];
  const bandLogo = mediaFor(band.id, snapshot.media).logo;
  const venueLogo = mediaFor(venue.id, snapshot.media).logo;
  return finish({
    id: booking.id,
    kind: "booking",
    title: `${band.name} at ${venue.name}`,
    marks: [
      { id: band.id, name: band.name, role: "Headliner", setTime: openDate.showTime, src: allowed ? bandLogo : null },
      { id: venue.id, name: venue.name, role: "Room", setTime: null, src: allowed ? venueLogo : null },
    ],
    venueName: venue.name,
    address: addressFor(venue),
    city: venue.city,
    dateLabel: formatDayLong(openDate.date),
    when: slotLine(openDate.showTime, openDate.daypart),
    age: openDate.age,
    cover: coverLine(booking.terms.ticketPrice),
    music,
    useImages: allowed && Boolean(bandLogo || venueLogo),
    lineup: `${band.name} · ${openDate.showTime}`,
  });
}

export function promoFromBill(snapshot: Snapshot, billId: string): PromoShow | null {
  const bill = snapshot.bills.find((item) => item.id === billId);
  if (!bill) return null;
  const booking = bill.bookingId ? snapshot.bookings.find((item) => item.id === bill.bookingId) : undefined;
  const openDate = snapshot.openDates.find((item) => item.id === (booking?.openDateId ?? bill.openDateId));
  const venue = getVenue(booking?.venueId ?? bill.venueId ?? "");
  const bands = bill.members.map((member) => ({ member, band: getBand(member.bandId) })).filter((item) => item.band);
  if (!venue || !openDate || bands.length === 0) return null;
  const ids = [venue.id, ...bands.map((item) => item.band!.id)];
  const allowed = imagesAllowed(snapshot, ids);
  const musicLabels = [...new Set(bands.map((item) => MUSIC_LABEL[repertoireFor(item.band!.id, snapshot.repertoires).music]))];
  const marks: PromoMark[] = [
    ...bands.map((item) => ({
      id: item.band!.id,
      name: item.band!.name,
      role: item.member.role,
      setTime: item.member.setTime,
      src: allowed ? mediaFor(item.band!.id, snapshot.media).logo : null,
    })),
    {
      id: venue.id,
      name: venue.name,
      role: "Room",
      setTime: null,
      src: allowed ? mediaFor(venue.id, snapshot.media).logo : null,
    },
  ];
  const lineup = bands.map((item) => `${item.band!.name} · ${item.member.role} · ${item.member.setTime}`).join("\n");
  return finish({
    id: bill.id,
    kind: "bill",
    title: bill.name,
    marks,
    venueName: venue.name,
    address: addressFor(venue),
    city: venue.city,
    dateLabel: formatDayLong(openDate.date),
    when: slotLine(openDate.showTime, openDate.daypart),
    age: openDate.age,
    cover: coverLine(booking?.terms.ticketPrice),
    music: musicLabels.join(" · "),
    useImages: allowed && marks.some((mark) => mark.src),
    lineup,
  });
}
