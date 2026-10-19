"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProfileWizard } from "@/components/onboarding";

function PhoneStart() {
  const params = useSearchParams();
  return <ProfileWizard surface="phone" profileId={params.get("edit")} />;
}

export default function PhoneStartPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading the profile…</p>}>
      <PhoneStart />
    </Suspense>
  );
}
