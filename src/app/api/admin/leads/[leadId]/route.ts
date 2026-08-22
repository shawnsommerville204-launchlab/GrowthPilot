import { NextResponse } from "next/server";
import { leadService } from "@/lib/crm/service";

export async function GET(_: Request, { params }: { params: Promise<{ leadId: string }> }) {
  try {
    const { leadId } = await params;
    const lead = await leadService.getLead(leadId);
    if (!lead) return NextResponse.json({ success: false, error: "Lead not found." }, { status: 404 });
    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("Failed to load lead", error);
    return NextResponse.json({ success: false, error: "Unable to load lead." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  try {
    const { leadId } = await params;
    const body = await request.json();
    const lead = await leadService.updateLead(leadId, body);
    if (!lead) return NextResponse.json({ success: false, error: "Lead not found." }, { status: 404 });
    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("Failed to update lead", error);
    return NextResponse.json({ success: false, error: "Unable to update lead." }, { status: 500 });
  }
}
