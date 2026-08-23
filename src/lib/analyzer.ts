import { analyzeWebsite } from "./audit/analyzer.ts";
import { buildLegacyFields, buildRecommendations } from "./audit/recommendations.ts";
import { scoreAudit } from "./audit/scorer.ts";
import type { AuditInput, AuditResult } from "./audit/types.ts";

export type { AuditInput, AuditResult, CategoryKey, Priority } from "./audit/types.ts";
export { analyzeWebsite } from "./audit/analyzer.ts";

export async function analyzeBusiness(input: AuditInput): Promise<AuditResult> {
  const findings = await analyzeWebsite(input);
  const { overallScore, categories } = scoreAudit(input, findings);
  const topOpportunities = buildRecommendations(input, findings, categories);
  const legacy = buildLegacyFields(topOpportunities, categories, findings, input);
  return {
    overallScore,
    categories,
    findings,
    topOpportunities,
    summary: findings.error ? "We could not fully analyze this website, but the available business details still produced a useful partial audit." : "Your audit is based on publicly visible website signals and highlights the clearest ways to turn more local searches into conversations.",
    insights: topOpportunities.map((item) => `${item.category}: ${item.explanation}`),
    actionPlan: legacy.actions.map((action) => ({ ...action, priority: action.priority === "High" ? "HIGH" as const : "MEDIUM" as const })),
    score: overallScore,
    ...legacy,
  };
}
