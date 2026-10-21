import type { Metadata } from "next";
import { BandIndex } from "@/components/directory";

export const metadata: Metadata = { title: "Bands" };

export default function BandsPage() {
  return <BandIndex />;
}
