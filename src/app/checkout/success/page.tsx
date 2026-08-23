"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function CheckoutSuccessContent() {
	const sessionId = useSearchParams().get("session_id");
	const [status, setStatus] = useState<"loading" | "paid" | "pending" | "error">(() => sessionId ? "loading" : "error");
	const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL;
	useEffect(() => {
		if (!sessionId) return;
		const checkoutSessionId = sessionId;
		let attempts = 0;
		let timer: number | undefined;
		let cancelled = false;
		async function checkStatus() {
			try {
				const response = await fetch(`/api/stripe/session?session_id=${encodeURIComponent(checkoutSessionId)}`);
				const data = await response.json();
				if (cancelled) return;
				if (response.ok && data.paid) {
					setStatus("paid");
					return;
				}
				attempts += 1;
				if (attempts < 5) timer = window.setTimeout(checkStatus, 2000);
				else setStatus("pending");
			} catch {
				setStatus("error");
			}
		}
		void checkStatus();
		return () => { cancelled = true; if (timer) window.clearTimeout(timer); };
	}, [sessionId]);
	const title = status === "paid" ? "You're In." : status === "error" ? "We couldn't confirm this checkout." : "We're confirming your payment.";
	const message = status === "paid" ? "Your Growth Strategy Session has been purchased successfully. Your next step is to schedule your strategy session." : status === "error" ? "Return to checkout or contact us if you were charged and do not see your session confirmed." : status === "pending" ? "Your payment may still be processing. We will continue confirming it on our side." : "Stripe is confirming this checkout. This usually takes a few seconds.";
	return <main className="legal-page"><div className="legal-shell"><span className="eyebrow">{status === "paid" ? "PAYMENT CONFIRMED" : status === "error" ? "CHECKOUT STATUS" : "PAYMENT PROCESSING"}</span><h1>{title}</h1><p className="lead-copy">{message}</p>{status === "paid" && (bookingUrl ? <a className="button button-primary" href={bookingUrl}>SCHEDULE MY STRATEGY SESSION <span>↗</span></a> : <p className="muted">Scheduling is being configured. We&apos;ll follow up with your next step.</p>)}{status === "error" && <Link className="button button-primary" href="/checkout">RETURN TO CHECKOUT</Link>}<Link href="/" className="back-link">Back to GrowthPilot</Link></div></main>;
}

export default function CheckoutSuccessPage() {
	return <Suspense><CheckoutSuccessContent /></Suspense>;
}