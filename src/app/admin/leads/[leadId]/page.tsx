"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Lead, LeadStatus } from "@/lib/crm/types";

const STATUSES: LeadStatus[] = ["NEW LEAD", "REVIEWED", "CONTACTED", "DISCOVERY", "PROPOSAL", "WON", "LOST"];

export default function LeadDetailPage({ params }: { params: { leadId: string } }) {
  const [lead, setLead] = useState<Lead | null>(null);

  useEffect(() => {
    async function loadLead() {
      const response = await fetch(`/api/admin/leads/${params.leadId}`);
      if (!response.ok) return;
      const data = await response.json();
      setLead(data.lead ?? null);
    }

    loadLead();
  }, [params.leadId]);

  async function updateStatus(value: LeadStatus) {
    if (!lead) return;
    const response = await fetch(`/api/admin/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
    if (!response.ok) return;
    const data = await response.json();
    setLead(data.lead ?? lead);
  }

  if (!lead) {
    return <main className="admin-page"><div className="admin-shell"><p>Loading lead…</p></div></main>;
  }

  return (
    <main className="admin-page">
      <div className="admin-shell">
        <header className="admin-header">
          <div>
            <span className="eyebrow">LEAD DETAIL</span>
            <h1>{lead.businessName}</h1>
          </div>
          <Link href="/admin/leads" className="button button-primary">Back to leads</Link>
        </header>

        <div className="lead-detail-grid">
          <section className="lead-card">
            <h2>Business</h2>
            <dl>
              <div><dt>Business Name</dt><dd>{lead.businessName}</dd></div>
              <div><dt>Website</dt><dd>{lead.website}</dd></div>
              <div><dt>Industry</dt><dd>{lead.industry}</dd></div>
              <div><dt>City</dt><dd>{lead.city}</dd></div>
            </dl>
          </section>

          <section className="lead-card">
            <h2>Contact</h2>
            <dl>
              <div><dt>Name</dt><dd>{lead.firstName} {lead.lastName}</dd></div>
              <div><dt>Email</dt><dd>{lead.email}</dd></div>
              <div><dt>Phone</dt><dd>{lead.phone || "Not provided"}</dd></div>
              <div><dt>Challenge</dt><dd>{lead.biggestChallenge || "Not provided"}</dd></div>
            </dl>
          </section>

          <section className="lead-card">
            <h2>Audit</h2>
            <dl>
              <div><dt>Growth Score</dt><dd>{lead.overallScore}</dd></div>
              <div><dt>Top Opportunity</dt><dd>{lead.topOpportunity}</dd></div>
              <div><dt>Primary Opportunity</dt><dd>{lead.primaryOpportunity ?? lead.topOpportunity}</dd></div>
              <div><dt>Recommended Service</dt><dd>{lead.recommendedService ?? "GrowthPilot Audit Follow-Up"}</dd></div>
              <div><dt>Category Scores</dt><dd><pre>{JSON.stringify(lead.auditResults?.categories ?? lead.categoryScores, null, 2)}</pre></dd></div>
              <div><dt>Answers</dt><dd><pre>{JSON.stringify(lead.auditAnswers, null, 2)}</pre></dd></div>
            </dl>
          </section>

          <section className="lead-card">
            <h2>Sales</h2>
            <dl>
              <div><dt>Status</dt><dd>
                <select value={lead.status} onChange={(event) => updateStatus(event.target.value as LeadStatus)}>
                  {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </dd></div>
              <div><dt>Next Action</dt><dd>{lead.nextAction ?? "Send audit follow-up"}</dd></div>
              <div><dt>Created</dt><dd>{new Date(lead.createdAt).toLocaleString()}</dd></div>
              <div><dt>Last Updated</dt><dd>{new Date(lead.updatedAt).toLocaleString()}</dd></div>
            </dl>
          </section>
          <section className="lead-card lead-card-wide">
            <h2>Recommendations</h2>
            {(lead.recommendations ?? lead.topOpportunities ?? []).map((recommendation) => <article key={recommendation.title}><strong>{recommendation.title}</strong><p>{recommendation.explanation}</p><ul>{recommendation.recommendations.map((item) => <li key={item}>{item}</li>)}</ul></article>)}
          </section>
        </div>
      </div>
    </main>
  );
}
