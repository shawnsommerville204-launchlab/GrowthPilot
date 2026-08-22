import { AuditInput, CategoryScores, WebsiteSignals } from "./types";

export const CATEGORY_WEIGHTS = { website: 0.2, localSeo: 0.2, reputation: 0.15, leadGeneration: 0.2, offer: 0.15, content: 0.1 } as const;

export function scoreAudit(input: AuditInput, signals: WebsiteSignals): { overallScore: number; categories: CategoryScores } {
  if (!signals.fetched) {
    const technicalBaseline = signals.https ? 60 : 50;
    const categories = { website: technicalBaseline, localSeo: 50, reputation: 50, leadGeneration: 50, offer: 50, content: 50 };
    const overallScore = Math.round(Object.entries(CATEGORY_WEIGHTS).reduce((total, [key, weight]) => total + categories[key as keyof CategoryScores] * weight, 0));
    return { overallScore, categories };
  }
  const website = [signals.https, Boolean(signals.title), Boolean(signals.metaDescription), Boolean(signals.h1.length), signals.viewport, signals.hasNavigation, signals.hasServiceContent, signals.hasLocationSignal, trustSignal(signals), signals.hasStrongCTA];
  const localSeo = [signals.hasLocationSignal, signals.hasServiceContent && signals.hasLocationSignal, signals.hasAddress || signals.hasLocationSignal, Boolean(input.city && signals.hasLocationSignal)];
  const reputation = [signals.hasTestimonials, signals.hasReviews, signals.hasGuarantee, signals.hasCertification || signals.hasTrustBadge];
  const leadGeneration = [signals.hasPhone, signals.hasContactForm, signals.hasBookingLink, signals.hasStrongCTA, signals.conversionOpportunities >= 2];
  const offer = [signals.hasServiceContent, signals.hasStrongCTA, Boolean(input.industry && signals.hasServiceContent), signals.hasGuarantee];
  const content = [signals.h1.length > 0, signals.h2.length >= 2, signals.hasServiceContent, signals.hasPortfolio, Boolean(signals.metaDescription)];
  const categories = { website: percent(website), localSeo: percent(localSeo), reputation: percent(reputation), leadGeneration: percent(leadGeneration), offer: percent(offer), content: percent(content) };
  const overallScore = Math.round(Object.entries(CATEGORY_WEIGHTS).reduce((total, [key, weight]) => total + categories[key as keyof CategoryScores] * weight, 0));
  return { overallScore: clamp(overallScore), categories };
}

function trustSignal(signals: WebsiteSignals): boolean { return signals.hasTestimonials || signals.hasReviews || signals.hasGuarantee || signals.hasCertification || signals.hasTrustBadge || signals.hasPortfolio; }
function percent(values: boolean[]): number { return Math.round(values.filter(Boolean).length / values.length * 100); }
function clamp(value: number): number { return Math.max(0, Math.min(100, value)); }
