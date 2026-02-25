'use client';

import { Card } from '@/components/ui';

interface FeatureRow {
  name: string;
  free: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
}

const FEATURES: FeatureRow[] = [
  { name: 'Search directory', free: true, pro: true, enterprise: true },
  { name: 'View firm profiles', free: true, pro: true, enterprise: true },
  { name: 'Firm comparisons', free: 'Up to 3', pro: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Advanced filters', free: false, pro: true, enterprise: true },
  { name: 'Saved searches', free: false, pro: true, enterprise: true },
  { name: 'Email alerts', free: false, pro: true, enterprise: true },
  { name: 'Fee breakdowns', free: false, pro: true, enterprise: true },
  { name: 'API access', free: false, pro: false, enterprise: true },
  { name: 'Bulk data exports', free: false, pro: false, enterprise: true },
  { name: 'Custom integrations', free: false, pro: false, enterprise: true },
  { name: 'Dedicated support', free: false, pro: false, enterprise: true },
  { name: 'SLA guarantee', free: false, pro: false, enterprise: true },
];

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="text-sm text-text-primary font-medium">{value}</span>;
  }
  return value ? (
    <span className="text-success text-lg">✓</span>
  ) : (
    <span className="text-text-muted text-lg">—</span>
  );
}

export function PlanComparison() {
  return (
    <Card variant="default" padding="none" className="overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border bg-secondary-50">
            <th className="px-6 py-4 text-sm font-semibold text-text-primary">Feature</th>
            <th className="px-6 py-4 text-sm font-semibold text-text-primary text-center">Free</th>
            <th className="px-6 py-4 text-sm font-semibold text-primary text-center">Pro</th>
            <th className="px-6 py-4 text-sm font-semibold text-text-primary text-center">Enterprise</th>
          </tr>
        </thead>
        <tbody>
          {FEATURES.map((row, i) => (
            <tr
              key={row.name}
              className={i % 2 === 0 ? 'bg-bg-primary' : 'bg-secondary-50/50'}
            >
              <td className="px-6 py-3.5 text-sm text-text-secondary">{row.name}</td>
              <td className="px-6 py-3.5 text-center"><CellValue value={row.free} /></td>
              <td className="px-6 py-3.5 text-center"><CellValue value={row.pro} /></td>
              <td className="px-6 py-3.5 text-center"><CellValue value={row.enterprise} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
