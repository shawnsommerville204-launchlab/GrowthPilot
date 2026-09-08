import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/auth";

const protectedPages = ["/leads", "/admin"];
const protectedApis = ["/api/leads", "/api/admin", "/api/recommendations", "/api/proposals"];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/api/leads" && request.method === "POST") return NextResponse.next();
  const isProtected = protectedPages.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)) || protectedApis.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
  if (!isProtected || path === "/login" || path === "/api/auth/login") return NextResponse.next();
  const configured = process.env.ADMIN_ACCESS_TOKEN;
  const authenticated = Boolean(configured && request.cookies.get(ADMIN_COOKIE)?.value === configured);
  if (authenticated) return NextResponse.next();
  if (path.startsWith("/api/")) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  const login = new URL("/login", request.url);
  login.searchParams.set("next", path);
  return NextResponse.redirect(login);
}

export const config = { matcher: ["/leads/:path*", "/admin/:path*", "/api/leads/:path*", "/api/admin/:path*", "/api/recommendations/:path*", "/api/proposals/:path*"] };