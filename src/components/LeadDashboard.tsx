"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Lead } from "@/lib/crm/types";
import { getFollowUpState, leadPriorityRank, scoreRangeLabel } from "@/lib/crm/lead-utils";

const STATUSES = ["All", "NEW LEAD", "REVIEWED", "CONTACTED", "DISCOVERY", "PROPOSAL", "WON", "LOST"] as const;
const PRIORITIES = ["All", "HOT", "WARM", "COLD"] as const;
const SCORE_FILTERS = ["All", "80+", "60–79", "40–59", "Below 40"] as const;
const FOLLOW_UP_FILTERS = ["All", "Due Today", "Overdue", "Upcoming", "No Follow-Up"] as const;
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "score", label: "Audit Score" },
  { value: "priority", label: "Priority" },
  { value: "followup", label: "Next Follow-Up" },
  { value: "contacted", label: "Recently Contacted" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export default function LeadDashboard() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUSES)[number]>("All");
  const [priorityFilter, setPriorityFilter] = useState<(typeof PRIORITIES)[number]>("All");
  const [scoreFilter, setScoreFilter] = useState<(typeof SCORE_FILTERS)[number]>("All");
  const [followUpFilter, setFollowUpFilter] = useState<(typeof FOLLOW_UP_FILTERS)[number]>("All");
  const [sortBy, setSortBy] = useState<SortValue>("newest");

  useEffect(() => {
    async function loadLeads() {
      try {
        setLoading(true);
        const response = await fetch("/api/leads");
        if (!response.ok) throw new Error("Unable to load leads");
        const data = await response.json();
        setLeads(data.leads ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load leads");
      } finally {
        setLoading(false);
      }
    }

    loadLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = leads.filter((lead) => {
      const searchText = [lead.businessName, lead.firstName, lead.lastName, lead.email, lead.phone, lead.website].join(" ").toLowerCase();
      const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery);
      const matchesStatus = statusFilter === "All" || lead.status === statusFilter;
      const matchesPriority = priorityFilter === "All" || lead.priority === priorityFilter;
      const matchesScore = scoreFilter === "All" || scoreRangeLabel(lead.overallScore) === scoreFilter;
      const followUpState = getFollowUpState(lead);
      const matchesFollowUp = followUpFilter === "All" || followUpState === followUpFilter;
      return matchesQuery && matchesStatus && matchesPriority && matchesScore && matchesFollowUp;
    });

    return [...filtered].sort((first, second) => {
      switch (sortBy) {
        case "oldest":
          return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();
        case "score":
          return second.overallScore - first.overallScore;
        case "priority":
          return leadPriorityRank(second.priority) - leadPriorityRank(first.priority);
        case "followup": {
          const firstDate = first.nextFollowUpAt ? new Date(first.nextFollowUpAt).getTime() : Number.MAX_SAFE_INTEGER;
          const secondDate = second.nextFollowUpAt ? new Date(second.nextFollowUpAt).getTime() : Number.MAX_SAFE_INTEGER;
          return firstDate - secondDate;
        }
        case "contacted":
          return new Date(second.lastContactedAt ?? second.updatedAt).getTime() - new Date(first.lastContactedAt ?? first.updatedAt).getTime();
        case "newest":
        default:
          return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
      }
    });
  }, [leads, query, statusFilter, priorityFilter, scoreFilter, followUpFilter, sortBy]);

  const summary = useMemo(() => ({
    total: leads.length,
    newLeads: leads.filter((lead) => lead.status === "NEW LEAD").length,
    hotLeads: leads.filter((lead) => lead.priority === "HOT").length,
    followUpsDue: leads.filter((lead) => ["Due Today", "Overdue"].includes(getFollowUpState(lead))).length,
    won: leads.filter((lead) => lead.status === "WON").length,
  }), [leads]);

  if (loading) {
    return <main className="crm-page"><div className="crm-shell"><p className="empty-state">Loading leads…</p></div></main>;
  }

  if (error) {
    return <main className="crm-page"><div className="crm-shell"><div className="empty-state"><h2>Unable to load CRM</h2><p>{error}</p></div></div></main>;
  }

  return (
    <main className="crm-page">
      <div className="crm-shell">
        <header className="crm-header">
          <div>
            <span className="eyebrow">INTERNAL CRM</span>
            <h1>Sales pipeline</h1>
          </div>
          <Link href="/leads/pipeline" className="button button-primary">Pipeline view</Link>
        </header>

        <section className="summary-grid">
          <div className="summary-card"><span>TOTAL LEADS</span><strong>{summary.total}</strong></div>
          <div className="summary-card"><span>NEW LEADS</span><strong>{summary.newLeads}</strong></div>
          <div className="summary-card"><span>HOT LEADS</span><strong>{summary.hotLeads}</strong></div>
          <div className="summary-card"><span>FOLLOW-UPS DUE</span><strong>{summary.followUpsDue}</strong></div>
          <div className="summary-card"><span>WON</span><strong>{summary.won}</strong></div>
        </section>

        <section className="filters-panel">
          <div className="filters-row">
            <label className="field-wrap field-grow">
              <span>Search</span>
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Business, name, email, phone, website" />
            </label>
            <label className="field-wrap">
              <span>Sort</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortValue)}>
                {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>

          <div className="filter-pills">
            <div className="filter-group">
              <span>Status</span>
              <div className="pill-row">{STATUSES.map((status) => <button key={status} type="button" className={statusFilter === status ? "pill active" : "pill"} onClick={() => setStatusFilter(status)}>{status === "All" ? "All" : status}</button>)}</div>
            </div>
            <div className="filter-group">
              <span>Priority</span>
              <div className="pill-row">{PRIORITIES.map((level) => <button key={level} type="button" className={priorityFilter === level ? "pill active" : "pill"} onClick={() => setPriorityFilter(level)}>{level}</button>)}</div>
            </div>
            <div className="filter-group">
              <span>Audit</span>
              <div className="pill-row">{SCORE_FILTERS.map((range) => <button key={range} type="button" className={scoreFilter === range ? "pill active" : "pill"} onClick={() => setScoreFilter(range)}>{range}</button>)}</div>
            </div>
            <div className="filter-group">
              <span>Follow-Up</span>
              <div className="pill-row">{FOLLOW_UP_FILTERS.map((state) => <button key={state} type="button" className={followUpFilter === state ? "pill active" : "pill"} onClick={() => setFollowUpFilter(state)}>{state}</button>)}</div>
            </div>
          </div>
        </section>

        {filteredLeads.length === 0 ? (
          <div className="empty-state">
            <h2>No leads match these filters.</h2>
            <p>Try broadening the status, priority, or follow-up filters.</p>
          </div>
        ) : (
          <div className="lead-table-wrap">
            <table className="lead-table">
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Business</th>
                  <th>Contact</th>
                  <th>Industry</th>
                  <th>Audit Score</th>
                  <th>Status</th>
                  <th>Next Follow-Up</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} onClick={() => router.push(`/leads/${lead.id}`)} className="lead-row">
                    <td><span className={`priority-badge ${lead.priority.toLowerCase()}`}>{lead.priority}</span></td>
                    <td>
                      <div className="business-cell">
                        <strong>{lead.businessName}</strong>
                        <small>{lead.website || "Website not provided"}</small>
                      </div>
                    </td>
                    <td>
                      <div className="contact-cell">
                        <strong>{[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Unassigned"}</strong>
                        <small>{lead.email || lead.phone || "No contact details"}</small>
                      </div>
                    </td>
                    <td>{lead.industry || "Not specified"}</td>
                    <td>{lead.overallScore}</td>
                    <td><span className={`status-badge ${lead.status.toLowerCase().replace(/\s+/g, "-")}`}>{lead.status}</span></td>
                    <td>{lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "No follow-up"}</td>
                    <td>{new Date(lead.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
