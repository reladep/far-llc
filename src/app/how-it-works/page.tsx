import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How It Works — Visor Index',
  description:
    'Learn how the Visor Index Score works — six weighted dimensions built entirely from SEC filings to help you evaluate financial advisors.',
  alternates: { canonical: '/how-it-works' },
};

const PILLARS = [
  { label: 'Conflict of Interest Exposure', weight: '22%', desc: 'Measures the degree to which a firm has financial incentives that may not align with client interests — proprietary products, revenue sharing, affiliate relationships, and side-by-side management of fee structures.' },
  { label: 'Regulatory Compliance', weight: '20%', desc: 'Evaluates the firm\'s history of SEC examinations, disclosures, and disciplinary events. Fewer and less severe regulatory issues result in a higher score.' },
  { label: 'Fee Transparency', weight: '18%', desc: 'Assesses how clearly and completely a firm discloses its fee schedule, billing practices, and any additional charges in its ADV filings.' },
  { label: 'AUM Growth Trajectory', weight: '15%', desc: 'Tracks assets under management over time. Sustained organic growth can signal client satisfaction and competitive positioning.' },
  { label: 'Ownership Stability', weight: '13%', desc: 'Examines changes in firm ownership, control persons, and key personnel. Stable ownership tends to correlate with consistent client experience.' },
  { label: 'Client Retention Proxy', weight: '12%', desc: 'Infers retention patterns from changes in client count relative to AUM growth. Firms that grow AUM while maintaining or growing client count score higher.' },
];

const STEPS = [
  { num: '01', title: 'Search', desc: 'Find any SEC-registered investment advisor by name, CRD number, city, or state. No account required.' },
  { num: '02', title: 'Score', desc: 'See the Visor Index Score — a composite of six weighted dimensions built from public SEC filings. No paid placements influence the result.' },
  { num: '03', title: 'Compare', desc: 'Place firms side by side across 45+ data points — fees, conflicts, compliance history, growth, and more.' },
  { num: '04', title: 'Track', desc: 'Subscribe to alerts on any firm. Get notified when fee schedules, AUM, regulatory records, or other material data changes.' },
  { num: '05', title: 'Negotiate', desc: 'Use real fee benchmarks and peer comparisons to negotiate better terms with confidence.' },
  { num: '06', title: 'Decide', desc: 'Make the most informed financial decision of your life — backed by data, not marketing.' },
];

const CSS = `
  .hiw-page {
    --navy: #0A1C2A;
    --green: #1A7A4A;
    --green-2: #22995E;
    --green-3: #2DBD74;
    --green-pale: #E6F4ED;
    --ink: #0C1810;
    --ink-2: #2E4438;
    --ink-3: #5A7568;
    --rule: #CAD8D0;
    --bg: #F6F8F7;
    --serif: 'Cormorant Garamond', Georgia, serif;
    --sans: 'Inter', system-ui, sans-serif;
    --mono: 'DM Mono', 'SF Mono', Menlo, monospace;
    font-family: var(--sans);
    color: var(--ink);
  }

  /* ---- Hero ---- */
  .hiw-hero {
    background: var(--navy);
    padding: 120px 32px 80px;
    text-align: center;
  }
  .hiw-hero-eyebrow {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .2em;
    text-transform: uppercase;
    color: rgba(255,255,255,.35);
    margin-bottom: 16px;
  }
  .hiw-hero-h1 {
    font-family: var(--serif);
    font-size: clamp(32px, 4.5vw, 52px);
    font-weight: 700;
    color: #fff;
    letter-spacing: -.02em;
    line-height: 1.08;
    max-width: 640px;
    margin: 0 auto 16px;
  }
  .hiw-hero-sub {
    font-size: 15px;
    color: rgba(255,255,255,.5);
    max-width: 520px;
    margin: 0 auto;
    line-height: 1.65;
  }

  /* ---- Section ---- */
  .hiw-section {
    max-width: 840px;
    margin: 0 auto;
    padding: 72px 32px;
  }
  .hiw-section + .hiw-section {
    border-top: 1px solid var(--rule);
  }
  .hiw-section-eyebrow {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .2em;
    text-transform: uppercase;
    color: var(--green-3);
    margin-bottom: 12px;
  }
  .hiw-section-h2 {
    font-family: var(--serif);
    font-size: clamp(24px, 3vw, 34px);
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -.02em;
    line-height: 1.12;
    margin-bottom: 12px;
  }
  .hiw-section-sub {
    font-size: 14px;
    color: var(--ink-3);
    line-height: 1.65;
    max-width: 560px;
    margin-bottom: 40px;
  }

  /* ---- Pillars ---- */
  .hiw-pillars {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--rule);
  }
  .hiw-pillar {
    padding: 20px 24px;
    border-bottom: 1px solid var(--rule);
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 16px;
    align-items: start;
  }
  .hiw-pillar:last-child { border-bottom: none; }
  .hiw-pillar-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
  }
  .hiw-pillar-dot {
    width: 7px;
    height: 7px;
    background: var(--green);
    border-radius: 50%;
    flex-shrink: 0;
  }
  .hiw-pillar-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
  }
  .hiw-pillar-desc {
    font-size: 13px;
    color: var(--ink-3);
    line-height: 1.6;
    padding-left: 17px;
  }
  .hiw-pillar-weight {
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 500;
    color: var(--ink-3);
    white-space: nowrap;
    padding-top: 2px;
  }

  /* ---- Steps ---- */
  .hiw-steps {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1px;
    background: var(--rule);
    border: 1px solid var(--rule);
  }
  .hiw-step {
    background: #fff;
    padding: 24px;
  }
  .hiw-step-num {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--green-3);
    margin-bottom: 12px;
  }
  .hiw-step-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 6px;
  }
  .hiw-step-desc {
    font-size: 13px;
    color: var(--ink-3);
    line-height: 1.55;
  }

  /* ---- Data sources ---- */
  .hiw-sources {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .hiw-source {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }
  .hiw-source-label {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--ink-3);
    min-width: 100px;
    flex-shrink: 0;
  }
  .hiw-source-val {
    font-size: 13px;
    color: var(--ink);
  }

  /* ---- CTA ---- */
  .hiw-cta-section {
    background: var(--navy);
    padding: 72px 32px;
    text-align: center;
  }
  .hiw-cta-h2 {
    font-family: var(--serif);
    font-size: clamp(24px, 3vw, 36px);
    font-weight: 700;
    color: #fff;
    letter-spacing: -.02em;
    margin-bottom: 12px;
  }
  .hiw-cta-sub {
    font-size: 14px;
    color: rgba(255,255,255,.5);
    margin-bottom: 28px;
  }
  .hiw-cta-btn {
    display: inline-block;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: .1em;
    text-transform: uppercase;
    background: var(--green);
    color: #fff;
    padding: 14px 32px;
    text-decoration: none;
    font-family: var(--sans);
    transition: background .15s;
  }
  .hiw-cta-btn:hover { background: var(--green-2); }

  /* ---- Responsive ---- */
  @media (max-width: 640px) {
    .hiw-hero { padding: 100px 20px 60px; }
    .hiw-section { padding: 48px 20px; }
    .hiw-steps { grid-template-columns: 1fr; }
    .hiw-pillar { grid-template-columns: 1fr; }
    .hiw-pillar-weight { padding-left: 17px; }
    .hiw-source { flex-direction: column; gap: 2px; }
    .hiw-cta-section { padding: 56px 20px; }
  }
`;

