import type { Metadata } from "next";
import { FanAlerts } from "@/components/fan-alerts";
import { PageFrame } from "@/components/shell";

export const metadata: Metadata = { title: "Alerts" };

export default function AlertsPage() {
  return (
    <PageFrame>
      <FanAlerts surface="desk" />
    </PageFrame>
  );
}
