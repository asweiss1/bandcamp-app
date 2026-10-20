import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { PlaceProvider } from "@/lib/place";
import { AppProvider } from "@/lib/store";
import { Pwa } from "@/components/pwa";
import { Shell } from "@/components/shell";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
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
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#1b1612",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const known = jar.get("bandcamp-phase")?.value === "ready";
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <AppProvider>
          <PlaceProvider>
            <Shell known={known}>{children}</Shell>
            <Pwa />
            <Toaster theme="light" position="top-center" />
          </PlaceProvider>
        </AppProvider>
      </body>
    </html>
  );
}
