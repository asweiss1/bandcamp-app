import type { Metadata } from "next";
import { GigAgreement } from "@/components/gig-agreement";

export const metadata: Metadata = { title: "Gig agreement" };

export default async function AgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GigAgreement id={id} surface="desk" />;
}
