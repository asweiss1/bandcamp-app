import type { Metadata } from "next";
import { BillDetail } from "@/components/bills";

export const metadata: Metadata = { title: "Bill" };

export default async function PhoneBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BillDetail id={id} surface="phone" />;
}
