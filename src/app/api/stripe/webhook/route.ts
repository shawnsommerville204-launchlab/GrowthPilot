import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { findPaymentByEvent, savePayment } from "@/lib/payments";
import { leadService } from "@/lib/crm/service";

function validSignature(payload: string, header: string, secret: string) {
  const values = header.split(",").reduce<Record<string, string[]>>((result, part) => {
    const [key, value] = part.split("=", 2);
    if (key && value) result[key] = [...(result[key] ?? []), value];
    return result;
  }, {});
  const timestamp = Number(values.t?.[0]);
  const signature = values.v1?.[0];
  if (!timestamp || !signature || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  const payload = await request.text();
  if (!validSignature(payload, request.headers.get("stripe-signature") || "", secret)) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  try {
    const event = JSON.parse(payload) as { id?: unknown; type?: unknown; created?: unknown; data?: { object?: Record<string, unknown> } };
    if (typeof event.id !== "string" || event.type !== "checkout.session.completed") return NextResponse.json({ received: true });
    const session = event.data?.object;
    if (!session || session.payment_status !== "paid" || typeof session.id !== "string") return NextResponse.json({ error: "Unsupported or unpaid checkout event." }, { status: 400 });
    const metadata = session.metadata as Record<string, unknown> | undefined;
    const leadId = typeof metadata?.leadId === "string" ? metadata.leadId : undefined;
    if (metadata?.product !== "growth_strategy_session" || metadata.source !== "growthpilot") return NextResponse.json({ error: "Unsupported checkout product." }, { status: 400 });
    const existingPayment = await findPaymentByEvent(event.id);
    const paidAt = typeof event.created === "number" ? new Date(event.created * 1000).toISOString() : new Date().toISOString();
    const customerId = typeof session.customer === "string" ? session.customer : undefined;
    if (!existingPayment) await savePayment({ id: crypto.randomUUID(), leadId, stripeEventId: event.id, stripeCheckoutSessionId: session.id, stripeCustomerId: customerId, product: "Growth Strategy Session", amount: typeof session.amount_total === "number" ? session.amount_total : 0, currency: typeof session.currency === "string" ? session.currency : "usd", status: "paid", paidAt, createdAt: paidAt });
    if (leadId) {
      const lead = await leadService.getLead(leadId);
      if (!lead) return NextResponse.json({ error: "Associated lead was not found." }, { status: 400 });
      if (lead.stripeCheckoutSessionId === session.id && lead.paymentStatus === "paid") return NextResponse.json({ received: true, duplicate: Boolean(existingPayment) });
      await leadService.updateLead(leadId, {
        paidOffer: "Growth Strategy Session",
        paidAt,
        paymentStatus: "paid",
        paidAmount: typeof session.amount_total === "number" ? session.amount_total : 9900,
        stripeCustomerId: customerId,
        stripeCheckoutSessionId: session.id,
        activities: [...(lead?.activities ?? []), { id: crypto.randomUUID(), leadId, type: "contact", content: "Growth Strategy Session purchased — $99", createdAt: paidAt, createdBy: "Stripe" }],
      });
    }
    return NextResponse.json({ received: true });
  } catch (error) { console.error("Stripe webhook failed", error instanceof Error ? error.message : "unknown error"); return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 }); }
}