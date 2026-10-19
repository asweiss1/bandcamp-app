import type { Metadata } from "next";
import { PhoneBand } from "@/components/phone/band";

export const metadata: Metadata = { title: "Band" };

export default async function PhoneBandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PhoneBand id={id} />;
}