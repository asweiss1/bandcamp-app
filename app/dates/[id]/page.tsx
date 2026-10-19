import type { Metadata } from "next";
import { DateDetail } from "@/components/date-detail";

export const metadata: Metadata = { title: "Open date" };

export default async function DatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DateDetail id={id} />;
}
