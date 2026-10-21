import { cookies } from "next/headers";
import { AppShell } from "@/components/app-shell";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const known = (await cookies()).get("bandcamp-phase")?.value === "ready";
  return <AppShell known={known}>{children}</AppShell>;
}
