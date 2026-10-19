import type { Metadata } from "next";
import { MusicianIndex } from "@/components/directory";

export const metadata: Metadata = { title: "Musicians" };

export default function MusiciansPage() {
  return <MusicianIndex />;
}
