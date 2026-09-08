export type AnalyticsEvent = "audit_started" | "audit_completed" | "lead_submitted" | "results_viewed" | "strategy_clicked" | "checkout_started" | "booking_clicked" | "proposal_created" | "proposal_accepted";

export function trackEvent(event: AnalyticsEvent, properties?: Record<string, string | number>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("auburn-revenue-rescue:analytics", { detail: { event, properties } }));
}