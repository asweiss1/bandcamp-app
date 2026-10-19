import type { Metadata } from "next";
import { PhoneListing } from "@/components/phone/board";

export const metadata: Metadata = { title: "Listing" };

export default async function PhoneListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PhoneListing id={id} />;
}
