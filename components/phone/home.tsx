"use client";

import { BookActions } from "@/components/book-actions";
import { FanHome } from "@/components/fan-home";
import { Tonight } from "@/components/phone/tonight";
import { useApp } from "@/lib/store";

export function PhoneHome() {
  const { snapshot } = useApp();
  return (
    <div className="grid gap-5">
      <BookActions tone="phone" />
      {snapshot.role === "fan" ? <FanHome surface="phone" focus="feed" /> : <Tonight />}
    </div>
  );
}
