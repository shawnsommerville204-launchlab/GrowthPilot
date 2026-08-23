"use client";
import { useState } from "react";
import Link from "next/link";
import { getOffer } from "@/lib/offers";

export default function StrategyCheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const offer = getOffer("strategy-session")!;
  async function startCheckout() {
    setLoading(true); setError("");
    try { const response = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); window.open(data.url, "_self"); } catch (cause) { setError(cause instanceof Error ? cause.message : "Checkout is unavailable."); setLoading(false); }
  }
  return <main className="legal-page"><div className="legal-shell"><span className="eyebrow">GROWTHPILOT / NEXT STEP</span><h1>{offer.name}</h1><p className="lead-copy">{offer.description}</p><strong className="offer-price">{offer.priceLabel}</strong><ul>{offer.includes.map((item) => <li key={item}>{item}</li>)}</ul>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" onClick={startCheckout} disabled={loading}>{loading ? "OPENING SECURE CHECKOUT..." : "BOOK MY STRATEGY SESSION"}</button><p className="muted">Secure checkout opens in Stripe. No guaranteed financial outcome is implied.</p><Link href="/" className="back-link">Back to GrowthPilot</Link></div></main>;
}