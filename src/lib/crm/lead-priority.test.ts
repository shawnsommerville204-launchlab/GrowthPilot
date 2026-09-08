import test from "node:test";
import assert from "node:assert/strict";
import { deriveLeadPriority } from "./lead-utils";

test("assigns HOT priority to high-score leads with strong signals", () => {
  const priority = deriveLeadPriority({
    overallScore: 88,
    businessName: "Bluebird Plumbing",
    website: "https://bluebirdplumbing.com",
    email: "owner@bluebirdplumbing.com",
    phone: "555-0101",
    recommendations: [{ category: "leadGeneration", title: "Lead generation", score: 82, priority: "HIGH", explanation: "Test", recommendations: ["Add CTA"] }],
    status: "CONTACTED",
    nextFollowUpAt: new Date(Date.now() + 86400000).toISOString(),
  });

  assert.equal(priority, "HOT");
});

test("flags low-information leads as COLD", () => {
  const priority = deriveLeadPriority({
    overallScore: 27,
    businessName: "Local Shop",
    website: "",
    email: "",
    phone: "",
    recommendations: [],
    status: "NEW LEAD",
    nextFollowUpAt: "",
  });

  assert.equal(priority, "COLD");
});
