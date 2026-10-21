import type { Metadata } from "next";
import { InboxThread } from "@/components/inbox";

export const metadata: Metadata = { title: "Message" };

export default async function PhoneInboxThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InboxThread id={id} surface="phone" />;
}