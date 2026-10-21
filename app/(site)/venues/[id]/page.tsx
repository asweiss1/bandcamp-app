import type { Metadata } from "next";
import { VenueProfile } from "@/components/directory";

export const metadata: Metadata = { title: "Venue" };

export default async function VenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VenueProfile id={id} />;
}
