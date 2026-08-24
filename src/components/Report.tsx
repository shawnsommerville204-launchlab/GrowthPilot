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

  const ringStyle = {
    background: `conic-gradient(var(--cyan) 0 ${
      overallScore * 3.6
    }deg, #dfe7e2 ${overallScore * 3.6}deg 360deg)`,
  } as const;

  const visibleOpportunity = top[0];

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

          <Link href="/" className="back-link">
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
                  "Your audit shows where your digital growth foundation is strongest and where improvement may create the most opportunity."}
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

                  <p>{categoryExplanation(key, result)}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* FIRST FINDING */}
        <section className="report-section opportunity-section">
          <div className="section-header light-label">
            <span>02</span>
            <h2>Your clearest opportunity</h2>
          </div>

          {visibleOpportunity ? (
            <article className="opportunity-card">
              <div className="opportunity-card-top">
                <span>TOP FINDING</span>
                <b>{visibleOpportunity.category}</b>
              </div>

              <h3>{visibleOpportunity.title}</h3>

              <strong>{visibleOpportunity.score} / 100</strong>

              <span className="opportunity-priority">
                {visibleOpportunity.priority}
              </span>

              <p>{visibleOpportunity.explanation}</p>

              <div className="free-finding">
                <span className="eyebrow">WHAT THIS MEANS</span>

                <p>
                  This is one of the areas most likely to deserve attention
                  based on the information available during your audit.
                </p>
              </div>
            </article>
          ) : (
            <article className="opportunity-card">
              <div className="opportunity-card-top">
                <span>TOP FINDING</span>
                <b>GROWTH</b>
              </div>

              <h3>There is room to keep improving your foundation.</h3>

              <p>
                Your audit did not identify one dominant weakness, which means
                the next step is determining where additional growth would have
                the greatest business impact.
              </p>
            </article>
          )}
        </section>

        {/* LOCKED STRATEGY */}
        <section className="report-section strategy-lock">
          <div className="section-header">
            <span>03</span>
            <h2>What your audit did not show you</h2>
          </div>

          <div className="locked-panel">
            <div className="locked-icon">✦</div>

            <span className="eyebrow">DEEPER ANALYSIS AVAILABLE</span>

            <h2>
              We identified additional opportunities worth investigating.
            </h2>

            <p>
              Your free audit gives you the score and the direction. The
              strategy session goes deeper into the findings and turns them
              into a prioritized implementation roadmap.
            </p>

            <div className="locked-grid">
              <div>
                <strong>01</strong>
                <span>Priority opportunity analysis</span>
              </div>

              <div>
                <strong>02</strong>
                <span>What to fix first</span>
              </div>

              <div>
                <strong>03</strong>
                <span>30/60/90-day direction</span>
              </div>

              <div>
                <strong>04</strong>
                <span>Implementation opportunities</span>
              </div>
            </div>

            <Link className="button button-primary" href={checkoutHref}>
              GET MY $99 GROWTH STRATEGY
              <span aria-hidden="true">↗</span>
            </Link>

            <small>
              One-time strategy session · Secure checkout powered by Stripe
            </small>
          </div>
        </section>

        {/* QUICK WINS */}
        <section className="report-section">
          <div className="section-header">
            <span>04</span>
            <h2>Start here</h2>
          </div>

          <div className="quick-win-grid">
            {quickWins(top).map((win) => (
              <div className="quick-win" key={win}>
                <span>✓</span>
                {win}
              </div>
            ))}
          </div>
        </section>

        {/* PAID CTA */}
        <section className="report-cta">
          <span className="eyebrow">YOUR FREE AUDIT IS COMPLETE</span>

          <h2>
            You know where the opportunities are. Now find out what to do about
            them.
          </h2>

          <p>
            Get a focused strategy session built around your audit findings,
            with a practical roadmap for your next growth moves.
          </p>

          <Link className="button button-primary" href={checkoutHref}>
            CONTINUE TO $99 STRATEGY SESSION
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

function categoryExplanation(
  key: CategoryKey,
  result: AuditResult
): string {
  const findings = result.findings;

  const fallback: Record<CategoryKey, string> = {
    website: findings.fetched
      ? "The website is measurable, but there may be opportunities to improve the path from visitor to customer."
      : "The website could not be fully inspected, so this score is based on the available signals.",

    localSeo: findings.hasLocationSignal
      ? "Local signals are present, but there may be opportunities to improve visibility with nearby buyers."
      : "Local market signals are limited, which may make it harder for nearby buyers to discover the business.",

    reputation:
      findings.hasReviews || findings.hasTestimonials
        ? "Customer proof is present, but additional trust signals may help reduce decision friction."
        : "Customer proof appears limited, which can make prospects less confident about choosing the business.",

    leadGeneration:
      findings.conversionOpportunities > 0
        ? "There are conversion opportunities that may affect how easily visitors become leads."
        : "The next step for a ready-to-buy visitor may not be clear enough.",

    offer: findings.hasServiceContent
      ? "The core service is visible, but the value proposition may be clearer and more compelling."
      : "The core offer is not immediately clear enough for a prospect comparing providers.",

    content:
      findings.h2.length > 0
        ? "There is some content structure, but additional buyer-focused content could strengthen the customer journey."
        : "Additional trust-building and educational content could support buyers during the research stage.",
  };

  return fallback[key];
}

function quickWins(
  top: AuditResult["topOpportunities"]
): string[] {
  const recommendations = top.flatMap(
    (opportunity) => opportunity.recommendations ?? []
  );

  const unique = [...new Set(recommendations)];

  if (unique.length > 0) {
    return unique.slice(0, 3);
  }

  return [
    "Make the primary customer action obvious.",
    "Strengthen trust signals throughout the customer journey.",
    "Clarify the value proposition for your highest-value customer.",
  ];
}
