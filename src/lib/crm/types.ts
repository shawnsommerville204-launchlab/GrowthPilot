import type { Priority } from "@/lib/audit/types";
import type { AIRecommendationPlan } from "@/lib/ai";

export const LEAD_STATUSES = ["NEW LEAD", "REVIEWED", "CONTACTED", "DISCOVERY", "PROPOSAL", "WON", "LOST"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_PRIORITIES = ["HOT", "WARM", "COLD"] as const;
export type LeadPriority = (typeof LEAD_PRIORITIES)[number];

export const LEAD_CONTACT_METHODS = ["Email", "Phone", "SMS", "Meeting", "Other"] as const;
export type LeadContactMethod = (typeof LEAD_CONTACT_METHODS)[number];

export type LeadOpportunity = {
  category: string;
  title: string;
  score: number;
  priority: Priority;
  explanation: string;
  recommendations: string[];
};

export type LeadActivity = {
  id: string;
  leadId: string;
  type: "note" | "status" | "follow-up" | "contact";
  content: string;
  createdAt: string;
  createdBy?: string;
};

export type Lead = {
  id: string;
  auditId: string;
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
  auditResults: AuditResultSnapshot;
  recommendations: LeadOpportunity[];
  topOpportunity: string;
  status: LeadStatus;
  priority: LeadPriority;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  contactMethod?: LeadContactMethod | "";
  notes?: string;
  owner?: string;
  source: "GrowthPilot Audit";
  createdAt: string;
  updatedAt: string;
  primaryOpportunity?: string;
  recommendedService?: string;
  nextAction?: string;
  categoryScores?: Record<string, number>;
  topOpportunities?: LeadOpportunity[];
  auditHistory?: string[];
  activities?: LeadActivity[];
  aiAnalysis?: AIRecommendationPlan;
  analysisGeneratedAt?: string;
  paidOffer?: string;
  paidAt?: string;
  paymentStatus?: "paid";
  paidAmount?: number;
  stripeCustomerId?: string;
  stripeCheckoutSessionId?: string;
};

export type AuditResultSnapshot = {
  overallScore: number;
  categories: Record<string, number>;
  findings: Record<string, unknown>;
  summary: string;
};
