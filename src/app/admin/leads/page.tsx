"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Lead } from "@/lib/crm/types";

const FILTERS = ["All", "NEW LEAD", "AUDIT COMPLETED", "REVIEWED", "CONTACTED", "DISCOVERY", "PROPOSAL", "WON", "LOST"] as const;

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  useEffect(() => {
    async function loadLeads() {
      const response = await fetch("/api/admin/leads");
      if (!response.ok) return;
      const data = await response.json();
      setLeads(data.leads ?? []);
    }

    loadLeads();
  }, []);

  const visibleLeads = leads.filter((lead) => {
    const matchesFilter = filter === "All" || lead.status === filter;
    const values = [lead.businessName, lead.email, lead.website, lead.city].join(" ").toLowerCase();
    const matchesQuery = values.includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });
  const averageScore = leads.length ? Math.round(leads.reduce((total, lead) => total + lead.overallScore, 0) / leads.length) : 0;
  const followUp = leads.filter((lead) => ["NEW LEAD", "AUDIT COMPLETED", "REVIEWED", "CONTACTED"].includes(lead.status)).length;

  return (
    <main className="admin-page">
      <div className="admin-shell">
        <header className="admin-header">
          <div>
            <span className="eyebrow">INTERNAL OPERATIONS</span>
            <h1>Lead dashboard</h1>
          </div>
          <Link href="/" className="button button-primary">Back to site</Link>
        </header>

        <div className="lead-metrics">
          <div><span>Total leads</span><strong>{leads.length}</strong></div>
          <div><span>New leads</span><strong>{leads.filter((lead) => lead.status === "NEW LEAD").length}</strong></div>
          <div><span>Audits completed</span><strong>{leads.length}</strong></div>
          <div><span>Average score</span><strong>{averageScore}<small>/100</small></strong></div>
          <div><span>Needs follow-up</span><strong>{followUp}</strong></div>
        </div>

        <div className="admin-toolbar">
          <div className="admin-filters">
            {FILTERS.map((value) => (
              <button
                key={value}
                type="button"
                className={filter === value ? "filter-pill active" : "filter-pill"}
                onClick={() => setFilter(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by business, email, website, or city"
            className="lead-search"
          />
        </div>

        <div className="lead-table-wrap">
          <table className="lead-table">
            <thead>
              <tr>
                <th>Lead ID</th>
                <th>Business</th>
                <th>Contact</th>
                <th>Industry</th>
                <th>Score</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {visibleLeads.map((lead) => (
                <tr key={lead.id}>
                  <td><Link href={`/admin/leads/${lead.id}`}>{lead.auditId}</Link></td>
                  <td><Link href={`/admin/leads/${lead.id}`}>{lead.businessName}</Link><small>{lead.city}</small></td>
                  <td>{lead.firstName} {lead.lastName}<small>{lead.email}</small></td>
                  <td>{lead.industry}</td>
                  <td>{lead.overallScore}</td>
                  <td><span className={`status-badge ${lead.status.toLowerCase()}`}>{lead.status}</span></td>
                  <td>{new Date(lead.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
