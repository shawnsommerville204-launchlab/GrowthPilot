export type RevenueRescueOffer = {
  id: string;
  name: string;
  priceLabel: string;
  amount?: number;
  description: string;
  includes: string[];
  stripePriceEnv?: string;
};

export const REVENUE_RESCUE_OFFERS: RevenueRescueOffer[] = [
  { id: "audit", name: "Growth Audit", priceLabel: "$0", amount: 0, description: "A directional assessment of your clearest growth opportunities.", includes: ["Business assessment", "Growth score", "Top opportunities", "Basic action plan"] },
  { id: "strategy-session", name: "Growth Strategy Session", priceLabel: "$99", amount: 9900, description: "A focused strategy session built around your audit findings.", includes: ["Audit review", "Priority opportunity analysis", "Personalized roadmap", "Implementation sequence"], stripePriceEnv: "STRIPE_STRATEGY_PRICE_ID" },
  { id: "starter", name: "Auburn Rescue Starter", priceLabel: "$500–$1,000", description: "One focused improvement such as CRM setup, automation, or conversion work.", includes: ["One defined improvement", "Implementation plan", "Practical handoff"] },
  { id: "growth", name: "Auburn Rescue Growth", priceLabel: "$1,500–$3,000", description: "A broader improvement project across sales, automation, reporting, or process.", includes: ["Multi-part improvement plan", "Implementation support", "Measurement plan"] },
  { id: "custom", name: "Auburn Rescue Custom", priceLabel: "Custom pricing", description: "A tailored engagement for larger or more complex growth systems.", includes: ["Discovery", "Custom scope", "Proposal"] },
  { id: "optimization", name: "Auburn Rescue Optimization", priceLabel: "$299–$999 / month", description: "Ongoing reporting, optimization, and workflow support.", includes: ["Monthly reporting", "CRM and automation optimization", "Ongoing strategy"] },
];

export function getOffer(id: string) { return REVENUE_RESCUE_OFFERS.find((offer) => offer.id === id); }