import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!secret || !sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return NextResponse.json({ success: false, status: "unavailable" }, { status: 400 });
  try {
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${secret}` } });
    if (!response.ok) return NextResponse.json({ success: false, status: "unavailable" }, { status: 502 });
    const session = await response.json() as { payment_status?: string; status?: string };
    return NextResponse.json({ success: true, paid: session.payment_status === "paid", status: session.status ?? "unknown" });
  } catch { return NextResponse.json({ success: false, status: "unavailable" }, { status: 502 }); }
}