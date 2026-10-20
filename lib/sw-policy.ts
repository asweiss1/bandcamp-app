export const CACHE_NAME = "bandcamp-shell-v1";

export const PRECACHE = [
  "/phone",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

export type CacheMode = "static" | "shell" | "api" | "ignore";

export function cacheMode(pathname: string, method: string): CacheMode {
  if (method !== "GET") return "ignore";
  if (pathname.startsWith("/_next/static/")) return "static";
  if (pathname.startsWith("/api/")) return "api";
  if (
    pathname === "/phone" ||
    pathname.startsWith("/phone/") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/icon.svg" ||
    pathname.startsWith("/icon-") ||
    pathname === "/apple-touch-icon.png"
  ) {
    return "shell";
  }
  return "ignore";
}
