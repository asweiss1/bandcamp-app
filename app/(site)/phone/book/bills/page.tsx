import type { Metadata } from "next";
import { BillIndex } from "@/components/bills";

export const metadata: Metadata = { title: "Shared bills" };

export default function PhoneBillsPage() {
  return <BillIndex surface="phone" />;
}
