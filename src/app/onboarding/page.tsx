'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card } from '@/components/ui';
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

export default function OnboardingPage() {
  const router = useRouter();
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

  const steps = [
    // Step 0: Location & Demographics
    <div key="0" className="space-y-4">
      <h2 className="text-lg font-semibold text-text-primary">About You</h2>
      <p className="text-sm text-text-secondary">Help us personalize your experience.</p>
      <div className="grid grid-cols-2 gap-4">
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
    <div key="1" className="space-y-4">
      <h2 className="text-lg font-semibold text-text-primary">Financial Profile</h2>
      <p className="text-sm text-text-secondary">This helps us match you with the right advisors.</p>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-primary">Estimated Net Worth</label>
        <select
          className="h-10 w-full rounded-lg border border-border bg-bg-primary px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary"
          value={form.net_worth_range}
          onChange={(e) => update('net_worth_range', e.target.value)}
        >
          <option value="">Select range...</option>
          {NET_WORTH_OPTIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-primary">Do you have an existing advisor?</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => update('has_existing_advisor', true)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              form.has_existing_advisor === true
                ? 'border-green-600 bg-green-50 text-green-700'
                : 'border-border text-text-secondary hover:border-green-400'
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => update('has_existing_advisor', false)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              form.has_existing_advisor === false
                ? 'border-green-600 bg-green-50 text-green-700'
                : 'border-border text-text-secondary hover:border-green-400'
            }`}
          >
            No
          </button>
        </div>
      </div>
    </div>,

    // Step 2: Fee Preferences
    <div key="2" className="space-y-4">
      <h2 className="text-lg font-semibold text-text-primary">Fee Preferences</h2>
      <p className="text-sm text-text-secondary">Understanding your budget helps us filter results.</p>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-primary">Maximum fee % willing to pay</label>
        <select
          className="h-10 w-full rounded-lg border border-border bg-bg-primary px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary"
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
    <div key="3" className="space-y-4">
      <h2 className="text-lg font-semibold text-text-primary">Services & Goals</h2>
      <p className="text-sm text-text-secondary">Select the services you&apos;re looking for.</p>
      <div className="grid grid-cols-2 gap-2">
        {SERVICES.map((s) => (
          <label
            key={s}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
              form.services_wanted.includes(s)
                ? 'border-green-600 bg-green-50 text-green-700'
                : 'border-border text-text-secondary hover:border-green-400'
            }`}
          >
            <input
              type="checkbox"
              className="accent-green-600"
              checked={form.services_wanted.includes(s)}
              onChange={() => toggleService(s)}
            />
            {s}
          </label>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-primary">
          Tell us about your financial situation
        </label>
        <textarea
          className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary min-h-[100px]"
          value={form.financial_context}
          onChange={(e) => update('financial_context', e.target.value)}
          placeholder="Help us tailor your experience..."
        />
      </div>
    </div>,
  ];

  const canNext = () => {
    if (step === 0) return true;
    if (step === 1) return true;
    if (step === 2) return true;
    return true;
  };

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
      subscription_status: 'active', // TODO: Wire up Stripe checkout here
    }, { onConflict: 'user_id' });

    if (dbError) {
      setError(dbError.message);
      setSubmitting(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg" padding="lg">
        {/* Progress */}
        <div className="flex gap-1 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-green-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {steps[step]}

        {error && <p className="mt-4 text-sm text-error">{error}</p>}

        <div className="flex justify-between mt-8">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
          >
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Complete Setup'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
