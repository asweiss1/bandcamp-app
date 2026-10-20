"use client";

import { useSyncExternalStore } from "react";

export function useOnline() {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("online", onChange);
      window.addEventListener("offline", onChange);
      return () => {
        window.removeEventListener("online", onChange);
        window.removeEventListener("offline", onChange);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}

export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <p className="bg-ink px-4 py-2 text-center text-xs leading-relaxed text-cream" role="status">
      Offline. Saved dates and the tour on this phone stay readable. New changes sync when Wi-Fi returns.
    </p>
  );
}
