'use client';

import { useState } from 'react';
import { Card, CardContent, Badge } from '@/components/ui';

interface FirmDisclosureData {
  [key: string]: string | number | null | undefined;
}

interface DisclosureItem {
  key: string;
  label: string;
  description: string;
}

interface DisclosureCategory {
  label: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  items: DisclosureItem[];
}

const CATEGORIES: DisclosureCategory[] = [
  {
    label: 'Criminal History',
    severity: 'critical',
    items: [
      { key: 'disclosure_firm_felony_charge', label: 'Felony Charge', description: 'The firm or a control person has been charged with a felony.' },
      { key: 'disclosure_firm_felony_conviction', label: 'Felony Conviction', description: 'The firm or a control person has been convicted of a felony.' },
      { key: 'disclosure_firm_misdemenor_charge', label: 'Misdemeanor Charge', description: 'The firm or a control person has been charged with an investment-related misdemeanor.' },
      { key: 'disclosure_firm_misdemenor_conviction', label: 'Misdemeanor Conviction', description: 'The firm or a control person has been convicted of an investment-related misdemeanor.' },
    ],
  },
  {
    label: 'Federal & Regulatory Actions',
    severity: 'serious',
    items: [
      { key: 'disclosure_firm_federal_violations', label: 'Federal Violations', description: 'A federal regulatory agency has found the firm in violation of investment-related regulations.' },
      { key: 'disclosure_firm_federal_revoke', label: 'Registration Revoked', description: 'A federal regulatory agency has revoked the firm\'s registration or license.' },
      { key: 'disclosure_firm_federal_suspension_restrictions', label: 'Suspension or Restrictions', description: 'The firm has been suspended or had restrictions placed on its activities by a federal regulator.' },
      { key: 'disclosure_firm_federal_false_statement', label: 'False Statement', description: 'The firm has been found to have made false statements to a federal regulatory agency.' },
      { key: 'disclosure_firm_federal_investment_order_10_years', label: 'Investment Order (10 yr)', description: 'A federal regulator issued an order against the firm related to investment activities in the last 10 years.' },
      { key: 'disclosure_firm_current_regulatory_proceedings', label: 'Current Regulatory Proceedings', description: 'The firm is currently subject to pending regulatory proceedings.' },
      { key: 'disclosure_firm_suspension_revoked', label: 'Suspension / Revocation', description: 'The firm\'s authorization to act as an investment advisor has been suspended or revoked.' },
    ],
  },
  {
    label: 'SEC & CFTC Actions',
    severity: 'serious',
    items: [
      { key: 'disclosure_firm_sec_cftc_violations', label: 'SEC/CFTC Violations', description: 'The SEC or CFTC has found the firm in violation of securities or commodities regulations.' },
      { key: 'disclosure_firm_sec_cftc_monetary_penalty', label: 'Monetary Penalty', description: 'The firm has been ordered to pay a monetary penalty by the SEC or CFTC.' },
      { key: 'disclosure_firm_sec_cftc_suspension_restrictions', label: 'Suspension or Restrictions', description: 'The SEC or CFTC has suspended or restricted the firm\'s activities.' },
      { key: 'disclosure_firm_sec_cftc_false_statement', label: 'False Statement', description: 'The firm has been found to have made false statements to the SEC or CFTC.' },
      { key: 'disclosure_firm_sec_cftc_investment_order', label: 'Investment Order', description: 'The SEC or CFTC has issued an order against the firm related to investment activities.' },
    ],
  },
  {
    label: 'Self-Regulatory Organization (SRO)',
    severity: 'moderate',
    items: [
      { key: 'disclosure_firm_self_regulatory_violation', label: 'SRO Violation', description: 'A self-regulatory organization (e.g. FINRA) has found the firm in violation of its rules.' },
      { key: 'disclosure_firm_self_regulatory_discipline', label: 'SRO Discipline', description: 'The firm has been disciplined by a self-regulatory organization.' },
      { key: 'disclosure_firm_self_regulatory_suspension_restrictions', label: 'SRO Suspension/Restrictions', description: 'A self-regulatory organization has suspended or restricted the firm\'s activities.' },
      { key: 'disclosure_firm_self_regulatory_false_statement', label: 'SRO False Statement', description: 'The firm has been found to have made false statements to a self-regulatory organization.' },
    ],
  },
  {
    label: 'Court Actions',
    severity: 'minor',
    items: [
      { key: 'disclosure_firm_court_ruling_violation', label: 'Court Violation', description: 'A court has found the firm in violation of investment-related statutes or regulations.' },
      { key: 'disclosure_firm_court_ruling_investment', label: 'Investment-Related Ruling', description: 'A court has issued a ruling against the firm related to investment activities.' },
      { key: 'disclosure_firm_court_ruling_ongoing_litigation', label: 'Ongoing Litigation', description: 'The firm is currently involved in investment-related litigation.' },
      { key: 'disclosure_firm_court_ruling_dismissal', label: 'Court Dismissal', description: 'A court case against the firm was dismissed.' },
    ],
  },
];

