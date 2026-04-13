import { useState } from 'react'

const SUBJECTS = ['General inquiry', 'Data & methodology', 'Enterprise / API access', 'Press & media', 'Other']

const FAQ = [
  { q: 'Is Visor Index free?', a: 'Basic search is free. Full profiles, scores, and comparison tools require a subscription.' },
  { q: 'How is advisor data sourced?', a: 'All data comes from public SEC ADV filings. No advisor has ever paid to appear or influence their score.' },
  { q: 'Do you offer enterprise or API access?', a: 'Yes. Reach out via the form and select "Enterprise / API access" as your subject.' },
  { q: 'Can I request a correction?', a: 'Absolutely. If you believe any data is inaccurate, let us know and we\'ll review it promptly.' },
]

function App() {
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: SUBJECTS[0], message: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    await new Promise(r => setTimeout(r, 800))
    setSending(false)
    setSubmitted(true)
  }

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#0C1810', minHeight: '100vh', background: '#fff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Hero ── */
        .ct-hero {
          background: #0A1C2A;
          padding: 44px 0 36px;
          position: relative;
        }
        .ct-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 72px 72px;
          pointer-events: none;
        }
        .ct-hero-inner {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 24px;
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
        }
        .ct-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #2DBD74;
          margin-bottom: 8px;
        }
        .ct-heading {
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px;
          font-weight: 300;
          color: #fff;
          line-height: 1.1;
          margin: 0;
        }
        .ct-hero-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          text-align: right;
          line-height: 1.4;
          max-width: 260px;
        }

        /* ── Body ── */
        .ct-body {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 24px 80px;
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 48px;
        }

        /* ── Form Card ── */
        .ct-form-card {
          background: #fff;
          border: 1px solid #CAD8D0;
        }
        .ct-form-header {
          padding: 14px 24px;
          border-bottom: 1px solid #CAD8D0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .ct-form-title {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #5A7568;
        }
        .ct-form-body {
          padding: 24px;
        }

        .ct-form { display: flex; flex-direction: column; gap: 20px; }
        .ct-field { display: flex; flex-direction: column; gap: 5px; }
        .ct-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #5A7568;
          font-family: 'Inter', sans-serif;
        }
        .ct-input, .ct-select, .ct-textarea {
          border: 1px solid #CAD8D0;
          background: #F6F8F7;
          padding: 10px 12px;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          color: #0C1810;
          transition: border-color 0.15s;
          outline: none;
          border-radius: 0;
        }
        .ct-input::placeholder, .ct-textarea::placeholder {
          color: #CAD8D0;
        }
        .ct-input:focus, .ct-select:focus, .ct-textarea:focus {
          border-color: #1A7A4A;
        }
        .ct-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%235A7568' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
        }
        .ct-textarea {
          min-height: 120px;
          resize: vertical;
        }
        .ct-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .ct-trust {
          font-size: 11px;
          color: #5A7568;
          margin: -4px 0 0;
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.02em;
        }

        .ct-submit {
          background: #1A7A4A;
          color: #fff;
          border: none;
          padding: 12px 24px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: background 0.15s;
          align-self: flex-start;
          border-radius: 0;
        }
        .ct-submit:hover { background: #22995E; }
        .ct-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Success ── */
        .ct-success {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 4px 0;
        }
        .ct-success-icon {
          width: 20px;
          height: 20px;
          background: #1A7A4A;
          border-radius: 50%;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .ct-success-text {
          font-size: 13px;
          color: #0C1810;
          line-height: 1.55;
        }
        .ct-success-text strong { font-weight: 600; }

        /* ── Sidebar ── */
        .ct-sidebar { padding-top: 0; }
        .ct-sidebar-section { margin-bottom: 32px; }
        .ct-sidebar-label {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #5A7568;
          margin-bottom: 10px;
        }
        .ct-email-link {
          font-size: 14px;
          color: #1A7A4A;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
        }
        .ct-email-link:hover { color: #2DBD74; }

        .ct-faq {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .ct-faq li {
          padding: 14px 0;
          border-bottom: 1px solid #CAD8D0;
        }
        .ct-faq li:first-child { padding-top: 0; }
        .ct-faq li:last-child { border-bottom: none; padding-bottom: 0; }
        .ct-faq-q {
          font-size: 13px;
          font-weight: 600;
          color: #0A1C2A;
          margin-bottom: 3px;
        }
        .ct-faq-a {
          font-size: 12px;
          color: #5A7568;
          line-height: 1.5;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .ct-hero-inner { flex-direction: column; align-items: flex-start; }
          .ct-hero-sub { text-align: left; max-width: none; }
          .ct-body { grid-template-columns: 1fr; gap: 40px; }
          .ct-row { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Hero */}
      <section className="ct-hero">
        <div className="ct-hero-inner">
          <div>
            <div className="ct-eyebrow">Contact</div>
            <h1 className="ct-heading">Get in touch.</h1>
          </div>
          <div className="ct-hero-sub">
            Questions about our data, methodology, or enterprise access.
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="ct-body">
        {/* Form */}
        <div className="ct-form-card">
          <div className="ct-form-header">
            <span className="ct-form-title">Send a Message</span>
          </div>
          <div className="ct-form-body">
            {submitted ? (
              <div className="ct-success">
                <div className="ct-success-icon">
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5L4.5 8.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="ct-success-text">
                  <strong>Message sent.</strong> We typically respond within one business day.
                  Check your inbox at <strong>{form.email}</strong> for our reply.
                </div>
              </div>
            ) : (
              <form className="ct-form" onSubmit={handleSubmit}>
                <div className="ct-row">
                  <div className="ct-field">
                    <label className="ct-label">Name</label>
                    <input className="ct-input" type="text" placeholder="Your name" required value={form.name} onChange={update('name')} />
                  </div>
                  <div className="ct-field">
                    <label className="ct-label">Email</label>
                    <input className="ct-input" type="email" placeholder="you@example.com" required value={form.email} onChange={update('email')} />
                  </div>
                </div>
                <div className="ct-field">
                  <label className="ct-label">Subject</label>
                  <select className="ct-select" value={form.subject} onChange={update('subject')}>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="ct-field">
                  <label className="ct-label">Message</label>
                  <textarea className="ct-textarea" placeholder="How can we help?" required value={form.message} onChange={update('message')} />
                </div>
                <div className="ct-trust">We typically respond within one business day.</div>
                <button className="ct-submit" type="submit" disabled={sending}>
                  {sending ? 'Sending…' : 'Send message →'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="ct-sidebar">
          <div className="ct-sidebar-section">
            <div className="ct-sidebar-label">Email us directly</div>
            <a className="ct-email-link" href="mailto:hello@visorindex.com">hello@visorindex.com</a>
          </div>
          <div className="ct-sidebar-section">
            <div className="ct-sidebar-label">Common Questions</div>
            <ul className="ct-faq">
              {FAQ.map(({ q, a }) => (
                <li key={q}>
                  <div className="ct-faq-q">{q}</div>
                  <div className="ct-faq-a">{a}</div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default App
