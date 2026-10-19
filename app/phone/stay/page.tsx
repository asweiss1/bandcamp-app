import { Suspense } from "react";
import type { Metadata } from "next";
import { PhoneStay } from "@/components/phone/stay";

export const metadata: Metadata = { title: "Stay" };

export default function PhoneStayPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading the city…</p>}>
      <PhoneStay />
    </Suspense>
  );
}
