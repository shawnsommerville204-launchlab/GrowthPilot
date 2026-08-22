import { NextResponse } from "next/server";
import { analyzeWithAI } from "@/lib/ai";
import { saveLead } from "@/lib/leads";
import { validateAuditInput } from "@/lib/audit/validators";

export const maxDuration = 20;
const requestLog = new Map<string, number[]>();

export async function POST(request: Request) {
  try {
    const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const now = Date.now();
    const recent = (requestLog.get(client) ?? []).filter((timestamp) => now - timestamp < 60_000);
    if (recent.length >= 5) return NextResponse.json({ error: "Too many audits were requested. Please try again in a minute." }, { status: 429 });
    requestLog.set(client, [...recent, now]);
    const validation = validateAuditInput(await request.json());
    if (!validation.input) return NextResponse.json({ error: validation.error }, { status: 400 });
    const input = validation.input;
    const auditId = crypto.randomUUID();
    const result = await analyzeWithAI(input);

    let leadId = "";
    let crmWarning: string | null = null;
    try {
      const leadResult = await saveLead(input, result, auditId);
      leadId = leadResult.lead.id;
    } catch (error) {
      crmWarning = "Lead tracking is temporarily unavailable; the audit was still saved.";
      console.error("CRM lead creation failed", error);
    }

    const audit = { id: auditId, auditId, ...input, ...result, createdAt: new Date().toISOString(), leadId };
    return NextResponse.json({ success: true, auditId, leadId, audit, input, result, crmWarning });
  } catch {
    return NextResponse.json({ error: "We could not complete that audit. Please try again." }, { status: 500 });
  }
}
