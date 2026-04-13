'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

const supabase = createSupabaseBrowserClient();

const NET_WORTH_OPTIONS = [
  'Under $500K',
  '$500K-$1M',
  '$1M-$5M',
  '$5M-$10M',
  '$10M-$25M',
  '$25M-$50M',
  '$50M+',
];

const FEE_PCT_OPTIONS = [
  '0.25%',
  '0.50%',
  '0.75%',
  '1.00%',
  '1.25%',
  '1.50%',
  '2.00%+',
  'Not sure',
];

const SERVICES = [
  'Financial Planning',
  'Tax Strategy',
  'Estate Planning',
  'Retirement',
  'ESG/Impact Investing',
  'Alternative Investments',
  'Trust Services',
  'Insurance',
  'Other',
];

const STEP_META = [
  { title: 'About You', sub: 'Help us personalize your experience.' },
  { title: 'Financial Profile', sub: 'This helps us match you with the right advisors.' },
  { title: 'Fee Preferences', sub: 'Understanding your budget helps us filter results.' },
  { title: 'Services & Goals', sub: 'Select the services you\u2019re looking for.' },
];

const PAGE_CSS = `
  .ob-page {
    --green: #1A7A4A; --green-light: rgba(26,122,74,.08); --green-accent: #2DBD74;
    --navy: #0A1C2A; --ink: #0C1810; --ink-2: #2E4438; --ink-3: #5A7568;
    --rule: #CAD8D0; --white: #F6F8F7; --card-bg: #fff;
    --serif: 'Cormorant Garamond', serif;
    --sans: 'Inter', sans-serif;
    --mono: 'DM Mono', monospace;
    min-height: 100vh; background: var(--white);
  }

  /* ── Navy header strip ───────────────────────────────────────── */
  .ob-header {
    width: 100%; background: var(--navy);
    padding: 36px 24px 28px;
    text-align: center;
  }
  .ob-header-kicker {
    font-family: var(--mono); font-size: 10px; font-weight: 600;
    letter-spacing: .18em; text-transform: uppercase;
    color: var(--green-accent); margin-bottom: 8px;
  }
  .ob-header-title {
    font-family: var(--serif); font-size: 28px; font-weight: 700;
    color: #fff; letter-spacing: -.01em; margin-bottom: 4px;
  }
  .ob-header-sub {
    font-family: var(--sans); font-size: 13px;
    color: rgba(255,255,255,.4);
  }

  /* ── Card shell ──────────────────────────────────────────────── */
  .ob-card {
    width: 100%; max-width: 540px; margin: 32px auto 64px;
    background: var(--card-bg); border: 1px solid var(--rule);
    padding: 36px 32px 32px;
    box-sizing: border-box;
  }

  /* ── Progress bar ────────────────────────────────────────────── */
  .ob-progress { display: flex; gap: 4px; margin-bottom: 28px; }
  .ob-progress-seg {
    flex: 1; height: 3px; border-radius: 2px;
    background: var(--rule); transition: background .2s;
  }
  .ob-progress-seg.done { background: var(--green); }

  /* ── Step indicator ──────────────────────────────────────────── */
  .ob-step-label {
    font-family: var(--mono); font-size: 10px; font-weight: 600;
    letter-spacing: .14em; text-transform: uppercase;
    color: var(--ink-3); margin-bottom: 6px;
  }

  /* ── Step heading ────────────────────────────────────────────── */
  .ob-step-title {
    font-family: var(--serif); font-size: 22px; font-weight: 700;
    color: var(--ink); margin-bottom: 4px;
  }
  .ob-step-sub {
    font-family: var(--sans); font-size: 13px;
    color: var(--ink-3); margin-bottom: 20px;
  }

  /* ── Form fields ─────────────────────────────────────────────── */
  .ob-fields { display: flex; flex-direction: column; gap: 16px; }
  .ob-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .ob-field-label {
    font-family: var(--sans); font-size: 13px; font-weight: 500;
    color: var(--ink); margin-bottom: 6px; display: block;
  }
  .ob-select {
    width: 100%; height: 40px; padding: 0 12px;
    font-family: var(--sans); font-size: 13px; color: var(--ink);
    background: var(--card-bg); border: 1px solid var(--rule);
    border-radius: 0; outline: none; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%235A7568'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center;
    transition: border-color .15s;
  }
  .ob-select:focus { border-color: var(--green); }
  .ob-textarea {
    width: 100%; min-height: 100px; padding: 10px 12px;
    font-family: var(--sans); font-size: 13px; color: var(--ink);
    background: var(--card-bg); border: 1px solid var(--rule);
    border-radius: 0; outline: none; resize: vertical;
    transition: border-color .15s;
  }
  .ob-textarea:focus { border-color: var(--green); }
  .ob-textarea::placeholder { color: var(--ink-3); }

  /* ── Toggle buttons (Yes/No) ─────────────────────────────────── */
  .ob-toggle-row { display: flex; gap: 10px; }
  .ob-toggle {
    padding: 8px 20px; font-family: var(--sans); font-size: 13px;
    font-weight: 500; border: 1px solid var(--rule); background: none;
    color: var(--ink-3); cursor: pointer; transition: all .15s;
  }
  .ob-toggle:hover { border-color: var(--green); color: var(--ink-2); }
  .ob-toggle.on {
    border-color: var(--green); background: var(--green-light);
    color: var(--green); font-weight: 600;
  }

  /* ── Service pills ───────────────────────────────────────────── */
  .ob-services { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .ob-service {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 14px; border: 1px solid var(--rule);
    font-family: var(--sans); font-size: 13px; color: var(--ink-3);
    cursor: pointer; transition: all .15s; user-select: none;
  }
  .ob-service:hover { border-color: var(--green); color: var(--ink-2); }
  .ob-service.on {
    border-color: var(--green); background: var(--green-light);
    color: var(--green);
  }
  .ob-service input[type="checkbox"] { accent-color: var(--green); }

  /* ── Footer buttons ──────────────────────────────────────────── */
  .ob-footer {
    display: flex; justify-content: space-between;
    align-items: center; margin-top: 28px;
    padding-top: 20px; border-top: 1px solid var(--rule);
  }

  /* ── Error ────────────────────────────────────────────────────── */
  .ob-error {
    font-family: var(--sans); font-size: 13px;
    color: #EF4444; margin-top: 16px;
  }

  /* ── Mobile ──────────────────────────────────────────────────── */
  @media (max-width: 640px) {
    .ob-header { padding: 28px 16px 22px; }
    .ob-header-title { font-size: 24px; }
    .ob-card { padding: 28px 20px 24px; margin-top: 24px; }
    .ob-row-2 { grid-template-columns: 1fr; }
    .ob-services { grid-template-columns: 1fr; }
    .ob-step-title { font-size: 20px; }
  }
`;

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showWelcome = searchParams.get('welcome') === '1';
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    location_city: '',
    location_state: '',
    age: '',
    net_worth_range: '',
    occupation: '',
    has_existing_advisor: null as boolean | null,
    max_fee_pct: '',
    max_fee_dollars: '',
    services_wanted: [] as string[],
    financial_context: '',
  });

  const update = (field: string, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const toggleService = (s: string) =>
    setForm((f) => ({
      ...f,
      services_wanted: f.services_wanted.includes(s)
        ? f.services_wanted.filter((x) => x !== s)
        : [...f.services_wanted, s],
    }));

  const canNext = () => true;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be logged in.');
      setSubmitting(false);
      return;
    }

    const { error: dbError } = await supabase.from('user_profiles').upsert({
      user_id: user.id,
      location_city: form.location_city || null,
      location_state: form.location_state || null,
      age: form.age ? parseInt(form.age) : null,
      net_worth_range: form.net_worth_range || null,
      occupation: form.occupation || null,
      has_existing_advisor: form.has_existing_advisor,
      max_fee_pct: form.max_fee_pct || null,
      max_fee_dollars: form.max_fee_dollars || null,
      services_wanted: form.services_wanted.length > 0 ? form.services_wanted : null,
      financial_context: form.financial_context || null,
      onboarding_completed: true,
    }, { onConflict: 'user_id' });

    if (dbError) {
      setError(dbError.message);
      setSubmitting(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  const stepContent = [
    // Step 0: Location & Demographics
    <div key="0" className="ob-fields">
      <div className="ob-row-2">
        <Input
          label="City"
          value={form.location_city}
          onChange={(e) => update('location_city', e.target.value)}
          placeholder="New York"
        />
        <Input
          label="State"
          value={form.location_state}
          onChange={(e) => update('location_state', e.target.value)}
          placeholder="NY"
        />
      </div>
      <Input
        label="Age"
        type="number"
        value={form.age}
        onChange={(e) => update('age', e.target.value)}
        placeholder="35"
      />
      <Input
        label="Occupation"
        value={form.occupation}
        onChange={(e) => update('occupation', e.target.value)}
        placeholder="Software Engineer"
      />
    </div>,

    // Step 1: Financial Info
    <div key="1" className="ob-fields">
      <div>
        <label className="ob-field-label">Estimated Net Worth</label>
        <select
          className="ob-select"
          value={form.net_worth_range}
          onChange={(e) => update('net_worth_range', e.target.value)}
        >
          <option value="">Select range...</option>
          {NET_WORTH_OPTIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="ob-field-label">Do you have an existing advisor?</label>
        <div className="ob-toggle-row">
          <button
            type="button"
            className={`ob-toggle${form.has_existing_advisor === true ? ' on' : ''}`}
            onClick={() => update('has_existing_advisor', true)}
          >
            Yes
          </button>
          <button
            type="button"
            className={`ob-toggle${form.has_existing_advisor === false ? ' on' : ''}`}
            onClick={() => update('has_existing_advisor', false)}
          >
            No
          </button>
        </div>
      </div>
    </div>,

    // Step 2: Fee Preferences
    <div key="2" className="ob-fields">
      <div>
        <label className="ob-field-label">Maximum fee % willing to pay</label>
        <select
          className="ob-select"
          value={form.max_fee_pct}
          onChange={(e) => update('max_fee_pct', e.target.value)}
        >
          <option value="">Select...</option>
          {FEE_PCT_OPTIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
      <Input
        label="Maximum annual fee ($) — optional"
        value={form.max_fee_dollars}
        onChange={(e) => update('max_fee_dollars', e.target.value)}
        placeholder="e.g. 10000"
      />
    </div>,

    // Step 3: Services & Context
    <div key="3" className="ob-fields">
      <div className="ob-services">
        {SERVICES.map((s) => (
          <label
            key={s}
            className={`ob-service${form.services_wanted.includes(s) ? ' on' : ''}`}
          >
            <input
              type="checkbox"
              checked={form.services_wanted.includes(s)}
              onChange={() => toggleService(s)}
            />
            {s}
          </label>
        ))}
      </div>
      <div>
        <label className="ob-field-label">Tell us about your financial situation</label>
        <textarea
          className="ob-textarea"
          value={form.financial_context}
          onChange={(e) => update('financial_context', e.target.value)}
          placeholder="Help us tailor your experience..."
        />
      </div>
    </div>,
  ];

  return (
    <div className="ob-page">
      <style suppressHydrationWarning>{PAGE_CSS}</style>

      {/* Navy header */}
      <div className="ob-header">
        <div className="ob-header-kicker">{showWelcome ? 'Welcome Aboard' : 'Getting Started'}</div>
        <div className="ob-header-title">{showWelcome ? 'One last step' : 'Set up your profile'}</div>
        <div className="ob-header-sub">
          {showWelcome
            ? 'Your plan is active. Takes about 2 minutes · All fields optional'
            : 'Takes about 2 minutes · All fields optional'}
        </div>
      </div>

      {/* Card */}
      <div className="ob-card">
        {/* Progress bar */}
        <div className="ob-progress">
          {stepContent.map((_, i) => (
            <div key={i} className={`ob-progress-seg${i <= step ? ' done' : ''}`} />
          ))}
        </div>

        {/* Step label */}
        <div className="ob-step-label">Step {step + 1} of {stepContent.length}</div>
        <div className="ob-step-title">{STEP_META[step].title}</div>
        <div className="ob-step-sub">{STEP_META[step].sub}</div>

        {/* Step content */}
        {stepContent[step]}

        {/* Error */}
        {error && <div className="ob-error">{error}</div>}

        {/* Footer */}
        <div className="ob-footer">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
          >
            Back
          </Button>
          {step < stepContent.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Complete Setup'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
