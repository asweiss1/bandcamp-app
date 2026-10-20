import type { Metadata } from "next";
import { DatesBrowser } from "@/components/dates-browser";

export const metadata: Metadata = { title: "Opportunities" };

export default async function DatesPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const params = await searchParams;
  return <DatesBrowser initialKind={params.kind === "calls" ? "calls" : "all"} />;
}
