"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import type { Role } from "@/lib/types";

const choices: { role: Role; title: string; name: string; copy: string; href: string }[] = [
  {
    role: "band",
    title: "View as band",
    name: "Mesa Dust",
    copy: "A Phoenix band mid-route. Flagstaff made an offer. Cottonwood countered. Vegas is still a request.",
    href: "/dashboard",
  },
  {
    role: "venue",
    title: "View as venue",
    name: "High Country Social",
    copy: "A Flagstaff room with an offer out to Mesa Dust and a Saturday request from Salt Choir.",
    href: "/dashboard",
  },
  {
    role: "musician",
    title: "View as musician",
    name: "Lena Ortiz",
    copy: "A Tucson drummer with a listing up and a note already sent to Night Market.",
    href: "/board",
  },
];

export function EnterBar() {
  const { setRole } = useApp();
  const router = useRouter();

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {choices.map((choice) => (
        <button
          key={choice.role}
          type="button"
          onClick={() => {
            setRole(choice.role);
            router.push(choice.href);
          }}
          className="rounded-2xl border border-cream/15 bg-cream/5 px-4 py-4 text-left transition hover:border-amber/60 hover:bg-cream/10 focus-visible:ring-3 focus-visible:ring-amber/60 focus-visible:outline-none"
        >
          <span className="text-xs font-semibold tracking-[0.16em] text-amber uppercase">
            {choice.title}
          </span>
          <span className="mt-2 block font-display text-2xl text-cream">{choice.name}</span>
          <span className="mt-2 block text-sm leading-relaxed text-cream/75">{choice.copy}</span>
        </button>
      ))}
    </div>
  );
}
