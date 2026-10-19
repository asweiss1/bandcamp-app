import type { LocalRules, Stay, StayType } from "@/lib/types";
import { addDays } from "@/lib/deal";
import { getCity } from "@/lib/catalog";

export const STAY_GROUPS: { type: StayType; label: string; blurb: string }[] = [
  {
    type: "hotel",
    label: "Hotels",
    blurb: "Lobbies, late check-in, and a shower that is not a camp spigot.",
  },
  {
    type: "motel",
    label: "Motels",
    blurb: "Drive-up rooms. Easier when the van is loaded and nobody wants a garage.",
  },
  {
    type: "rental",
    label: "Airbnb and short-term rentals",
    blurb: "Houses and casitas when the whole band wants a kitchen.",
  },
  {
    type: "campground",
    label: "Campgrounds and camping spots",
    blurb: "Tents, cabins, and hookups outside the club district.",
  },
  {
    type: "van",
    label: "Overnight parking and van sleeping",
    blurb: "Sample notes on lots, rest areas, and sleeping in the vehicle.",
  },
];

function stay(
  citySlug: string,
  type: StayType,
  name: string,
  area: string,
  price: string,
  distance: string,
  notes: string,
): Stay {
  return {
    id: `${citySlug}-${type}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    citySlug,
    type,
    name,
    area,
    price,
    distance,
    notes,
  };
}

export const stays: Stay[] = [
  stay("phoenix-az", "hotel", "Paloma House", "Roosevelt Row", "$164–$210", "0.6 mi from Grand Ave rooms", "Sample listing. Late front desk. Garage parking is extra in this dataset."),
  stay("phoenix-az", "hotel", "Encanto Court", "Midtown", "$139–$176", "2.1 mi from the venue district", "Sample listing. Quieter block, outdoor pool, van fits the side lot."),
  stay("phoenix-az", "motel", "Sunliner Motor Court", "Van Buren", "$78–$96", "1.4 mi east of downtown", "Sample listing. Drive-up doors. Ask before idling the Sprinter overnight."),
  stay("phoenix-az", "motel", "Cactus 17 Inn", "West Van Buren", "$69–$88", "3 mi from Grand Ave", "Sample listing. Weekly rates exist. Lighting in the lot is poor in this note."),
  stay("phoenix-az", "rental", "Adobe Porch casita", "Garfield", "$185 / night · sleeps 5", "0.8 mi from The Yucca Room", "Sample short-term rental. Street parking for one van, no trailer."),
  stay("phoenix-az", "rental", "Grand Ave garage apartment", "Grand Avenue", "$140 / night · sleeps 3", "0.3 mi from the club", "Sample rental. Stairs. Fine for a duo, tight for a backline."),
  stay("phoenix-az", "campground", "Salt River Flats", "East valley", "$22 tent · $35 RV", "40 min from downtown", "Sample campground. Reservations recommended on Fridays. No late-arrival gate code in this dataset."),
  stay("phoenix-az", "campground", "Lake Bench Camp", "Northwest", "$28 tent", "50 min from downtown", "Sample site. Water spigots. Generators quiet hours 8pm in this note."),
  stay("phoenix-az", "van", "I-10 rest area, east of town", "Interstate", "Free · time-limited in this sample", "25 min from the club", "Sample note: treated as a short rest, not an overnight. Do not plan the night here."),
  stay("phoenix-az", "van", "Day-use desert lot", "Papago area", "Not an overnight in this sample", "15 min from downtown", "Sample note: day-use only. The dataset marks sleeping in the vehicle as not allowed here."),

  stay("flagstaff-az", "hotel", "Aspen Switch Hotel", "Downtown", "$189–$240", "0.7 mi from Southside", "Sample listing. Winter rates jump. Heated garage in this note."),
  stay("flagstaff-az", "hotel", "Railroad Annex", "Southside", "$154–$198", "0.2 mi from High Country Social", "Sample listing. The closest bed to a Butler load-in."),
  stay("flagstaff-az", "motel", "Ponderosa Motor Lodge", "Route 66", "$92–$120", "1.1 mi from downtown", "Sample listing. Exterior corridors. Van parking in front of the door."),
  stay("flagstaff-az", "motel", "Snow Cap 66", "East Route 66", "$84–$110", "2 mi from the club", "Sample listing. Sketchy ice machine, honest beds, easy exit toward I-40."),
  stay("flagstaff-az", "rental", "Pine Needle bungalow", "Sunnyside", "$210 / night · sleeps 6", "1.5 mi from Southside", "Sample rental. Driveway fits a Sprinter. No trailer. Wood stove is decorative in this note."),
  stay("flagstaff-az", "rental", "Campus-edge apartment", "Near downtown", "$160 / night · sleeps 4", "0.9 mi from the Piñon Room", "Sample rental. Street parking only. Quiet hours posted by the host."),
  stay("flagstaff-az", "campground", "Fort Valley Pines", "Northwest of town", "$30 tent · $45 RV", "15 min from downtown", "Sample campground. Can fill up on autumn weekends. Bear boxes in this note."),
  stay("flagstaff-az", "campground", "Lake Mary Bench", "Southeast", "$24 tent", "20 min from town", "Sample site. Cold at night in November. No hookups."),
  stay("flagstaff-az", "van", "I-40 rest area west of Flagstaff", "Interstate", "Free · posted time limit in this sample", "12 min from town", "Sample note: a nap, not a bunk. The dataset does not treat this as legal overnight sleeping."),
  stay("flagstaff-az", "van", "National forest pull-off", "Outside city limits", "Sample dispersed spot", "25–40 min from the club", "Sample note: outside the city, with a stay limit and a fire ban flag. Not a city-street option."),

  stay("cottonwood-az", "hotel", "Verde Veranda", "Old Town edge", "$149–$188", "0.4 mi from Verde Taproom", "Sample listing. Small hotel. Lot holds a van, not a trailer."),
  stay("cottonwood-az", "hotel", "Mingus View Inn", "South 89A", "$132–$170", "1.2 mi from Old Town", "Sample listing. Breakfast included in this dataset. Ask for a ground-floor room."),
  stay("cottonwood-az", "motel", "Cottonwood Court", "Main Street", "$79–$99", "0.3 mi from the taproom", "Sample listing. Drive-up. The sample says overnight street parking nearby is discouraged, so use the motel lot."),
  stay("cottonwood-az", "motel", "River Run Motel", "Toward Clarkdale", "$72–$90", "4 min from Old Town", "Sample listing. Quieter than Main Street. Ice and a soda machine."),
  stay("cottonwood-az", "rental", "Old Town adobe", "Historic district", "$175 / night · sleeps 4", "2 blocks from the stage", "Sample rental. One parking pad. No amplified practice at the house."),
  stay("cottonwood-az", "rental", "Orchard guesthouse", "Bridgeport", "$155 / night · sleeps 5", "6 min from Old Town", "Sample rental. Yard can take the van. Host asks for shoes off."),
  stay("cottonwood-az", "campground", "Dead Horse sample loop", "Verde River", "$25 tent · $40 RV", "10 min from Old Town", "Sample campground inspired by the state park area. Reservations in this dataset, no walk-up on Saturdays."),
  stay("cottonwood-az", "campground", "Tuzigoot bench", "North of town", "$18 tent", "12 min from the taproom", "Sample walk-in style site. No fires in this note. Water at the entrance."),
  stay("cottonwood-az", "van", "Taproom lot after close", "Old Town", "Not overnight in this sample", "At the venue", "Sample note: load-in parking ends after the show. Do not sleep on Main Street."),
  stay("cottonwood-az", "van", "Highway rest pull-off", "89A south", "Short stop in this sample", "8 min from town", "Sample note: emergency rest only. The dataset points bands at the motel or the campground."),

  stay("tucson-az", "hotel", "Barrio Lantern", "Barrio Viejo", "$151–$196", "0.3 mi from Adobe & Wire", "Sample listing. Historic block. Lot is small — call if you have a trailer."),
  stay("tucson-az", "hotel", "Congress Annex Hotel", "Downtown", "$142–$180", "0.8 mi from the club", "Sample listing. Late check-in window until 1am in this note."),
  stay("tucson-az", "motel", "Miracle Mile Motor Inn", "Miracle Mile", "$70–$92", "2 mi from downtown", "Sample listing. Classic motor court. Easy van parking, thin walls."),
  stay("tucson-az", "motel", "Oracle Star Motel", "North Oracle", "$74–$95", "10 min from the club", "Sample listing. Second-floor rooms have a stair. Ground floor preferred with gear."),
  stay("tucson-az", "rental", "Adobe court house", "Menlo Park", "$200 / night · sleeps 6", "1 mi from Adobe & Wire", "Sample rental. Walled yard fits two vehicles. No parties — the gig is the party."),
  stay("tucson-az", "rental", "Guest casita", "Sam Hughes", "$130 / night · sleeps 2", "8 min from downtown", "Sample rental. Too small for the whole band. Fine for a driver who needs a door that locks."),
  stay("tucson-az", "campground", "Gilbert Ray sample", "West desert", "$20 tent", "30 min from downtown", "Sample county-style campground. Dark skies. No generators after 10 in this note."),
  stay("tucson-az", "campground", "Tanque Verde creek site", "East", "$26 tent · $38 RV", "25 min from the club", "Sample site. Shade ramadas. Books up for winter weekends."),
  stay("tucson-az", "van", "City street near the club", "Barrio Viejo", "Not allowed in this sample", "At the venue", "Sample note: overnight vehicle sleeping on city streets is marked not allowed."),
  stay("tucson-az", "van", "BLM-style desert spur", "West of the valley", "Sample dispersed camping", "45 min from downtown", "Sample note: outside city limits, with a 14-day style limit and a fire restriction flag. Unverified."),

  stay("albuquerque-nm", "hotel", "Barelas Station Hotel", "Barelas", "$158–$205", "0.4 mi from Rail Yard Hall", "Sample listing. The practical choice when the trailer is in the yard."),
  stay("albuquerque-nm", "hotel", "Central Avenue House", "Downtown", "$129–$168", "1 mi from the hall", "Sample listing. Rooftop is closed. Parking structure next door."),
  stay("albuquerque-nm", "motel", "Route 66 Courts", "East Central", "$68–$86", "3 mi from Barelas", "Sample listing. Cheap, drive-up, fine for one night heading to Amarillo or Flagstaff."),
  stay("albuquerque-nm", "motel", "West Mesa Motor Lodge", "West I-40", "$75–$94", "12 min from the hall", "Sample listing. Truck-friendly lot. A better van overnight than a downtown street."),
  stay("albuquerque-nm", "rental", "Barelas cottage", "Barelas", "$170 / night · sleeps 5", "0.6 mi from the dock", "Sample rental. Driveway and a couch. Host allows an early coffee exit."),
  stay("albuquerque-nm", "rental", "Nob Hill flat", "Nob Hill", "$145 / night · sleeps 3", "8 min from downtown", "Sample rental. Street parking. Not ideal with a trailer."),
  stay("albuquerque-nm", "campground", "Bosque bench camp", "North valley", "$22 tent", "15 min from the hall", "Sample campground along the river. Mosquitoes in the note. Quiet hours 10pm."),
  stay("albuquerque-nm", "campground", "Foothills RV sample", "East", "$32 tent · $48 full hookup", "20 min from downtown", "Sample RV park. Pull-throughs. Showers included in this dataset."),
  stay("albuquerque-nm", "van", "I-40 rest area", "East of the city", "Time-limited in this sample", "20 min from the hall", "Sample note: rest, not residence. Posted hours would come from a real feed later."),
  stay("albuquerque-nm", "van", "West Mesa public land", "Outside the city", "Sample dispersed area", "30–45 min from downtown", "Sample note: the dataset distinguishes city camping bans from public land west of town. Rules here are unverified examples."),

  stay("las-vegas-nv", "hotel", "Arts District House", "Arts District", "$149–$210", "0.3 mi from Neon Chapel", "Sample listing. Off-strip rates. Valet does not take a Sprinter in this note — use the side lot."),
  stay("las-vegas-nv", "hotel", "Fremont-adjacent inn", "Downtown", "$119–$176", "1.5 mi from the club", "Sample listing. Casinos are not campgrounds. This is a normal hotel room."),
  stay("las-vegas-nv", "motel", "Boulder Motor Court", "Boulder Highway", "$72–$98", "15 min from the Arts District", "Sample listing. A motel on purpose, so the van can sit outside the door."),
  stay("las-vegas-nv", "motel", "Tropicana Courts", "South of the strip", "$80–$110", "12 min from the club", "Sample listing. Lot lighting is harsh. Fine for gear you would rather not leave downtown."),
  stay("las-vegas-nv", "rental", "Arts District bungalow", "18b", "$230 / night · sleeps 6", "0.5 mi from Neon Chapel", "Sample rental. Driveway fits the van. HOA in this note forbids sleeping in the vehicle on the street."),
  stay("las-vegas-nv", "rental", "Henderson house share", "Henderson", "$180 / night · sleeps 4", "25 min from the club", "Sample rental. Cheaper, farther, and a real kitchen. Bad if load-out is 1am and call is noon."),
  stay("las-vegas-nv", "campground", "Red Rock edge camp", "West", "$25 tent · $40 RV", "35 min from the Arts District", "Sample campground. Hot even in November afternoons. No shade in this note."),
  stay("las-vegas-nv", "campground", "Lake Mead sample site", "Southeast", "$30 tent", "45 min from the club", "Sample site. A real product would check water levels and fire rules. This card does not."),
  stay("las-vegas-nv", "van", "Casino and club lots", "Strip and downtown", "Not overnight camping in this sample", "Varies", "Sample note: private lots are for patrons, not a bedroom. The dataset marks them as not allowed for sleeping."),
  stay("las-vegas-nv", "van", "BLM-style land outside the valley", "Desert", "Sample dispersed camping", "40–70 min from the club", "Sample note: a future feed would show whether a permit is required. This prototype only flags the question, plus a heat warning."),
];

export const localRules: LocalRules[] = [
  {
    citySlug: "phoenix-az",
    vehicleSleeping:
      "Example answer: sleeping in a vehicle on Phoenix public streets is shown as not allowed. This is sample copy for the prototype, not a reading of current city code.",
    streetsAndLots:
      "Example answer: downtown and Grand Avenue blocks are treated as time-limited or resident-restricted at night. Private lots belong to the business. A venue lot is for load-in, not a bunk.",
    walmartBlmRest:
      "Example answer: do not assume any big-box lot allows an overnight. Interstate rest areas east and west of the valley are marked as short stops with time limits. Public desert land is outside the city and would need its own fire and stay rules in a real feed.",
    permits:
      "Example answer: no permit is wired up here. A production version would say whether a trailer, generator, or street closure needs a city permit, and would link the application.",
  },
  {
    citySlug: "flagstaff-az",
    vehicleSleeping:
      "Example answer: sleeping in a vehicle on Flagstaff city streets is shown as restricted, including during winter parking-ban conditions in this sample. Use a motel lot or a campground.",
    streetsAndLots:
      "Example answer: Southside and downtown overnight street parking is marked unreliable for a van full of gear. High Country Social's garage is a load-in, and this sample says it closes after the strike.",
    walmartBlmRest:
      "Example answer: big-box lots are not listed as overnight options. The I-40 rest area west of town is a posted time limit, not a bed. National forest land outside city limits appears as a possible dispersed option with a stay limit and a fire-ban flag — unverified.",
    permits:
      "Example answer: campground nights in this dataset want a reservation, not a city performance permit. Dispersed forest stays would later cite the current fire restriction and length-of-stay rule.",
  },
  {
    citySlug: "cottonwood-az",
    vehicleSleeping:
      "Example answer: sleeping in a vehicle on Old Town streets is shown as discouraged and, for this prototype, not allowed. The taproom lot is load-in only.",
    streetsAndLots:
      "Example answer: Main Street turns over after the show. The sample points bands to a motel court or a campground rather than the curb in front of the room.",
    walmartBlmRest:
      "Example answer: this town's sample does not rely on big-box lots or BLM land. A highway pull-off on 89A is marked as a short rest. Camping is pointed at the river-area campground sample.",
    permits:
      "Example answer: no special overnight permit is modeled. If the patio show adds a generator or a street closure, a real product would surface the town's special-event permit.",
  },
  {
    citySlug: "tucson-az",
    vehicleSleeping:
      "Example answer: overnight sleeping in a vehicle on city streets is marked not allowed, including near Barrio Viejo rooms.",
    streetsAndLots:
      "Example answer: club-adjacent street parking is for the audience, with evening turnover. Venue alleys are load-in. Motel courts are the sample's in-town van answer.",
    walmartBlmRest:
      "Example answer: big-box overnight parking is not assumed. Rest areas are time-limited. Desert public land west of town is listed as a sample dispersed option with a 14-day style limit and a fire restriction — not verified.",
    permits:
      "Example answer: camping inside county or federal sites in this dataset needs a site reservation. Sleeping on city property does not have a permit workaround in the sample.",
  },
  {
    citySlug: "albuquerque-nm",
    vehicleSleeping:
      "Example answer: camping and sleeping in vehicles inside the city are shown as restricted. The sample tells touring bands not to plan a night on a downtown curb.",
    streetsAndLots:
      "Example answer: Barelas and downtown lots that look empty are still private or time-limited. Rail Yard Hall can keep a trailer in the yard only when the booker has agreed in the booking.",
    walmartBlmRest:
      "Example answer: I-40 rest areas are short stops. West Mesa public land is the sample's out-of-city option and is labeled unverified. Big-box lots are not an overnight plan in this dataset.",
    permits:
      "Example answer: a yard overnight for a trailer should be written into the offer, not assumed. Dispersed-land permits and fire restrictions would come from a reviewed source later.",
  },
  {
    citySlug: "las-vegas-nv",
    vehicleSleeping:
      "Example answer: sleeping in a vehicle on city streets is shown as not allowed. Casino, hotel, and club lots are private and are marked not okay for overnight camping. Heat is called out even in shoulder season.",
    streetsAndLots:
      "Example answer: the Arts District bungalow note says the street in front of a rental is not a bedroom. Use the driveway, a motel court, or a hotel lot that has agreed to the van.",
    walmartBlmRest:
      "Example answer: big-box overnight stays are not listed. Public land outside the valley is a sample dispersed option, 40 minutes or more from the club, with a permit question left unanswered on purpose.",
    permits:
      "Example answer: this card flags that desert camping near the valley may require a permit and may close for fire or heat restrictions. The prototype does not know today's status.",
  },
];

export function staysFor(slug: string) {
  return stays.filter((item) => item.citySlug === slug);
}

export function rulesFor(slug: string) {
  return localRules.find((rules) => rules.citySlug === slug);
}

export function searchLinks(slug: string, date?: string) {
  const city = getCity(slug);
  const place = city ? `${city.city}, ${city.state}` : slug;
  const checkout = date ? addDays(date, 1) : undefined;
  const airbnbDates =
    date && checkout ? `?checkin=${date}&checkout=${checkout}` : "";
  const bookingDates =
    date && checkout ? `&checkin=${date}&checkout=${checkout}` : "";
  return [
    {
      label: "Search Airbnb",
      href: `https://www.airbnb.com/s/${encodeURIComponent(place)}/homes${airbnbDates}`,
    },
    {
      label: "Search hotels",
      href: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(place)}${bookingDates}`,
    },
    {
      label: "Search campgrounds",
      href: `https://www.hipcamp.com/en-US/search?q=${encodeURIComponent(place)}`,
    },
    {
      label: "Map overnight parking",
      href: `https://www.google.com/maps/search/${encodeURIComponent(`overnight parking ${place}`)}`,
    },
  ];
}
