import type { Metadata } from "next";
import { BandSearch } from "@/components/band-search";

export const metadata: Metadata = { title: "Find bands" };

export default function PhoneBandsPage() {
  return (
    <div className="grid gap-4 pb-2">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Directory</p>
        <h1 className="mt-1 font-display text-4xl leading-none tracking-tight">Find bands</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Search by name, hometown, or style. Message, tune in, invite them onto a night, or make an offer.
        </p>
      </div>
      <BandSearch surface="phone" />
    </div>
  );
}
