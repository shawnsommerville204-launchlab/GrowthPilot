import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="audit-section audit-page-form">
      <div className="audit-intro">
        <span className="eyebrow">GROWTHPILOT / CONTACT</span>
        <h1>Ready to fix these growth gaps?</h1>
        <p>Share a few details and our team can help scope the next step for your business.</p>
      </div>
      <form className="audit-form" action="mailto:hello@growthpilot.local" method="post" encType="text/plain">
        <div className="form-grid">
          <label>
            Name
            <input type="text" name="name" placeholder="Your name" />
          </label>
          <label>
            Email
            <input type="email" name="email" placeholder="you@yourbusiness.com" />
          </label>
          <label>
            Business
            <input type="text" name="business" placeholder="Business name" />
          </label>
          <label>
            Goal
            <input type="text" name="goal" placeholder="I want help improving my lead generation" />
          </label>
        </div>
        <button className="button button-primary form-submit" type="submit">
          SEND MY GROWTH PLAN <span aria-hidden="true">↗</span>
        </button>
        <p className="form-note">
          <Link href="/" style={{ textDecoration: "underline" }}>Back to homepage</Link>
        </p>
      </form>
    </main>
  );
}
