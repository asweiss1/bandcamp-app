"use client";

import { useEffect, useRef } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { GIG_COLOR, type TourNight } from "@/lib/tour";

function pinIcon(color: string, n: number, selected: boolean) {
  const size = selected ? 34 : 28;
  const ink = color.toLowerCase() === "#e2a322" ? "#1b1612" : "#fffaf3";
  return L.divIcon({
    className: "tour-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span style="display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:999px;background:${color};color:${ink};font:700 12px/1 Outfit,sans-serif;border:2px solid #fffaf3;box-shadow:0 1px 4px rgba(27,22,18,.35)${selected ? `,0 0 0 3px ${color}` : ""}">${n}</span>`,
  });
}

function legIcon(text: string) {
  return L.divIcon({
    className: "tour-leg",
    iconSize: [108, 22],
    iconAnchor: [54, 26],
    html: `<span style="display:inline-block;max-width:108px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border-radius:999px;border:1px solid #e2d4c2;background:#fffaf3;padding:2px 7px;font:600 11px/16px Outfit,sans-serif;color:#1b1612">${text}</span>`,
  });
}

function Frame({ nights, selectedId }: { nights: TourNight[]; selectedId: string }) {
  const map = useMap();
  const fitted = useRef(false);
  const skipFly = useRef(true);

  useEffect(() => {
    if (fitted.current || nights.length === 0) return;
    fitted.current = true;
    const bounds = L.latLngBounds(nights.map((night) => [night.pinLat, night.pinLng]));
    map.fitBounds(bounds.pad(0.28));
    const timer = window.setTimeout(() => map.invalidateSize(), 180);
    return () => window.clearTimeout(timer);
  }, [map, nights]);

  useEffect(() => {
    const night = nights.find((item) => item.id === selectedId);
    if (!night) return;
    if (skipFly.current) {
      skipFly.current = false;
      return;
    }
    map.flyTo([night.pinLat, night.pinLng], Math.max(map.getZoom(), 7), { duration: 0.45 });
  }, [map, nights, selectedId]);

  return null;
}

export function TourMap({
  nights,
  selectedId,
  onSelect,
}: {
  nights: TourNight[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const first = nights[0];
  if (!first) return null;

  return (
    <MapContainer
      center={[first.lat, first.lng]}
      zoom={6}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Frame nights={nights} selectedId={selectedId} />
      {nights.slice(1).map((night, index) => {
        const previous = nights[index];
        const quiet = !night.leg || night.leg.miles === 0;
        return (
          <Polyline
            key={`line-${night.id}`}
            positions={[
              [previous.pinLat, previous.pinLng],
              [night.pinLat, night.pinLng],
            ]}
            pathOptions={{
              color: "#c4492c",
              weight: quiet ? 2 : 3,
              opacity: quiet ? 0.45 : 0.9,
              dashArray: quiet ? "6 8" : undefined,
            }}
          />
        );
      })}
      {nights.slice(1).map((night, index) => {
        const previous = nights[index];
        if (!night.leg || night.leg.miles === 0) return null;
        return (
          <Marker
            key={`label-${night.id}`}
            position={[(previous.pinLat + night.pinLat) / 2, (previous.pinLng + night.pinLng) / 2]}
            icon={legIcon(`${night.leg.hours}h · ${night.leg.miles} mi`)}
            interactive={false}
            keyboard={false}
          />
        );
      })}
      {nights.map((night, index) => (
        <Marker
          key={night.id}
          position={[night.pinLat, night.pinLng]}
          icon={pinIcon(GIG_COLOR[night.gig], index + 1, night.id === selectedId)}
          eventHandlers={{ click: () => onSelect(night.id) }}
        >
          <Tooltip>{`${index + 1}. ${night.city}`}</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
