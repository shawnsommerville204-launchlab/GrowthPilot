import { NextResponse } from "next/server";
import { leadService } from "@/lib/crm/service";
import { LEAD_CONTACT_METHODS, LEAD_PRIORITIES, LEAD_STATUSES } from "@/lib/crm/lead-utils";

function validateLeadPatch(body: Record<string, unknown>) {
  if (body.status && !LEAD_STATUSES.includes(body.status as never)) return "Invalid status.";
  if (body.priority && !LEAD_PRIORITIES.includes(body.priority as never)) return "Invalid priority.";
  if (body.contactMethod && !LEAD_CONTACT_METHODS.includes(body.contactMethod as never)) return "Invalid contact method.";
  return null;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const lead = await leadService.getLead(id);
    if (!lead) return NextResponse.json({ success: false, error: "Lead not found." }, { status: 404 });
    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("Lead fetch failed", error);
    return NextResponse.json({ success: false, error: "Unable to load lead." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const validationError = validateLeadPatch(body);
    if (validationError) return NextResponse.json({ success: false, error: validationError }, { status: 400 });

    const lead = await leadService.updateLead(id, {
      status: typeof body.status === "string" ? (body.status as never) : undefined,
      priority: typeof body.priority === "string" ? (body.priority as never) : undefined,
      lastContactedAt: typeof body.lastContactedAt === "string" ? body.lastContactedAt : undefined,
      nextFollowUpAt: typeof body.nextFollowUpAt === "string" ? body.nextFollowUpAt : undefined,
      contactMethod: typeof body.contactMethod === "string" ? (body.contactMethod as never) : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      owner: typeof body.owner === "string" ? body.owner : undefined,
    });

    if (!lead) return NextResponse.json({ success: false, error: "Lead not found." }, { status: 404 });
    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("Lead update failed", error);
    return NextResponse.json({ success: false, error: "Unable to update lead." }, { status: 500 });
  }
}
