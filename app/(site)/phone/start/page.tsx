"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProfileWizard } from "@/components/onboarding";

function PhoneStart() {
  const params = useSearchParams();
  const welcome = params.get("welcome");
  const initialRole =
    welcome === "band" || welcome === "venue" || welcome === "musician" || welcome === "fan" ? welcome : null;
  return <ProfileWizard surface="phone" profileId={params.get("edit")} initialRole={initialRole} welcome={Boolean(initialRole)} />;
}

export default function PhoneStartPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading the profile…</p>}>
      <PhoneStart />
    </Suspense>
  );
}
