"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BedDouble, Map, MessageSquare, MoonStar, UserRound } from "lucide-react";
import { isYourMove } from "@/lib/queries";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/phone", label: "Next", icon: MoonStar },
  { href: "/phone/route", label: "Route", icon: Map },
  { href: "/phone/stay", label: "Stay", icon: BedDouble },
  { href: "/phone/board", label: "Board", icon: MessageSquare },
  { href: "/phone/you", label: "You", icon: UserRound },
];

function tabActive(pathname: string, href: string) {
  if (href === "/phone") {
    return pathname === "/phone" || pathname.startsWith("/phone/gig");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PhoneShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { snapshot } = useApp();
  const moves = snapshot.bookings.filter((booking) => isYourMove(booking, snapshot)).length;

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
                On the road
              </span>
            </span>
          </Link>
          <Link href="/dashboard" className="text-xs font-semibold text-rust">
            Full desk
          </Link>
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
          <div className="grid grid-cols-5 px-1 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const selected = tabActive(pathname, tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={selected ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-medium text-muted-foreground",
                    selected && "text-ink",
                  )}
                >
                  <Icon className="size-5" />
                  {tab.label}
                  {tab.href === "/phone" && moves > 0 ? (
                    <span className="absolute top-1 right-2 min-w-4 rounded-full bg-amber px-1 text-center text-[10px] font-semibold text-ink">
                      {moves}
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
