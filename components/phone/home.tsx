"use client";

import Link from "next/link";
import { BookActions } from "@/components/book-actions";
import { FanHome } from "@/components/fan-home";
import { Tonight } from "@/components/phone/tonight";
import { useApp } from "@/lib/store";

export function PhoneHome() {
  const { snapshot } = useApp();
  return (
    <div className="grid gap-5">
      <BookActions tone="phone" />
      <Link href="/phone/bands" className="text-sm font-semibold text-rust">
        Find bands
      </Link>
      {snapshot.role === "fan" ? <FanHome surface="phone" focus="feed" /> : <Tonight />}
    </div>
  );
}
