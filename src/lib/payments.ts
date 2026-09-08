import { promises as fs } from "node:fs";
import path from "node:path";

export type Payment = { id: string; leadId?: string; stripeEventId: string; stripeCheckoutSessionId: string; stripeCustomerId?: string; product: string; amount: number; currency: string; status: "paid"; paidAt: string; createdAt: string };
const filePath = path.join(process.cwd(), "data", "payments.json");
let storePromise: Promise<Map<string, Payment>> | undefined;

function production() { return process.env.NODE_ENV === "production"; }
function endpoint() { return `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_PAYMENTS_TABLE_NAME || "Payments")}`; }
function connected() { return Boolean(process.env.AIRTABLE_PAT && process.env.AIRTABLE_BASE_ID); }
async function call(url: string, options?: RequestInit) { const response = await fetch(url, { ...options, headers: { Authorization: `Bearer ${process.env.AIRTABLE_PAT}`, "Content-Type": "application/json", ...options?.headers } }); if (!response.ok) throw new Error(`Payment storage failed: ${response.status}`); return response.json(); }
async function localStore() { if (!storePromise) storePromise = fs.readFile(filePath, "utf8").then((value) => new Map(Object.entries(JSON.parse(value) as Record<string, Payment>))).catch(() => new Map()); return storePromise; }
async function persist(store: Map<string, Payment>) { await fs.mkdir(path.dirname(filePath), { recursive: true }); await fs.writeFile(filePath, JSON.stringify(Object.fromEntries(store), null, 2)); }

export async function findPaymentByEvent(eventId: string) {
  if (production() && !connected()) throw new Error("Production payment storage is not configured.");
  if (connected()) { const data = await call(`${endpoint()}?filterByFormula=${encodeURIComponent(`{Stripe Event ID}='${eventId.replace(/'/g, "\\'")}'`)}&maxRecords=1`); return data.records[0] ? fromRecord(data.records[0]) : undefined; }
  return (await localStore()).get(eventId);
}
export async function savePayment(payment: Payment) {
  if (production() && !connected()) throw new Error("Production payment storage is not configured.");
  if (connected()) {
    const data = await call(`${endpoint()}?performUpsert=true&fieldsToMergeOn[]=Stripe%20Event%20ID`, { method: "PATCH", body: JSON.stringify({ records: [{ fields: toFields(payment) }] }) });
    return fromRecord(data.records[0]);
  }
  const store = await localStore(); store.set(payment.stripeEventId, payment); await persist(store); return payment;
}
function toFields(payment: Payment) { return { "Payment ID": payment.id, "Lead ID": payment.leadId || null, "Stripe Event ID": payment.stripeEventId, "Stripe Checkout Session ID": payment.stripeCheckoutSessionId, "Stripe Customer ID": payment.stripeCustomerId || null, Product: payment.product, Amount: payment.amount, Currency: payment.currency, Status: payment.status, "Paid At": payment.paidAt, "Created At": payment.createdAt }; }
function fromRecord(record: { fields: Record<string, unknown> }): Payment { const fields = record.fields; return { id: String(fields["Payment ID"]), leadId: String(fields["Lead ID"] || "") || undefined, stripeEventId: String(fields["Stripe Event ID"]), stripeCheckoutSessionId: String(fields["Stripe Checkout Session ID"]), stripeCustomerId: String(fields["Stripe Customer ID"] || "") || undefined, product: String(fields.Product), amount: Number(fields.Amount), currency: String(fields.Currency), status: "paid", paidAt: String(fields["Paid At"]), createdAt: String(fields["Created At"]) }; }