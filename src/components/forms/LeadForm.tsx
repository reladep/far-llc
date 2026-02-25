'use client';

import { useLeadForm } from '@/hooks/useLeadForm';
import { Button, Input } from '@/components/ui';

const INVESTMENT_RANGES = [
  'Under $100K',
  '$100K – $500K',
  '$500K – $1M',
  '$1M – $5M',
  '$5M+',
];

const TIMELINES = [
  'Immediately',
  'Within 3 months',
  'Within 6 months',
  'Within 1 year',
  'Just exploring',
];

interface LeadFormProps {
  firmCrd: number;
  firmName: string;
  onClose?: () => void;
}

export function LeadForm({ firmCrd, firmName, onClose }: LeadFormProps) {
  const form = useLeadForm(firmCrd);

  if (form.status === 'success') {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-success-100 flex items-center justify-center text-success text-xl">
          ✓
        </div>
        <h3 className="text-lg font-semibold text-text-primary">Request Sent!</h3>
        <p className="mt-2 text-sm text-text-secondary">
          {firmName} will receive your inquiry and get back to you soon.
        </p>
        <Button variant="outline" className="mt-6" onClick={onClose ?? form.reset}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-text-primary">
          Contact {firmName}
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Step {form.step} of 3
        </p>
        {/* Progress bar */}
        <div className="mt-3 flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= form.step ? 'bg-primary' : 'bg-secondary-200'
              }`}
            />
          ))}
        </div>
      </div>

      {form.step === 1 && (
        <div className="flex flex-col gap-4">
          <Input
            label="Full Name *"
            value={form.data.contact.name}
            onChange={(e) => form.updateContact('name', e.target.value)}
            error={form.errors.name}
            placeholder="John Doe"
          />
          <Input
            label="Email *"
            type="email"
            value={form.data.contact.email}
            onChange={(e) => form.updateContact('email', e.target.value)}
            error={form.errors.email}
            placeholder="john@example.com"
          />
          <Input
            label="Phone"
            type="tel"
            value={form.data.contact.phone}
            onChange={(e) => form.updateContact('phone', e.target.value)}
            error={form.errors.phone}
            placeholder="(555) 123-4567"
          />
        </div>
      )}

      {form.step === 2 && (
        <div className="flex flex-col gap-4">
          <SelectField
            label="Estimated Investment Amount *"
            options={INVESTMENT_RANGES}
            value={form.data.needs.investmentAmount}
            onChange={(v) => form.updateNeeds('investmentAmount', v)}
            error={form.errors.investmentAmount}
          />
          <SelectField
            label="Timeline *"
            options={TIMELINES}
            value={form.data.needs.timeline}
            onChange={(v) => form.updateNeeds('timeline', v)}
            error={form.errors.timeline}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">
              Do you currently work with a financial advisor? *
            </label>
            <div className="flex gap-3">
              {(['yes', 'no'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => form.updateNeeds('hasCurrentAdvisor', opt)}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    form.data.needs.hasCurrentAdvisor === opt
                      ? 'border-primary bg-primary-50 text-primary'
                      : 'border-border text-text-secondary hover:bg-secondary-50'
                  }`}
                >
                  {opt === 'yes' ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
            {form.errors.hasCurrentAdvisor && (
              <p className="text-xs text-error">{form.errors.hasCurrentAdvisor}</p>
            )}
          </div>
        </div>
      )}

      {form.step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">
              Message (optional)
            </label>
            <textarea
              value={form.data.message}
              onChange={(e) => form.updateMessage(e.target.value)}
              placeholder="Tell the advisor about your financial goals..."
              rows={4}
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary resize-none"
            />
          </div>
        </div>
      )}

      {form.status === 'error' && (
        <p className="mt-4 text-sm text-error">
          Something went wrong. Please try again.
        </p>
      )}

      <div className="mt-6 flex justify-between gap-3">
        {form.step > 1 ? (
          <Button variant="outline" onClick={form.prevStep}>
            Back
          </Button>
        ) : (
          <div />
        )}
        {form.step < 3 ? (
          <Button onClick={form.nextStep}>Continue</Button>
        ) : (
          <Button
            onClick={form.submit}
            disabled={form.status === 'submitting'}
          >
            {form.status === 'submitting' ? 'Sending...' : 'Send Request'}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Internal select component ── */
function SelectField({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text-primary">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-10 w-full rounded-lg border bg-bg-primary px-3 text-sm text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary ${
          error ? 'border-error' : 'border-border'
        }`}
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
