import type { Metadata } from "next";
import { ListingForm } from "@/components/board-views";

export const metadata: Metadata = { title: "Post a listing" };

export default function NewListingPage() {
  return <ListingForm />;
}
