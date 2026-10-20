"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function pin() {
  return L.divIcon({
    className: "show-pin",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: `<span style="display:block;width:16px;height:16px;border-radius:999px;background:#c4492c;border:2px solid #fffaf3;box-shadow:0 1px 3px rgba(27,22,18,.4)"></span>`,
  });
}

export function ShowMap({
  shows,
}: {
  shows: { bookingId: string; lat: number; lng: number; title: string; href: string }[];
}) {
  const first = shows[0];
  if (!first) {
    return <p className="rounded-2xl border border-dashed px-4 py-8 text-sm text-muted-foreground">No confirmed shows in this radius.</p>;
  }
  return (
    <div className="h-80 overflow-hidden rounded-2xl border">
      <MapContainer center={[first.lat, first.lng]} zoom={6} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {shows.map((show) => (
          <Marker key={show.bookingId} position={[show.lat, show.lng]} icon={pin()}>
            <Popup>
              <a href={show.href}>{show.title}</a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
