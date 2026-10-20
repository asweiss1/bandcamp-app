"use client";

import { DAYPARTS, daypartFor } from "@/lib/daypart";
import type { Daypart } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function DaypartField({
  daypart,
  showTime,
  onChange,
  disabled,
}: {
  daypart: Daypart;
  showTime: string;
  onChange: (next: { daypart: Daypart; showTime: string }) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">Daypart</span>
      <div className="flex flex-wrap gap-2">
        {DAYPARTS.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            aria-pressed={daypart === item.id}
            onClick={() => onChange({ daypart: item.id, showTime: item.time })}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              daypart === item.id ? "bg-ink text-cream" : "bg-sand",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Start time</span>
        <Input
          className="h-11"
          value={showTime}
          disabled={disabled}
          onChange={(event) => onChange({ showTime: event.target.value, daypart: daypartFor(event.target.value) })}
        />
      </label>
    </div>
  );
}
