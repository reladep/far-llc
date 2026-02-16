import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'FAR helps consumers find the right advisor through data, not marketing.',
};

const steps = [
  {
    num: '1',
    title: 'We Aggregate Public SEC Data',
    desc: 'Every registered investment advisor files Form ADV with the SEC. We collect and structure this data automatically.',
  },
  {
    num: '2',
    title: 'We Verify and Structure It',
    desc: 'Raw filings become clean, comparable profiles with fees, services, credentials, and disclosures.',
  },
  {
    num: '3',
    title: 'You Make Informed Decisions',
    desc: 'Search, compare, and connect with advisors — armed with real data instead of marketing claims.',
  },
];

export default function AboutPage() {
  return (
    <div className="container-page py-16">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">
          Making Financial Advice Transparent
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          FAR helps consumers find the right advisor through data, not marketing.
        </p>
      </div>

      {/* Mission */}
      <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-border p-8 text-center">
        <h2 className="text-xl font-semibold text-text-primary">Our Mission</h2>
        <p className="mt-4 text-text-secondary">
          We believe everyone deserves access to quality financial advice. Our platform
          puts data in your hands — so you can choose an advisor based on facts, not ads.
        </p>
      </div>

      {/* How It Works */}
      <div className="mt-20">
        <h2 className="text-center text-2xl font-bold text-text-primary">
          How It Works
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.num} className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {step.num}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-text-primary">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-text-secondary">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
