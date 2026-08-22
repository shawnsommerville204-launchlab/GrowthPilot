import { AuditInput, AuditResult } from "./analyzer";
import { buildPrimaryOpportunity, getNextAction, leadService } from "./crm/service";
import { Lead } from "./crm/types";

export type { Lead, LeadStatus } from "./crm/types";

export async function saveLead(input: AuditInput, result: AuditResult, auditId: string) {
  const existing = await leadService.findExistingLead({ email: input.email, website: input.website });
  const { primaryOpportunity, recommendedService } = buildPrimaryOpportunity(result);
  const payload = {
    auditId,
    businessName: input.businessName,
    website: input.website,
    industry: input.industry,
    city: input.city,
    email: input.email,
    overallScore: result.overallScore,
    topOpportunity: result.topOpportunities[0]?.title ?? "Growth opportunity",
    primaryOpportunity,
    recommendedService,
    categoryScores: result.categories,
    topOpportunities: result.topOpportunities,
    status: existing?.status ?? "New",
    source: "GrowthPilot Audit" as const,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nextAction: getNextAction(existing?.status ?? "New"),
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
