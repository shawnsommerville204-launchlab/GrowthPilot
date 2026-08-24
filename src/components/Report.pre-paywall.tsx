"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuditResult, CategoryKey, Priority } from "@/lib/analyzer";

const categories: [CategoryKey, string][] = [
  ["website", "Website"],
  ["localSeo", "Local SEO"],
  ["reputation", "Reputation"],
  ["leadGeneration", "Lead Generation"],
  ["offer", "Offer"],
  ["content", "Content"],
];

type ReportInput = {
  businessName: string;
  website?: string;
  industry?: string;
  city?: string;
  email?: string;
};

type ReportProps = {
  result: AuditResult;
  input?: ReportInput;
  businessName?: string;
  auditId?: string;
  leadId?: string;
  createdAt?: string;
};

export default function Report({
  result,
  input,
  businessName,
  auditId,
  leadId,
  createdAt,
}: ReportProps) {
  const [shareState, setShareState] = useState("COPY AUDIT URL");

  const name = input?.businessName ?? businessName ?? "Your business";
  const top = result.topOpportunities ?? [];

  const date = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Today";

  const overallScore = result.overallScore ?? result.score ?? 0;

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/audit/results/${auditId ?? "preview"}`
      : `/audit/results/${auditId ?? "preview"}`;

  const ringStyle = {
    background: `conic-gradient(var(--cyan) 0 ${
      overallScore * 3.6
    }deg, #dfe7e2 ${overallScore * 3.6}deg 360deg)`,
  } as const;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 120);

    return () => window.clearTimeout(timer);
  }, []);

  async function shareAudit() {
    const shareText = `${name} GrowthPilot audit - Growth Score ${overallScore}/100\n${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${name} Growth Audit`,
          text: shareText,
          url: shareUrl,
        });

        setShareState("SHARED");
      } else {
        await navigator.clipboard.writeText(shareText);
        setShareState("URL COPIED");
      }

      window.setTimeout(() => setShareState("COPY AUDIT URL"), 2200);
    } catch {
      setShareState("SHARE CANCELLED");

      window.setTimeout(() => {
        setShareState("COPY AUDIT URL");
      }, 1600);
    }
  }

  const checkoutHref = leadId
    ? `/checkout?leadId=${encodeURIComponent(leadId)}`
    : "/checkout";

  return (
    <main className="report-page">
      <header className="report-nav">
        <Link className="brand" href="/">
          GROWTH<span>PILOT</span>
        </Link>

        <div className="report-actions">
          <button
            className="report-action"
            type="button"
            onClick={() => window.print()}
          >
            PRINT REPORT
          </button>

          <button
            className="report-action"
            type="button"
            onClick={shareAudit}
          >
            {shareState}
          </button>

          <Link href="/audit" className="back-link">
            New audit <span>↗</span>
          </Link>
        </div>
      </header>

      <div className="report-wrap">
        <header className="report-meta">
          <div>
            <span className="eyebrow">DIGITAL GROWTH AUDIT</span>

            <h1>{name}</h1>

            <p>
              {input?.city || "Local market"}
              {input?.website ? ` · ${input.website}` : ""}
            </p>
          </div>

          <div className="report-date">
            <span>AUDIT DATE</span>
            <strong>{date}</strong>

            {auditId && <small>ID / {auditId.slice(0, 8)}</small>}
          </div>
        </header>

        {/* SCORE */}

        <section className="report-section">
          <div className="score-wrap">
            <div
              className="score-ring"
              style={ringStyle}
              aria-label={`${overallScore} out of 100`}
            >
              <div>
                <strong>{overallScore}</strong>
                <small>/ 100</small>
              </div>
            </div>

            <div className="score-copy">
              <span className="eyebrow">GROWTH SCORE</span>

              <h2>{scoreInterpretation(overallScore)}</h2>

              <p>
                {result.summary ||
                  "Your audit identifies the areas most likely to affect visibility, trust, and conversion."}
              </p>
            </div>
          </div>
        </section>

        {/* SCORECARD */}

        <section className="report-section">
          <div className="section-header">
            <span>01</span>
            <h2>Category scorecard</h2>
          </div>

          <div className="category-grid">
            {categories.map(([key, label]) => {
              const score = result.categories[key];

              const opportunity = top.find(
                (item) =>
                  normalizeCategory(item.category) ===
                  normalizeCategory(label),
              );

              return (
                <article className="category-card" key={key}>
                  <div className="category-top">
                    <span>{label}</span>

                    <strong>
                      {score}
                      <small>/ 100</small>
                    </strong>
                  </div>

                  <div className="bar">
                    <i style={{ width: `${score}%` }} />
                  </div>

                  <span
                    className={`category-status status-${statusFor(
                      score,
                    ).toLowerCase()}`}
                  >
                    {statusFor(score).replace("_", " ")}
                  </span>

                  <p>
                    {categoryExplanation(
                      key,
                      result,
                      opportunity?.explanation,
                    )}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        {/* OPPORTUNITIES */}

        <section className="report-section opportunity-section">
          <div className="section-header light-label">
            <span>02</span>
            <h2>Your biggest growth opportunities</h2>
          </div>

          <div className="opportunity-cards">
            {top.length ? (
              top.slice(0, 3).map((opportunity, index) => (
                <article
                  className="opportunity-card"
                  key={`${opportunity.category}-${index}`}
                >
                  <div className="opportunity-card-top">
                    <span>Opportunity #{index + 1}</span>

                    <b>{opportunity.category}</b>
                  </div>

                  <h3>{opportunity.title}</h3>

                  <strong>{opportunity.score} / 100</strong>

                  <span className="opportunity-priority">
                    {opportunity.priority}
                  </span>

                  <p>{opportunity.explanation}</p>

                  {/* Do NOT reveal the implementation recommendations */}
                  <div className="locked-recommendations">
                    <span>🔒</span>

                    <div>
                      <strong>Detailed recommendations locked</strong>

                      <p>
                        Your audit identified the problem. Your Growth Strategy
                        Session reveals exactly what to change and how to
                        prioritize it.
                      </p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <article className="opportunity-card">
                <div className="opportunity-card-top">
                  <span>Opportunity #1</span>

                  <b>Growth</b>
                </div>

                <h3>Strong base, steady improvements ahead</h3>

                <strong>{overallScore} / 100</strong>

                <span className="opportunity-priority">GOOD</span>

                <p>
                  The current audit did not surface significant weaknesses.
                  The next step is identifying which improvements could create
                  the greatest return.
                </p>
              </article>
            )}
          </div>
        </section>

        {/* WHY THIS MATTERS */}

        <section className="report-section">
          <div className="section-header">
            <span>03</span>
            <h2>Why this matters</h2>
          </div>

          <div className="why-grid">
            {top.slice(0, 3).map((opportunity, index) => (
              <article
                className="reason-card"
                key={`${opportunity.category}-impact-${index}`}
              >
                <span className="eyebrow">{opportunity.category}</span>

                <h3>{opportunity.title}</h3>

                <p>
                  <strong>Finding:</strong> {opportunity.explanation}
                </p>

                <p>
                  <strong>Business impact:</strong>{" "}
                  {opportunityImpact(opportunity.category)}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* LOCKED STRATEGY */}

        <section className="report-section">
          <div className="section-header">
            <span>04</span>
            <h2>Your personalized growth plan</h2>
          </div>

          <div className="locked-plan">
            <div className="locked-plan-icon">🔒</div>

            <span className="eyebrow">GROWTH STRATEGY SESSION</span>

            <h2>
              You know where the problems are.
              <br />
              Now find out what to do about them.
            </h2>

            <p>
              Your free audit identifies the highest-impact opportunities.
              The Growth Strategy Session turns those findings into a
              prioritized implementation roadmap.
            </p>

            <div className="locked-plan-grid">
              <div>
                <strong>01</strong>
                <span>Priority opportunities</span>
              </div>

              <div>
                <strong>02</strong>
                <span>Personalized recommendations</span>
              </div>

              <div>
                <strong>03</strong>
                <span>30/60/90-day roadmap</span>
              </div>

              <div>
                <strong>04</strong>
                <span>Implementation sequence</span>
              </div>
            </div>

            <Link className="button button-primary" href={checkoutHref}>
              GET MY GROWTH PLAN — $99
              <span aria-hidden="true">↗</span>
            </Link>

            <small>One-time payment · Secure checkout powered by Stripe</small>
          </div>
        </section>

        {/* FREE REPORT SUMMARY */}

        <section className="report-section">
          <div className="section-header">
            <span>05</span>
            <h2>What your audit tells us</h2>
          </div>

          <div className="summary-box">
            <p>
              {buildFreeSummary(name, result)}
            </p>
          </div>
        </section>

        {/* FINAL CTA */}

        <section className="report-cta">
          <span className="eyebrow">READY FOR THE NEXT STEP?</span>

          <h2>
            Stop guessing what to fix.
            <br />
            Get your GrowthPilot strategy.
          </h2>

          <p>
            Turn your audit into a prioritized plan built around your business.
          </p>

          <Link className="button button-primary" href={checkoutHref}>
            GET MY GROWTH PLAN — $99
            <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </div>
    </main>
  );
}

function scoreInterpretation(score: number): string {
  if (score >= 90) return "Excellent digital foundation";

  if (score >= 75) return "Strong foundation with opportunities";

  if (score >= 60) return "Moderate growth opportunity";

  if (score >= 40) return "Significant growth opportunities";

  return "Critical growth gaps";
}

function statusFor(score: number): Priority {
  if (score < 40) return "CRITICAL";

  if (score < 60) return "HIGH";

  if (score < 75) return "MEDIUM";

  if (score < 90) return "GOOD";

  return "EXCELLENT";
}

function normalizeCategory(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

function categoryExplanation(
  key: CategoryKey,
  result: AuditResult,
  opportunity?: string,
): string {
  if (opportunity) return opportunity;

  const findings = result.findings;

  const fallback: Record<CategoryKey, string> = {
    website: findings.fetched
      ? "The page structure is visible and measurable, but the foundation still leaves room for conversion gains."
      : "The site could not be fully inspected, so this category is based on the visible baseline and missing signals.",

    localSeo: findings.hasLocationSignal
      ? "The business is partly visible in local context, but the local value proposition is still not fully clear."
      : "The local market signal is not strong enough to help nearby buyers immediately recognize the business.",

    reputation:
      findings.hasReviews || findings.hasTestimonials
        ? "Customer proof is present, but it may not yet be prominent enough to lower decision friction."
        : "Customer trust signals are not yet strong enough to help prospects feel confident moving forward.",

    leadGeneration:
      findings.conversionOpportunities > 0
        ? "There is some conversion potential, but the path to contact or book still needs to be clearer."
        : "The next step is not obvious enough for a ready-to-buy visitor.",

    offer: findings.hasServiceContent
      ? "The business message is somewhat visible, but the value proposition still needs to be easier to understand."
      : "The core offer is not clear enough for someone comparing providers in the first few seconds.",

    content:
      findings.h2.length > 0
        ? "The site has some content structure, but it is not yet doing enough to answer buyer questions in depth."
        : "There are not enough trust-building content signals to support the research stage of the buying journey.",
  };

  return fallback[key];
}

function opportunityImpact(category: string): string {
  const impacts: Record<string, string> = {
    "Lead Generation":
      "Visitors may understand the offer but leave without taking the next step.",

    "Local SEO":
      "People searching nearby may not recognize this business as a relevant local option.",

    Reputation:
      "Prospects may hesitate because they do not have enough proof to reduce uncertainty.",

    Website:
      "A weak website creates friction before the customer ever reaches the business.",

    Offer:
      "Prospects may not quickly understand the service outcome or why this business is different.",

    Content:
      "Buyers researching the problem may not trust the business enough to reach out.",
  };

  return (
    impacts[category] ??
    "This gap can create friction before a prospect becomes a lead."
  );
}

function buildFreeSummary(name: string, result: AuditResult): string {
  const categories = Object.entries(result.categories);

  const strongest = categories.sort(
    ([, left], [, right]) => right - left,
  )[0];

  const biggestOpportunity = result.topOpportunities?.[0];

  return `${name} currently has a Growth Score of ${
    result.overallScore
  }/100. The strongest area identified by the audit is ${
    strongest?.[0] ?? "your current foundation"
  }. The clearest opportunity is ${
    biggestOpportunity?.category ?? "conversion"
  }. The free audit shows where the biggest gaps are; the Growth Strategy Session is designed to determine exactly what to fix first and how to implement it.`;
}
