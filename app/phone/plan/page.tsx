import type { Metadata } from "next";
import dynamic from "next/dynamic";

const TourPlanner = dynamic(() => import("@/components/tour-planner").then((mod) => mod.TourPlanner), {
  loading: () => <p className="text-sm text-muted-foreground">Loading the tour planner…</p>,
});

export const metadata: Metadata = { title: "Tour planner" };

export default function PhonePlanPage() {
  return <TourPlanner surface="phone" />;
}
