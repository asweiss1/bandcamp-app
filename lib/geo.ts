import { cities, getCity, getExtraPlace } from "@/lib/catalog";

export type Place = {
  id: string;
  label: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
};

export type SavedPlace = Place & { source: "sample" | "geo" | "search" };

export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "phoenix-az": { lat: 33.4484, lng: -112.074 },
  "flagstaff-az": { lat: 35.1983, lng: -111.6513 },
  "cottonwood-az": { lat: 34.7392, lng: -112.0099 },
  "tucson-az": { lat: 32.2226, lng: -110.9747 },
  "albuquerque-nm": { lat: 35.0844, lng: -106.6504 },
  "las-vegas-nv": { lat: 36.1699, lng: -115.1398 },
  "prescott-az": { lat: 34.54, lng: -112.4685 },
  "sedona-az": { lat: 34.8697, lng: -111.761 },
  "gallup-nm": { lat: 35.5281, lng: -108.7426 },
  "santa-fe-nm": { lat: 35.687, lng: -105.9378 },
  "las-cruces-nm": { lat: 32.3199, lng: -106.7637 },
  "kingman-az": { lat: 35.1894, lng: -114.053 },
};

const EXTRA_PLACES: Place[] = [
  ["Austin", "TX", 30.2672, -97.7431],
  ["Dallas", "TX", 32.7767, -96.797],
  ["Houston", "TX", 29.7604, -95.3698],
  ["El Paso", "TX", 31.7619, -106.485],
  ["Denver", "CO", 39.7392, -104.9903],
  ["Durango", "CO", 37.2753, -107.8801],
  ["Boulder", "CO", 40.015, -105.2705],
  ["Salt Lake City", "UT", 40.7608, -111.891],
  ["Moab", "UT", 38.5733, -109.5498],
  ["St. George", "UT", 37.0965, -113.5684],
  ["Los Angeles", "CA", 34.0522, -118.2437],
  ["San Diego", "CA", 32.7157, -117.1611],
  ["Palm Springs", "CA", 33.8303, -116.5453],
  ["Joshua Tree", "CA", 34.1347, -116.3131],
  ["Nashville", "TN", 36.1627, -86.7816],
  ["Memphis", "TN", 35.1495, -90.049],
  ["Austin", "TX", 30.2672, -97.7431],
  ["New Orleans", "LA", 29.9511, -90.0715],
  ["Chicago", "IL", 41.8781, -87.6298],
  ["New York", "NY", 40.7128, -74.006],
  ["Brooklyn", "NY", 40.6782, -73.9442],
  ["Boston", "MA", 42.3601, -71.0589],
  ["Portland", "OR", 45.5152, -122.6784],
  ["Seattle", "WA", 47.6062, -122.3321],
  ["Atlanta", "GA", 33.749, -84.388],
  ["Asheville", "NC", 35.5951, -82.5515],
  ["Kansas City", "MO", 39.0997, -94.5786],
  ["Omaha", "NE", 41.2565, -95.9345],
  ["Minneapolis", "MN", 44.9778, -93.265],
  ["Detroit", "MI", 42.3314, -83.0458],
  ["Philadelphia", "PA", 39.9526, -75.1652],
  ["Pittsburgh", "PA", 40.4406, -79.9959],
  ["Washington", "DC", 38.9072, -77.0369],
  ["Miami", "FL", 25.7617, -80.1918],
  ["Orlando", "FL", 28.5383, -81.3792],
  ["Boise", "ID", 43.615, -116.2023],
  ["Missoula", "MT", 46.8721, -113.994],
  ["Billings", "MT", 45.7833, -108.5007],
  ["Cheyenne", "WY", 41.14, -104.8202],
  ["Reno", "NV", 39.5296, -119.8138],
  ["Sparks", "NV", 39.5349, -119.7527],
  ["Henderson", "NV", 36.0395, -114.9817],
  ["Mesa", "AZ", 33.4152, -111.8315],
  ["Tempe", "AZ", 33.4255, -111.94],
  ["Scottsdale", "AZ", 33.4942, -111.9261],
  ["Gilbert", "AZ", 33.3528, -111.789],
  ["Glendale", "AZ", 33.5387, -112.186],
  ["Yuma", "AZ", 32.6927, -114.6277],
  ["Page", "AZ", 36.9147, -111.4558],
  ["Winslow", "AZ", 35.0242, -110.6974],
  ["Holbrook", "AZ", 34.9022, -110.1582],
  ["Show Low", "AZ", 34.2542, -110.0298],
  ["Payson", "AZ", 34.2309, -111.3251],
  ["Globe", "AZ", 33.3942, -110.7868],
  ["Bisbee", "AZ", 31.4482, -109.9284],
  ["Sierra Vista", "AZ", 31.5455, -110.2773],
  ["Nogales", "AZ", 31.3404, -110.9343],
  ["Casa Grande", "AZ", 32.8795, -111.7574],
  ["Marfa", "TX", 30.3095, -104.0206],
  ["Alpine", "TX", 30.3585, -103.661],
  ["Truth or Consequences", "NM", 33.1284, -107.2528],
  ["Silver City", "NM", 32.7701, -108.2803],
  ["Taos", "NM", 36.4072, -105.5731],
  ["Farmington", "NM", 36.7281, -108.2187],
  ["Roswell", "NM", 33.3943, -104.523],
  ["Socorro", "NM", 34.0584, -106.8914],
  ["Grants", "NM", 35.1473, -107.8514],
  ["Los Alamos", "NM", 35.8800, -106.3031],
  ["Amarillo", "TX", 35.222, -101.8313],
  ["Lubbock", "TX", 33.5779, -101.8552],
  ["Oklahoma City", "OK", 35.4676, -97.5164],
  ["Tulsa", "OK", 36.154, -95.9928],
  ["Colorado Springs", "CO", 38.8339, -104.8214],
  ["Grand Junction", "CO", 39.0639, -108.5506],
  ["Provo", "UT", 40.2338, -111.6585],
  ["Cedar City", "UT", 37.6775, -113.0619],
  ["Bend", "OR", 44.0582, -121.3153],
  ["Sacramento", "CA", 38.5816, -121.4944],
  ["San Francisco", "CA", 37.7749, -122.4194],
  ["Oakland", "CA", 37.8044, -122.2712],
  ["Fresno", "CA", 36.7378, -119.7871],
  ["Bakersfield", "CA", 35.3733, -119.0187],
  ["Madison", "WI", 43.0731, -89.4012],
  ["Milwaukee", "WI", 43.0389, -87.9065],
  ["Cleveland", "OH", 41.4993, -81.6944],
  ["Columbus", "OH", 39.9612, -82.9988],
  ["Indianapolis", "IN", 39.7684, -86.1581],
  ["Louisville", "KY", 38.2527, -85.7585],
  ["Richmond", "VA", 37.5407, -77.436],
  ["Charleston", "SC", 32.7765, -79.9311],
  ["Savannah", "GA", 32.0809, -81.0912],
  ["Birmingham", "AL", 33.5186, -86.8104],
  ["Little Rock", "AR", 34.7465, -92.2896],
  ["Des Moines", "IA", 41.5868, -93.625],
  ["Fargo", "ND", 46.8772, -96.7898],
  ["Sioux Falls", "SD", 43.546, -96.7313],
  ["Anchorage", "AK", 61.2181, -149.9003],
  ["Honolulu", "HI", 21.3069, -157.8583],
  ["Burlington", "VT", 44.4759, -73.2121],
  ["Portland", "ME", 43.6591, -70.2568],
  ["Providence", "RI", 41.824, -71.4128],
  ["Baltimore", "MD", 39.2904, -76.6122],
  ["Raleigh", "NC", 35.7796, -78.6382],
  ["Charlotte", "NC", 35.2271, -80.8431],
].map(([city, state, lat, lng]) => ({
  id: `${String(city).toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${String(state).toLowerCase()}`,
  label: `${city}, ${state}`,
  city: String(city),
  state: String(state),
  lat: Number(lat),
  lng: Number(lng),
}));

