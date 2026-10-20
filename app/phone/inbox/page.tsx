import type { Metadata } from "next";
import { InboxIndex } from "@/components/inbox";

export const metadata: Metadata = { title: "Inbox" };

export default function PhoneInboxPage() {
  return <InboxIndex surface="phone" />;
}
