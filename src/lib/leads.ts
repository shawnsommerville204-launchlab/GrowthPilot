import type { AuditInput, AuditResult } from "./analyzer.ts";
import { buildPrimaryOpportunity, getNextAction, leadService } from "./crm/service.ts";
import type { Lead } from "./crm/types.ts";

export type { Lead, LeadStatus } from "./crm/types.ts";

export async function saveLead(input: AuditInput, result: AuditResult, auditId: string) {
  const existing = await leadService.findExistingLead({ email: input.email, website: input.website });
  const { primaryOpportunity, recommendedService } = buildPrimaryOpportunity(result);
  const payload = {
    auditId,
    firstName: "",
    lastName: "",
    businessName: input.businessName,
    website: input.website,
    industry: input.industry,
    city: input.city,
    email: input.email,
    phone: "",
    biggestChallenge: "",
    overallScore: result.overallScore,
    auditAnswers: input as unknown as Record<string, string>,
    auditResults: { overallScore: result.overallScore, categories: result.categories, findings: result.findings, summary: result.summary },
    recommendations: result.topOpportunities,
    topOpportunity: result.topOpportunities[0]?.title ?? "Growth opportunity",
    primaryOpportunity,
    recommendedService,
    categoryScores: result.categories,
    topOpportunities: result.topOpportunities,
    status: existing?.status ?? ("NEW LEAD" as const),
    source: "GrowthPilot Audit" as const,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nextAction: getNextAction(existing?.status ?? "NEW LEAD"),
  };

  if (existing) {
    const updated = await leadService.updateLead(existing.id, {
      ...payload,
      auditId,
      status: existing.status,
      updatedAt: new Date().toISOString(),
      nextAction: existing.nextAction ?? getNextAction(existing.status),
    });
    return { lead: updated ?? existing, exists: true, warning: null };
  }

  const created = await leadService.createLead(payload);
  return { lead: created, exists: false, warning: null };
}

export async function getLead(id: string) { return leadService.getLead(id); }
export async function updateLead(id: string, updates: Partial<Lead>) { return leadService.updateLead(id, updates); }
export async function listLeads() { return leadService.listLeads(); }
