"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { GIG_COLOR, type TourNight } from "@/lib/tour";

function pinIcon(color: string, n: number, selected: boolean, dx: number, dy: number) {
  const size = selected ? 32 : 26;
  const ink = color.toLowerCase() === "#e2a322" ? "#1b1612" : "#fffaf3";
  return L.divIcon({
    className: "tour-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2 - dx, size / 2 - dy],
    html: `<span style="display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:999px;background:${color};color:${ink};font:700 12px/1 Outfit,sans-serif;border:2px solid #fffaf3;box-shadow:0 1px 3px rgba(27,22,18,.4)">${n}</span>`,
  });
}

function chipIcon(text: string, anchor: [number, number]) {
  const width = Math.min(132, 18 + text.length * 6.2);
  return L.divIcon({
    className: "tour-leg",
    iconSize: [width, 18],
    iconAnchor: anchor,
    html: `<span style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border-radius:999px;border:1px solid #e2d4c2;background:#fffaf3;padding:0 6px;font:600 10px/16px Outfit,sans-serif;color:#1b1612;text-align:center">${text}</span>`,
  });
}

function spiderOffset(order: number, count: number) {
  if (count < 2) return { x: 0, y: 0 };
  const angle = (order / count) * Math.PI * 2 - Math.PI / 2;
  const radius = 14;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

function FlyTo({ nights, selectedId }: { nights: TourNight[]; selectedId: string }) {
  const map = useMap();
  const skip = useRef(true);
  const nightsRef = useRef(nights);

  useEffect(() => {
    nightsRef.current = nights;
  }, [nights]);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    const night = nightsRef.current.find((item) => item.id === selectedId);
    if (!night) return;
    map.flyTo([night.lat, night.lng], Math.min(Math.max(map.getZoom(), 6), 8), { duration: 0.4 });
  }, [map, selectedId]);

  return null;
}

function Frame({ nights }: { nights: TourNight[] }) {
  const map = useMap();
  const nightsRef = useRef(nights);

  useEffect(() => {
    nightsRef.current = nights;
  }, [nights]);

  useEffect(() => {
    const container = map.getContainer();
    let sized = "";
    const fit = () => {
      map.invalidateSize();
      const size = map.getSize();
      if (size.x < 40 || size.y < 40) return;
      const key = `${Math.round(size.x)}x${Math.round(size.y)}`;
      if (key === sized) return;
      sized = key;
      const current = nightsRef.current;
      if (current.length === 0) return;
      map.fitBounds(L.latLngBounds(current.map((night) => [night.lat, night.lng])).pad(0.28));
    };
    fit();
    const observer = new ResizeObserver(() => fit());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

function LegAndCityLabels({ nights }: { nights: TourNight[] }) {
  const map = useMap();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((value) => value + 1);
    map.on("zoomend moveend", bump);
    return () => {
      map.off("zoomend", bump);
      map.off("moveend", bump);
    };
  }, [map]);

  const cities = useMemo(() => {
    const seen = new Set<string>();
    return nights.filter((night) => {
      if (seen.has(night.citySlug)) return false;
      seen.add(night.citySlug);
      return true;
    });
  }, [nights]);

  void tick;

  return (
    <>
      {nights.slice(1).map((night, index) => {
        const previous = nights[index];
        if (!night.leg || night.leg.miles === 0) return null;
        const start = map.latLngToContainerPoint([previous.lat, previous.lng]);
        const end = map.latLngToContainerPoint([night.lat, night.lng]);
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.hypot(dx, dy) || 1;
        const sign = index % 2 === 0 ? 1 : -1;
        const ox = (-dy / len) * 12 * sign;
        const oy = (dx / len) * 12 * sign;
        const text = `${night.leg.hours}h · ${night.leg.miles} mi`;
        const width = Math.min(132, 18 + text.length * 6.2);
        return (
          <Marker
            key={`label-${night.id}`}
            position={[(previous.lat + night.lat) / 2, (previous.lng + night.lng) / 2]}
            icon={chipIcon(text, [width / 2 - ox, 9 - oy])}
            interactive={false}
            keyboard={false}
          />
        );
      })}
      {cities.map((night) => (
        <Marker
          key={`city-${night.citySlug}`}
          position={[night.lat, night.lng]}
          icon={chipIcon(night.city, [Math.min(132, 18 + night.city.length * 6.2) / 2, -6])}
          interactive={false}
          keyboard={false}
        />
      ))}
    </>
  );
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
  const spider = useMemo(() => {
    const seen = new Map<string, number>();
    const counts = new Map<string, number>();
    for (const night of nights) counts.set(night.citySlug, (counts.get(night.citySlug) ?? 0) + 1);
    return nights.map((night) => {
      const order = seen.get(night.citySlug) ?? 0;
      seen.set(night.citySlug, order + 1);
      return spiderOffset(order, counts.get(night.citySlug) ?? 1);
    });
  }, [nights]);

  if (!first) return null;

  return (
    <MapContainer center={[first.lat, first.lng]} zoom={5} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Frame nights={nights} />
      <FlyTo nights={nights} selectedId={selectedId} />
      <LegAndCityLabels nights={nights} />
      {nights.slice(1).map((night, index) => {
        const previous = nights[index];
        const quiet = !night.leg || night.leg.miles === 0;
        if (quiet) return null;
        return (
          <Polyline
            key={`line-${night.id}`}
            positions={[
              [previous.lat, previous.lng],
              [night.lat, night.lng],
            ]}
            pathOptions={{ color: "#c4492c", weight: 3, opacity: 0.9 }}
          />
        );
      })}
      {nights.map((night, index) => (
        <Marker
          key={night.id}
          position={[night.lat, night.lng]}
          zIndexOffset={night.id === selectedId ? 800 : 400}
          icon={pinIcon(
            GIG_COLOR[night.gig],
            index + 1,
            night.id === selectedId,
            spider[index]?.x ?? 0,
            spider[index]?.y ?? 0,
          )}
          eventHandlers={{ click: () => onSelect(night.id) }}
        >
          <Tooltip>{`${index + 1}. ${night.city}`}</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
