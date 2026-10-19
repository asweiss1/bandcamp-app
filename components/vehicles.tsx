"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import type { FuelType, Vehicle, VehicleType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TYPES: { id: VehicleType; label: string }[] = [
  { id: "van", label: "Van" },
  { id: "trailer", label: "Trailer" },
  { id: "rv", label: "RV" },
  { id: "car", label: "Car" },
];

const emptyDraft = {
  name: "",
  vehicleType: "van" as VehicleType,
  mpg: "",
  fuel: "gas" as FuelType,
  towMpg: "",
};

export function VehiclePanel({ bandId }: { bandId: string }) {
  const { snapshot, saveVehicle, removeVehicle } = useApp();
  const vehicles = snapshot.vehicles.filter((vehicle) => vehicle.bandId === bandId);
  const canEdit = snapshot.role === "band" && snapshot.bandId === bandId;
  const [adding, setAdding] = useState(false);

  return (
    <section className="rounded-2xl border bg-card p-4">
      <h2 className="font-display text-3xl">Vehicles</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        The tour uses the first van, RV, or car. Towing MPG is used when this band also lists a trailer.
      </p>
      {vehicles.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No vehicle listed. Fuel falls back to a sample van at 12 mpg.</p>
      ) : (
        <ul className="mt-3 grid gap-3">
          {vehicles.map((vehicle) => (
            <li key={vehicle.id}>
              <VehicleForm
                bandId={bandId}
                vehicle={vehicle}
                canEdit={canEdit}
                onSave={saveVehicle}
                onRemove={removeVehicle}
              />
            </li>
          ))}
        </ul>
      )}
      {canEdit && adding ? (
        <div className="mt-3">
          <VehicleForm
            bandId={bandId}
            canEdit
            onSave={(vehicle) => {
              const result = saveVehicle(vehicle);
              if (result.ok) setAdding(false);
              return result;
            }}
            onRemove={() => {
              setAdding(false);
              return { ok: true as const, data: "" };
            }}
          />
        </div>
      ) : null}
      {canEdit && !adding ? (
        <Button type="button" variant="outline" className="mt-3 h-10" onClick={() => setAdding(true)}>
          Add a vehicle
        </Button>
      ) : null}
      {canEdit ? null : (
        <p className="mt-3 text-xs text-muted-foreground">Switch to this band to edit the rig.</p>
      )}
    </section>
  );
}

function VehicleForm({
  bandId,
  vehicle,
  canEdit,
  onSave,
  onRemove,
}: {
  bandId: string;
  vehicle?: Vehicle;
  canEdit: boolean;
  onSave: (vehicle: Omit<Vehicle, "id" | "towMpg"> & { id?: string; towMpg?: number | null }) => { ok: boolean; error?: string };
  onRemove: (id: string) => { ok: boolean; error?: string };
}) {
  const [name, setName] = useState(vehicle?.name ?? emptyDraft.name);
  const [vehicleType, setVehicleType] = useState<VehicleType>(vehicle?.vehicleType ?? emptyDraft.vehicleType);
  const [mpg, setMpg] = useState(vehicle ? String(vehicle.mpg) : emptyDraft.mpg);
  const [fuel, setFuel] = useState<FuelType>(vehicle?.fuel ?? emptyDraft.fuel);
  const [towMpg, setTowMpg] = useState(vehicle?.towMpg != null ? String(vehicle.towMpg) : "");

  function save() {
    const tow = towMpg.trim();
    const result = onSave({
      id: vehicle?.id,
      bandId,
      name,
      vehicleType,
      mpg: Number(mpg),
      fuel,
      towMpg: tow ? Number(tow) : null,
    });
    if (!result.ok) toast.error(result.error ?? "Could not save that vehicle.");
    else toast.success(vehicle ? "Vehicle updated." : "Vehicle added.");
  }

  function remove() {
    if (!vehicle) {
      onRemove("");
      return;
    }
    const result = onRemove(vehicle.id);
    if (!result.ok) toast.error(result.error ?? "Could not remove that vehicle.");
    else toast.success("Vehicle removed.");
  }

  return (
    <div className="grid gap-2 rounded-xl bg-sand/60 p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-xs font-medium">
          Name
          <Input className="h-10" value={name} disabled={!canEdit} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="grid gap-1 text-xs font-medium">
          Type
          <select
            className="h-10 rounded-lg border bg-transparent px-2 text-sm"
            value={vehicleType}
            disabled={!canEdit}
            onChange={(event) => setVehicleType(event.target.value as VehicleType)}
          >
            {TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium">
          MPG
          <Input
            className="h-10"
            inputMode="decimal"
            value={mpg}
            disabled={!canEdit}
            onChange={(event) => setMpg(event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-xs font-medium">
          Fuel
          <select
            className="h-10 rounded-lg border bg-transparent px-2 text-sm"
            value={fuel}
            disabled={!canEdit}
            onChange={(event) => setFuel(event.target.value as FuelType)}
          >
            <option value="gas">Gas</option>
            <option value="diesel">Diesel</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium sm:col-span-2">
          Towing MPG, optional
          <Input
            className="h-10"
            inputMode="decimal"
            value={towMpg}
            disabled={!canEdit}
            placeholder="Used only with a trailer"
            onChange={(event) => setTowMpg(event.target.value)}
          />
        </label>
      </div>
      {canEdit ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="h-10" onClick={save}>
            {vehicle ? "Save vehicle" : "Add vehicle"}
          </Button>
          <Button type="button" variant="outline" className="h-10" onClick={remove}>
            {vehicle ? "Remove" : "Cancel"}
          </Button>
        </div>
      ) : (
        <p className="text-sm">
          {vehicle?.name} · {vehicle?.vehicleType} · {vehicle?.mpg} mpg {vehicle?.fuel}
          {vehicle?.towMpg != null ? ` · ${vehicle.towMpg} mpg towing` : ""}
        </p>
      )}
    </div>
  );
}
