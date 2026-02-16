import type { Metadata } from 'next';
import { Button, Card } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing. Choose the plan that fits your needs.',
};

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    description: 'Get started with the basics.',
    features: [
      'Search advisors',
      'View full profiles',
      'Compare up to 2 firms',
      'Save up to 5 firms',
    ],
    cta: 'Get Started',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For serious investors who want more.',
    features: [
      'Everything in Free',
      'Compare up to 4 firms',
      'Unlimited saves',
      'Email alerts for new firms',
      'Export data (CSV & PDF)',
    ],
    cta: 'Start Free Trial',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For firms and institutions.',
    features: [
      'API access',
      'Bulk data exports',
      'Dedicated support',
      'Custom integrations',
    ],
    cta: 'Contact Sales',
    featured: false,
  },
];

const faqs = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, cancel anytime. No long-term contracts or cancellation fees.',
  },
  {
    q: 'Is there a free trial?',
    a: '14-day free trial on Pro. No credit card required to start.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'All major credit cards and PayPal.',
  },
];

export default function PricingPage() {
  return (
    <div className="container-page py-section md:py-section-md lg:py-section-lg">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text-primary">
          Simple, Transparent Pricing
        </h1>
        <p className="mt-3 md:mt-4 text-sm md:text-base lg:text-lg text-text-secondary">
          Choose the plan that fits your needs.
        </p>
      </div>

      {/* Plans */}
      <div className="mt-8 md:mt-12 grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            padding="lg"
            className={`relative flex flex-col ${
              plan.featured
                ? 'border-primary ring-2 ring-primary'
                : ''
            }`}
          >
            {plan.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                Most Popular
              </span>
            )}
            <h2 className="text-base md:text-lg font-semibold text-text-primary">{plan.name}</h2>
            <div className="mt-3 md:mt-4">
              <span className="text-3xl md:text-4xl font-bold text-text-primary">{plan.price}</span>
              {plan.period && (
                <span className="text-text-muted">{plan.period}</span>
              )}
            </div>
            <p className="mt-2 text-xs md:text-sm text-text-secondary">{plan.description}</p>
            <ul className="mt-4 md:mt-6 flex-1 space-y-2 md:space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs md:text-sm text-text-primary">
                  <span className="text-primary">✓</span> {f}
                </li>
              ))}
            </ul>
            <Button
              variant={plan.featured ? 'primary' : 'outline'}
              className="mt-6 md:mt-8 w-full"
            >
              {plan.cta}
            </Button>
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <div className="mt-12 md:mt-20">
        <h2 className="text-center text-xl md:text-2xl font-bold text-text-primary">
          Frequently Asked Questions
        </h2>
        <div className="mx-auto mt-6 md:mt-8 max-w-2xl space-y-4 md:space-y-6">
          {faqs.map((faq) => (
            <div key={faq.q} className="rounded-lg border border-border p-4 md:p-6">
              <h3 className="text-sm md:text-base font-semibold text-text-primary">{faq.q}</h3>
              <p className="mt-2 text-xs md:text-sm text-text-secondary">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
