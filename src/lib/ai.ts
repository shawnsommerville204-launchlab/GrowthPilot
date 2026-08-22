import { analyzeBusiness, AuditInput, AuditResult } from "./analyzer";

type Interpretation = Pick<AuditResult, "summary" | "insights" | "actionPlan">;

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