const SEVERITY_DOT = {
  critical: 'bg-red-500',
  serious: 'bg-orange-400',
  moderate: 'bg-yellow-400',
  minor: 'bg-slate-300',
};

interface RegulatoryDisclosuresProps {
  firmData: FirmDisclosureData;
}

export default function RegulatoryDisclosures({ firmData }: RegulatoryDisclosuresProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const flaggedCategories = CATEGORIES.map(category => {
    const flaggedItems = category.items.filter(item => {
      const val = firmData[item.key];
      return val === 'Y' || val === 'y';
    });
    return { ...category, flaggedItems };
  }).filter(c => c.flaggedItems.length > 0);

  const totalFlags = flaggedCategories.reduce((sum, c) => sum + c.flaggedItems.length, 0);
  const hasCleanRecord = totalFlags === 0;

  const hasCritical = flaggedCategories.some(c => c.severity === 'critical');
  const hasSerious = flaggedCategories.some(c => c.severity === 'serious');
  const cardBg = hasCleanRecord
    ? 'bg-green-50/60 border-green-200'
    : hasCritical
      ? 'bg-red-50/40 border-red-200'
      : hasSerious
        ? 'bg-amber-50/40 border-amber-200'
        : 'bg-yellow-50/40 border-yellow-200';

  return (
    <Card className={cardBg}>
      <CardContent className="px-4 py-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Regulatory Disclosures</h2>
          {hasCleanRecord ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Clean
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              {totalFlags} flagged
            </span>
          )}
        </div>

        {hasCleanRecord ? (
          <p className="text-xs text-slate-400 mt-0.5">No disclosures on file.</p>
        ) : (
          <>
            <p className="text-xs text-slate-400 mt-0.5 mb-2">Click to expand details.</p>

            <div className="divide-y divide-slate-100">
              {flaggedCategories.map((category) => {
                const isExpanded = expandedCategory === category.label;
                const dotColor = SEVERITY_DOT[category.severity];

                return (
                  <div key={category.label}>
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : category.label)}
                      className="w-full flex items-center justify-between py-1.5 text-left hover:bg-slate-50 -mx-2 px-2 rounded transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${dotColor}`} />
                        <span className="text-xs font-medium text-slate-800">{category.label}</span>
                        <span className="text-xs text-slate-400">{category.flaggedItems.length}</span>
                      </div>
                      <svg
                        className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="pb-2 pl-7 space-y-1">
                        {category.flaggedItems.map((item) => (
                          <div key={item.key}>
                            <p className="text-xs font-medium text-slate-700">{item.label}</p>
                            <p className="text-xs text-slate-400 leading-snug">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <p className="text-xs text-slate-300 mt-2">Source: SEC Form ADV</p>
      </CardContent>
    </Card>
  );
}
