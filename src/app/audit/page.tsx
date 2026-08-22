"use client";
import { useEffect, useState } from "react";
import AnalysisScreen from "@/components/AnalysisScreen";
import Report from "@/components/Report";
import { AuditResult } from "@/lib/analyzer";
export default function AuditPage() { const [audit, setAudit] = useState<{ result: AuditResult; input: { businessName: string } } | null>(null); const [showReport, setShowReport] = useState(false); useEffect(() => { const stored = sessionStorage.getItem("growthpilot-audit"); if (stored) window.setTimeout(() => setAudit(JSON.parse(stored)), 0); }, []); if (audit && showReport) return <Report result={audit.result} businessName={audit.input.businessName} />; return <AnalysisScreen onComplete={() => { if (audit) setShowReport(true); }} />; }
