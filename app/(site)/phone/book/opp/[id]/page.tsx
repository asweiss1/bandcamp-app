import type { Metadata } from "next";
import { OpportunityDetail } from "@/components/opportunity-detail";

export const metadata: Metadata = { title: "Opportunity" };

export default async function PhoneOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OpportunityDetail id={id} surface="phone" />;
}