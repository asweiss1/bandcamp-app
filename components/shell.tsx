"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutDashboard, Menu, MoonStar, Smartphone, Tent, Users } from "lucide-react";
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
  { href: "/dates", label: "Dates" },
  { href: "/bands", label: "Bands" },
  { href: "/venues", label: "Venues" },
  { href: "/lodging", label: "Lodging" },
  { href: "/board", label: "Board" },
  { href: "/near", label: "Near" },
  { href: "/plan", label: "Plan" },
  { href: "/tour", label: "Tour" },
  { href: "/dashboard", label: "Desk" },
];

function active(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { snapshot } = useApp();
  const moves = snapshot.bookings.filter((booking) => isYourMove(booking, snapshot)).length;

  if (pathname === "/phone" || pathname.startsWith("/phone/")) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-full flex-col">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b bg-paper/90 backdrop-blur">
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
          <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-sand hover:text-foreground",
                  active(pathname, link.href) && "bg-ink text-cream hover:bg-ink hover:text-cream",
                )}
              >
                {link.label}
                {link.href === "/dashboard" && moves > 0 ? (
                  <span className="ml-1 inline-flex min-w-5 justify-center rounded-full bg-amber px-1 text-[11px] text-ink">
                    {moves}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
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
      <main id="content" className="flex-1 pb-24 md:pb-10">
        {children}
      </main>
      <footer className="hidden border-t md:block">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-4 text-xs text-muted-foreground">
          <p>BandCamp is a working prototype. Lodging laws and room rates are example data.</p>
          <p>No account, no payment, no contract — yet.</p>
        </div>
      </footer>
      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-paper/95 backdrop-blur md:hidden"
      >
        <div className="grid grid-cols-5 px-1 pt-1 pb-[max(0.4rem,env(safe-area-inset-bottom))]">
          <MobileLink href="/dates" label="Dates" pathname={pathname} icon={<CalendarDays />} />
          <MobileLink href="/lodging" label="Stay" pathname={pathname} icon={<Tent />} />
          <MobileLink href="/board" label="Board" pathname={pathname} icon={<Users />} />
          <MobileLink
            href="/dashboard"
            label="Desk"
            pathname={pathname}
            icon={<LayoutDashboard />}
            badge={moves}
          />
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
}: {
  href: string;
  label: string;
  pathname: string;
  icon: React.ReactNode;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium text-muted-foreground",
        active(pathname, href) && "text-ink",
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

function MoreMenu({ pathname }: { pathname: string }) {
  const extra = [
    { href: "/bands", label: "Bands" },
    { href: "/venues", label: "Venues" },
    { href: "/musicians", label: "Musicians" },
    { href: "/near", label: "Near you" },
    { href: "/plan", label: "Plan a tour" },
    { href: "/tour", label: "Tour route" },
    { href: "/", label: "Home" },
    { href: "/phone", label: "Phone companion" },
  ];
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium text-muted-foreground"
        >
          <Menu className="size-5" />
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
