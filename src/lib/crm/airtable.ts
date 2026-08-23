import type { Lead, LeadStatus } from "./types.ts";

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

  const endpoint = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_TABLE_NAME || "Leads")}`;
  const headers = { Authorization: `Bearer ${process.env.AIRTABLE_PAT}`, "Content-Type": "application/json" };
  async function call(url: string, options?: RequestInit) {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) throw new Error(`Airtable request failed: ${response.status}`);
    return response.json();
  }
  function formula(value: string) { return encodeURIComponent(`{Lead ID}='${value.replace(/'/g, "\\'")}'`); }
  function fromRecord(record: { fields: Record<string, unknown> }): Lead {
    const fields = record.fields;
    return {
      id: String(fields["Lead ID"] ?? ""),
      auditId: String(fields["Audit ID"] ?? ""),
      firstName: String(fields["First Name"] ?? ""),
      lastName: String(fields["Last Name"] ?? ""),
      businessName: String(fields["Business Name"] ?? ""),
      website: String(fields.Website ?? ""),
      industry: String(fields.Industry ?? ""),
      city: String(fields.City ?? ""),
      email: String(fields.Email ?? ""),
      phone: String(fields.Phone ?? ""),
      biggestChallenge: String(fields["Biggest Challenge"] ?? ""),
      overallScore: Number(fields["Overall Score"] ?? 0),
      auditAnswers: JSON.parse(String(fields["Audit Answers"] ?? "{}")),
      auditResults: JSON.parse(String(fields["Audit Results"] ?? "{}")),
      recommendations: JSON.parse(String(fields.Recommendations ?? "[]")),
      topOpportunity: String(fields["Top Opportunity"] ?? ""),
      status: String(fields.Status ?? "NEW LEAD") as LeadStatus,
      priority: String(fields.Priority ?? "WARM") as Lead["priority"],
      source: "GrowthPilot Audit",
      createdAt: String(fields["Created At"] ?? ""),
      updatedAt: String(fields["Updated At"] ?? ""),
      lastContactedAt: String(fields["Last Contacted At"] ?? ""),
      nextFollowUpAt: String(fields["Next Follow-Up At"] ?? ""),
      contactMethod: String(fields["Contact Method"] ?? "") as Lead["contactMethod"],
      notes: String(fields.Notes ?? ""),
      owner: String(fields.Owner ?? "GrowthPilot"),
      nextAction: String(fields["Next Action"] ?? ""),
      activities: JSON.parse(String(fields.Activities ?? "[]")),
      aiAnalysis: fields["AI Analysis"] ? JSON.parse(String(fields["AI Analysis"])) : undefined,
      analysisGeneratedAt: String(fields["Analysis Generated At"] ?? "") || undefined,
      paidOffer: String(fields["Paid Offer"] ?? "") || undefined,
      paidAt: String(fields["Paid At"] ?? "") || undefined,
      paymentStatus: fields["Payment Status"] === "paid" ? "paid" : undefined,
      paidAmount: fields["Paid Amount"] ? Number(fields["Paid Amount"]) : undefined,
      stripeCustomerId: String(fields["Stripe Customer ID"] ?? "") || undefined,
      stripeCheckoutSessionId: String(fields["Stripe Checkout Session ID"] ?? "") || undefined,
    };
  }

  return {
    async createLead(lead) {
      const data = await call(endpoint, { method: "POST", body: JSON.stringify({ fields: buildAirtableFieldMap(lead) }) });
      return fromRecord(data);
    },
    async getLead(id) {
      const data = await call(`${endpoint}?filterByFormula=${formula(id)}&maxRecords=1`);
      return data.records[0] ? fromRecord(data.records[0]) : undefined;
    },
    async updateLead(id, updates) {
      const data = await call(`${endpoint}?filterByFormula=${formula(id)}&maxRecords=1`);
      if (!data.records[0]) return undefined;
      const current = fromRecord(data.records[0]);
      const next = { ...current, ...updates, updatedAt: new Date().toISOString() };
      await call(`${endpoint}/${data.records[0].id}`, { method: "PATCH", body: JSON.stringify({ fields: buildAirtableFieldMap(next) }) });
      return next;
    },
    async listLeads() {
      const data = await call(`${endpoint}?pageSize=100`);
      return data.records.map(fromRecord);
    },
  };
}

export const AIRTABLE_REQUIRED_FIELDS = [
  "Lead ID",
  "Audit ID",
  "First Name",
  "Last Name",
  "Business Name",
  "Website",
  "Industry",
  "City",
  "Email",
  "Phone",
  "Biggest Challenge",
  "Overall Score",
  "Audit Answers",
  "Audit Results",
  "Recommendations",
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
    "First Name": lead.firstName,
    "Last Name": lead.lastName,
    "Business Name": lead.businessName,
    Website: lead.website,
    Industry: lead.industry,
    City: lead.city,
    Email: lead.email,
    Phone: lead.phone,
    "Biggest Challenge": lead.biggestChallenge,
    "Overall Score": lead.overallScore,
    "Audit Answers": JSON.stringify(lead.auditAnswers),
    "Audit Results": JSON.stringify(lead.auditResults),
    Recommendations: JSON.stringify(lead.recommendations),
    "Top Opportunity": lead.topOpportunity,
    Status: lead.status as LeadStatus,
    Priority: lead.priority,
    Source: lead.source,
    "Created At": lead.createdAt,
    "Updated At": lead.updatedAt,
    "Last Contacted At": lead.lastContactedAt ?? "",
    "Next Follow-Up At": lead.nextFollowUpAt ?? "",
    "Contact Method": lead.contactMethod ?? "",
    Notes: lead.notes ?? "",
    Owner: lead.owner ?? "GrowthPilot",
    "Next Action": lead.nextAction ?? "",
    Activities: JSON.stringify(lead.activities ?? []),
    "AI Analysis": lead.aiAnalysis ? JSON.stringify(lead.aiAnalysis) : null,
    "Analysis Generated At": lead.analysisGeneratedAt ?? null,
    "Paid Offer": lead.paidOffer ?? null,
    "Paid At": lead.paidAt ?? null,
    "Payment Status": lead.paymentStatus ?? null,
    "Paid Amount": lead.paidAmount ?? null,
    "Stripe Customer ID": lead.stripeCustomerId ?? null,
    "Stripe Checkout Session ID": lead.stripeCheckoutSessionId ?? null,
  };
}
