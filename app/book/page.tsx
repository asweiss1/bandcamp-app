import type { Metadata } from "next";
import { BookNear } from "@/components/book-near";

export const metadata: Metadata = { title: "Book a gig" };

export default function BookPage() {
  return <BookNear surface="desk" />;
}
