import type { Metadata } from "next";
import { MusicianProfile } from "@/components/directory";

export const metadata: Metadata = { title: "Musician" };

export default async function MusicianPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MusicianProfile id={id} />;
}
