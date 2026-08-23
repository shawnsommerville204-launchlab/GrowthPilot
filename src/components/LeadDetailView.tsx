"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Lead, LeadContactMethod, LeadPriority, LeadStatus } from "@/lib/crm/types";
import { LEAD_CONTACT_METHODS, LEAD_PRIORITIES, LEAD_STATUSES, getFollowUpState } from "@/lib/crm/lead-utils";
import type { AIRecommendationPlan } from "@/lib/ai";

const EMPTY_NOTE = "";

export default function LeadDetailView({ leadId }: { leadId: string }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState(EMPTY_NOTE);
  const [proposalLink, setProposalLink] = useState<string | null>(null);

  useEffect(() => {
    async function loadLead() {
      try {
        const response = await fetch(`/api/leads/${leadId}`);
        if (!response.ok) {
          throw new Error("Lead not found");
        }
        const data = await response.json();
        setLead(data.lead ?? null);
      } catch (loadError) {
        setErrorMessage(loadError instanceof Error ? loadError.message : "Unable to load lead");
      } finally {
        setLoading(false);
      }
    }

    loadLead();
  }, [leadId]);

  const followUpState = useMemo(() => (lead ? getFollowUpState(lead) : "No Follow-Up"), [lead]);

  async function updateLead(patch: Partial<Lead>) {
    if (!lead) return;
    setSaving(true);
    setMessage(null);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to update lead");
      setLead(data.lead ?? { ...lead, ...patch });
      setMessage("Lead updated successfully.");
    } catch (updateError) {
      setErrorMessage(updateError instanceof Error ? updateError.message : "Unable to update lead");
    } finally {
      setSaving(false);
    }
  }

  async function addNote() {
    if (!lead || !noteDraft.trim()) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteDraft.trim(), type: "note" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to save note");
      setLead((current) => ({
        ...(current ?? lead),
        notes: `${current?.notes ? `${current.notes}\n` : ""}${new Date().toLocaleDateString()}: ${noteDraft.trim()}`,
        activities: [...(current?.activities ?? []), { id: data.activity?.id ?? crypto.randomUUID(), leadId: lead.id, type: "note", content: noteDraft.trim(), createdAt: new Date().toISOString(), createdBy: "Operator" }],
      }));
      setNoteDraft(EMPTY_NOTE);
      setMessage("Note added successfully.");
    } catch (noteError) {
      setErrorMessage(noteError instanceof Error ? noteError.message : "Unable to save note");
    } finally {
      setSaving(false);
    }
  }

  async function generateAnalysis() {
    if (!lead) return;
    setSaving(true);
    setMessage(null);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/recommendations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: lead.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to generate analysis");
      setLead(data.lead ?? { ...lead, aiAnalysis: data.analysis, analysisGeneratedAt: new Date().toISOString() });
      setMessage("AI analysis generated successfully.");
    } catch (generationError) {
      setErrorMessage(generationError instanceof Error ? generationError.message : "AI analysis is temporarily unavailable. Your audit is still saved.");
    } finally {
      setSaving(false);
    }
  }

  async function createProposalLink() {
    if (!lead) return;
    const response = await fetch("/api/proposals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: lead.id }) });
    const data = await response.json();
    if (!response.ok) { setErrorMessage(data.error ?? "Unable to create proposal link."); return; }
    setProposalLink(data.url);
    await navigator.clipboard?.writeText(data.url);
    setMessage("Secure customer proposal link copied.");
  }

  if (loading) return <main className="crm-page"><div className="crm-shell"><p className="empty-state">Loading lead…</p></div></main>;
  if (!lead) return <main className="crm-page"><div className="crm-shell"><div className="empty-state"><h2>Lead not found</h2><p>The requested lead could not be found.</p></div></div></main>;

  return (
    <main className="crm-page">
      <div className="crm-shell">
        <header className="crm-header">
          <div>
            <span className="eyebrow">LEAD DETAIL</span>
            <h1>{lead.businessName}</h1>
          </div>
          <div className="detail-actions-row"><button type="button" className="button button-primary" onClick={generateAnalysis} disabled={saving}>{saving ? "ANALYZING..." : lead?.aiAnalysis ? "REGENERATE ANALYSIS" : "GENERATE AI ANALYSIS"}</button><button type="button" className="button button-light" onClick={createProposalLink}>Copy customer proposal link</button><Link href="/leads" className="button button-dark">Back to leads</Link></div>
        </header>

        {(message || errorMessage) && <div className={errorMessage ? "feedback error" : "feedback success"}>{errorMessage ?? message}</div>}
        {proposalLink && <p className="muted proposal-link-preview">Proposal link expires in 30 days: {proposalLink}</p>}

        <section className="detail-hero">
          <div>
            <p className="detail-meta">{lead.firstName} {lead.lastName} · {lead.industry || "Industry not specified"}</p>
            <div className="detail-actions-row">
              <span className={`priority-badge ${lead.priority.toLowerCase()}`}>{lead.priority}</span>
              <span className={`status-badge ${lead.status.toLowerCase().replace(/\s+/g, "-")}`}>{lead.status}</span>
              <span className="simple-pill">Score {lead.overallScore}</span>
            </div>
          </div>
          <div className="detail-controls">
            <label className="field-wrap">
              <span>Status</span>
              <select value={lead.status} onChange={(event) => updateLead({ status: event.target.value as LeadStatus })}>
                {LEAD_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <label className="field-wrap">
              <span>Priority</span>
              <select value={lead.priority} onChange={(event) => updateLead({ priority: event.target.value as LeadPriority })}>
                {LEAD_PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </label>
          </div>
        </section>

        <div className="detail-grid">
          <section className="panel">
            <h2>Contact Information</h2>
            <dl className="info-list">
              <div><dt>Email</dt><dd><a href={`mailto:${lead.email}`}>{lead.email || "Not provided"}</a></dd></div>
              <div><dt>Phone</dt><dd><a href={`tel:${lead.phone}`}>{lead.phone || "Not provided"}</a></dd></div>
              <div><dt>Website</dt><dd><a href={lead.website || "#"} target="_blank" rel="noreferrer">{lead.website || "Not provided"}</a></dd></div>
              <div><dt>Business</dt><dd>{lead.businessName}</dd></div>
              <div><dt>Industry</dt><dd>{lead.industry || "Not specified"}</dd></div>
            </dl>
          </section>

          <section className="panel">
            <h2>CRM Details</h2>
            <dl className="info-list">
              <div><dt>Last Contacted</dt><dd>{lead.lastContactedAt ? new Date(lead.lastContactedAt).toLocaleString() : "Not recorded"}</dd></div>
              <div><dt>Next Follow-Up</dt><dd>{lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleString() : "None scheduled"}</dd></div>
              <div><dt>Contact Method</dt><dd>{lead.contactMethod || "Not recorded"}</dd></div>
              <div><dt>Owner</dt><dd>{lead.owner || "GrowthPilot"}</dd></div>
              <div><dt>Follow-Up State</dt><dd>{followUpState}</dd></div>
              <div><dt>Payment</dt><dd>{lead.paidOffer ? `${lead.paidOffer} paid${lead.paidAt ? ` on ${new Date(lead.paidAt).toLocaleDateString()}` : ""}` : "Not paid"}</dd></div>
            </dl>
            <div className="mini-grid">
              <label className="field-wrap">
                <span>Next Follow-Up</span>
                <input type="datetime-local" value={lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toISOString().slice(0, 16) : ""} onChange={(event) => updateLead({ nextFollowUpAt: event.target.value ? new Date(event.target.value).toISOString() : "" })} />
              </label>
              <label className="field-wrap">
                <span>Contact Method</span>
                <select value={lead.contactMethod ?? ""} onChange={(event) => updateLead({ contactMethod: event.target.value as LeadContactMethod })}>
                  <option value="">Select method</option>
                  {LEAD_CONTACT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
                </select>
              </label>
            </div>
          </section>

          <section className="panel panel-wide">
            <h2>Audit Summary</h2>
            <div className="score-header">
              <span>GrowthPilot Score</span>
              <strong>{lead.overallScore}</strong>
            </div>
            <div className="category-grid">
              {Object.entries(lead.auditResults?.categories ?? lead.categoryScores ?? {}).map(([category, score]) => (
                <div key={category} className="score-chip"><span>{category}</span><strong>{score}</strong></div>
              ))}
            </div>
            <div className="audit-blocks">
              <div>
                <h3>Main weaknesses</h3>
                <ul>{lead.recommendations?.slice(0, 3).map((item) => <li key={item.title}>{item.title}</li>) ?? <li>Not available</li>}</ul>
              </div>
              <div>
                <h3>Main opportunities</h3>
                <ul>{lead.topOpportunities?.slice(0, 3).map((item) => <li key={item.title}>{item.title}</li>) ?? <li>Review audit signals</li>}</ul>
              </div>
            </div>
            <div className="json-block">
              <h3>Audit answers</h3>
              <pre>{JSON.stringify(lead.auditAnswers ?? {}, null, 2)}</pre>
            </div>
          </section>

          <section className="panel panel-wide ai-analysis-panel">
            <div className="section-title-row"><div><span className="eyebrow">AI BUSINESS ANALYSIS</span><h2>{lead.aiAnalysis ? "Personalized growth plan" : "Turn the audit into a growth plan"}</h2></div>{lead.analysisGeneratedAt && <span className="muted">Last analyzed: {new Date(lead.analysisGeneratedAt).toLocaleString()}</span>}</div>
            {lead.aiAnalysis ? <AnalysisContent analysis={lead.aiAnalysis} /> : <div className="analysis-empty"><p>Your original audit is saved. Generate a structured diagnosis for the sales conversation.</p><button type="button" className="button button-primary" onClick={generateAnalysis} disabled={saving}>{saving ? "ANALYZING..." : "GENERATE AI ANALYSIS"}</button></div>}
          </section>

          <section className="panel panel-wide">
            <h2>Recommendations</h2>
            <div className="recommendation-list">
              {(lead.recommendations ?? lead.topOpportunities ?? []).map((recommendation) => (
                <article key={recommendation.title} className="recommendation-card">
                  <div className="recommendation-head">
                    <span className="simple-pill">{recommendation.priority ?? "Medium"}</span>
                    <strong>{recommendation.title}</strong>
                  </div>
                  <p>{recommendation.explanation}</p>
                  <ul>{recommendation.recommendations.map((item) => <li key={item}>{item}</li>)}</ul>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>Follow-Up Management</h2>
            <div className="mini-grid">
              <label className="field-wrap">
                <span>Last Contacted</span>
                <input type="datetime-local" value={lead.lastContactedAt ? new Date(lead.lastContactedAt).toISOString().slice(0, 16) : ""} onChange={(event) => updateLead({ lastContactedAt: event.target.value ? new Date(event.target.value).toISOString() : "" })} />
              </label>
              <label className="field-wrap">
                <span>Contact Method</span>
                <select value={lead.contactMethod ?? ""} onChange={(event) => updateLead({ contactMethod: event.target.value as LeadContactMethod })}>
                  <option value="">Select</option>
                  {LEAD_CONTACT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
                </select>
              </label>
            </div>
            <div className="mini-grid">
              <button type="button" className="button button-primary" onClick={() => updateLead({ lastContactedAt: new Date().toISOString(), contactMethod: lead.contactMethod || "Email" })}>Mark Contacted</button>
              <button type="button" className="button button-dark" onClick={() => updateLead({ nextFollowUpAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), contactMethod: lead.contactMethod || "Email" })}>Set Follow-Up</button>
            </div>
          </section>

          <section className="panel">
            <h2>Notes</h2>
            <textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Add internal notes…" />
            <div className="note-actions">
              <button type="button" className="button button-primary" onClick={addNote} disabled={!noteDraft.trim() || saving}>Add Note</button>
            </div>
            <div className="notes-list">
              {(lead.activities ?? []).length > 0 ? (
                lead.activities!.slice().reverse().map((activity) => (
                  <div key={activity.id} className="note-item">
                    <strong>{new Date(activity.createdAt).toLocaleDateString()}</strong>
                    <p>{activity.content}</p>
                  </div>
                ))
              ) : (
                <p className="muted">No notes yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function AnalysisContent({ analysis }: { analysis: AIRecommendationPlan }) {
  return <div className="analysis-content">
    <div className="summary-box"><p><strong>{analysis.executiveSummary}</strong></p><p>{analysis.overallAssessment}</p><p><strong>AI-estimated sales readiness:</strong> {analysis.salesReadiness}</p></div>
    <div className="analysis-opportunities">{analysis.opportunities.map((opportunity) => <article className="recommendation-card" key={opportunity.title}><div className="recommendation-head"><span className="simple-pill">{opportunity.priority}</span><strong>{opportunity.title}</strong></div><p><strong>Problem:</strong> {opportunity.problem}</p><p><strong>Evidence:</strong> {opportunity.evidence}</p><p><strong>Recommendation:</strong> {opportunity.recommendation}</p><p><strong>Expected outcome:</strong> {opportunity.expectedOutcome}</p></article>)}</div>
    <div className="plan-grid">{analysis.actionPlan.map((phase) => <article className="plan-card" key={phase.phase}><span className="plan-week">{phase.timeframe}</span><h3>{phase.phase}</h3><p>{phase.description}</p><ul>{phase.steps.map((step) => <li key={step}>{step}</li>)}</ul></article>)}</div>
    <div className="service-list">{analysis.recommendedServices.map((service) => <div className="service-row" key={service.service}><strong>{service.service}</strong><span className="simple-pill">{service.priority}</span><p>{service.reason}</p></div>)}</div>
  </div>;
}
