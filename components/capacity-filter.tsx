"use client";

import { CAPACITY_PRESETS } from "@/lib/capacity";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CapacityFilter({
  min,
  max,
  sort,
  sorts,
  onRange,
  onSort,
}: {
  min: number | null;
  max: number | null;
  sort: string;
  sorts: { id: string; label: string }[];
  onRange: (min: number | null, max: number | null) => void;
  onSort: (sort: string) => void;
}) {
  const any = min == null && max == null;
  return (
    <div className="grid gap-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip pressed={any} onClick={() => onRange(null, null)}>
          Any size
        </Chip>
        {CAPACITY_PRESETS.map((preset) => (
          <Chip
            key={preset.id}
            pressed={min === preset.min && max === preset.max}
            onClick={() => onRange(preset.min, preset.max)}
          >
            {preset.label}
          </Chip>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_180px]">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Min capacity</span>
          <Input
            inputMode="numeric"
            value={min ?? ""}
            placeholder="Any"
            className="h-10"
            onChange={(event) => onRange(numberOrNull(event.target.value), max)}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Max capacity</span>
          <Input
            inputMode="numeric"
            value={max ?? ""}
            placeholder="Any"
            className="h-10"
            onChange={(event) => onRange(min, numberOrNull(event.target.value))}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Sort</span>
          <Select value={sort} onValueChange={onSort}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sorts.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
    </div>
  );
}

function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        pressed ? "border-ink bg-ink text-cream" : "bg-card text-foreground hover:bg-sand",
      )}
    >
      {children}
    </button>
  );
}

function numberOrNull(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return Math.round(parsed);
}
