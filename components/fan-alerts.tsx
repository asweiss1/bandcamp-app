"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function FanAlerts({ surface }: { surface: "desk" | "phone" }) {
  const { snapshot, markAlertsRead } = useApp();
  const alerts = snapshot.alerts
    .filter((alert) => alert.fanId === snapshot.fanId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = alerts.filter((alert) => !alert.read).length;
  const href = (id: string) => (surface === "phone" ? `/phone/shows/${id}` : `/shows/${id}`);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Alerts</p>
          <h1 className="mt-1 font-display text-4xl leading-none tracking-tight">For you</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {unread > 0
              ? `${unread} new. A followed band booked near home, or a followed room posted a lineup.`
              : "You're caught up. New notes show up when a followed band books near home, or a followed room posts a lineup."}
          </p>
        </div>
        {unread > 0 ? (
          <Button
            type="button"
            variant="outline"
            className="h-10"
            onClick={() => {
              const result = markAlertsRead();
              if (!result.ok) toast.error(result.error);
            }}
          >
            Mark read
          </Button>
        ) : null}
      </div>
      {alerts.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
          No alerts yet. Follow a band or a room, then confirmed shows nearby land here.
        </p>
      ) : (
        <ul className="grid gap-2">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <Link href={href(alert.bookingId)} className="block rounded-2xl border bg-card px-4 py-3 hover:border-rust/40">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {alert.read ? "Read" : "New"} · {alert.kind === "band-near" ? "Band near you" : "New lineup"}
                </p>
                <p className="mt-1 font-medium">{alert.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{alert.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function unreadAlerts(fanId: string, alerts: { fanId: string; read: boolean }[]) {
  return alerts.filter((alert) => alert.fanId === fanId && !alert.read).length;
}
