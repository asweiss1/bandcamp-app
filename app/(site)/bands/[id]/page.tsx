import type { Metadata } from "next";
import { BandProfile } from "@/components/directory";

export const metadata: Metadata = { title: "Band" };

export default async function BandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BandProfile id={id} />;
}
