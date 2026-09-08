import { NextResponse } from "next/server";
import { leadService } from "@/lib/crm/service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) return NextResponse.json({ success: false, error: "Note content is required." }, { status: 400 });

    const lead = await leadService.getLead(id);
    if (!lead) return NextResponse.json({ success: false, error: "Lead not found." }, { status: 404 });

    const activity = {
      id: crypto.randomUUID(),
      leadId: lead.id,
      type: (body.type === "note" ? "note" : "note") as "note",
      content,
      createdAt: new Date().toISOString(),
      createdBy: "Operator",
    };

    const nextNotes = [lead.notes, content].filter(Boolean).join("\n");
    const updated = await leadService.updateLead(id, {
      notes: nextNotes,
      activities: [...(lead.activities ?? []), activity],
    });

    return NextResponse.json({ success: true, lead: updated, activity });
  } catch (error) {
    console.error("Note creation failed", error);
    return NextResponse.json({ success: false, error: "Unable to save note." }, { status: 500 });
  }
}
