"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { CalendarDays, Mail, Map, Menu, MoonStar, Smartphone, UserRound } from "lucide-react";
import { Onboarding } from "@/components/onboarding";
import { unreadTotal } from "@/lib/inbox";
import { isYourMove } from "@/lib/queries";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { RoleSwitcher } from "@/components/role-switcher";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { href: "/book", label: "Book", match: ["/book", "/dates", "/bookings", "/bands"] },
  { href: "/inbox", label: "Inbox", match: ["/inbox"] },
  { href: "/plan", label: "Tour", match: ["/plan", "/tour", "/lodging"] },
  { href: "/dashboard", label: "Profile", match: ["/dashboard", "/start"] },
];

function active(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function areaActive(pathname: string, match: string[]) {
  return match.some((href) => active(pathname, href));
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { snapshot } = useApp();
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const moves = snapshot.bookings.filter((booking) => isYourMove(booking, snapshot)).length;
  const mail = unreadTotal(snapshot);
  const phone = pathname === "/phone" || pathname.startsWith("/phone/");

  if (ready && snapshot.account.phase === "welcome") {
    return <Onboarding surface={phone ? "phone" : "desk"} />;
  }
  if (phone) return <>{children}</>;

  return (
    <div className="flex min-h-full flex-col">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b bg-paper/90 backdrop-blur print:hidden">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-ink font-display text-lg text-amber">
              B
            </span>
            <span className="font-display text-xl tracking-tight">
              BandCamp
              <span className="ml-2 hidden text-xs font-sans font-medium tracking-[0.14em] text-muted-foreground uppercase sm:inline">
                Prototype
              </span>
            </span>
          </Link>
          <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-sand hover:text-foreground",
                  areaActive(pathname, link.match) && "bg-ink text-cream hover:bg-ink hover:text-cream",
                )}
              >
                {link.label}
                {link.href === "/book" && moves > 0 ? (
                  <span className="ml-1 inline-flex min-w-5 justify-center rounded-full bg-amber px-1 text-[11px] text-ink">
                    {moves}
                  </span>
                ) : null}
                {link.href === "/inbox" && mail > 0 ? (
                  <span className="ml-1 inline-flex min-w-5 justify-center rounded-full bg-amber px-1 text-[11px] text-ink">
                    {mail}
                  </span>
                ) : null}
              </Link>
            ))}
            <MoreMenu pathname={pathname} trigger="text" />
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/inbox"
              aria-label={mail > 0 ? `Inbox, ${mail} unread` : "Inbox"}
              className="relative grid size-9 place-items-center rounded-full border bg-card text-ink hover:bg-sand"
            >
              <Mail className="size-4" />
              {mail > 0 ? (
                <span className="absolute -top-1 -left-1 min-w-4 rounded-full bg-amber px-1 text-center text-[10px] font-semibold text-ink">
                  {mail}
                </span>
              ) : null}
            </Link>
            <Link
              href="/phone"
              aria-label="Open the phone companion"
              className="grid size-9 place-items-center rounded-full border bg-card text-ink hover:bg-sand"
            >
              <Smartphone className="size-4" />
            </Link>
            <RoleSwitcher />
          </div>
        </div>
      </header>
      {snapshot.account.demo ? (
        <div className="border-b bg-sand print:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm sm:px-6">
            <p>You are exploring sample profiles. Your own profiles stay on this device.</p>
            <Link href="/start" className="font-semibold text-rust">
              Your profiles
            </Link>
          </div>
        </div>
      ) : null}
      <main id="content" className="flex-1 pb-24 md:pb-10">
        {children}
      </main>
      <footer className="hidden border-t md:block print:hidden">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-4 text-xs text-muted-foreground">
          <p>BandCamp is a working prototype. Lodging laws and room rates are example data.</p>
          <p>Profiles stay in this browser until accounts exist. No payment, no contract — yet.</p>
        </div>
      </footer>
      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-paper/95 backdrop-blur print:hidden md:hidden"
      >
        <div className="grid grid-cols-4 px-1 pt-1 pb-[max(0.4rem,env(safe-area-inset-bottom))]">
          <MobileLink href="/book" label="Book" pathname={pathname} icon={<CalendarDays />} badge={moves} match={["/book", "/dates", "/bookings", "/bands"]} />
          <MobileLink href="/plan" label="Tour" pathname={pathname} icon={<Map />} match={["/plan", "/tour", "/lodging"]} />
          <MobileLink href="/dashboard" label="Profile" pathname={pathname} icon={<UserRound />} match={["/dashboard", "/start"]} />
          <MoreMenu pathname={pathname} />
        </div>
      </nav>
    </div>
  );
}

function MobileLink({
  href,
  label,
  pathname,
  icon,
  badge = 0,
  match = [href],
}: {
  href: string;
  label: string;
  pathname: string;
  icon: React.ReactNode;
  badge?: number;
  match?: string[];
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium text-muted-foreground",
        areaActive(pathname, match) && "text-ink",
      )}
    >
      <span className="[&_svg]:size-5">{icon}</span>
      {label}
      {badge > 0 ? (
        <span className="absolute top-0 right-2 min-w-4 rounded-full bg-amber px-1 text-center text-[10px] text-ink">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function MoreMenu({ pathname, trigger = "tab" }: { pathname: string; trigger?: "tab" | "text" }) {
  const { snapshot } = useApp();
  const mail = unreadTotal(snapshot);
  const extra = [
    { href: "/inbox", label: mail > 0 ? `Inbox (${mail})` : "Inbox" },
    { href: "/board", label: "Board" },
    { href: "/dates?kind=calls", label: "Permits and fairs" },
    { href: "/shows", label: "Shows" },
    { href: "/alerts", label: "Alerts" },
    { href: "/bills", label: "Bills" },
    { href: "/venues", label: "Venues" },
    { href: "/musicians", label: "Musicians" },
    { href: "/near", label: "Near you" },
    { href: "/tour", label: "Tour route" },
    { href: "/", label: "Home" },
    { href: "/phone", label: "Phone companion" },
  ];
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className={
            trigger === "text"
              ? "rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-sand hover:text-foreground"
              : "flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium text-muted-foreground"
          }
        >
          {trigger === "tab" ? <Menu className="size-5" /> : null}
          More
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">More</SheetTitle>
        </SheetHeader>
        <div className="grid gap-2 px-4 pb-6">
          {extra.map((link) => (
            <SheetClose key={link.href} asChild>
              <Link
                href={link.href}
                className={cn(
                  "flex h-11 items-center rounded-lg border px-3 text-sm font-medium",
                  active(pathname, link.href) ? "border-ink bg-ink text-cream" : "bg-card",
                )}
              >
                {link.label}
              </Link>
            </SheetClose>
          ))}
          <p className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
            <MoonStar className="size-3.5" />
            Switch role from the chip at the top of the screen.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function PageFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8", className)}>
      {children}
    </div>
  );
}

export function PageIntro({
  eyebrow,
  title,
  lede,
  actions,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 font-display text-4xl tracking-tight text-balance sm:text-5xl">{title}</h1>
        {lede ? <p className="mt-2 max-w-2xl text-base text-muted-foreground">{lede}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
