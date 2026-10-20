"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getVenue } from "@/lib/catalog";
import { slotLine } from "@/lib/daypart";
import { defaultTerms } from "@/lib/deal";
import { dateFill, sortByDate } from "@/lib/queries";
import { useApp } from "@/lib/store";
import type { Band, Terms } from "@/lib/types";
import { DealFields } from "@/components/deal-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function OfferDialog({
  band,
  open,
  onOpenChange,
  bookingHref,
  postHref,
}: {
  band: Band | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingHref: (id: string) => string;
  postHref: string;
}) {
  const router = useRouter();
  const { snapshot, sendOffer } = useApp();
  const venue = getVenue(snapshot.venueId);
  const dates = useMemo(
    () =>
      sortByDate(
        snapshot.openDates.filter(
          (item) => item.venueId === snapshot.venueId && dateFill(item.id, snapshot.bookings) !== "filled",
        ),
      ),
    [snapshot],
  );
  const [openDateId, setOpenDateId] = useState(dates[0]?.id ?? "");
  const [terms, setTerms] = useState<Terms>(defaultTerms({ guarantee: band?.feeMin ?? 800, note: "" }));
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!band) return;
    const result = sendOffer(openDateId, band.id, terms);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast(result.warning ?? "Offer sent");
    onOpenChange(false);
    router.push(bookingHref(result.data));
  }

  return (
    <Dialog
      open={open && Boolean(band)}
      onOpenChange={(next) => {
        if (next && band) {
          setOpenDateId(dates[0]?.id ?? "");
          setTerms(defaultTerms({ guarantee: band.feeMin, note: "" }));
          setError(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Offer {band?.name} a date</DialogTitle>
          <DialogDescription>
            From {venue?.name ?? "your venue"}. They can accept, counter, or decline.
          </DialogDescription>
        </DialogHeader>
        {dates.length === 0 ? (
          <Button asChild className="h-10">
            <Link href={postHref}>Post a date first</Link>
          </Button>
        ) : (
          <form onSubmit={submit} className="grid gap-4">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Open date</span>
              <Select value={openDateId} onValueChange={setOpenDateId}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Pick a date" />
                </SelectTrigger>
                <SelectContent>
                  {dates.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.date} · {slotLine(item.showTime, item.daypart)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <DealFields value={terms} onChange={setTerms} />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="h-11">
              Send offer
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
