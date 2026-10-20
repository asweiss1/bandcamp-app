"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { BookActions } from "@/components/book-actions";
import { Tonight } from "@/components/phone/tonight";
import { useApp } from "@/lib/store";

const FanHome = dynamic(() => import("@/components/fan-home").then((mod) => mod.FanHome), {
  loading: () => <p className="text-sm text-muted-foreground">Loading shows…</p>,
});

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
