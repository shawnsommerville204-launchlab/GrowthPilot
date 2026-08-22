export type AuditInput = {
  businessName: string;
  website: string;
  industry: string;
  city: string;
  email: string;
};

export type WebsiteSignals = {
  fetched: boolean;
  https: boolean;
  title: string;
  metaDescription: string;
  viewport: boolean;
  canonical: string;
  robots: string;
  h1: string[];
  h2: string[];
  hasNavigation: boolean;
  hasServiceContent: boolean;
  hasLocationSignal: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  hasContactForm: boolean;
  hasBookingLink: boolean;
  hasStrongCTA: boolean;
  conversionOpportunities: number;
  hasTestimonials: boolean;
  hasReviews: boolean;
  hasGuarantee: boolean;
  hasCertification: boolean;
  hasExperienceSignal: boolean;
  hasCustomerCount: boolean;
  hasTrustBadge: boolean;
  hasPortfolio: boolean;
  hasAddress: boolean;
  error?: "unreachable" | "timeout" | "invalid-response";
};

export type CategoryKey = "website" | "localSeo" | "reputation" | "leadGeneration" | "offer" | "content";
export type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "GOOD" | "EXCELLENT";

export type CategoryScores = Record<CategoryKey, number>;

export type Opportunity = {
  category: string;
  score: number;
  priority: Priority;
  title: string;
  explanation: string;
  recommendations: string[];
};

export type AuditResult = {
  overallScore: number;
  categories: CategoryScores;
  findings: WebsiteSignals;
  topOpportunities: Opportunity[];
  summary: string;
  insights: string[];
  actionPlan: { title: string; description: string; priority: Priority }[];
  score: number;
  strengths: string[];
  opportunities: string[];
  priority: { category: string; title: string; description: string; impact: "High" | "Medium" | "Low" };
  actions: { title: string; description: string; priority: "High" | "Medium" | "Low" }[];
};
