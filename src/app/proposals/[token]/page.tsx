import Link from "next/link";
import { leadService } from "@/lib/crm/service";
import { getOffer } from "@/lib/offers";
import { verifyProposalToken } from "@/lib/proposal-tokens";

export default async function ProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const leadId = verifyProposalToken(token);
  const lead = leadId ? await leadService.getLead(leadId) : undefined;
  if (!lead) return <main className="legal-page"><div className="legal-shell"><h1>Proposal unavailable</h1><p>This proposal link is invalid or expired.</p><Link href="/" className="button button-primary">Back to GrowthPilot</Link></div></main>;
  const offer = getOffer("strategy-session")!;
  return <main className="proposal-page"><div className="proposal-shell"><header className="proposal-header"><span className="eyebrow">GROWTHPILOT</span><span>GROWTH OPPORTUNITY ASSESSMENT</span></header><section className="proposal-intro"><span className="eyebrow">PREPARED FOR</span><h1>{lead.businessName}</h1><p>{lead.city} · {lead.industry}</p></section><section className="proposal-section"><h2>What we found</h2><p>{lead.aiAnalysis?.executiveSummary ?? lead.auditResults.summary}</p><div className="proposal-score"><strong>{lead.overallScore}</strong><span>/ 100 Growth Score</span></div></section><section className="proposal-section"><h2>Top opportunities</h2>{(lead.aiAnalysis?.opportunities ?? []).slice(0, 3).map((item) => <article className="proposal-opportunity" key={item.title}><strong>{item.title}</strong><span>{item.priority}</span><p>{item.recommendation}</p></article>)}</section><section className="proposal-section"><h2>Recommended solution</h2><p>We recommend beginning with a focused strategy session to turn the assessment into an implementation sequence tailored to the opportunities above.</p><ul>{offer.includes.map((item) => <li key={item}>{item}</li>)}</ul></section><section className="proposal-investment"><span className="eyebrow">INVESTMENT</span><strong>{offer.priceLabel}</strong><p>Intended outcome: a clearer set of decisions and next actions. Results are not guaranteed.</p><Link href="/checkout/strategy" className="button button-primary">GET STARTED <span>↗</span></Link></section><footer className="proposal-footer"><span>GrowthPilot</span><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></footer></div></main>;
}