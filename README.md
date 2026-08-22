# GrowthPilot

GrowthPilot is a focused growth audit for local home-service businesses. It turns a few business signals into a practical Growth Score, priority opportunities, and a seven-day action plan.

## MVP

- Premium responsive landing page and audit form
- Server-side website signal analysis with deterministic scoring (no API keys required)
- Growth Score report with category scores and priority actions
- In-memory lead capture abstraction
- Conversion CTAs ready to connect to Stripe or a sales inbox

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

Future Airtable storage can use:

```env
AIRTABLE_PAT=
AIRTABLE_BASE_ID=
AIRTABLE_TABLE_NAME=
```

## Important limitation

Without `OPENAI_API_KEY`, the analyzer fetches the submitted public HTML and scores visible technical, local, trust, conversion, offer, and content signals deterministically. With the key, the app uses an OpenAI model only to interpret those collected findings; it cannot change scores. Website fetches can fail or be partial, and the analyzer does not retrieve Google data, rankings, traffic, or verified business performance.

## Deployment

Push the repository to GitHub and import it into Vercel or Netlify. The default build command is `npm run build`; no secrets are needed for the MVP.

## Roadmap

### V2

Real website crawling, AI analysis, Google Business Profile and review analysis, SEO analysis, email delivery, and Airtable CRM.

### V3

Stripe, user accounts, client dashboard, automated reports, and monthly monitoring.

### V4

Automated content generation, review responses, SEO recommendations, lead follow-up automation, and a white-label agency version.

## Connecting a real AI provider

Set `OPENAI_API_KEY` in the server environment. The provider call is implemented in `src/lib/ai.ts`, keeps the `AuditInput` and `AuditResult` contract, and never exposes the key to the client. Set `OPENAI_MODEL` to another compatible chat-completions model when needed.
