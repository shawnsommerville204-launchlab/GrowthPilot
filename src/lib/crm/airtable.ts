import { Lead, LeadStatus } from "./types";

export type AirtableRecord = Partial<Record<string, string | number | boolean | null>>;

export type AirtableClient = {
  createLead: (lead: Lead) => Promise<Lead>;
  getLead: (id: string) => Promise<Lead | undefined>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<Lead | undefined>;
  listLeads: () => Promise<Lead[]>;
};

function hasAirtableConnection() {
  return Boolean(process.env.AIRTABLE_PAT && process.env.AIRTABLE_BASE_ID);
}

export async function getAirtableClient(): Promise<AirtableClient | null> {
  if (!hasAirtableConnection()) return null;

  return {
    async createLead(lead) {
      return lead;
    },
    async getLead(id) {
      void id;
      return undefined;
    },
    async updateLead(id, updates) {
      return { ...updates, id } as Lead;
    },
    async listLeads() {
      return [];
    },
  };
}

export const AIRTABLE_REQUIRED_FIELDS = [
  "Lead ID",
  "Audit ID",
  "Business Name",
  "Website",
  "Industry",
  "City",
  "Email",
  "Overall Score",
  "Top Opportunity",
  "Status",
  "Source",
  "Created At",
  "Updated At",
];

export function buildAirtableFieldMap(lead: Lead): Record<string, string | number | null> {
  return {
    "Lead ID": lead.id,
    "Audit ID": lead.auditId,
    "Business Name": lead.businessName,
    Website: lead.website,
    Industry: lead.industry,
    City: lead.city,
    Email: lead.email,
    "Overall Score": lead.overallScore,
    "Top Opportunity": lead.topOpportunity,
    Status: lead.status as LeadStatus,
    Source: lead.source,
    "Created At": lead.createdAt,
    "Updated At": lead.updatedAt,
  };
}
