"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const token = new FormData(event.currentTarget).get("token");
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    if (response.ok) router.push("/leads");
    else { const data = await response.json(); setError(data.error ?? "Unable to sign in."); setLoading(false); }
  }
  return <main className="legal-page"><form className="legal-shell auth-form" onSubmit={submit}><span className="eyebrow">GROWTHPILOT / INTERNAL</span><h1>Operator sign in</h1><p className="lead-copy">Sign in to access lead records and sales operations.</p><label>Access token<input name="token" type="password" autoComplete="current-password" required /></label>{error && <p className="form-error">{error}</p>}<button className="button button-primary" disabled={loading}>{loading ? "SIGNING IN..." : "SIGN IN"}</button></form></main>;
}