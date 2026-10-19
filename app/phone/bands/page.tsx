import type { Metadata } from "next";
import { BandSearch } from "@/components/band-search";

export const metadata: Metadata = { title: "Find a band" };

export default function PhoneBandsPage() {
  return (
    <div className="grid gap-4 pb-2">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Book</p>
        <h1 className="mt-1 font-display text-4xl leading-none tracking-tight">Find a band</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Search the name, a player, or a song. Send an offer onto one of your open nights.
        </p>
      </div>
      <BandSearch surface="phone" />
    </div>
  );
}
