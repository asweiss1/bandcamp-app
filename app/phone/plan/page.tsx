import type { Metadata } from "next";
import { TourPlanner } from "@/components/tour-planner";

export const metadata: Metadata = { title: "Tour planner" };

export default function PhonePlanPage() {
  return <TourPlanner surface="phone" />;
}
