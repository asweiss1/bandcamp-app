import Link from "next/link";
import { Button } from "@/components/ui/button";

export function BookActions({ tone }: { tone: "cream" | "desk" | "phone" }) {
  const gig = tone === "phone" ? "/phone/book" : "/book";
  const tour = tone === "phone" ? "/phone/plan" : "/plan";

  if (tone === "phone") {
    return (
      <div id="book-actions" className="grid gap-2">
        <Link href={gig} className="grid h-12 place-items-center rounded-xl bg-ink text-base font-semibold text-cream">
          Book a gig
        </Link>
        <Link href={tour} className="grid h-12 place-items-center rounded-xl border border-ink bg-card text-base font-semibold">
          Book a whole tour
        </Link>
      </div>
    );
  }

  if (tone === "cream") {
    return (
      <div id="book-actions" className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="h-12 bg-amber px-6 text-base text-ink hover:bg-amber/90">
          <Link href={gig}>Book a gig</Link>
        </Button>
        <Button asChild variant="outline" className="h-12 border-cream/40 bg-transparent px-6 text-base text-cream hover:bg-cream/10">
          <Link href={tour}>Book a whole tour</Link>
        </Button>
      </div>
    );
  }

  return (
    <div id="book-actions" className="mb-6 flex flex-col gap-2 sm:flex-row">
      <Button asChild className="h-12 px-6 text-base">
        <Link href={gig}>Book a gig</Link>
      </Button>
      <Button asChild variant="outline" className="h-12 px-6 text-base">
        <Link href={tour}>Book a whole tour</Link>
      </Button>
    </div>
  );
}
