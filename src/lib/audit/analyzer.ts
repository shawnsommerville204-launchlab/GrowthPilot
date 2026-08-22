import { AuditInput, WebsiteSignals } from "./types";

const FETCH_TIMEOUT_MS = 10000;

export async function analyzeWebsite(input: AuditInput): Promise<WebsiteSignals> {
  const url = new URL(input.website);
  const base: WebsiteSignals = {
    fetched: false, https: url.protocol === "https:", title: "", metaDescription: "", viewport: false,
    canonical: "", robots: "", h1: [], h2: [], hasNavigation: false, hasServiceContent: false,
    hasLocationSignal: false, hasPhone: false, hasEmail: false, hasContactForm: false, hasBookingLink: false,
    hasStrongCTA: false, conversionOpportunities: 0, hasTestimonials: false, hasReviews: false,
    hasGuarantee: false, hasCertification: false, hasExperienceSignal: false, hasCustomerCount: false,
    hasTrustBadge: false, hasPortfolio: false, hasAddress: false,
  };
  try {
    const response = await fetch(input.website, {
      headers: { "User-Agent": "GrowthPilot-Audit/1.0 (+https://growthpilot-azure.vercel.app)" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "manual",
    });
    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) return { ...base, error: "invalid-response" };
    const html = (await response.text()).slice(0, 2_000_000);
    return extractSignals(html, input, base);
  } catch (error) {
    return { ...base, error: error instanceof DOMException && error.name === "TimeoutError" ? "timeout" : "unreachable" };
  }
}

function extractSignals(html: string, input: AuditInput, base: WebsiteSignals): WebsiteSignals {
  const text = decode(stripTags(html)).replace(/\s+/g, " ").trim();
  const lower = text.toLowerCase();
  const attrText = html.replace(/\s+/g, " ");
  const h1 = matches(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi);
  const h2 = matches(html, /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi);
  const hasPhone = /(?:\+?\d[\d ().-]{7,}\d)/.test(text);
  const hasEmail = /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(text);
  const hasBookingLink = /(book|schedule|appointment|estimate|quote)/i.test(attrText);
  const hasContactForm = /<form\b/i.test(html) && /(contact|quote|estimate|request|form)/i.test(lower);
  const ctaMatches = text.match(/(get a quote|free estimate|contact us|call now|book now|request (?:a )?quote|schedule now|request service)/gi) ?? [];
  const hasServiceContent = /(services?|roofing|hvac|plumbing|landscap|remodel|repair|installation|maintenance)/i.test(lower);
  const hasLocationSignal = [input.city, "service area", "serving", "locations", "areas we serve"].filter(Boolean).some((signal) => lower.includes(signal.toLowerCase()));
  return {
    ...base,
    fetched: true,
    title: first(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i),
    metaDescription: first(html, /<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) || first(html, /<meta\b[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i),
    viewport: /<meta\b[^>]*name=["']viewport["']/i.test(html),
    canonical: first(html, /<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i),
    robots: first(html, /<meta\b[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i),
    h1: h1.map(decode), h2: h2.map(decode),
    hasNavigation: /<nav\b/i.test(html) || /<(?:header|div)\b[^>]*(?:navigation|navbar|menu)/i.test(html),
    hasServiceContent, hasLocationSignal, hasPhone, hasEmail,
    hasContactForm,
    hasBookingLink, hasStrongCTA: ctaMatches.length > 0, conversionOpportunities: [hasPhone && "phone", hasEmail && "email", hasContactForm && "form", hasBookingLink && "booking", ctaMatches.length > 0 && "cta"].filter(Boolean).length,
    hasTestimonials: /(testimonial|what our customers say|happy customers)/i.test(lower), hasReviews: /(reviews?|rated \d|stars?)/i.test(lower),
    hasGuarantee: /(guarantee|warranty)/i.test(lower), hasCertification: /(certified|licensed|accredited|association)/i.test(lower),
    hasExperienceSignal: /(?:\d+|many)\+? years? (?:of )?experience/i.test(lower), hasCustomerCount: /\d+[,.]?\d*\+? customers?/i.test(lower),
    hasTrustBadge: /(trust badge|bbb|award-winning|award winning)/i.test(lower), hasPortfolio: /(portfolio|our work|projects?|gallery)/i.test(lower),
    hasAddress: /\d{1,5}\s+[\w .'-]+,\s*[\w .'-]+,\s*[A-Z]{2}\s+\d{5}/i.test(text),
  };
}

function matches(value: string, pattern: RegExp): string[] { return [...value.matchAll(pattern)].map((match) => decode(stripTags(match[1] ?? "")).trim()).filter(Boolean); }
function first(value: string, pattern: RegExp): string { return decode(stripTags(value.match(pattern)?.[1] ?? "")).trim(); }
function stripTags(value: string): string { return value.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " "); }
function decode(value: string): string { return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">"); }
