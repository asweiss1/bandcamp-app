import type { Metadata } from "next";
import { PhoneDate } from "@/components/phone/book";

export const metadata: Metadata = { title: "Open date" };

export default async function PhoneDatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PhoneDate id={id} />;
}
