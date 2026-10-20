"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, Mail, Map, MapPin, Menu, Sparkles, UserRound } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { unreadAlerts } from "@/components/fan-alerts";
import { unreadTotal } from "@/lib/inbox";
import { usePlace } from "@/lib/place";
import { isYourMove } from "@/lib/queries";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/phone/book", label: "Book", icon: CalendarDays },
  { href: "/phone/plan", label: "Tour", icon: Map },
  { href: "/phone/you", label: "Profile", icon: UserRound },
];

const fanTabs = [
  { href: "/phone", label: "Happening", icon: Sparkles },
  { href: "/phone/near", label: "Near", icon: MapPin },
  { href: "/phone/alerts", label: "Alerts", icon: Bell },
  { href: "/phone/you", label: "You", icon: UserRound },
];

function tabActive(pathname: string, href: string, fan: boolean) {
  if (fan && href === "/phone") return pathname === "/phone" || pathname.startsWith("/phone/shows");
  if (href === "/phone/book") {
    return pathname.startsWith("/phone/book") || pathname.startsWith("/phone/bands") || pathname.startsWith("/phone/gig");
  }
  if (href === "/phone/plan") {
    return pathname.startsWith("/phone/plan") || pathname.startsWith("/phone/route");
  }
  if (href === "/phone/you") return pathname.startsWith("/phone/you") || pathname.startsWith("/phone/start");
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
  const mail = unreadTotal(snapshot);

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
              href="/phone/inbox"
              aria-label={mail > 0 ? `Inbox, ${mail} unread` : "Inbox"}
              className="relative grid size-9 place-items-center rounded-full border bg-card text-ink"
            >
              <Mail className="size-4" />
              {mail > 0 ? (
                <span className="absolute -top-1 -left-1 min-w-4 rounded-full bg-amber px-1 text-center text-[10px] font-semibold text-ink">
                  {mail}
                </span>
              ) : null}
            </Link>
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
          <div className="grid grid-cols-4 px-0.5 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
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
                  {tab.href === "/phone/book" && !fan && moves > 0 ? (
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
            {fan ? null : <PhoneMore pathname={pathname} />}
          </div>
        </nav>
      </div>
    </div>
  );
}

function PhoneMore({ pathname }: { pathname: string }) {
  const { snapshot } = useApp();
  const mail = unreadTotal(snapshot);
  const links = [
    { href: "/phone/bands", label: "Find bands" },
    { href: "/phone/inbox", label: mail > 0 ? `Inbox (${mail})` : "Inbox" },
    { href: "/phone/board", label: "Board" },
    { href: "/phone/book/calls", label: "Permits and fairs" },
    { href: "/phone/stay", label: "Stay" },
    { href: "/phone/route", label: "Route" },
    { href: "/phone", label: "Next date" },
  ];
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium text-muted-foreground"
        >
          <Menu className="size-4" />
          More
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">More</SheetTitle>
        </SheetHeader>
        <div className="grid gap-2 px-4 pb-6">
          {links.map((link) => (
            <SheetClose key={link.href} asChild>
              <Link
                href={link.href}
                className={cn(
                  "flex h-11 items-center rounded-lg border px-3 text-sm font-medium",
                  pathname === link.href ? "border-ink bg-ink text-cream" : "bg-card",
                )}
              >
                {link.label}
              </Link>
            </SheetClose>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
