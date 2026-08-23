# GrowthPilot

GrowthPilot is a focused growth audit for local home-service businesses. It turns a few business signals into a practical Growth Score, priority opportunities, and a seven-day action plan.

## MVP

- Premium responsive landing page and audit form
- Server-side website signal analysis with deterministic scoring (no API keys required)
- Growth Score report with category scores and priority actions
- Post-audit lead capture with server-side validation and durable local JSON persistence
- Structured AI diagnosis, action plan, service mapping, and CRM analysis persistence
- Configurable offers, Stripe-hosted strategy checkout, customer-facing proposals, and trust pages

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Stack

Next.js App Router, React, TypeScript, and CSS. The app is deployable to Vercel or Netlify without a custom server.

## Environment variables

The app works without variables and uses the deterministic analyzer. To enable the AI provider, add an OpenAI API key on the server:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Optional Airtable storage configuration is reserved for deployments that connect the CRM adapter:

```env
AIRTABLE_PAT=
AIRTABLE_BASE_ID=
AIRTABLE_TABLE_NAME=Leads
NEXT_PUBLIC_BOOKING_URL=
NEXT_PUBLIC_APP_URL=https://your-domain.com
STRIPE_SECRET_KEY=
STRIPE_PRICE_STRATEGY_SESSION=
STRIPE_WEBHOOK_SECRET=
```

## Lead storage note

Without Airtable credentials, the server stores leads in `data/leads.json` for local development. That directory is git-ignored. Production deployments should provide a shared persistence provider before running multiple instances.

The strategy checkout uses Stripe Checkout through `POST /api/checkout`. Create a Stripe Price for the $99 strategy session and set its ID in `STRIPE_PRICE_STRATEGY_SESSION`. The checkout route never trusts a browser redirect as payment confirmation; connect `STRIPE_WEBHOOK_SECRET` to a webhook handler before using paid status or fulfillment automation. Operators can create a printable proposal at `/proposals/[leadId]`.

## Important limitation

Without `OPENAI_API_KEY`, the analyzer fetches the submitted public HTML and scores visible technical, local, trust, conversion, offer, and content signals deterministically. With the key, the app uses an OpenAI model only to interpret those collected findings; it cannot change scores. Website fetches can fail or be partial, and the analyzer does not retrieve Google data, rankings, traffic, or verified business performance.

## Deployment

Push the repository to GitHub and import it into Vercel or Netlify. The default build command is `npm run build`; no secrets are needed for the MVP.

## Roadmap

### V2

Real website crawling, AI analysis, Google Business Profile and review analysis, SEO analysis, email delivery, and Airtable CRM.

### V3

User accounts, client dashboard, automated reports, Stripe webhooks, and monthly monitoring.

### V4

Automated content generation, review responses, SEO recommendations, lead follow-up automation, and a white-label agency version.

## Connecting a real AI provider

Set `OPENAI_API_KEY` in the server environment. The provider call is implemented in `src/lib/ai.ts`, keeps the `AuditInput` and `AuditResult` contract, and never exposes the key to the client. Set `OPENAI_MODEL` to another compatible chat-completions model when needed.
