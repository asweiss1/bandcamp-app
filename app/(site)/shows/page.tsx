import type { Metadata } from "next";
import { FanHome } from "@/components/fan-home";

export const metadata: Metadata = { title: "What's happening" };

export default function ShowsPage() {
  return <FanHome surface="desk" focus="feed" />;
}
