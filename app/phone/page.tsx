import type { Metadata } from "next";
import { Tonight } from "@/components/phone/tonight";

export const metadata: Metadata = { title: "Next up" };

export default function PhoneHomePage() {
  return <Tonight />;
}
