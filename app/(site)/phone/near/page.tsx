import type { Metadata } from "next";
import { NearFeed } from "@/components/near-feed";

export const metadata: Metadata = { title: "Near you" };

export default function PhoneNearPage() {
  return <NearFeed surface="phone" />;
}
