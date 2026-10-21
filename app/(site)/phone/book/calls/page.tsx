import type { Metadata } from "next";
import { PhoneBook } from "@/components/phone/book";

export const metadata: Metadata = { title: "Permits and fairs" };

export default function PhoneCallsPage() {
  return <PhoneBook initialKind="calls" heading="Permits and fairs" />;
}
