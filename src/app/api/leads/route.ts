import { NextResponse } from "next/server";
import { AuditResult } from "@/lib/analyzer";
import { leadService } from "@/lib/crm/service";
import { generateRecommendationPlan } from "@/lib/ai";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function text(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validAudit(value: unknown): value is { input: Record<string, string>; result: AuditResult } {
  if (!value || typeof value !== "object") return false;
  const audit = value as Record<string, unknown>;
  const input = audit.input;
  const result = audit.result;
  return Boolean(input && typeof input === "object" && result && typeof result === "object" && typeof (result as AuditResult).overallScore === "number" && (result as AuditResult).categories);
}

export async function GET() {
  try {
    const leads = await leadService.listLeads();
    return NextResponse.json({ success: true, leads });
  } catch (error) {
    console.error("Lead list failed", error);
    return NextResponse.json({ success: false, error: "Unable to load lead list." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const firstName = text(body.firstName, 80);
    const lastName = text(body.lastName, 80);
    const businessName = text(body.businessName, 120);
    const email = text(body.email, 254).toLowerCase();
    if (!firstName || !lastName || !businessName || !email) return NextResponse.json({ error: "First name, last name, business name, and email are required." }, { status: 400 });
    if (!emailPattern.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (!validAudit(body.audit)) return NextResponse.json({ error: "Your audit data is missing or invalid. Please run the audit again." }, { status: 400 });

    const audit = body.audit;
    const input = audit.input;
    const result = audit.result;
    const aiAnalysis = await generateRecommendationPlan({
      businessName,
      website: text(input.website, 2048),
      industry: text(input.industry, 100),
      city: text(input.city, 100),
      email,
    }, result);
    const existing = await leadService.findExistingLead({ email, website: text(input.website, 2048) });
    if (existing) {
      if (existing.aiAnalysis) return NextResponse.json({ success: true, duplicate: true, leadId: existing.id, auditId: existing.auditId, lead: existing, result: { ...result, aiAnalysis: existing.aiAnalysis } });
      const aiAnalysis = await generateRecommendationPlan({ businessName, website: text(input.website, 2048), industry: text(input.industry, 100), city: text(input.city, 100), email }, result);
      const updated = await leadService.updateLead(existing.id, { aiAnalysis, analysisGeneratedAt: new Date().toISOString() });
      return NextResponse.json({ success: true, duplicate: true, leadId: existing.id, auditId: existing.auditId, lead: updated ?? existing, result: { ...result, aiAnalysis } });
    }

    const sequence = (await leadService.listLeads()).filter((lead) => lead.id.startsWith(`GP-${new Date().getUTCFullYear()}-`)).length + 1;
    const auditId = `GP-${new Date().getUTCFullYear()}-${String(sequence).padStart(6, "0")}`;
    const lead = await leadService.createLead({
      auditId,
      firstName,
      lastName,
      businessName,
      website: text(input.website, 2048),
      industry: text(input.industry, 100),
      city: text(input.city, 100),
      email,
      phone: text(body.phone, 40),
      biggestChallenge: text(body.biggestChallenge, 1000),
      overallScore: result.overallScore,
      auditAnswers: input,
      auditResults: { overallScore: result.overallScore, categories: result.categories, findings: result.findings, summary: result.summary },
      recommendations: result.topOpportunities,
      topOpportunity: result.topOpportunities[0]?.title ?? "Growth opportunity",
      primaryOpportunity: result.topOpportunities[0]?.title ?? "Growth opportunity",
      recommendedService: "GrowthPilot Audit Follow-Up",
      status: "NEW LEAD",
      source: "GrowthPilot Audit",
      aiAnalysis,
      analysisGeneratedAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true, leadId: lead.id, auditId, lead, result: { ...result, aiAnalysis } });
  } catch (error) {
    console.error("Lead creation failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "We could not save your details. Please try again." }, { status: 500 });
  }
}