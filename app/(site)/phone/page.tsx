import type { Metadata } from "next";
import { PhoneHome } from "@/components/phone/home";

export const metadata: Metadata = { title: "Next up" };

export default function PhoneHomePage() {
  return <PhoneHome />;
}
