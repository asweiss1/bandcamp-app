import type { Metadata } from "next";
import { InboxIndex } from "@/components/inbox";

export const metadata: Metadata = { title: "Inbox" };

export default function InboxPage() {
  return <InboxIndex surface="desk" />;
}
