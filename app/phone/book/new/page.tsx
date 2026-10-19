import type { Metadata } from "next";
import { PhonePostDate } from "@/components/phone/book";

export const metadata: Metadata = { title: "Post a date" };

export default function PhonePostDatePage() {
  return <PhonePostDate />;
}
