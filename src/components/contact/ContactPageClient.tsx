'use client';

import { useState } from 'react';

const PAGE_CSS = `
  .ct-hero { background: #0a1c2a; padding: 80px 0 64px; position: relative; overflow: hidden; }
  .ct-hero::before { content: ''; position: absolute; inset: 0; background: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 72px 72px; pointer-events: none; }
  .ct-hero-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; position: relative; }
  .ct-kicker { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .ct-kicker::before, .ct-kicker::after { content: ''; width: 28px; height: 1.5px; background: linear-gradient(90deg, #2DBD74 0%, transparent 100%); }
  .ct-kicker::after { background: linear-gradient(270deg, #2DBD74 0%, transparent 100%); }
  .ct-kicker span { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #2DBD74; }
  .ct-heading { font-family: 'Cormorant Garamond', serif; font-size: clamp(36px, 5vw, 56px); font-weight: 300; color: #fff; line-height: 1.15; margin: 0; }
  .ct-sub { color: rgba(255,255,255,0.5); font-size: 15px; line-height: 1.65; max-width: 520px; margin-top: 16px; }

  .ct-body { max-width: 1200px; margin: 0 auto; padding: 64px 24px 80px; display: grid; grid-template-columns: 1fr 380px; gap: 64px; }

  .ct-form { display: flex; flex-direction: column; gap: 24px; }
  .ct-field { display: flex; flex-direction: column; gap: 6px; }
  .ct-label { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #0a1c2a; }
  .ct-input, .ct-select, .ct-textarea {
    border: 1px solid #CAD8D0; background: #F6F8F7; padding: 12px 14px;
    font-size: 14px; font-family: 'DM Sans', sans-serif; color: #0C1810;
    transition: border-color 0.15s; outline: none; border-radius: 0;
  }
  .ct-input:focus, .ct-select:focus, .ct-textarea:focus { border-color: #2DBD74; }
  .ct-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%235A7568' stroke-width='1.5' fill='none'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }
  .ct-textarea { min-height: 140px; resize: vertical; }
  .ct-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .ct-submit {
    background: #1A7A4A; color: #fff; border: none; padding: 14px 28px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.15s;
    align-self: flex-start;
  }
  .ct-submit:hover { background: #22995E; }
  .ct-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  .ct-trust { font-size: 12px; color: #5A7568; margin-top: -8px; }

  .ct-success {
    background: #F0FDF4; border: 1px solid #BBF7D0; padding: 20px 24px;
    display: flex; align-items: flex-start; gap: 12px;
  }
  .ct-success-icon { width: 20px; height: 20px; background: #1A7A4A; border-radius: 50%; display: grid; place-items: center; flex-shrink: 0; margin-top: 1px; }
  .ct-success-text { font-size: 14px; color: #0C1810; line-height: 1.5; }
  .ct-success-text strong { font-weight: 600; }

  .ct-sidebar { padding-top: 8px; }
  .ct-sidebar-section { margin-bottom: 40px; }
  .ct-sidebar-label { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: #5A7568; margin-bottom: 12px; }
  .ct-email-link { font-size: 15px; color: #1A7A4A; text-decoration: none; font-weight: 500; transition: color 0.15s; }
  .ct-email-link:hover { color: #22995E; }

  .ct-faq { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 20px; }
  .ct-faq-q { font-size: 14px; font-weight: 600; color: #0a1c2a; margin-bottom: 4px; }
  .ct-faq-a { font-size: 13px; color: #5A7568; line-height: 1.55; }

  @media (max-width: 768px) {
    .ct-body { grid-template-columns: 1fr; gap: 48px; }
    .ct-row { grid-template-columns: 1fr; }
    .ct-sidebar { border-top: 1px solid #E5E7EB; padding-top: 40px; }
  }
`;

const SUBJECTS = ['General inquiry', 'Data & methodology', 'Enterprise / API access', 'Press & media', 'Other'];

const FAQ = [
  { q: 'Is Visor Index free?', a: 'Basic search is free. Full profiles, scores, and comparison tools require a subscription.' },
  { q: 'How is advisor data sourced?', a: 'All data comes from public SEC ADV filings. No advisor has ever paid to appear or influence their score.' },
  { q: 'Do you offer enterprise or API access?', a: 'Yes. Reach out via the form and select "Enterprise / API access" as your subject.' },
  { q: 'Can I request a correction?', a: 'Absolutely. If you believe any data is inaccurate, let us know and we\'ll review it promptly.' },
];

export function ContactPageClient() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: SUBJECTS[0], message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate submission — replace with real API call
    await new Promise(r => setTimeout(r, 800));
    setSending(false);
    setSubmitted(true);
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
  };

  return (
    <>
      <style suppressHydrationWarning>{PAGE_CSS}</style>

      {/* Hero */}
      <section className="ct-hero">
        <div className="ct-hero-inner">
          <div className="ct-kicker"><span>Contact</span></div>
          <h1 className="ct-heading">Get in touch.</h1>
          <p className="ct-sub">
            Questions about Visor Index, our data, or enterprise access? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      {/* Body */}
      <div className="ct-body">
        {/* Form */}
        <div>
          {submitted ? (
            <div className="ct-success">
              <div className="ct-success-icon">
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div className="ct-success-text">
                <strong>Message sent.</strong> We typically respond within one business day. Check your inbox at <strong>{form.email}</strong> for our reply.
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
              <p className="ct-trust">We typically respond within one business day.</p>
              <button className="ct-submit" type="submit" disabled={sending}>
                {sending ? 'Sending\u2026' : 'Send message \u2192'}
              </button>
            </form>
          )}
        </div>

        {/* Sidebar */}
        <aside className="ct-sidebar">
          <div className="ct-sidebar-section">
            <div className="ct-sidebar-label">Email us directly</div>
            <a className="ct-email-link" href="mailto:hello@visorindex.com">hello@visorindex.com</a>
          </div>
          <div className="ct-sidebar-section">
            <div className="ct-sidebar-label">Common questions</div>
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
    </>
  );
}
