import type { Metadata } from "next";
import { PhoneShell } from "@/components/phone/shell";

export const metadata: Metadata = {
  title: "On the road",
  description:
    "BandCamp's phone companion: the next gig, the route, lodging rules, and the musician board. Same browser data as the desk.",
};

export default function PhoneLayout({ children }: { children: React.ReactNode }) {
  return <PhoneShell>{children}</PhoneShell>;
}
