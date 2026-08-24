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
  const overallScore = result.overallScore ?? result.score ?? 0;

  const date = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Today";

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/audit/results/${auditId ?? "preview"}`
      : `/audit/results/${auditId ?? "preview"}`;

  const checkoutUrl = leadId
    ? `/checkout?leadId=${encodeURIComponent(leadId)}`
    : "/checkout";

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
      window.setTimeout(() => setShareState("COPY AUDIT URL"), 1600);
    }
  }

  return (
    <main className="report-page">
      <header className="report-nav">
        <a className="brand" href="/">
          GROWTH<span>PILOT</span>
        </a>

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

          <Link href="/" className="back-link">
            New audit <span>↗</span>
          </Link>
        </div>
      </header>

      <div className="report-wrap">
        {/* HEADER */}

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
                  "Your audit identifies the areas creating the biggest opportunities for growth."}
              </p>
            </div>
          </div>
        </section>

        {/* CATEGORY SCORECARD */}

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
                  normalizeCategory(label)
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
                      score
                    ).toLowerCase()}`}
                  >
                    {statusFor(score).replace("_", " ")}
                  </span>

                  <p>
                    {categoryExplanation(
                      key,
                      result,
                      opportunity?.explanation
                    )}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        {/* TOP OPPORTUNITIES */}

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

                  <p>{shorten(opportunity.explanation)}</p>

                  <div className="recommendation-teaser">
                    <strong>Actionable improvements identified.</strong>

                    <p>
                      Your audit found specific ways to improve this area.
                      The detailed fix sequence and implementation priorities
                      are included in the Growth Strategy Session.
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <article className="opportunity-card">
                <div className="opportunity-card-top">
                  <span>Opportunity</span>
                  <b>Growth</b>
                </div>

                <h3>Strong foundation with room to optimize</h3>

                <strong>{overallScore} / 100</strong>

                <span className="opportunity-priority">GOOD</span>

                <p>
                  The audit did not identify a major weakness, but there are
                  still opportunities to improve conversion and growth.
                </p>
              </article>
            )}
          </div>

          {/* SECONDARY CTA */}

          <div className="report-inline-cta">
            <div>
              <span className="eyebrow">WANT THE NEXT STEP?</span>

              <h3>Know what needs attention. Now get the strategy.</h3>

              <p>
                Get the priority sequence, detailed recommendations, and
                implementation roadmap built around this audit.
              </p>
            </div>

            <Link className="button button-primary" href={checkoutUrl}>
              VIEW GROWTH STRATEGY — $99
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>

        {/* WHAT WE FOUND */}

        <section className="report-section">
          <div className="section-header">
            <span>03</span>
            <h2>What we found</h2>
          </div>

          <div className="why-grid">
            {top.slice(0, 3).map((opportunity, index) => (
              <article
                className="reason-card"
                key={`${opportunity.category}-impact-${index}`}
              >
                <span className="eyebrow">{opportunity.category}</span>

                <h3>{opportunity.title}</h3>

                <p>{shorten(opportunity.explanation)}</p>

                <p>
                  <strong>Why it matters:</strong>{" "}
                  {opportunityImpact(opportunity.category)}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* OPPORTUNITY AREAS */}

        <section className="report-section">
          <div className="section-header">
            <span>04</span>
            <h2>Growth opportunity areas</h2>
          </div>

          <div className="quick-win-grid">
            {top.slice(0, 3).map((opportunity) => (
              <div className="quick-win" key={opportunity.category}>
                <span>✓</span>
                {opportunity.title}
              </div>
            ))}

            {!top.length && (
              <>
                <div className="quick-win">
                  <span>✓</span>
                  Improve conversion
                </div>

                <div className="quick-win">
                  <span>✓</span>
                  Strengthen visibility
                </div>

                <div className="quick-win">
                  <span>✓</span>
                  Increase customer trust
                </div>
              </>
            )}
          </div>
        </section>

        {/* 30 DAY PREVIEW */}

        <section className="report-section">
          <div className="section-header">
            <span>05</span>
            <h2>Your 30-day growth plan</h2>
          </div>

          <div className="plan-grid">
            <article className="plan-card">
              <span className="plan-week">WEEK 1</span>
              <h3>Identify the highest-impact issue</h3>
              <p>
                Focus attention on the issue most likely to affect growth.
              </p>
            </article>

            <article className="plan-card">
              <span className="plan-week">WEEK 2</span>
              <h3>Prioritize the opportunity</h3>
              <p>
                Determine which improvement should happen first.
              </p>
            </article>

            <article className="plan-card">
              <span className="plan-week">WEEK 3</span>
              <h3>Build the improvement sequence</h3>
              <p>
                Translate the findings into an actionable implementation
                sequence.
              </p>
            </article>

            <article className="plan-card">
              <span className="plan-week">WEEK 4</span>
              <h3>Measure and optimize</h3>
              <p>
                Establish the next measurements and improvements.
              </p>
            </article>
          </div>

          <div className="strategy-lock">
            <span className="eyebrow">FULL STRATEGY</span>

            <h3>Your detailed implementation roadmap is ready to be built.</h3>

            <p>
              The Growth Strategy Session turns this diagnosis into a
              prioritized plan with specific recommendations and next steps.
            </p>

            <Link className="button button-primary" href={checkoutUrl}>
              GET MY GROWTH STRATEGY
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>

        {/* EXECUTIVE SUMMARY */}

        <section className="report-section">
          <div className="section-header">
            <span>06</span>
            <h2>Executive summary</h2>
          </div>

          <div className="summary-box">
            <p>{buildExecutiveSummary(name, result)}</p>
          </div>
        </section>

        {/* FINAL CTA */}

        <section className="report-cta">
          <span className="eyebrow">READY TO TURN THIS AUDIT INTO A PLAN?</span>

          <h2>Turn your audit into a prioritized growth strategy.</h2>

          <p>
            Your free audit shows where the biggest opportunities are. The
            Growth Strategy Session turns those findings into a practical
            implementation roadmap.
          </p>

          <Link className="button button-primary" href={checkoutUrl}>
            GET MY GROWTH STRATEGY
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

function shorten(value?: string): string {
  if (!value) {
    return "The audit identified an opportunity that deserves closer attention.";
  }

  const clean = value.replace(/\s+/g, " ").trim();

  return clean.length > 220 ? `${clean.slice(0, 217)}...` : clean;
}

function categoryExplanation(
  key: CategoryKey,
  result: AuditResult,
  opportunity?: string
): string {
  if (opportunity) return shorten(opportunity);

  const findings = result.findings;

  const fallback: Record<CategoryKey, string> = {
    website: findings.fetched
      ? "The website foundation is measurable, but there is room to improve conversion."
      : "The site could not be fully inspected, so this category is based on the available signals.",

    localSeo: findings.hasLocationSignal
      ? "The business has some local visibility signals, but the local value proposition could be clearer."
      : "The local market signal is not strong enough to immediately connect nearby buyers with the business.",

    reputation:
      findings.hasReviews || findings.hasTestimonials
        ? "Customer proof is present, but it may not yet be prominent enough to reduce decision friction."
        : "Trust signals are not yet strong enough to give prospects confidence.",

    leadGeneration:
      findings.conversionOpportunities > 0
        ? "There is conversion potential, but the path from visitor to lead could be clearer."
        : "The next step is not obvious enough for a ready-to-buy visitor.",

    offer: findings.hasServiceContent
      ? "The business message is visible, but the value proposition could be easier to understand."
      : "The core offer is not clear enough for someone comparing providers.",

    content:
      findings.h2.length > 0
        ? "The site has content structure, but it could do more to answer buyer questions."
        : "There are limited content signals supporting the research stage of the buying journey.",
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
      "Website friction can prevent visitors from reaching the business.",

    Offer:
      "Prospects may not immediately understand the service outcome or differentiation.",

    Content:
      "Buyers researching the problem may not have enough information to build confidence.",
  };

  return (
    impacts[category] ??
    "This gap can create friction before a prospect becomes a lead."
  );
}

function buildExecutiveSummary(
  name: string,
  result: AuditResult
): string {
  const strongest = Object.entries(result.categories).sort(
    ([, left], [, right]) => right - left
  )[0];

  const biggestOpportunity = result.topOpportunities[0];

  return `${name} has a Growth Score of ${
    result.overallScore
  }/100. The strongest area is ${
    strongest ? strongest[0] : "the current foundation"
  }. The biggest opportunity is ${
    biggestOpportunity?.category ?? "conversion"
  }. The audit identified specific areas where additional growth is possible. The detailed recommendations, priority sequence, and implementation roadmap are available through the Growth Strategy Session.`;
}
