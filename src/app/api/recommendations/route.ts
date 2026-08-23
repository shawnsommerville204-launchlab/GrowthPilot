import { NextResponse } from "next/server";
import { generateRecommendationPlan, isAIRecommendationPlan } from "@/lib/ai";
import { leadService } from "@/lib/crm/service";
import type { AuditResult } from "@/lib/audit/types";

export const maxDuration = 20;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { leadId?: unknown };
    if (typeof body.leadId !== "string" || !body.leadId.trim()) return NextResponse.json({ success: false, error: "A lead ID is required." }, { status: 400 });

    const lead = await leadService.getLead(body.leadId);
    if (!lead) return NextResponse.json({ success: false, error: "Lead not found." }, { status: 404 });

    const input = {
      businessName: lead.businessName,
      website: lead.website,
      industry: lead.industry,
      city: lead.city,
      email: lead.email,
    };
    const audit: AuditResult = {
      ...lead.auditResults,
      categories: lead.auditResults.categories as AuditResult["categories"],
      findings: lead.auditResults.findings as AuditResult["findings"],
      topOpportunities: lead.topOpportunities ?? lead.recommendations,
      actionPlan: [],
      score: lead.overallScore,
      strengths: [],
      opportunities: [],
      priority: { category: "OTHER", title: "Review growth signals", description: "Review the audit evidence.", impact: "Medium" as const },
      actions: [],
      insights: [],
    };
    const analysis = await generateRecommendationPlan(input, audit);
    if (!isAIRecommendationPlan(analysis)) return NextResponse.json({ success: false, error: "Recommendation validation failed." }, { status: 502 });

    const updated = await leadService.updateLead(lead.id, { aiAnalysis: analysis, analysisGeneratedAt: new Date().toISOString() });
    if (!updated) return NextResponse.json({ success: false, error: "Unable to save recommendation analysis." }, { status: 500 });
    return NextResponse.json({ success: true, analysis, lead: updated });
  } catch (error) {
    console.error("Recommendation generation failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ success: false, error: "AI analysis is temporarily unavailable. Your audit is still saved." }, { status: 503 });
  }
}