import test from "node:test";
import assert from "node:assert/strict";
import { buildAIRecommendationPlan, isAIRecommendationPlan } from "./ai.ts";

test("buildAIRecommendationPlan creates prioritized problems, opportunities, and service recommendations", () => {
  const plan = buildAIRecommendationPlan({
    businessName: "Bluebird Plumbing",
    website: "https://bluebirdplumbing.com",
    industry: "Plumbing",
    city: "Austin",
    email: "owner@bluebirdplumbing.com",
  }, {
    overallScore: 58,
    categories: {
      website: 48,
      localSeo: 64,
      reputation: 72,
      leadGeneration: 41,
      offer: 62,
      content: 57,
    },
    findings: {
      fetched: true,
      https: true,
      title: "",
      metaDescription: "",
      viewport: false,
      canonical: "",
      robots: "",
      h1: [],
      h2: [],
      hasNavigation: false,
      hasServiceContent: false,
      hasLocationSignal: true,
      hasPhone: true,
      hasEmail: false,
      hasContactForm: false,
      hasBookingLink: false,
      hasStrongCTA: false,
      conversionOpportunities: 6,
      hasTestimonials: false,
      hasReviews: false,
      hasGuarantee: false,
      hasCertification: false,
      hasExperienceSignal: false,
      hasCustomerCount: false,
      hasTrustBadge: false,
      hasPortfolio: false,
      hasAddress: true,
    },
    topOpportunities: [
      { category: "website", score: 48, priority: "HIGH", title: "Landing page clarity", explanation: "The site lacks clear conversion structure.", recommendations: ["Add clearer CTA", "Add proof"] },
      { category: "leadGeneration", score: 41, priority: "HIGH", title: "Call-to-action flow", explanation: "The path to contacting the business is weak.", recommendations: ["Add quote form", "Add call link"] },
    ],
    summary: "Summary",
    insights: ["Summary"],
    actionPlan: [{ title: "Fix CTA", description: "Add clear CTA", priority: "HIGH" }],
    score: 58,
    strengths: ["Strong local presence"],
    opportunities: ["Improve conversion"],
    priority: { category: "website", title: "Weak conversion path", description: "Call flow is weak", impact: "High" },
    actions: [{ title: "Fix CTA", description: "Add clear CTA", priority: "High" }],
  });

  assert.ok(plan.problems.length >= 2);
  assert.ok(plan.opportunities.length >= 2);
  assert.ok(plan.serviceRecommendations.length >= 1);
  assert.ok(plan.actionPlan.length >= 3);
  assert.equal(plan.serviceRecommendations[0].service, "CRM Setup");
  assert.equal(plan.actionPlan.length, 3);
  assert.equal(isAIRecommendationPlan(plan), true);
});

test("isAIRecommendationPlan rejects malformed provider output", () => {
  assert.equal(isAIRecommendationPlan({ executiveSummary: "Only a summary" }), false);
});