export default function HowItWorksPage() {
  return (
    <div className="hiw-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Hero */}
      <section className="hiw-hero">
        <div className="hiw-hero-eyebrow">How It Works</div>
        <h1 className="hiw-hero-h1">
          Data-driven advisor intelligence, built from public filings
        </h1>
        <p className="hiw-hero-sub">
          The Visor Index Score is a composite metric across six weighted dimensions,
          calculated entirely from SEC filings. No paid placements. No advisory influence.
        </p>
      </section>

      {/* Methodology */}
      <section className="hiw-section">
        <div className="hiw-section-eyebrow">Methodology</div>
        <h2 className="hiw-section-h2">The Visor Index Score</h2>
        <p className="hiw-section-sub">
          Every SEC-registered investment advisor files Form ADV with the SEC.
          We parse these filings, extract 45+ data points per firm, and compute
          a composite score across six dimensions.
        </p>
        <div className="hiw-pillars">
          {PILLARS.map(p => (
            <div key={p.label} className="hiw-pillar">
              <div>
                <div className="hiw-pillar-header">
                  <span className="hiw-pillar-dot" />
                  <span className="hiw-pillar-name">{p.label}</span>
                </div>
                <div className="hiw-pillar-desc">{p.desc}</div>
              </div>
              <div className="hiw-pillar-weight">{p.weight}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="hiw-section">
        <div className="hiw-section-eyebrow">Platform</div>
        <h2 className="hiw-section-h2">Six steps from search to decision</h2>
        <p className="hiw-section-sub">
          Institutional-grade diligence tools, accessible to everyone.
          Everything you need, nothing you don't.
        </p>
        <div className="hiw-steps">
          {STEPS.map(s => (
            <div key={s.num} className="hiw-step">
              <div className="hiw-step-num">{s.num}</div>
              <div className="hiw-step-title">{s.title}</div>
              <div className="hiw-step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Data Sources */}
      <section className="hiw-section">
        <div className="hiw-section-eyebrow">Data</div>
        <h2 className="hiw-section-h2">Where our data comes from</h2>
        <p className="hiw-section-sub">
          All data is sourced from publicly available SEC filings. We do not accept
          payment from advisors, and no firm can influence its score.
        </p>
        <div className="hiw-sources">
          <div className="hiw-source">
            <span className="hiw-source-label">Primary</span>
            <span className="hiw-source-val">SEC EDGAR — Form ADV Parts 1 and 2 (annual and amended filings)</span>
          </div>
          <div className="hiw-source">
            <span className="hiw-source-label">Coverage</span>
            <span className="hiw-source-val">40,000+ SEC-registered investment advisors across all 50 states</span>
          </div>
          <div className="hiw-source">
            <span className="hiw-source-label">Refresh</span>
            <span className="hiw-source-val">Quarterly, aligned with SEC filing deadlines — scores update within 72 hours of new filings</span>
          </div>
          <div className="hiw-source">
            <span className="hiw-source-label">History</span>
            <span className="hiw-source-val">Growth metrics (AUM, clients, employees) tracked over 1, 5, and 10 year windows where available</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="hiw-cta-section">
        <h2 className="hiw-cta-h2">Ready to see the data?</h2>
        <p className="hiw-cta-sub">Search any advisor for free. No account required.</p>
        <Link href="/search" className="hiw-cta-btn">Search Advisors →</Link>
      </section>
    </div>
  );
}
