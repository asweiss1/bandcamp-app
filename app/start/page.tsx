"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ProfileWizard } from "@/components/onboarding";
import { PageFrame } from "@/components/shell";

function StartForm() {
  const params = useSearchParams();
  const edit = params.get("edit");
  return (
    <PageFrame>
      <ProfileWizard surface="desk" profileId={edit} />
    </PageFrame>
  );
}

export default function StartPage() {
  return (
    <Suspense fallback={<PageFrame><p className="text-sm text-muted-foreground">Loading the profile…</p></PageFrame>}>
      <StartForm />
    </Suspense>
  );
}
