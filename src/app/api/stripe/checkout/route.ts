import { NextResponse } from "next/server";
import { getOffer } from "@/lib/offers";
import { leadService } from "@/lib/crm/service";

async function stripeRequest<T>(secret: string, path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded", ...options?.headers },
  });
  if (!response.ok) throw new Error(`Stripe request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

type StripeCustomer = { id: string };
type StripeSession = { url?: string };

export async function POST(request: Request) {
  try {
    const secret = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_STRATEGY_PRICE_ID;
    if (!secret || !priceId) return NextResponse.json({ success: false, error: "Checkout is being configured. Please try again later." }, { status: 503 });

    const body = await request.json() as { leadId?: unknown };
    const leadId = typeof body.leadId === "string" ? body.leadId.trim() : "";
    const lead = leadId ? await leadService.getLead(leadId) : undefined;
    if (leadId && !lead) return NextResponse.json({ success: false, error: "We could not verify that audit lead." }, { status: 404 });

    let customerId = "";
    if (lead?.email) {
      const search = await stripeRequest<{ data: StripeCustomer[] }>(secret, `customers/search?query=${encodeURIComponent(`email:'${lead.email.replace(/'/g, "\\'")}'`)}&limit=1`);
      customerId = search.data[0]?.id ?? "";
      if (!customerId) {
        const customer = await stripeRequest<StripeCustomer>(secret, "customers", { method: "POST", body: new URLSearchParams({ email: lead.email, name: [lead.firstName, lead.lastName].filter(Boolean).join(" "), "metadata[leadId]": lead.id }) });
        customerId = customer.id;
      }
    }

    const offer = getOffer("strategy-session")!;
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    const cancelUrl = new URL("/checkout", origin);
    cancelUrl.searchParams.set("cancelled", "true");
    if (lead?.id) cancelUrl.searchParams.set("leadId", lead.id);
    const params = new URLSearchParams({ mode: "payment", "line_items[0][price]": priceId, "line_items[0][quantity]": "1", success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`, cancel_url: cancelUrl.toString(), "metadata[leadId]": lead?.id ?? "", "metadata[product]": "growth_strategy_session", "metadata[source]": "growthpilot" });
    if (customerId) params.set("customer", customerId);
    else params.set("customer_creation", "always");
    const session = await stripeRequest<StripeSession>(secret, "checkout/sessions", { method: "POST", body: params });
    if (!session.url) return NextResponse.json({ success: false, error: "We could not start checkout. Please try again." }, { status: 503 });
    return NextResponse.json({ success: true, url: session.url, product: offer.id });
  } catch (error) {
    console.error("Stripe checkout creation failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ success: false, error: "We couldn't start checkout right now. Please try again." }, { status: 503 });
  }
}