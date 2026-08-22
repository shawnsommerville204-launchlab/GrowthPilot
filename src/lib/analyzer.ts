export type AuditInput = {
  businessName: string;
  website: string;
  industry?: string;
  city?: string;
  email?: string;
};

export type AuditResult = {
  score: number;
  categories: { website: number; localSeo: number; reviews: number; leadGeneration: number; content: number; offer: number };
  strengths: string[];
  opportunities: string[];
  priority: { category: string; title: string; description: string; impact: "High" | "Medium" | "Low" };
  actions: { title: string; description: string; priority: "High" | "Medium" | "Low" }[];
};

export function analyzeBusiness(input: AuditInput): AuditResult {
  const url = input.website.toLowerCase();
  const secure = url.startsWith("https://");
  const hasLocalContext = Boolean(input.city && input.industry);
  const categories = {
    website: clamp(54 + (secure ? 12 : 0) + (input.website.length < 42 ? 7 : 0)),
    localSeo: clamp(46 + (hasLocalContext ? 14 : 0) + (input.city ? 5 : 0)),
    reviews: clamp(63 + (input.businessName.length % 12)),
    leadGeneration: clamp(43 + (input.email ? 8 : 0) + (input.industry ? 5 : 0)),
    content: clamp(49 + (input.industry ? 8 : 0) + (input.businessName.length % 8)),
    offer: clamp(57 + (input.businessName.length % 15) + (input.industry ? 5 : 0)),
  };
  const score = Math.round(Object.values(categories).reduce((sum, value) => sum + value, 0) / 6);
  const entries = Object.entries(categories).sort(([, first], [, second]) => first - second);
  const weakest = entries[0][0];
  const labels: Record<string, string> = { website: "Website", localSeo: "Local SEO", reviews: "Reviews", leadGeneration: "Lead Generation", content: "Content", offer: "Offer" };
  const priorityCopy: Record<string, [string, string]> = {
    leadGeneration: ["Make the next step impossible to miss", "Add one clear quote or booking path to every high-intent page so interested visitors know exactly how to reach you."],
    localSeo: ["Own your local search moment", "Build out service and city pages, then keep your business profile complete and active."],
    website: ["Turn visits into conversations", "Sharpen the homepage message and place a strong estimate CTA above the fold."],
    content: ["Show the work before people ask", "Publish useful project answers and proof that demonstrate your expertise in the moments customers are researching."],
    offer: ["Make your best offer clearer", "Lead with the service, outcome, and reason to choose you in plain language."],
    reviews: ["Create a reliable review rhythm", "Ask happy customers for feedback at the right moment and feature specific proof near your calls to action."],
  };
  const [title, description] = priorityCopy[weakest];
  return {
    score,
    categories,
    strengths: [secure ? "Secure website foundation" : "A clear starting point to improve", input.industry ? `Focused ${input.industry.toLowerCase()} positioning` : "Room to sharpen service positioning", input.city ? `Strong local-market opportunity in ${input.city}` : "Local visibility opportunity"],
    opportunities: ["Improve homepage CTA|Give visitors a direct next step such as Request a Free Estimate.", "Add local service proof|Use project examples, service areas, and customer language to build confidence.", "Create a review request system|Make it easy for satisfied customers to share specific feedback.", "Build one high-intent service page|Answer the questions customers ask right before they call."],
    priority: { category: labels[weakest], title, description, impact: "High" },
    actions: [
      { title: "Rewrite the homepage headline", description: "State who you help, what you do, and the outcome in one crisp sentence.", priority: "High" },
      { title: "Add a quote CTA", description: "Make requesting an estimate available from every important page.", priority: "High" },
      { title: "Optimize your business profile", description: "Confirm services, service areas, hours, photos, and a steady review ask.", priority: "Medium" },
      { title: "Publish a local service page", description: "Create one useful page for your highest-value service and market.", priority: "Medium" },
      { title: "Review the lead funnel", description: "Test every form, phone link, and follow-up step as a new customer.", priority: "Low" },
    ],
  };
}

function clamp(value: number) { return Math.max(0, Math.min(100, value)); }
