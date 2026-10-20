import type { Metadata } from "next";
import { ShowPage } from "@/components/show-page";

export const metadata: Metadata = { title: "Show" };

export default async function PhoneShowRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ShowPage id={id} surface="phone" />;
}
