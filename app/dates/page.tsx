import type { Metadata } from "next";
import { DatesBrowser } from "@/components/dates-browser";

export const metadata: Metadata = { title: "Opportunities" };

export default function DatesPage() {
  return <DatesBrowser />;
}
