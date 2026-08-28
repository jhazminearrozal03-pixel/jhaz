import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

import { CHECKLIST_COOKIE_NAME } from "@/lib/checklist-session";

// Optimistic check only (cookie signature, no DB lookup) — Route Handlers still perform the
// authoritative session check against ChecklistSession via lib/checklist-dal.ts.
async function hasValidSessionCookie(request: NextRequest) {
  const cookieValue = request.cookies.get(CHECKLIST_COOKIE_NAME)?.value;
  if (!cookieValue) return false;

  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  try {
    await jwtVerify(cookieValue, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = await hasValidSessionCookie(request);

  if (pathname === "/checklist/login") {
    if (authenticated) {
      return NextResponse.redirect(new URL("/checklist", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/checklist") && !authenticated) {
    return NextResponse.redirect(new URL("/checklist/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/checklist/:path*"],
};
