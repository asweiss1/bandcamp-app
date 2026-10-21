import type { Metadata } from "next";
import { NightChoices } from "@/components/pitch-room";

export const metadata: Metadata = { title: "Who fits this night" };

export default async function PhoneNightPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <NightChoices id={id} surface="phone" />;
}
