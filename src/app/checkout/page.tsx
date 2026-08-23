"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { getOffer } from "@/lib/offers";

const benefits = [
  "Review your Growth Score",
  "Identify your highest-impact opportunities",
  "Prioritize what to fix first",
  "Build a practical 30/60/90-day direction",
  "Identify the best GrowthPilot implementation opportunities",
];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get("leadId") ?? "";
  const cancelled = searchParams.get("cancelled") === "true";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const offer = getOffer("strategy-session")!;

  async function startCheckout() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: leadId || undefined }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      window.open(data.url, "_self");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't start checkout right now. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="checkout-page">
      <header className="checkout-nav"><Link href="/" className="brand">GROWTH<span>PILOT</span></Link><span className="checkout-label">Growth Strategy Session</span></header>
      <div className="checkout-shell">
        <section className="checkout-copy"><span className="eyebrow">YOUR NEXT GROWTH MOVE</span><h1>Turn your audit into a growth plan.</h1><p>Your GrowthPilot audit identified opportunities inside your business. This focused session turns those findings into a practical implementation roadmap.</p><ul>{benefits.map((item) => <li key={item}><span aria-hidden="true">✓</span>{item}</li>)}</ul></section>
        <aside className="checkout-card"><span className="eyebrow">GROWTHPILOT</span><h2>{offer.name}</h2><strong className="checkout-price">{offer.priceLabel}</strong><p>One-time payment. No subscription.</p>{cancelled && <p className="checkout-notice">Checkout was canceled. Your audit is still available.</p>}{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary checkout-button" onClick={startCheckout} disabled={loading}>{loading ? "OPENING SECURE CHECKOUT..." : "CONTINUE TO SECURE CHECKOUT"}<span aria-hidden="true">↗</span></button><small>Secure payment powered by Stripe. GrowthPilot does not collect card details.</small></aside>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return <Suspense><CheckoutContent /></Suspense>;
}