export const US_PLACES: Place[] = [
  ...cities.flatMap((city) => {
    const coords = CITY_COORDS[city.slug];
    if (!coords) return [];
    return [{ id: city.slug, label: city.label, city: city.city, state: city.state, ...coords }];
  }),
  ...EXTRA_PLACES.filter((place) => !cities.some((city) => city.label === place.label)),
];

export const SAMPLE_PLACE: SavedPlace = {
  ...(US_PLACES.find((place) => place.id === "phoenix-az") as Place),
  source: "sample",
};

export function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const earth = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return earth * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function driveBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const miles = Math.round(milesBetween(a, b) * 1.3);
  const hours = Math.round((miles / 55) * 10) / 10;
  return { miles, hours };
}

export function placeForSlug(slug: string): Place | null {
  const extra = getExtraPlace(slug);
  if (extra) return extra;
  const city = getCity(slug);
  const coords = CITY_COORDS[slug];
  if (!city || !coords) return null;
  return { id: slug, label: city.label, city: city.city, state: city.state, ...coords };
}

export function placeFromNominatim(item: {
  lat?: string;
  lon?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    municipality?: string;
    state?: string;
  };
}): Place | null {
  const lat = Number(item.lat);
  const lng = Number(item.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const address = item.address ?? {};
  const city = address.city || address.town || address.village || address.hamlet || address.municipality;
  const stateName = address.state ?? "";
  const state = STATE_ABBR[stateName] ?? (stateName.length === 2 ? stateName.toUpperCase() : "");
  if (!city || !state) return null;
  const known = US_PLACES.find(
    (place) => place.city.toLowerCase() === city.toLowerCase() && place.state.toLowerCase() === state.toLowerCase(),
  );
  if (known) return known;
  const id = `${city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${state.toLowerCase()}`;
  return { id, label: `${city}, ${state}`, city, state, lat, lng };
}

export function searchPlaces(query: string) {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return US_PLACES.slice(0, 8);
  return US_PLACES.filter(
    (place) =>
      place.city.toLowerCase().includes(needle) ||
      place.label.toLowerCase().includes(needle) ||
      `${place.city}, ${place.state}`.toLowerCase().includes(needle),
  ).slice(0, 8);
}

export const STATE_ABBR: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA", Colorado: "CO",
  Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID",
  Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA",
  Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN",
  Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR",
  Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
  Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA", Washington: "WA",
  "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY", "District of Columbia": "DC",
};
