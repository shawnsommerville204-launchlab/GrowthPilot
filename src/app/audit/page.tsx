"use client";
import { useEffect, useState } from "react";
import AnalysisScreen from "@/components/AnalysisScreen";
import Report from "@/components/Report";
import AuditForm from "@/components/AuditForm";
import { AuditResult } from "@/lib/analyzer";
import { readStoredAudit } from "@/lib/audit/storage";

type StoredAudit = {
  result: AuditResult;
  input: { businessName: string; website?: string; industry?: string; city?: string; email?: string };
  audit?: { id?: string; createdAt?: string };
  id?: string;
};

export default function AuditPage() {
  const [audit] = useState<StoredAudit | null>(() => readStoredAudit());
  const [showReport, setShowReport] = useState(false);

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
    return <Report result={audit.result} input={audit.input} auditId={audit.audit?.id ?? audit.id} createdAt={audit.audit?.createdAt} />;
  }

  return <AnalysisScreen onComplete={() => setShowReport(true)} />;
}
