import type { Metadata } from "next";
import { PhoneGig } from "@/components/phone/gig";

export const metadata: Metadata = { title: "Gig" };

export default async function PhoneGigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PhoneGig id={id} />;
}
