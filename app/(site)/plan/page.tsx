import type { Metadata } from "next";
import { PageFrame } from "@/components/shell";
import { TourPlanner } from "@/components/tour-planner";

export const metadata: Metadata = { title: "Tour planner" };

export default function PlanPage() {
  return (
    <PageFrame>
      <TourPlanner surface="desk" />
    </PageFrame>
  );
}
