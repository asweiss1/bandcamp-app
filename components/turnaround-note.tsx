"use client";

import { noteForBooking } from "@/lib/turnaround";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export function TurnaroundNote({ bookingId, className }: { bookingId: string; className?: string }) {
  const { snapshot } = useApp();
  const note = noteForBooking(snapshot, bookingId);
  if (!note) return null;
  return (
    <span className={cn("block text-sm font-medium text-rust", className)}>
      <span aria-hidden>⌛ </span>
      {note}
    </span>
  );
}
