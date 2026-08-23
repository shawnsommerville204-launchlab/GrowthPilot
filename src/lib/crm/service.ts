import type { Lead, LeadPriority, LeadStatus } from "./types.ts";
import type { AuditResult } from "@/lib/analyzer";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getAirtableClient } from "./airtable.ts";
import { deriveLeadPriority, normalizeLeadStatus } from "./lead-utils.ts";

export type LeadCreateInput = {
  auditId: string;
  id?: string;
  firstName: string;
  lastName: string;
  businessName: string;
  website: string;
  industry: string;
  city: string;
  email: string;
  phone: string;
  biggestChallenge: string;
  overallScore: number;
  auditAnswers: Record<string, string>;
  auditResults: Lead["auditResults"];
  recommendations: Lead["recommendations"];
  topOpportunity: string;
  primaryOpportunity?: string;
  recommendedService?: string;
  categoryScores?: Record<string, number>;
  topOpportunities?: Lead["topOpportunities"] | AuditResult["topOpportunities"];
  status?: LeadStatus;
  priority?: LeadPriority;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  contactMethod?: Lead["contactMethod"];
  notes?: string;
  owner?: string;
  source?: "GrowthPilot Audit";
  createdAt?: string;
  updatedAt?: string;
  nextAction?: string;
  activities?: Lead["activities"];
  aiAnalysis?: Lead["aiAnalysis"];
  analysisGeneratedAt?: string;
  paidOffer?: string;
  paidAt?: string;
  paymentStatus?: "paid";
  paidAmount?: number;
  stripeCustomerId?: string;
  stripeCheckoutSessionId?: string;
};

export type LeadUpdateInput = Partial<LeadCreateInput> & { status?: LeadStatus; priority?: LeadPriority };

export interface CRMService {
  createLead(input: LeadCreateInput): Promise<Lead>;
  getLead(id: string): Promise<Lead | undefined>;
  updateLead(id: string, updates: LeadUpdateInput): Promise<Lead | undefined>;
  listLeads(): Promise<Lead[]>;
  findExistingLead(input: { email?: string; website?: string }): Promise<Lead | undefined>;
}

const storePath = path.join(process.cwd(), "data", "leads.json");
let storePromise: Promise<Map<string, Lead>> | undefined;

async function getStore() {
  if (process.env.NODE_ENV === "production" && !process.env.AIRTABLE_PAT) throw new Error("Production CRM storage is not configured.");
  if (!storePromise) {
    storePromise = fs.readFile(storePath, "utf8").then((value) => new Map(Object.entries(JSON.parse(value) as Record<string, Lead>))).catch(() => new Map());
  }
  return storePromise;
}

async function persist(store: Map<string, Lead>) {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(Object.fromEntries(store), null, 2));
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function nextActionForStatus(status: LeadStatus = "NEW LEAD"): string {
  const map: Record<LeadStatus, string> = {
    "NEW LEAD": "Review audit and send follow-up",
    REVIEWED: "Contact the business",
    CONTACTED: "Schedule discovery call",
    DISCOVERY: "Prepare discovery notes",
    PROPOSAL: "Follow up on proposal",
    WON: "Begin implementation",
    LOST: "Add to future follow-up",
  };
  return map[status];
}

export const leadService: CRMService = {
  async createLead(input) {
    const store = await getStore();
    const now = new Date().toISOString();
    const normalizedStatus = normalizeLeadStatus(input.status ?? "NEW LEAD");
    const nextPriority = input.priority ?? deriveLeadPriority({
      overallScore: input.overallScore,
      businessName: input.businessName,
      website: input.website,
      email: input.email,
      phone: input.phone,
      recommendations: input.recommendations ?? [],
      status: normalizedStatus,
      nextFollowUpAt: input.nextFollowUpAt ?? "",
    });
    const lead = {
      id: input.id ?? input.auditId,
      auditId: input.auditId,
      firstName: input.firstName,
      lastName: input.lastName,
      businessName: input.businessName,
      website: input.website,
      industry: input.industry,
      city: input.city,
      email: input.email,
      phone: input.phone,
      biggestChallenge: input.biggestChallenge,
      overallScore: input.overallScore,
      auditAnswers: input.auditAnswers,
      auditResults: input.auditResults,
      recommendations: input.recommendations,
      topOpportunity: input.topOpportunity,
      status: normalizedStatus,
      priority: nextPriority,
      lastContactedAt: input.lastContactedAt ?? "",
      nextFollowUpAt: input.nextFollowUpAt ?? "",
      contactMethod: input.contactMethod ?? "",
      notes: input.notes ?? "",
      owner: input.owner ?? "GrowthPilot",
      source: input.source ?? "GrowthPilot Audit",
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
      primaryOpportunity: input.primaryOpportunity ?? input.topOpportunity,
      recommendedService: input.recommendedService ?? "GrowthPilot Audit Follow-Up",
      nextAction: input.nextAction ?? nextActionForStatus(normalizedStatus),
      categoryScores: input.categoryScores,
      topOpportunities: (input.topOpportunities ?? input.recommendations ?? []).map((item) => ({
        category: item.category,
        title: item.title,
        score: item.score,
        priority: item.priority,
        explanation: item.explanation,
        recommendations: item.recommendations,
      })),
      auditHistory: [input.auditId],
      activities: input.activities ?? [],
    } satisfies Lead;

    const remote = await getAirtableClient();
    if (remote) return remote.createLead(lead);
    store.set(lead.id, lead);
    await persist(store);
    return lead;
  },

  async getLead(id) {
    const remote = await getAirtableClient();
    if (remote) return remote.getLead(id);
    const store = await getStore();
    return store.get(id);
  },

  async updateLead(id, updates) {
    const remote = await getAirtableClient();
    if (remote) return remote.updateLead(id, updates);
    const store = await getStore();
    const current = store.get(id);
    if (!current) return undefined;

    const nextStatus = updates.status ? normalizeLeadStatus(updates.status) : current.status;
    const nextPriority = updates.priority ?? current.priority ?? deriveLeadPriority({
      ...current,
      status: nextStatus,
      nextFollowUpAt: updates.nextFollowUpAt ?? current.nextFollowUpAt,
    });
    const next: Lead = {
      ...current,
      ...updates,
      status: nextStatus,
      priority: nextPriority,
      updatedAt: new Date().toISOString(),
      nextAction: updates.nextAction ?? nextActionForStatus(nextStatus),
      lastContactedAt: updates.lastContactedAt ?? current.lastContactedAt ?? "",
      nextFollowUpAt: updates.nextFollowUpAt ?? current.nextFollowUpAt ?? "",
      contactMethod: updates.contactMethod ?? current.contactMethod ?? "",
      notes: updates.notes ?? current.notes ?? "",
      owner: updates.owner ?? current.owner ?? "GrowthPilot",
    };
    store.set(id, next);
    await persist(store);
    return next;
  },

  async listLeads() {
    const remote = await getAirtableClient();
    if (remote) return remote.listLeads();
    const store = await getStore();
    return [...store.values()].sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
  },

  async findExistingLead({ email, website }) {
    const remote = await getAirtableClient();
    if (remote) {
      const leads = await remote.listLeads();
      return leads.find((lead) => (email && normalize(lead.email) === normalize(email)) || (website && normalize(lead.website) === normalize(website)));
    }
    const store = await getStore();
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

export function getNextAction(status: LeadStatus = "NEW LEAD") {
  return nextActionForStatus(status);
}
