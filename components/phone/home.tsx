"use client";

import { FanHome } from "@/components/fan-home";
import { Tonight } from "@/components/phone/tonight";
import { useApp } from "@/lib/store";

export function PhoneHome() {
  const { snapshot } = useApp();
  if (snapshot.role === "fan") return <FanHome surface="phone" focus="feed" />;
  return <Tonight />;
}
