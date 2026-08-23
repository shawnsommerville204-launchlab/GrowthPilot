"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { writeStoredAudit } from "@/lib/audit/storage";
import { trackEvent } from "@/lib/analytics";

export default function AuditForm() {
  const router = useRouter();
  const [form, setForm] = useState({ businessName: "", website: "", industry: "", city: "", email: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const trimmed = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()])) as typeof form;
    if (!trimmed.businessName || !trimmed.website || !trimmed.industry || !trimmed.city) {
      setError("Complete your business name, website, industry, and city.");
      return;
    }
    try {
      new URL(trimmed.website);
    } catch {
      setError("Enter a valid website URL, including https://");
      return;
    }
    if (!/^https?:$/i.test(new URL(trimmed.website).protocol)) {
      setError("Enter a valid website URL, including https://");
      return;
    }
    if (trimmed.email && !/^\S+@\S+\.\S+$/.test(trimmed.email)) {
      setError("Enter a valid email address or leave it blank.");
      return;
    }

    setLoading(true);
    trackEvent("audit_started");
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trimmed),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const stored = {
        result: data.result,
        input: data.input,
        audit: { id: data.auditId, createdAt: data.audit?.createdAt ?? new Date().toISOString() },
      };
      writeStoredAudit(stored);
      trackEvent("audit_completed", { score: data.result.overallScore });
      router.push("/audit");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const fields: { key: keyof typeof form; label: string; placeholder: string; type?: "text" | "url" | "email" }[] = [
    { key: "businessName", label: "Business name", placeholder: "Summit Roofing" },
    { key: "website", label: "Website *", placeholder: "https://yourbusiness.com", type: "url" },
    { key: "industry", label: "Industry", placeholder: "Roofing, HVAC, landscaping..." },
    { key: "city", label: "City", placeholder: "Austin, TX" },
    { key: "email", label: "Email", placeholder: "you@yourbusiness.com", type: "email" },
  ];

  return (
    <form className="audit-form" onSubmit={submit} noValidate>
      <div className="form-grid">
        {fields.map((field) => (
          <label key={field.key}>
            {field.label}
            <input
              type={field.type ?? "text"}
              value={form[field.key]}
              onChange={(event) => update(field.key, event.target.value)}
              placeholder={field.placeholder}
              required={field.key === "website"}
            />
          </label>
        ))}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary form-submit" type="submit" disabled={loading}>
        {loading ? "Preparing your audit..." : "Run my free audit"}
        <span aria-hidden="true">↗</span>
      </button>
      <p className="form-note">No credit card. No sales pitch. Just a clear starting point.</p>
    </form>
  );
}
