import { Suspense } from "react";
import type { Metadata } from "next";
import { LodgingCity } from "@/components/lodging-views";

export const metadata: Metadata = { title: "City lodging" };

export default function LodgingCityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="px-6 py-16 text-muted-foreground">Loading the city guide…</div>}>
      <LodgingRoute params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function LodgingRoute({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const date = typeof query.date === "string" ? query.date : undefined;
  return <LodgingCity slug={slug} date={date} />;
}
