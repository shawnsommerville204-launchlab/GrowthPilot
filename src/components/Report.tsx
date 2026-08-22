"use client";
/* eslint-disable @next/next/no-html-link-for-pages */
import Link from "next/link";
import { useEffect, useState } from "react";
import { AuditResult, CategoryKey, Priority } from "@/lib/analyzer";

const categories: [CategoryKey, string][] = [["website", "Website"], ["localSeo", "Local SEO"], ["reputation", "Reputation"], ["leadGeneration", "Lead Generation"], ["offer", "Offer"], ["content", "Content"]];

type ReportInput = { businessName: string; website?: string; industry?: string; city?: string; email?: string };

type ReportProps = { result: AuditResult; input?: ReportInput; businessName?: string; auditId?: string; createdAt?: string };

export default function Report({ result, input, businessName, auditId, createdAt }: ReportProps) {
  const [shareState, setShareState] = useState("COPY AUDIT URL");
  const name = input?.businessName ?? businessName ?? "Your business";
  const top = result.topOpportunities ?? [];
  const quickWins = [...new Set(top.flatMap((opportunity) => opportunity.recommendations).slice(0, 5))];
  const date = createdAt ? new Date(createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "Today";
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/audit/results/${auditId ?? "preview"}` : `/audit/results/${auditId ?? "preview"}`;
  const overallScore = result.overallScore ?? result.score ?? 0;
  const ringStyle = {
    background: `conic-gradient(var(--cyan) 0 ${overallScore * 3.6}deg, #dfe7e2 ${overallScore * 3.6}deg 360deg)`,
  } as const;
  const actionPlan = buildActionPlan(top, result);

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
        await navigator.share({ title: `${name} Growth Audit`, text: shareText, url: shareUrl });
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
        <a className="brand" href="/">GROWTH<span>PILOT</span></a>
        <div className="report-actions">
          <button className="report-action" type="button" onClick={() => window.print()}>PRINT REPORT</button>
          <button className="report-action" type="button" onClick={shareAudit}>{shareState}</button>
          <Link href="/" className="back-link">New audit <span>↗</span></Link>
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

        <section className="report-section">
          <div className="score-wrap">
            <div className="score-ring" style={ringStyle} aria-label={`${overallScore} out of 100`}>
              <div>
                <strong>{overallScore}</strong>
                <small>/ 100</small>
              </div>
            </div>
            <div className="score-copy">
              <span className="eyebrow">GROWTH SCORE</span>
              <h2>{scoreInterpretation(overallScore)}</h2>
              <p>{result.summary || "The audit indicator shows where growth is being lost and where the next fix should go."}</p>
            </div>
          </div>
        </section>

        <section className="report-section">
          <div className="section-header">
            <span>01</span>
            <h2>Category scorecard</h2>
          </div>
          <div className="category-grid">
            {categories.map(([key, label]) => {
              const score = result.categories[key];
              const opportunity = top.find((item) => normalizeCategory(item.category) === normalizeCategory(label));
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
                  <span className={`category-status status-${statusFor(score).toLowerCase()}`}>
                    {statusFor(score).replace("_", " ")}
                  </span>
                  <p>{categoryExplanation(key, result, opportunity?.explanation)}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="report-section opportunity-section">
          <div className="section-header light-label">
            <span>02</span>
            <h2>Your biggest growth opportunities</h2>
          </div>
          <div className="opportunity-cards">
            {top.length ? (
              top.slice(0, 3).map((opportunity, index) => (
                <article className="opportunity-card" key={`${opportunity.category}-${index}`}>
                  <div className="opportunity-card-top">
                    <span>Opportunity #{index + 1}</span>
                    <b>{opportunity.category}</b>
                  </div>
                  <h3>{opportunity.title}</h3>
                  <strong>{opportunity.score} / 100</strong>
                  <span className="opportunity-priority">{opportunity.priority}</span>
                  <p>{opportunity.explanation}</p>
                  <ul>
                    {opportunity.recommendations.slice(0, 4).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))
            ) : (
              <article className="opportunity-card">
                <div className="opportunity-card-top">
                  <span>Opportunity #1</span>
                  <b>Growth</b>
                </div>
                <h3>Strong base, steady improvements ahead</h3>
                <strong>0 / 100</strong>
                <span className="opportunity-priority">GOOD</span>
                <p>The current audit did not surface significant weaknesses, so the next step is to keep improving the strongest conversion points.</p>
              </article>
            )}
          </div>
        </section>

        <section className="report-section">
          <div className="section-header">
            <span>03</span>
            <h2>Why this matters</h2>
          </div>
          <div className="why-grid">
            {top.slice(0, 3).map((opportunity, index) => (
              <article className="reason-card" key={`${opportunity.category}-impact-${index}`}>
                <span className="eyebrow">{opportunity.category}</span>
                <h3>{opportunity.title}</h3>
                <p>
                  <strong>Finding:</strong> {opportunity.explanation}
                </p>
                <p>
                  <strong>Business impact:</strong> {opportunityImpact(opportunity.category)}
                </p>
                <p>
                  <strong>Recommended fix:</strong> {opportunity.recommendations[0] ?? "Prioritize the first clear action in the opportunity list."}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="report-section">
          <div className="section-header">
            <span>04</span>
            <h2>Quick wins</h2>
          </div>
          <div className="quick-win-grid">
            {quickWins.slice(0, 5).map((win) => (
              <div className="quick-win" key={win}>
                <span>✓</span>
                {win}
              </div>
            ))}
          </div>
        </section>

        <section className="report-section">
          <div className="section-header">
            <span>05</span>
            <h2>Your 30-day growth plan</h2>
          </div>
          <div className="plan-grid">
            {actionPlan.map((item) => (
              <article className="plan-card" key={item.week}>
                <span className="plan-week">{item.week}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="report-section">
          <div className="section-header">
            <span>06</span>
            <h2>Executive summary</h2>
          </div>
          <div className="summary-box">
            <p>{buildExecutiveSummary(name, result)}</p>
          </div>
        </section>

        <section className="report-cta">
          <span className="eyebrow">READY TO FIX THESE PROBLEMS?</span>
          <h2>GrowthPilot can help you turn these findings into actual improvements.</h2>
          <Link className="button button-primary" href="/contact">
            GET MY GROWTH PLAN <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </div>
    </main>
  );
}

function scoreInterpretation(score: number): string {
  return score >= 90 ? "Excellent digital foundation" : score >= 75 ? "Strong foundation with opportunities" : score >= 60 ? "Moderate growth opportunity" : score >= 40 ? "Significant growth opportunities" : "Critical growth gaps";
}

function statusFor(score: number): Priority {
  return score < 40 ? "CRITICAL" : score < 60 ? "HIGH" : score < 75 ? "MEDIUM" : score < 90 ? "GOOD" : "EXCELLENT";
}

function normalizeCategory(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

function categoryExplanation(key: CategoryKey, result: AuditResult, opportunity?: string): string {
  if (opportunity) return opportunity;
  const findings = result.findings;
  const fallback: Record<CategoryKey, string> = {
    website: findings.fetched ? "The page structure is visible and measurable, but the foundation still leaves room for conversion gains." : "The site could not be fully inspected, so this category is based on the visible baseline and missing signals.",
    localSeo: findings.hasLocationSignal ? "The business is partly visible in local context, but the local value proposition is still not fully clear." : "The local market signal is not strong enough to help nearby buyers immediately recognize the business.",
    reputation: findings.hasReviews || findings.hasTestimonials ? "Customer proof is present, but it may not yet be prominent enough to lower decision friction." : "Customer trust signals are not yet strong enough to help prospects feel confident moving forward.",
    leadGeneration: findings.conversionOpportunities > 0 ? "There is some conversion potential, but the path to contact or book still needs to be clearer." : "The next step is not obvious enough for a ready-to-buy visitor.",
    offer: findings.hasServiceContent ? "The business message is somewhat visible, but the value proposition still needs to be easier to understand." : "The core offer is not clear enough for someone comparing providers in the first few seconds.",
    content: findings.h2.length > 0 ? "The site has some content structure, but it is not yet doing enough to answer buyer questions in depth." : "There are not enough trust-building content signals to support the research stage of the buying journey.",
  };
  return fallback[key];
}

function opportunityImpact(category: string): string {
  const impacts: Record<string, string> = {
    "Lead Generation": "Visitors may understand the offer but leave without taking the next step.",
    "Local SEO": "People searching nearby may not recognize this business as a relevant local option.",
    Reputation: "Prospects may hesitate because they do not have enough proof to reduce uncertainty.",
    Website: "A weak website creates friction before the customer ever reaches the business.",
    Offer: "Prospects may not quickly understand the service outcome or why this business is different.",
    Content: "Buyers researching the problem may not trust the business enough to reach out.",
  };
  return impacts[category] ?? "This gap can create friction before a prospect becomes a lead.";
}

function buildActionPlan(top: AuditResult["topOpportunities"], result: AuditResult) {
  const lead = top.find((item) => item.category === "Lead Generation");
  const local = top.find((item) => item.category === "Local SEO");
  const reputation = top.find((item) => item.category === "Reputation");
  const content = top.find((item) => item.category === "Content");

  return [
    {
      week: "WEEK 1",
      title: lead?.title ?? result.actionPlan[0]?.title ?? "Fix the biggest conversion issue",
      description: lead?.recommendations[0] ?? result.actionPlan[0]?.description ?? "Resolve the highest-priority customer friction before anything else.",
    },
    {
      week: "WEEK 2",
      title: local?.title ?? "Improve local visibility",
      description: local?.recommendations[0] ?? "Add city and service-area language where local buyers are searching.",
    },
    {
      week: "WEEK 3",
      title: reputation?.title ?? "Strengthen trust signals",
      description: reputation?.recommendations[0] ?? "Add proof that reduces uncertainty before customers call.",
    },
    {
      week: "WEEK 4",
      title: content?.title ?? "Build growth content",
      description: content?.recommendations[0] ?? "Publish useful answers that support buyers before the first call.",
    },
  ];
}

function buildExecutiveSummary(name: string, result: AuditResult): string {
  const strongest = Object.entries(result.categories).sort(([, left], [, right]) => right - left)[0];
  const biggestOpportunity = result.topOpportunities[0];
  const topThree = result.topOpportunities.slice(0, 3).map((item, index) => `${index + 1}. ${item.title}`);

  return `${name} has a Growth Score of ${result.overallScore}/100.\n\nThe strongest area is ${strongest ? strongest[0] : "the current foundation"}.\nThe biggest opportunity is ${biggestOpportunity?.category ?? "conversion"}.\nThe three highest-priority improvements are:\n${topThree.join("\n")}`;
}
