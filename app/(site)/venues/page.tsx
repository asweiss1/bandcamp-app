import type { Metadata } from "next";
import { VenueIndex } from "@/components/directory";

export const metadata: Metadata = { title: "Venues" };

export default function VenuesPage() {
  return <VenueIndex />;
}
