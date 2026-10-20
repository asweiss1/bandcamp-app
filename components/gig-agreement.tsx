"use client";

import Link from "next/link";
import { toast } from "sonner";
import { agreementFor, agreementText } from "@/lib/agreement";
import { useApp } from "@/lib/store";
import { isVerified, verificationFor } from "@/lib/trust";
import { PageFrame } from "@/components/shell";
import { Button } from "@/components/ui/button";

export function GigAgreement({ id, surface }: { id: string; surface: "desk" | "phone" }) {
  const { snapshot } = useApp();
  const agreement = agreementFor(snapshot, id);
  const back = surface === "phone" ? `/phone/gig/${id}` : `/bookings/${id}`;

  if (!agreement) {
    const missing = (
      <div>
        <h1 className="font-display text-4xl">The agreement waits until both sides confirm.</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Offers and counters stay private. The one-page agreement appears after the date is confirmed.
        </p>
        <Link href={back} className="mt-4 inline-block text-sm font-semibold text-rust">
          Back to the booking
        </Link>
      </div>
    );
    return surface === "phone" ? missing : <PageFrame>{missing}</PageFrame>;
  }

  const booking = snapshot.bookings.find((item) => item.id === id);
  const bandVerified = booking ? isVerified("band", verificationFor(snapshot.verifications, booking.bandId)) : false;
  const venueVerified = booking ? isVerified("venue", verificationFor(snapshot.verifications, booking.venueId)) : false;

  async function download() {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "pt", format: "letter" });
    const lines = pdf.splitTextToSize(agreementText(agreement!), 460);
    pdf.setFont("times", "normal");
    pdf.text(lines, 72, 72);
    pdf.save(`${agreement!.bookingId}-agreement.pdf`);
    toast("Agreement downloaded");
  }

  const sheet = (
    <article id="gig-agreement" className="mx-auto max-w-3xl rounded-2xl border bg-card px-5 py-6 sm:px-8 sm:py-8 print:border-0 print:shadow-none">
      <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Gig agreement</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
        {agreement.bandName} at {agreement.venueName}
      </h1>
      <p className="mt-2 text-lg">{agreement.dateLabel}</p>
      <p className="text-muted-foreground">{agreement.when}</p>
      <p className="mt-1 text-sm text-muted-foreground">{agreement.address}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold tracking-wide uppercase">
        <span className="rounded-full bg-pine px-2.5 py-1 text-cream">Both sides accepted</span>
        {bandVerified ? <span className="rounded-full bg-sand px-2.5 py-1">Band verified</span> : null}
        {venueVerified ? <span className="rounded-full bg-sand px-2.5 py-1">Venue verified</span> : null}
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <Row label="Pay" value={agreement.pay} />
        <Row label="Door / tickets" value={`${agreement.door} ${agreement.tickets}. ${agreement.age}.`} />
        <Row label="Set time" value={agreement.when} />
        <Row label="Load-in" value={agreement.loadIn} />
        <Row label="Gear" value={agreement.gear} />
        <Row label="Accepted" value={agreement.acceptedOn} />
      </dl>
      <h2 className="mt-6 font-display text-2xl">Cancellation</h2>
      <p className="mt-2 text-sm leading-relaxed">{agreement.cancellation}</p>
      <p className="mt-6 text-sm text-muted-foreground">
        {agreement.bandName} and {agreement.venueName} accepted these terms on {agreement.acceptedOn}.
      </p>
      <div className="mt-6 flex flex-wrap gap-2 print:hidden">
        <Button type="button" className="h-11" onClick={() => window.print()}>
          Print
        </Button>
        <Button type="button" variant="outline" className="h-11" onClick={() => void download()}>
          Download PDF
        </Button>
        <Button asChild variant="ghost" className="h-11">
          <Link href={back}>Back to the booking</Link>
        </Button>
      </div>
    </article>
  );

  return surface === "phone" ? sheet : <PageFrame>{sheet}</PageFrame>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 text-sm leading-relaxed">{value}</dd>
    </div>
  );
}
