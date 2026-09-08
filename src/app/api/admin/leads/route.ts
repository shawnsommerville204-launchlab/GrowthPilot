import { NextResponse } from "next/server";
import { leadService } from "@/lib/crm/service";

export async function GET() {
  try {
    const leads = await leadService.listLeads();
    return NextResponse.json({ success: true, leads });
  } catch (error) {
    console.error("Failed to load leads", error);
    return NextResponse.json({ success: false, error: "Unable to load lead list." }, { status: 500 });
  }
}
