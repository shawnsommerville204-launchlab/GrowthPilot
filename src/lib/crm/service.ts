import { Lead, LeadStatus } from "./types";
import { AuditResult } from "@/lib/analyzer";

export type LeadCreateInput = {
  auditId: string;
  businessName: string;
  website: string;
  industry: string;
  city: string;
  email: string;
  overallScore: number;
  topOpportunity: string;
  primaryOpportunity?: string;
  recommendedService?: string;
  categoryScores?: Record<string, number>;
  topOpportunities?: Lead["topOpportunities"] | AuditResult["topOpportunities"];
  status?: LeadStatus;
  source?: "GrowthPilot Audit";
  createdAt?: string;
  updatedAt?: string;
  nextAction?: string;
};

export type LeadUpdateInput = Partial<LeadCreateInput> & { status?: LeadStatus };

export interface CRMService {
  createLead(input: LeadCreateInput): Promise<Lead>;
  getLead(id: string): Promise<Lead | undefined>;
  updateLead(id: string, updates: LeadUpdateInput): Promise<Lead | undefined>;
  listLeads(): Promise<Lead[]>;
  findExistingLead(input: { email?: string; website?: string }): Promise<Lead | undefined>;
}

const store = new Map<string, Lead>();

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function nextActionForStatus(status: LeadStatus = "New"): string {
  const map: Record<LeadStatus, string> = {
    New: "Send audit follow-up",
    Contacted: "Schedule discovery call",
    Qualified: "Prepare proposal",
    Won: "Begin implementation",
    Lost: "Add to future follow-up",
  };
  return map[status];
}

export const leadService: CRMService = {
  async createLead(input) {
    const now = new Date().toISOString();
    const lead = {
      id: crypto.randomUUID(),
      auditId: input.auditId,
      businessName: input.businessName,
      website: input.website,
      industry: input.industry,
      city: input.city,
      email: input.email,
      overallScore: input.overallScore,
      topOpportunity: input.topOpportunity,
      status: input.status ?? "New",
      source: input.source ?? "GrowthPilot Audit",
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
      primaryOpportunity: input.primaryOpportunity ?? input.topOpportunity,
      recommendedService: input.recommendedService ?? "GrowthPilot Audit Follow-Up",
      nextAction: nextActionForStatus(input.status ?? "New"),
      categoryScores: input.categoryScores,
      topOpportunities: input.topOpportunities?.map((item) => ({
        category: item.category,
        title: item.title,
        score: item.score,
        priority: item.priority,
        explanation: item.explanation,
        recommendations: item.recommendations,
      })),
      auditHistory: [input.auditId],
    } satisfies Lead;

    store.set(lead.id, lead);
    return lead;
  },

  async getLead(id) {
    return store.get(id);
  },

  async updateLead(id, updates) {
    const current = store.get(id);
    if (!current) return undefined;

    const next: Lead = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
      nextAction: nextActionForStatus(updates.status ?? current.status),
    };
    store.set(id, next);
    return next;
  },

  async listLeads() {
    return [...store.values()].sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
  },

  async findExistingLead({ email, website }) {
    const normalizedEmail = email ? normalize(email) : "";
    const normalizedWebsite = website ? normalize(website) : "";

    for (const lead of store.values()) {
      if (normalizedEmail && normalize(lead.email) === normalizedEmail) return lead;
      if (normalizedWebsite && normalize(lead.website) === normalizedWebsite) return lead;
    }
    return undefined;
  },
};

export function buildPrimaryOpportunity(result: AuditResult): { primaryOpportunity: string; recommendedService: string } {
  const categoryMap: Record<string, { service: string; label: string }> = {
    leadGeneration: { label: "Conversion Optimization", service: "GrowthPilot Conversion Optimization" },
    localSeo: { label: "Local SEO Optimization", service: "GrowthPilot Local SEO Optimization" },
    website: { label: "Website Optimization", service: "GrowthPilot Website Optimization" },
    reputation: { label: "Reputation Management", service: "GrowthPilot Reputation Management" },
    offer: { label: "Offer Positioning Optimization", service: "GrowthPilot Offer/Positioning Optimization" },
    content: { label: "Content Strategy", service: "GrowthPilot Content Strategy" },
  };

  const worst = Object.entries(result.categories).sort(([, left], [, right]) => left - right)[0];
  const mapping = categoryMap[worst?.[0] ?? "leadGeneration"] ?? categoryMap.leadGeneration;
  return {
    primaryOpportunity: mapping.label,
    recommendedService: mapping.service,
  };
}

export function getNextAction(status: LeadStatus = "New") {
  return nextActionForStatus(status);
}
