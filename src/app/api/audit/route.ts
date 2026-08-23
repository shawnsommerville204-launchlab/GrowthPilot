import { NextResponse } from "next/server";
import { analyzeWithAI, generateRecommendationPlan } from "@/lib/ai";
import { validateAuditInput } from "@/lib/audit/validators";

export const maxDuration = 20;
const requestLog = new Map<string, number[]>();

export async function POST(request: Request) {
  try {
    const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const now = Date.now();
    const recent = (requestLog.get(client) ?? []).filter((timestamp) => now - timestamp < 60_000);
    if (recent.length >= 5) return NextResponse.json({ error: "Too many audits were requested. Please try again in a minute." }, { status: 429 });
    requestLog.set(client, [...recent, now]);
    const validation = validateAuditInput(await request.json());
    if (!validation.input) return NextResponse.json({ error: validation.error }, { status: 400 });
    const input = validation.input;
    const result = await analyzeWithAI(input);
const aiAnalysis = await generateRecommendationPlan(input, result);
const completeResult = {
  ...result,
  aiAnalysis,
};
    const auditId = crypto.randomUUID();
    const audit = {
  id: auditId,
  auditId,
  ...input,
  ...completeResult,
  createdAt: new Date().toISOString(),
};
   return NextResponse.json({
  success: true,
  auditId,
  audit,
  input,
  result: completeResult,
});
  } catch {
    return NextResponse.json({ error: "We could not complete that audit. Please try again." }, { status: 500 });
  }
}
