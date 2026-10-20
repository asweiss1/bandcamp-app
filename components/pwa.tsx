"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { syncOutbox } from "@/lib/outbox";

export function Pwa() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    function onOnline() {
      const synced = syncOutbox();
      if (synced.length === 0) return;
      toast.success(`Synced ${synced.length} offline ${synced.length === 1 ? "change" : "changes"}.`);
    }
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  return null;
}
