"use client";

import Link from "next/link";
import { useState } from "react";
import Report from "@/components/Report";
import { AuditResult } from "@/lib/analyzer";
import { readStoredAuditById } from "@/lib/audit/storage";

type StoredAudit = {
  result: AuditResult;
  input: { businessName: string; website?: string; industry?: string; city?: string; email?: string };
  audit?: { id?: string; createdAt?: string };
  id?: string;
};

export default function AuditResultsPage({ params }: { params: { auditId: string } }) {
  const [audit] = useState<StoredAudit | null>(() => readStoredAuditById(params.auditId));

  if (!audit) {
    return (
      <main className="report-page" style={{ padding: "60px 20px" }}>
        <div
          className="report-wrap"
          style={{
            maxWidth: 760,
            margin: "0 auto",
            background: "#f5f7f4",
            border: "1px solid rgba(17,20,20,0.12)",
            padding: "40px 32px",
          }}
        >
          <span className="eyebrow">AUDIT LINK</span>
          <h1 style={{ fontSize: "clamp(32px,6vw,52px)", letterSpacing: "-0.06em", margin: "16px 0 12px" }}>This audit is not available yet.</h1>
          <p style={{ color: "#495a54", lineHeight: 1.7 }}>
            The report URL is set up for the next database step, but this browser session does not currently include that audit record.
          </p>
          <Link className="button button-primary" href="/" style={{ marginTop: 24 }}>
            START A NEW AUDIT <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </main>
    );
  }

  return <Report result={audit.result} input={audit.input} auditId={audit.audit?.id ?? audit.id} leadId={audit.id} createdAt={audit.audit?.createdAt} />;
}
