import { analyzeBusiness, AuditInput, AuditResult } from "./analyzer";

export async function analyzeWithAI(input: AuditInput): Promise<AuditResult> {
  if (!process.env.OPENAI_API_KEY) return analyzeBusiness(input);

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
          { role: "user", content: JSON.stringify(input) },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return analyzeBusiness(input);
    const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return analyzeBusiness(input);
    const parsed: unknown = JSON.parse(content);
    return isAuditResult(parsed) ? parsed : analyzeBusiness(input);
  } catch {
    return analyzeBusiness(input);
  }
}

const SYSTEM_PROMPT = `You produce a practical local-business growth audit in JSON. Use only the business fields supplied by the user. This is not a website crawl: never claim to have verified traffic, reviews, rankings, conversions, or website content. Return exactly these keys: score (integer 0-100), categories (website, localSeo, reviews, leadGeneration, content, offer as integers 0-100), strengths (3 strings), opportunities (4 strings formatted as Title|Description), priority (category, title, description, impact where impact is High, Medium, or Low), and actions (5 objects with title, description, priority). Keep recommendations specific to the supplied industry and city when present. Return JSON only.`;

function isAuditResult(value: unknown): value is AuditResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<AuditResult>;
  const categories = result.categories;
  if (!categories) return false;
  return Number.isInteger(result.score) && Array.isArray(result.strengths) && result.strengths.length >= 3 && Array.isArray(result.opportunities) && result.opportunities.length >= 3 && Boolean(result.priority?.category) && Boolean(result.priority?.title) && Array.isArray(result.actions) && result.actions.length >= 3 && Object.values(categories).every((score) => typeof score === "number" && score >= 0 && score <= 100);
}
