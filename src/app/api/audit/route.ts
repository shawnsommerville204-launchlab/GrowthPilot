import { NextResponse } from "next/server";
import { analyzeWithAI } from "@/lib/ai";
import { saveLead } from "@/lib/leads";
import { AuditInput } from "@/lib/analyzer";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<AuditInput>;
    const businessName = body.businessName?.trim() ?? "";
    const website = body.website?.trim() ?? "";
    if (!website || !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(website)) return NextResponse.json({ error: "Enter a valid website URL, including https://" }, { status: 400 });
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return NextResponse.json({ error: "Enter a valid email address or leave it blank." }, { status: 400 });
    const input: AuditInput = { businessName, website, industry: body.industry?.trim(), city: body.city?.trim(), email: body.email?.trim() };
    const result = await analyzeWithAI(input);
    const id = saveLead(input, result);
    return NextResponse.json({ id, input, result });
  } catch { return NextResponse.json({ error: "We could not complete that audit. Please try again." }, { status: 500 }); }
}
