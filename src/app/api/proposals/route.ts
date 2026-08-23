import { NextResponse } from "next/server";
import { createProposalToken } from "@/lib/proposal-tokens";
import { leadService } from "@/lib/crm/service";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { leadId?: unknown };
    if (typeof body.leadId !== "string" || !body.leadId.trim()) return NextResponse.json({ success: false, error: "A lead ID is required." }, { status: 400 });
    const lead = await leadService.getLead(body.leadId);
    if (!lead) return NextResponse.json({ success: false, error: "Lead not found." }, { status: 404 });
    const token = createProposalToken(lead.id);
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    return NextResponse.json({ success: true, url: `${origin}/proposals/${token}`, expiresInDays: 30 });
  } catch (error) { console.error("Proposal token creation failed", error instanceof Error ? error.message : "unknown error"); return NextResponse.json({ success: false, error: "Unable to create proposal link." }, { status: 503 }); }
}