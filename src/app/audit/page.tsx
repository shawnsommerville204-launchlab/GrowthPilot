"use client";
import { useEffect, useState } from "react";
import AnalysisScreen from "@/components/AnalysisScreen";
import Report from "@/components/Report";
import AuditForm from "@/components/AuditForm";
import LeadCapture from "@/components/LeadCapture";
import { AuditResult } from "@/lib/analyzer";
import { readStoredAudit, writeStoredAudit } from "@/lib/audit/storage";

type StoredAudit = {
  result: AuditResult;
  input: { businessName: string; website?: string; industry?: string; city?: string; email?: string };
  audit?: { id?: string; createdAt?: string };
  id?: string;
};

export default function AuditPage() {
  const [audit] = useState<StoredAudit | null>(() => readStoredAudit());
  const [showReport, setShowReport] = useState(() => Boolean(audit?.id));
  const [showCapture, setShowCapture] = useState(() => Boolean(audit?.id));

  useEffect(() => {
    if (showReport) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showReport]);

  if (!audit) {
    return (
      <main className="audit-section audit-page-form">
        <div className="audit-intro">
          <span className="eyebrow">01 / START HERE</span>
          <h1>
            Run your<br />
            <em>growth audit.</em>
          </h1>
          <p>Enter your business details and we&apos;ll inspect the public signals that shape your next local lead.</p>
        </div>
        <AuditForm />
      </main>
    );
  }

  if (showReport) {
    return <Report result={audit.result} input={audit.input} auditId={audit.audit?.id ?? audit.id} leadId={audit.id} createdAt={audit.audit?.createdAt} />;
  }

  if (showCapture) return <LeadCapture audit={{ input: audit.input, result: audit.result }} onComplete={(data) => { writeStoredAudit({ ...audit, audit: { id: data.auditId, createdAt: new Date().toISOString() }, id: data.leadId }); setShowReport(true); }} />;

  return <AnalysisScreen onComplete={() => setShowCapture(true)} />;
}
