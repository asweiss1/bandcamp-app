import type { Metadata } from "next";
import { PhoneBook } from "@/components/phone/book";

export const metadata: Metadata = { title: "Book" };

export default function PhoneBookPage() {
  return <PhoneBook />;
}
