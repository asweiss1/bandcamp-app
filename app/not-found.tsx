import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-20">
      <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">404</p>
      <h1 className="mt-2 font-display text-5xl">That page missed load-in.</h1>
      <p className="mt-3 text-muted-foreground">The route isn&apos;t on this prototype.</p>
      <Button asChild className="mt-6 h-10">
        <Link href="/">Back to the start</Link>
      </Button>
    </div>
  );
}
