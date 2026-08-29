// CORS support for /api routes so the Chrome extension (chrome-extension://
// origin) and other local clients can POST normalized job data to the local
// service. Echoes the request origin; answers preflight OPTIONS.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") || "*";
  const res = NextResponse.next();
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-jobhunt-token");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Vary", "Origin");

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: res.headers });
  }
  return res;
}

export const config = {
  matcher: "/api/:path*",
};
