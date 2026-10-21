import type { Metadata } from "next";
import { NearFeed } from "@/components/near-feed";
import { PageFrame } from "@/components/shell";

export const metadata: Metadata = { title: "Near you" };

export default function NearPage() {
  return (
    <PageFrame>
      <NearFeed surface="desk" />
    </PageFrame>
  );
}
