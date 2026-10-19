"use client";

import { DEAL_OPTIONS } from "@/lib/deal";
import type { Terms } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function DealFields({
  value,
  onChange,
}: {
  value: Terms;
  onChange: (next: Terms) => void;
}) {
  const showGuarantee = value.dealType !== "door";
  const showSplit = value.dealType !== "guarantee";

  return (
    <div className="grid gap-4">
      <div className="grid gap-2 sm:grid-cols-3">
        {DEAL_OPTIONS.map((option) => {
          const selected = value.dealType === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange({ ...value, dealType: option.id })}
              className={cn(
                "rounded-xl border px-3 py-3 text-left transition focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                selected ? "border-rust bg-accent" : "border-border bg-card hover:bg-sand",
              )}
            >
              <span className="block text-sm font-semibold">{option.label}</span>
              <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                {option.hint}
              </span>
            </button>
          );
        })}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {showGuarantee ? (
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Guarantee</span>
            <Input
              className="h-10"
              inputMode="decimal"
              min={0}
              type="number"
              value={value.guarantee ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  guarantee: event.target.value === "" ? null : Number(event.target.value),
                })
              }
            />
          </label>
        ) : null}
        {showSplit ? (
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Band&apos;s share of the door</span>
            <Input
              className="h-10"
              inputMode="numeric"
              min={0}
              max={100}
              type="number"
              value={value.doorSplitBand ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  doorSplitBand: event.target.value === "" ? null : Number(event.target.value),
                })
              }
            />
          </label>
        ) : null}
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Ticket price</span>
          <Input
            className="h-10"
            inputMode="decimal"
            min={0}
            type="number"
            value={value.ticketPrice ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                ticketPrice: event.target.value === "" ? null : Number(event.target.value),
              })
            }
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Load-in</span>
          <Input
            className="h-10"
            type="time"
            value={value.loadIn}
            onChange={(event) => onChange({ ...value, loadIn: event.target.value })}
          />
        </label>
      </div>
      <label className="flex items-start gap-3 rounded-xl border bg-card px-3 py-3 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-rust"
          checked={value.backline}
          onChange={(event) => onChange({ ...value, backline: event.target.checked })}
        />
        <span>
          <span className="block font-medium">Backline in house</span>
          <span className="text-muted-foreground">
            Drum kit and amps stay at the venue. Uncheck if the band is bringing everything.
          </span>
        </span>
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Note</span>
        <Textarea
          value={value.note}
          placeholder="Why this deal, what you can flex, what the van needs."
          onChange={(event) => onChange({ ...value, note: event.target.value })}
        />
      </label>
    </div>
  );
}
