import type { Metadata } from "next";
import { PhoneYou } from "@/components/phone/you";

export const metadata: Metadata = { title: "You" };

export default function PhoneYouPage() {
  return <PhoneYou />;
}
