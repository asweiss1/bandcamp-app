"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BedDouble, Bell, CalendarDays, Map, MapPin, MessageSquare, MoonStar, Sparkles, UserRound } from "lucide-react";
import { unreadAlerts } from "@/components/fan-alerts";
import { usePlace } from "@/lib/place";
import { isYourMove } from "@/lib/queries";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/phone", label: "Next", icon: MoonStar },
  { href: "/phone/book", label: "Book", icon: CalendarDays },
  { href: "/phone/route", label: "Route", icon: Map },
  { href: "/phone/stay", label: "Stay", icon: BedDouble },
  { href: "/phone/board", label: "Board", icon: MessageSquare },
  { href: "/phone/you", label: "You", icon: UserRound },
];

const fanTabs = [
  { href: "/phone", label: "Happening", icon: Sparkles },
  { href: "/phone/near", label: "Near", icon: MapPin },
  { href: "/phone/alerts", label: "Alerts", icon: Bell },
  { href: "/phone/you", label: "You", icon: UserRound },
];

function tabActive(pathname: string, href: string, fan: boolean) {
  if (href === "/phone") {
    if (fan) return pathname === "/phone" || pathname.startsWith("/phone/shows");
    return pathname === "/phone" || pathname.startsWith("/phone/gig");
  }
  if (href === "/phone/book") {
    return pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith("/phone/bands");
  }
  if (href === "/phone/route") {
    return pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith("/phone/plan");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PhoneShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { snapshot } = useApp();
  const { place } = usePlace();
  const fan = snapshot.role === "fan";
  const bar = fan ? fanTabs : tabs;
  const moves = snapshot.bookings.filter((booking) => isYourMove(booking, snapshot)).length;
  const unread = fan ? unreadAlerts(snapshot.fanId, snapshot.alerts) : 0;

  return (
    <div className="min-h-dvh bg-ink md:grid md:place-items-center md:py-6">
      <div className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col bg-paper md:h-[min(900px,calc(100dvh-3rem))] md:overflow-hidden md:rounded-[2.2rem] md:shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:ring-1 md:ring-cream/15">
        <a
          href="#phone-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <header className="flex items-center justify-between gap-3 px-4 pt-[max(0.7rem,env(safe-area-inset-top))] pb-2">
          <Link href="/phone" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-ink font-display text-lg text-amber">
              B
            </span>
            <span>
              <span className="block font-display text-lg leading-none tracking-tight">BandCamp</span>
              <span className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                {fan ? "In the crowd" : "On the road"}
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/phone/near"
              className="max-w-28 truncate rounded-full bg-sand px-3 py-1 text-xs font-semibold"
            >
              {place.city}
            </Link>
            <Link href="/dashboard" className="text-xs font-semibold text-rust">
              Desk
            </Link>
          </div>
        </header>
        <main
          id="phone-content"
          className="flex-1 overflow-y-auto px-4 pb-4"
        >
          {children}
        </main>
        <nav
          aria-label="Phone"
          className="border-t bg-paper/95 backdrop-blur"
        >
          <div className={cn("grid px-0.5 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))]", fan ? "grid-cols-4" : "grid-cols-6")}>
            {bar.map((tab) => {
              const Icon = tab.icon;
              const selected = tabActive(pathname, tab.href, fan);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={selected ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium text-muted-foreground",
                    selected && "text-ink",
                  )}
                >
                  <Icon className="size-4" />
                  {tab.label}
                  {tab.href === "/phone" && !fan && moves > 0 ? (
                    <span className="absolute top-1 right-2 min-w-4 rounded-full bg-amber px-1 text-center text-[10px] font-semibold text-ink">
                      {moves}
                    </span>
                  ) : null}
                  {tab.href === "/phone/alerts" && unread > 0 ? (
                    <span className="absolute top-1 right-2 min-w-4 rounded-full bg-amber px-1 text-center text-[10px] font-semibold text-ink">
                      {unread}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
