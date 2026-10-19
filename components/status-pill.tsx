import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  accepted: "bg-pine text-cream",
  filled: "bg-pine text-cream",
  offered: "bg-amber text-ink",
  countered: "bg-wine text-cream",
  requested: "bg-rust text-cream",
  declined: "bg-sand text-ink",
  open: "bg-cream text-ink ring-1 ring-border",
  "in-talks": "bg-accent text-ink",
};

export function statusLabel(status: string) {
  switch (status) {
    case "accepted":
      return "Confirmed";
    case "offered":
      return "Offer";
    case "countered":
      return "Counter";
    case "requested":
      return "Request";
    case "declined":
      return "Declined";
    case "open":
      return "Open";
    case "in-talks":
      return "In talks";
    case "filled":
      return "Filled";
    default:
      return status;
  }
}

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase",
        tones[status] ?? "bg-secondary text-foreground",
        className,
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
