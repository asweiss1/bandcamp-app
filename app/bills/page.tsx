import type { Metadata } from "next";
import { BillIndex } from "@/components/bills";

export const metadata: Metadata = { title: "Shared bills" };

export default function BillsPage() {
  return <BillIndex surface="desk" />;
}
