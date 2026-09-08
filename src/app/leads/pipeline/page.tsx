"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Lead, LeadStatus } from "@/lib/crm/types";
import { LEAD_STATUSES } from "@/lib/crm/lead-utils";

const PIPELINE_STATUSES: LeadStatus[] = [...LEAD_STATUSES];

export default function LeadPipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeads() {
      const response = await fetch("/api/leads");
      const data = await response.json();
      setLeads(data.leads ?? []);
      setLoading(false);
    }
    loadLeads();
  }, []);

  const byStatus = useMemo(() => PIPELINE_STATUSES.reduce((acc, status) => ({ ...acc, [status]: leads.filter((lead) => lead.status === status) }), {} as Record<LeadStatus, Lead[]>), [leads]);

  async function moveLead(leadId: string, nextStatus: LeadStatus) {
    const response = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!response.ok) return;
    const data = await response.json();
    setLeads((current) => current.map((lead) => (lead.id === leadId ? data.lead : lead)));
  }

  if (loading) {
    return <main className="crm-page"><div className="crm-shell"><p className="empty-state">Loading pipeline…</p></div></main>;
  }

  return (
    <main className="crm-page">
      <div className="crm-shell">
        <header className="crm-header">
          <div>
            <span className="eyebrow">PIPELINE</span>
            <h1>Sales stages</h1>
          </div>
          <Link href="/leads" className="button button-primary">Lead list</Link>
        </header>
        <div className="pipeline-grid">
          {PIPELINE_STATUSES.map((status) => (
            <section key={status} className="pipeline-column">
              <header className="pipeline-head">
                <h2>{status}</h2>
                <span>{byStatus[status]?.length ?? 0}</span>
              </header>
              <div className="pipeline-cards">
                {(byStatus[status] ?? []).length === 0 ? (
                  <div className="pipeline-empty">No leads</div>
                ) : (
                  (byStatus[status] ?? []).map((lead) => (
                    <article key={lead.id} className="pipeline-card">
                      <Link href={`/leads/${lead.id}`}><strong>{lead.businessName}</strong></Link>
                      <p>{[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Unassigned contact"}</p>
                      <div className="pipeline-meta">
                        <span>{lead.overallScore}</span>
                        <span className={`priority-badge ${lead.priority.toLowerCase()}`}>{lead.priority}</span>
                      </div>
                      <small>{lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleDateString() : "No follow-up"}</small>
                      <select value={lead.status} onChange={(event) => moveLead(lead.id, event.target.value as LeadStatus)}>
                        {PIPELINE_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
                      </select>
                    </article>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
