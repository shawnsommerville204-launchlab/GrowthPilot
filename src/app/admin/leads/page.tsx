"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Lead } from "@/lib/crm/types";

const FILTERS = ["All", "New", "Contacted", "Qualified", "Won", "Lost"] as const;

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
                <th>Business</th>
                <th>Website</th>
                <th>City</th>
                <th>Industry</th>
                <th>Email</th>
                <th>Score</th>
                <th>Primary opportunity</th>
                <th>Recommended service</th>
                <th>Status</th>
                <th>Created</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {visibleLeads.map((lead) => (
                <tr key={lead.id}>
                  <td><Link href={`/admin/leads/${lead.id}`}>{lead.businessName}</Link></td>
                  <td>{lead.website}</td>
                  <td>{lead.city}</td>
                  <td>{lead.industry}</td>
                  <td>{lead.email}</td>
                  <td>{lead.overallScore}</td>
                  <td>{lead.primaryOpportunity ?? lead.topOpportunity}</td>
                  <td>{lead.recommendedService ?? "GrowthPilot Audit Follow-Up"}</td>
                  <td><span className={`status-badge ${lead.status.toLowerCase()}`}>{lead.status}</span></td>
                  <td>{new Date(lead.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td>{new Date(lead.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
