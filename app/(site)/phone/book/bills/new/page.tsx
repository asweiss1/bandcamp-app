import type { Metadata } from "next";
import { BillForm } from "@/components/bills";

export const metadata: Metadata = { title: "Build a bill" };

export default function PhoneNewBillPage() {
  return <BillForm surface="phone" />;
}
