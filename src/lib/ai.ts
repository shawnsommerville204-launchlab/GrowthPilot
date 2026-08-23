import { analyzeBusiness } from "./analyzer.ts";
import type { AuditInput, AuditResult } from "./audit/types.ts";
import type { Priority } from "./audit/types.ts";

export const RECOMMENDATION_CATEGORIES = ["MARKETING", "SALES", "CUSTOMER EXPERIENCE", "OPERATIONS", "AUTOMATION", "TECHNOLOGY", "DATA", "PROCESS", "BRANDING", "OTHER"] as const;
export type RecommendationCategory = (typeof RECOMMENDATION_CATEGORIES)[number];
export type RecommendationPriority = "HIGH" | "MEDIUM" | "LOW";
export type RecommendationEffort = "LOW" | "MEDIUM" | "HIGH";

export type GrowthPilotOpportunity = {
  title: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  problem: string;
  evidence: string;
  recommendation: string;
  expectedOutcome: string;
  effort: RecommendationEffort;
};

export type GrowthPilotActionPhase = {
  phase: "IMMEDIATE" | "SHORT TERM" | "GROWTH";
  timeframe: "0-7 DAYS" | "1-4 WEEKS" | "30-90 DAYS";
  description: string;
  steps: string[];
};

export type RecommendedService = {
  service: string;
  reason: string;
  priority: RecommendationPriority;
};

function normalizePriority(value: string): Priority {
  switch (value) {
    case "CRITICAL":
      return "CRITICAL";
    case "HIGH":
      return "HIGH";
    case "MEDIUM":
      return "MEDIUM";
    case "GOOD":
      return "GOOD";
    default:
      return "EXCELLENT";
  }
}

export type AIRecommendationPlan = {
  executiveSummary: string;
  overallAssessment: string;
  opportunities: GrowthPilotOpportunity[];
  recommendedServices: RecommendedService[];
  actionPlan: GrowthPilotActionPhase[];
  salesReadiness: "HIGH" | "MEDIUM" | "LOW";
  problems: { title: string; description: string; priority: Priority; category: string }[];
  serviceRecommendations: { service: string; problem: string; recommendation: string; expectedOutcome?: string }[];
};

type Interpretation = Pick<AuditResult, "summary" | "insights" | "actionPlan">;

export function buildAIRecommendationPlan(input: AuditInput, audit: AuditResult): AIRecommendationPlan {
  const ranked = [...audit.topOpportunities].sort((left, right) => left.score - right.score);

  const categoryMap: Record<string, RecommendationCategory> = {
    website: "TECHNOLOGY",
    localseo: "MARKETING",
    reputation: "CUSTOMER EXPERIENCE",
    leadgeneration: "SALES",
    offer: "BRANDING",
    content: "MARKETING",
  };
  const serviceMap: Record<string, string> = {
    website: "Website / Conversion Optimization",
    localseo: "Marketing Automation",
    reputation: "Customer Experience Optimization",
    leadgeneration: "CRM Setup",
    offer: "Sales Process Optimization",
    content: "Business Growth Audit",
  };
  const priorityMap: Record<Priority, RecommendationPriority> = {
    CRITICAL: "HIGH",
    HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    GOOD: "LOW",
    EXCELLENT: "LOW",
  };

  const problems = ranked.slice(0, 3).map((item) => ({
    title: item.title,
    description: item.explanation,
    priority: normalizePriority(item.priority),
    category: item.category,
  }));

  const opportunities = ranked.slice(0, 5).map((item) => ({
    title: item.title,
    category: categoryMap[normalizeCategory(item.category)] ?? "OTHER",
    priority: priorityMap[item.priority],
    problem: item.explanation,
    evidence: `${item.category} audit score: ${item.score}/100. ${item.explanation}`,
    recommendation: item.recommendations[0] ?? "Define and document the next measurable improvement with the business owner.",
    expectedOutcome: "A clearer, more consistent path from business interest to the next customer conversation.",
    effort: (item.priority === "CRITICAL" || item.priority === "HIGH" ? "MEDIUM" : "LOW") as RecommendationEffort,
  }));

  const serviceRecommendations = ranked.slice(0, 3).map((item, index) => {
    const recommendation = item.recommendations[0] ?? "Define a concrete next step with the business owner.";
    return {
      service: serviceMap[normalizeCategory(item.category)] ?? "Custom AI Solution",
      problem: item.title,
      recommendation,
      expectedOutcome: index === 0 ? "A clearer path from visitor to lead and conversation." : undefined,
    };
  });

  const actions = ranked.flatMap((item) => item.recommendations.slice(0, 2));
  const actionPlan: GrowthPilotActionPhase[] = [
    { phase: "IMMEDIATE", timeframe: "0-7 DAYS", description: "Address the highest-severity audit signal first.", steps: actions.slice(0, 3) },
    { phase: "SHORT TERM", timeframe: "1-4 WEEKS", description: "Put a repeatable process behind the next opportunity.", steps: actions.slice(3, 6) },
    { phase: "GROWTH", timeframe: "30-90 DAYS", description: "Measure the changes and improve the strongest growth lever.", steps: actions.slice(6, 9) },
  ].map((phase) => ({ ...phase, steps: phase.steps.length ? phase.steps : ["Review the next audit signal with the business owner."] })) as GrowthPilotActionPhase[];

  const executiveSummary = `${input.businessName} has a GrowthPilot score of ${audit.overallScore}/100. The audit identified ${opportunities.length || 1} priority area${opportunities.length === 1 ? "" : "s"}; the most immediate focus is ${opportunities[0]?.title ?? "reviewing the available growth signals"}.`;
  const overallAssessment = audit.summary;
  const recommendedServices = serviceRecommendations.map((item, index) => ({ service: item.service, reason: item.recommendation, priority: index === 0 ? "HIGH" as const : "MEDIUM" as const }));
  const salesReadiness = input.email && (input.website || input.city) ? "HIGH" : input.email ? "MEDIUM" : "LOW";

  return {
    executiveSummary,
    overallAssessment,
    problems,
    opportunities,
    recommendedServices,
    salesReadiness,
    serviceRecommendations,
    actionPlan,
  };
}

