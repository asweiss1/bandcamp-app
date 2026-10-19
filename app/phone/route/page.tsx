import type { Metadata } from "next";
import { PhoneRoute } from "@/components/phone/route-screen";

export const metadata: Metadata = { title: "Route" };

export default function PhoneRoutePage() {
  return <PhoneRoute />;
}
