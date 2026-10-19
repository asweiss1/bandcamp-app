import type { Metadata } from "next";
import { PhoneBoard } from "@/components/phone/board";

export const metadata: Metadata = { title: "Board" };

export default function PhoneBoardPage() {
  return <PhoneBoard />;
}
