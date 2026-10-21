import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const known = request.cookies.get("bandcamp-phase")?.value === "ready";
  if (request.nextUrl.pathname === "/phone" && !known) {
    const url = request.nextUrl.clone();
    url.pathname = "/welcome-phone";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
