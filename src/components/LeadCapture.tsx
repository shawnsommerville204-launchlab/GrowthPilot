"use client";

import { FormEvent, useState } from "react";
import { AuditResult } from "@/lib/analyzer";
import { trackEvent } from "@/lib/analytics";

type LeadCaptureProps = {
  audit: { input: Record<string, string>; result: AuditResult };
  onComplete: (data: { leadId: string; auditId: string; result: AuditResult }) => void;
};

export default function LeadCapture({ audit, onComplete }: LeadCaptureProps) {
  const [form, setForm] = useState({ firstName: "", lastName: "", businessName: audit.input.businessName ?? "", email: audit.input.email ?? "", phone: "", website: audit.input.website ?? "", industry: audit.input.industry ?? "", biggestChallenge: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) { setForm((current) => ({ ...current, [field]: value })); }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    const values = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()])) as typeof form;
    if (!values.firstName || !values.lastName || !values.businessName || !values.email) { setError("First name, last name, business name, and email are required."); return; }
    if (!/^\S+@\S+\.\S+$/.test(values.email)) { setError("Enter a valid email address."); return; }
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, audit }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "We could not save your details.");
      trackEvent("lead_submitted");
      onComplete({ leadId: data.leadId, auditId: data.auditId, result: data.result });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not save your details. Please try again.");
      setLoading(false);
    }
  }

  const fields: { key: keyof typeof form; label: string; placeholder: string; required?: boolean; type?: "email" | "tel" | "url" }[] = [
    { key: "firstName", label: "First name", placeholder: "Alex", required: true },
    { key: "lastName", label: "Last name", placeholder: "Morgan", required: true },
    { key: "businessName", label: "Business name", placeholder: "Summit Roofing", required: true },
    { key: "email", label: "Email", placeholder: "you@business.com", required: true, type: "email" },
    { key: "phone", label: "Phone", placeholder: "(555) 010-2040", type: "tel" },
    { key: "website", label: "Website", placeholder: "https://yourbusiness.com", type: "url" },
    { key: "industry", label: "Industry", placeholder: "Roofing, HVAC, landscaping" },
  ];

  return <main className="audit-section lead-capture-page"><div className="audit-intro"><span className="eyebrow">02 / YOUR RESULTS</span><h1>One last step<br /><em>before the score.</em></h1><p>Tell us where to send your personalized audit. Your answers stay attached to the report so we can make the recommendations useful.</p></div><form className="lead-capture-form" onSubmit={submit} noValidate><div className="form-grid">{fields.map((field) => <label key={field.key}>{field.label}{field.required ? " *" : ""}<input required={field.required} type={field.type ?? "text"} value={form[field.key]} placeholder={field.placeholder} onChange={(event) => update(field.key, event.target.value)} /></label>)}</div><label className="wide-field">Biggest business challenge<textarea value={form.biggestChallenge} placeholder="What is making growth difficult right now?" rows={4} onChange={(event) => update("biggestChallenge", event.target.value)} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-dark" type="submit" disabled={loading}>{loading ? "SAVING YOUR AUDIT..." : "SHOW MY GROWTH SCORE"}<span aria-hidden="true">↗</span></button></form></main>;
}