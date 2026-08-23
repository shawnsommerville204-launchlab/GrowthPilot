import type { Lead, LeadPriority, LeadStatus } from "./types.ts";

export const LEAD_STATUSES = ["NEW LEAD", "REVIEWED", "CONTACTED", "DISCOVERY", "PROPOSAL", "WON", "LOST"] as const;
export const LEAD_PRIORITIES = ["HOT", "WARM", "COLD"] as const;
export const LEAD_CONTACT_METHODS = ["Email", "Phone", "SMS", "Meeting", "Other"] as const;

export function normalizeLeadStatus(status?: string): LeadStatus {
  const normalized = String(status ?? "NEW LEAD").trim();
  if (normalized === "AUDIT COMPLETED") return "REVIEWED";
  if (normalized === "NEW LEAD" || normalized === "REVIEWED" || normalized === "CONTACTED" || normalized === "DISCOVERY" || normalized === "PROPOSAL" || normalized === "WON" || normalized === "LOST") {
    return normalized as LeadStatus;
  }
  return "NEW LEAD";
}

export function deriveLeadPriority({ overallScore = 0, businessName = "", website = "", email = "", phone = "", recommendations = [], status = "NEW LEAD", nextFollowUpAt = "" }: Partial<Lead>): LeadPriority {
  let score = 0;

  if (overallScore >= 80) score += 40;
  else if (overallScore >= 60) score += 25;
  else if (overallScore >= 40) score += 10;

  if (businessName.trim().length > 2) score += 10;
  if (website.trim()) score += 12;
  if (email.trim()) score += 12;
  if (phone.trim()) score += 10;

  if (recommendations.length > 0) score += Math.min(18, recommendations.length * 6);

  if (["CONTACTED", "DISCOVERY", "PROPOSAL", "WON"].includes(status)) score += 10;
  if (nextFollowUpAt) score += 8;

  if (score >= 70) return "HOT";
  if (score >= 40) return "WARM";
  return "COLD";
}

export function getFollowUpState(lead: Partial<Lead>): "Overdue" | "Due Today" | "Upcoming" | "No Follow-Up" {
  const date = lead.nextFollowUpAt;
  if (!date) return "No Follow-Up";

  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return "No Follow-Up";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const followUpDay = new Date(target);
  followUpDay.setHours(0, 0, 0, 0);

  if (followUpDay.getTime() < today.getTime()) return "Overdue";
  if (followUpDay.getTime() === today.getTime()) return "Due Today";
  return "Upcoming";
}

export function leadPriorityRank(priority: LeadPriority): number {
  return { HOT: 3, WARM: 2, COLD: 1 }[priority] ?? 1;
}

export function scoreRangeLabel(score: number): string {
  if (score >= 80) return "80+";
  if (score >= 60) return "60–79";
  if (score >= 40) return "40–59";
  return "Below 40";
}
