'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';

interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

const PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Get started with basic search and comparison tools.',
    features: [
      'Search advisor directory',
      'View firm profiles',
      'Compare up to 3 firms',
      'Basic filters',
    ],
    cta: 'Get Started',
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 19,
    yearlyPrice: 182, // ~20% discount
    description: 'Unlock everything for serious advisor research.',
    features: [
      'Everything in Free',
      'Unlimited comparisons',
      'Advanced filters & sorting',
      'Save searches & set alerts',
      'Detailed fee breakdowns',
      'Priority support',
    ],
    cta: 'Start Pro Trial',
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: -1, // custom
    yearlyPrice: -1,
    description: 'For institutions and platforms needing API access.',
    features: [
      'Everything in Pro',
      'API access',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantees',
      'Bulk data exports',
    ],
    cta: 'Contact Sales',
  },
];

export function PricingCalculator() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div>
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <span
          className={`text-sm font-medium ${billing === 'monthly' ? 'text-text-primary' : 'text-text-muted'}`}
        >
          Monthly
        </span>
        <button
          type="button"
          onClick={() => setBilling((b) => (b === 'monthly' ? 'annual' : 'monthly'))}
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
            billing === 'annual' ? 'bg-primary' : 'bg-secondary-300'
          }`}
          role="switch"
          aria-checked={billing === 'annual'}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
              billing === 'annual' ? 'translate-x-5.5' : 'translate-x-0.5'
            } mt-0.5`}
          />
        </button>
        <span
          className={`text-sm font-medium ${billing === 'annual' ? 'text-text-primary' : 'text-text-muted'}`}
        >
          Annual{' '}
          <span className="text-xs text-success font-semibold">Save 20%</span>
        </span>
      </div>

      {/* Plan cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const price =
            plan.monthlyPrice === -1
              ? null
              : billing === 'annual'
                ? plan.yearlyPrice / 12
                : plan.monthlyPrice;

          return (
            <Card
              key={plan.id}
              variant={plan.highlighted ? 'elevated' : 'default'}
              padding="lg"
              className={plan.highlighted ? 'ring-2 ring-primary' : ''}
            >
              {plan.highlighted && (
                <span className="inline-block mb-3 text-xs font-semibold text-primary bg-primary-50 px-2.5 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold text-text-primary">{plan.name}</h3>
              <p className="mt-1 text-sm text-text-secondary">{plan.description}</p>

              <div className="mt-4">
                {price !== null ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-text-primary">
                      {formatCurrency(price)}
                    </span>
                    <span className="text-sm text-text-muted">/mo</span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-text-primary">Custom</span>
                )}
                {billing === 'annual' && price !== null && price > 0 && (
                  <p className="text-xs text-text-muted mt-1">
                    Billed {formatCurrency(plan.yearlyPrice)}/year
                  </p>
                )}
              </div>

              <Button
                variant={plan.highlighted ? 'primary' : 'outline'}
                className="w-full mt-6"
              >
                {plan.cta}
              </Button>

              <ul className="mt-6 flex flex-col gap-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-success mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
