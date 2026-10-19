import { getVenue, venues } from "@/lib/catalog";
import { addDays } from "@/lib/deal";
import { driveBetween, placeForSlug, type Place } from "@/lib/geo";
import { staysFor } from "@/lib/lodging";
import { dateFill } from "@/lib/queries";
import type { Booking, OpenDate, Opportunity, Snapshot } from "@/lib/types";

export type LodgingPref = "camp" | "cheap" | "hotel";

export type PlanInput = {
  start: Place;
  days: number;
  startDate: string;
  maxDriveHours: number;
  genre: string;
  minGuarantee: number;
  end: Place | null;
  loop: boolean;
  lodging: LodgingPref;
};

export type GigChoice = {
  openDateId: string;
  venueId: string;
  venueName: string;
  citySlug: string;
  cityLabel: string;
  lat: number;
  lng: number;
  guarantee: number;
  driveMiles: number;
  driveHours: number;
  showTime: string;
};

export type PlanNight = {
  date: string;
  place: Place;
  driveMiles: number;
  driveHours: number;
  kind: "gig" | "permit" | "fair" | "rest";
  openDateId?: string;
  venueId?: string;
  venueName?: string;
  opportunityId?: string;
  title: string;
  guarantee: number;
  showTime?: string;
  lodging: LodgingPref;
  lodgingName: string;
  lodgingCost: number;
  choices: GigChoice[];
};

export type TourPlan = {
  nights: PlanNight[];
  miles: number;
  gas: number;
  lodgingTotal: number;
  guarantees: number;
  net: number;
  assumptions: string;
};

const GAS_PRICE = 3.6;
const MPG = 12;

export function guaranteeOf(deal: string) {
  const match = deal.match(/\$([0-9,]+)/);
  return match ? Number(match[1].replace(/,/g, "")) : 0;
}

export function lodgingQuote(slug: string, pref: LodgingPref) {
  const cost = pref === "camp" ? 28 : pref === "cheap" ? 89 : 165;
  const type = pref === "camp" ? "campground" : pref === "cheap" ? "motel" : "hotel";
  const stay = staysFor(slug).find((item) => item.type === type);
  const fallback =
    pref === "camp" ? "Sample campground estimate" : pref === "cheap" ? "Sample motel estimate" : "Sample hotel estimate";
  return {
    lodging: pref,
    lodgingName: stay ? `${stay.name} · sample` : fallback,
    lodgingCost: cost,
  };
}

function genreOk(genres: string[], genre: string) {
  if (genre === "any") return true;
  return genres.some((item) => item.toLowerCase() === genre.toLowerCase());
}

function choicesFor(
  snapshot: Pick<Snapshot, "openDates" | "bookings">,
  from: Place,
  date: string,
  input: PlanInput,
): GigChoice[] {
  return snapshot.openDates.flatMap((openDate) => {
    if (openDate.date !== date) return [];
    if (dateFill(openDate.id, snapshot.bookings) === "filled") return [];
    if (!genreOk(openDate.genres, input.genre)) return [];
    const venue = getVenue(openDate.venueId);
    const place = venue ? placeForSlug(venue.citySlug) : null;
    if (!venue || !place) return [];
    const guarantee = guaranteeOf(venue.typicalDeal);
    if (guarantee < input.minGuarantee) return [];
    const drive = driveBetween(from, place);
    if (place.id !== from.id && drive.hours > input.maxDriveHours) return [];
    return [
      {
        openDateId: openDate.id,
        venueId: venue.id,
        venueName: venue.name,
        citySlug: place.id,
        cityLabel: place.label,
        lat: place.lat,
        lng: place.lng,
        guarantee,
        driveMiles: place.id === from.id ? 0 : drive.miles,
        driveHours: place.id === from.id ? 0 : drive.hours,
        showTime: openDate.showTime,
      },
    ];
  });
}

function opportunityOn(
  opportunities: Opportunity[],
  place: Place,
  date: string,
  genre: string,
) {
  return opportunities.find(
    (item) =>
      item.citySlug === place.id &&
      item.startDate <= date &&
      item.endDate >= date &&
      genreOk(item.genres, genre),
  );
}

function nightFromChoice(date: string, choice: GigChoice, lodging: LodgingPref, choices: GigChoice[]): PlanNight {
  const place: Place = {
    id: choice.citySlug,
    label: choice.cityLabel,
    city: choice.cityLabel.split(",")[0]?.trim() || choice.cityLabel,
    state: choice.cityLabel.split(",")[1]?.trim() || "",
    lat: choice.lat,
    lng: choice.lng,
  };
  return {
    date,
    place,
    driveMiles: choice.driveMiles,
    driveHours: choice.driveHours,
    kind: "gig",
    openDateId: choice.openDateId,
    venueId: choice.venueId,
    venueName: choice.venueName,
    title: choice.venueName,
    guarantee: choice.guarantee,
    showTime: choice.showTime,
    choices,
    ...lodgingQuote(choice.citySlug, lodging),
  };
}

