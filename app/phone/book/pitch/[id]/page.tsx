import type { Metadata } from "next";
import { PitchRoom } from "@/components/pitch-room";

export const metadata: Metadata = { title: "Pitch" };

export default async function PhonePitchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PitchRoom id={id} surface="phone" />;
}