function normalizeCategory(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

export function isAIRecommendationPlan(value: unknown): value is AIRecommendationPlan {
  if (!value || typeof value !== "object") return false;
  const plan = value as Partial<AIRecommendationPlan>;
  return typeof plan.executiveSummary === "string" && typeof plan.overallAssessment === "string" && Array.isArray(plan.opportunities) && plan.opportunities.length >= 1 && plan.opportunities.length <= 5 && plan.opportunities.every((item) => item && typeof item.title === "string" && RECOMMENDATION_CATEGORIES.includes(item.category) && ["HIGH", "MEDIUM", "LOW"].includes(item.priority) && typeof item.problem === "string" && typeof item.evidence === "string" && typeof item.recommendation === "string" && typeof item.expectedOutcome === "string" && ["LOW", "MEDIUM", "HIGH"].includes(item.effort)) && Array.isArray(plan.actionPlan) && plan.actionPlan.length === 3 && plan.actionPlan.every((phase) => phase && ["IMMEDIATE", "SHORT TERM", "GROWTH"].includes(phase.phase) && ["0-7 DAYS", "1-4 WEEKS", "30-90 DAYS"].includes(phase.timeframe) && typeof phase.description === "string" && Array.isArray(phase.steps) && phase.steps.every((step) => typeof step === "string")) && Array.isArray(plan.recommendedServices) && plan.recommendedServices.every((service) => service && typeof service.service === "string" && typeof service.reason === "string" && ["HIGH", "MEDIUM", "LOW"].includes(service.priority)) && ["HIGH", "MEDIUM", "LOW"].includes(plan.salesReadiness ?? "");
}

export async function generateRecommendationPlan(input: AuditInput, audit: AuditResult): Promise<AIRecommendationPlan> {
  const fallback = buildAIRecommendationPlan(input, audit);
  if (!process.env.OPENAI_API_KEY) return fallback;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: RECOMMENDATION_SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify({ input, audit: { overallScore: audit.overallScore, categories: audit.categories, findings: audit.findings, topOpportunities: audit.topOpportunities } }) },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return fallback;
    const payload = await response.json() as { choices?: { message?: { content?: string } }[] };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return fallback;
    const parsed: unknown = JSON.parse(content);
    const candidate = { ...fallback, ...(parsed && typeof parsed === "object" ? parsed : {}) };
    return isAIRecommendationPlan(candidate) ? candidate : fallback;
  } catch {
    return fallback;
  }
}

const RECOMMENDATION_SYSTEM_PROMPT = `Create a personalized GrowthPilot business improvement plan from the supplied scored audit. Never invent facts, revenue, employees, customers, or guaranteed results. Every opportunity must cite supplied evidence. Return JSON with executiveSummary, overallAssessment, opportunities (3 to 5 objects with title, category, priority, problem, evidence, recommendation, expectedOutcome, effort), actionPlan (exactly three phases with phase, timeframe, description, steps), recommendedServices (only services supported by the audit, with service, reason, priority), and salesReadiness. Use only categories MARKETING, SALES, CUSTOMER EXPERIENCE, OPERATIONS, AUTOMATION, TECHNOLOGY, DATA, PROCESS, BRANDING, OTHER; priorities HIGH, MEDIUM, LOW; effort LOW, MEDIUM, HIGH; phases IMMEDIATE, SHORT TERM, GROWTH; timeframes 0-7 DAYS, 1-4 WEEKS, 30-90 DAYS.`;

export async function analyzeWithAI(input: AuditInput): Promise<AuditResult> {
  const deterministic = await analyzeBusiness(input);
  if (!process.env.OPENAI_API_KEY) return deterministic;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify({ input, audit: { overallScore: deterministic.overallScore, categories: deterministic.categories, findings: deterministic.findings, topOpportunities: deterministic.topOpportunities } }) },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return deterministic;
    const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return deterministic;
    const parsed: unknown = JSON.parse(content);
    return isInterpretation(parsed) ? { ...deterministic, ...parsed } : deterministic;
  } catch {
    return deterministic;
  }
}

const SYSTEM_PROMPT = `You interpret an already-scored local business audit. Never change, recalculate, or invent scores or findings. Return JSON with exactly summary (string), insights (array of concise strings), and actionPlan (array of 3 to 5 objects with title, description, and priority using only CRITICAL, HIGH, MEDIUM, GOOD, or EXCELLENT). Base every statement on supplied audit data and use practical business-friendly language.`;

function isInterpretation(value: unknown): value is Interpretation {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<Interpretation>;
  return typeof result.summary === "string" && Array.isArray(result.insights) && result.insights.every((item) => typeof item === "string") && Array.isArray(result.actionPlan) && result.actionPlan.length > 0 && result.actionPlan.every((action) => typeof action.title === "string" && typeof action.description === "string" && typeof action.priority === "string");
}
