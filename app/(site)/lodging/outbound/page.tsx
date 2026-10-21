import type { Metadata } from "next";
import Link from "next/link";
import { searchLinksFor } from "@/lib/lodging";
import { PageFrame } from "@/components/shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Lodging search" };

export default async function OutboundLodgingPage({
  searchParams,
}: {
  searchParams: Promise<{ label?: string; date?: string }>;
}) {
  const query = await searchParams;
  const label = query.label?.trim() || "this town";
  const links = searchLinksFor(label, query.date);

  return (
    <PageFrame>
      <Link href="/lodging" className="text-sm font-medium text-rust">
        ← Sample cities
      </Link>
      <p className="mt-4 text-xs font-semibold tracking-[0.16em] text-rust uppercase">No seeded listings</p>
      <h1 className="mt-2 font-display text-5xl tracking-tight">{label}</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        This town is not one of the sample cities with lodging cards. Maps and outbound search still work.
        Nothing here is a live rate or a legal briefing.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {links.map((link) => (
          <Button key={link.label} asChild variant="outline" className="h-10">
            <a href={link.href} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          </Button>
        ))}
      </div>
    </PageFrame>
  );
}
