import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const configured = process.env.ADMIN_ACCESS_TOKEN;
  if (!configured) return NextResponse.json({ error: "Operator authentication is not configured." }, { status: 503 });
  const body = await request.json() as { token?: unknown };
  if (typeof body.token !== "string" || body.token !== configured) return NextResponse.json({ error: "Invalid access token." }, { status: 401 });
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, configured, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
  return response;
}