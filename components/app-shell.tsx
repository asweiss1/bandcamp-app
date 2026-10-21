import { Toaster } from "sonner";
import { PlaceProvider } from "@/lib/place";
import { AppProvider } from "@/lib/store";
import { Pwa } from "@/components/pwa";
import { Shell } from "@/components/shell";

export function AppShell({ children, known }: { children: React.ReactNode; known: boolean }) {
  return (
    <AppProvider>
      <PlaceProvider>
        <Shell known={known}>{children}</Shell>
        <Pwa />
        <Toaster theme="light" position="top-center" />
      </PlaceProvider>
    </AppProvider>
  );
}