function restNight(date: string, place: Place, driveMiles: number, driveHours: number, lodging: LodgingPref, title: string): PlanNight {
  return {
    date,
    place,
    driveMiles,
    driveHours,
    kind: "rest",
    title,
    guarantee: 0,
    choices: [],
    ...lodgingQuote(place.id, lodging),
  };
}

export function buildPlan(snapshot: Pick<Snapshot, "openDates" | "bookings" | "opportunities">, input: PlanInput): TourPlan {
  const nights: PlanNight[] = [];
  let cursor = input.start;
  const target = input.loop ? input.start : input.end;

  for (let index = 0; index < input.days; index += 1) {
    const date = addDays(input.startDate, index);
    const last = index === input.days - 1;
    let options = choicesFor(snapshot, cursor, date, input);
    if (last && target) {
      options = options.filter((choice) => {
        if (choice.citySlug === target.id) return true;
        const home = driveBetween(
          { lat: choice.lat, lng: choice.lng },
          target,
        );
        return home.hours <= input.maxDriveHours;
      });
    }
    options.sort((a, b) => b.guarantee - b.driveHours * 40 - (a.guarantee - a.driveHours * 40));
    if (last && target) {
      const atTarget = options.find((choice) => choice.citySlug === target.id);
      if (atTarget) options = [atTarget, ...options.filter((choice) => choice.openDateId !== atTarget.openDateId)];
    }
    const best = options[0];
    if (best) {
      const night = nightFromChoice(date, best, input.lodging, options);
      nights.push(night);
      cursor = night.place;
      continue;
    }
    if (last && target) {
      const drive = driveBetween(cursor, target);
      if (cursor.id === target.id || drive.hours <= input.maxDriveHours) {
        const opp = opportunityOn(snapshot.opportunities, target, date, input.genre);
        if (opp) {
          nights.push({
            ...restNight(
              date,
              target,
              cursor.id === target.id ? 0 : drive.miles,
              cursor.id === target.id ? 0 : drive.hours,
              input.lodging,
              opp.title,
            ),
            kind: opp.kind === "permit" ? "permit" : "fair",
            opportunityId: opp.id,
            guarantee: guaranteeOf(opp.compensation),
          });
        } else {
          nights.push(
            restNight(
              date,
              target,
              cursor.id === target.id ? 0 : drive.miles,
              cursor.id === target.id ? 0 : drive.hours,
              input.lodging,
              "Rest day",
            ),
          );
        }
        cursor = target;
        continue;
      }
    }
    const opp = opportunityOn(snapshot.opportunities, cursor, date, input.genre);
    if (opp) {
      nights.push({
        ...restNight(date, cursor, 0, 0, input.lodging, opp.title),
        kind: opp.kind === "permit" ? "permit" : "fair",
        opportunityId: opp.id,
        guarantee: guaranteeOf(opp.compensation),
      });
    } else {
      nights.push(restNight(date, cursor, 0, 0, input.lodging, "Rest day"));
    }
  }

  return summarize(nights);
}

export function summarize(nights: PlanNight[]): TourPlan {
  const miles = nights.reduce((sum, night) => sum + night.driveMiles, 0);
  const gas = Math.round((miles / MPG) * GAS_PRICE);
  const lodgingTotal = nights.reduce((sum, night) => sum + night.lodgingCost, 0);
  const guarantees = nights.reduce((sum, night) => sum + night.guarantee, 0);
  return {
    nights,
    miles,
    gas,
    lodgingTotal,
    guarantees,
    net: guarantees - gas - lodgingTotal,
    assumptions: `Sample budget. Drives use straight-line distance × 1.3 at 55 mph, not live traffic. Gas assumes a van at ${MPG} mpg and $${GAS_PRICE.toFixed(2)} a gallon. Lodging is a flat sample rate: $28 camp, $89 motel, $165 hotel.`,
  };
}

export function applyChoice(night: PlanNight, choice: GigChoice, lodging: LodgingPref): PlanNight {
  return nightFromChoice(night.date, choice, lodging, night.choices);
}

export function withLodging(night: PlanNight, lodging: LodgingPref): PlanNight {
  return { ...night, ...lodgingQuote(night.place.id, lodging) };
}

export function asRest(night: PlanNight): PlanNight {
  return {
    ...night,
    kind: "rest",
    openDateId: undefined,
    venueId: undefined,
    venueName: undefined,
    opportunityId: undefined,
    title: "Rest day",
    guarantee: 0,
    showTime: undefined,
  };
}

export function venuesInPlan(openDates: OpenDate[], bookings: Booking[]) {
  return venues.filter((venue) =>
    openDates.some(
      (openDate) => openDate.venueId === venue.id && dateFill(openDate.id, bookings) !== "filled",
    ),
  );
}
