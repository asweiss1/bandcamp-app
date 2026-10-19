import type { Metadata } from "next";
import { TourView } from "@/components/tour-view";

export const metadata: Metadata = { title: "Tour" };

export default function TourPage() {
  return <TourView />;
}
