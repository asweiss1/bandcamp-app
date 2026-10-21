import type { Metadata } from "next";
import { FanAlerts } from "@/components/fan-alerts";

export const metadata: Metadata = { title: "Alerts" };

export default function PhoneAlertsPage() {
  return <FanAlerts surface="phone" />;
}
