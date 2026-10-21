import { WelcomeChoices } from "@/components/welcome-choices";

export function WelcomeScreen() {
  return (
    <main className="min-h-dvh bg-ink md:grid md:place-items-center md:py-6">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-paper md:h-[min(900px,calc(100dvh-3rem))] md:min-h-0 md:overflow-y-auto md:rounded-[2.2rem] md:shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div id="onboarding" className="grid gap-5 px-4 py-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-rust uppercase">Create a profile · 1 of 1</p>
            <h1 className="mt-2 font-display text-4xl leading-none tracking-tight">Who is this profile for?</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Saved in this browser for now. The same fields are ready for an account later.
            </p>
          </div>
          <WelcomeChoices />
        </div>
      </div>
    </main>
  );
}
