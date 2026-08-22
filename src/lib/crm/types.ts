import type { Priority } from "@/lib/audit/types";

export type LeadStatus = "New" | "Contacted" | "Qualified" | "Won" | "Lost";

export type LeadOpportunity = {
  category: string;
  title: string;
  score: number;
  priority: Priority;
  explanation: string;
  recommendations: string[];
};

export type Lead = {
  id: string;
  auditId: string;
  businessName: string;
  website: string;
  industry: string;
  city: string;
  email: string;
  overallScore: number;
  topOpportunity: string;
  status: LeadStatus;
  source: "GrowthPilot Audit";
  createdAt: string;
  updatedAt: string;
  primaryOpportunity?: string;
  recommendedService?: string;
  nextAction?: string;
  categoryScores?: Record<string, number>;
  topOpportunities?: LeadOpportunity[];
  auditHistory?: string[];
};
