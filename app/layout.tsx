import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Toaster } from "sonner";
import { AppProvider } from "@/lib/store";
import { Shell } from "@/components/shell";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: {
    default: "BandCamp",
    template: "%s · BandCamp",
  },
  description:
    "A prototype booking desk for bands, small venues, and fill-in musicians. Open dates, deal negotiation, a tour route, and sample lodging for the night after load-out.",
  applicationName: "BandCamp",
  appleWebApp: {
    capable: true,
    title: "BandCamp",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#1b1612",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <AppProvider>
          <Shell>{children}</Shell>
          <Toaster theme="light" position="top-center" />
        </AppProvider>
      </body>
    </html>
  );
}
