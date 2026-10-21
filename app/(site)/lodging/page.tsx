import type { Metadata } from "next";
import { LodgingIndex } from "@/components/lodging-views";

export const metadata: Metadata = { title: "Lodging" };

export default function LodgingPage() {
  return <LodgingIndex />;
}
