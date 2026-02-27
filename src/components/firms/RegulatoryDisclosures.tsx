import { Card, CardContent, Badge } from '@/components/ui';

interface FirmDisclosureData {
  // Criminal
  disclosure_firm_felony_charge?: string | null;
  disclosure_firm_felony_conviction?: string | null;
  disclosure_firm_misdemenor_charge?: string | null;
  disclosure_firm_misdemenor_conviction?: string | null;
  // Federal / Regulatory
  disclosure_firm_federal_false_statement?: string | null;
  disclosure_firm_federal_investment_order_10_years?: string | null;
  disclosure_firm_federal_revoke?: string | null;
  disclosure_firm_federal_suspension_restrictions?: string | null;
  disclosure_firm_federal_violations?: string | null;
  disclosure_firm_current_regulatory_proceedings?: string | null;
  disclosure_firm_suspension_revoked?: string | null;
  // SEC / CFTC
  disclosure_firm_sec_cftc_false_statement?: string | null;
  disclosure_firm_sec_cftc_investment_order?: string | null;
  disclosure_firm_sec_cftc_monetary_penalty?: string | null;
  disclosure_firm_sec_cftc_suspension_restrictions?: string | null;
  disclosure_firm_sec_cftc_violations?: string | null;
  // Self-Regulatory (SRO)
  disclosure_firm_self_regulatory_discipline?: string | null;
  disclosure_firm_self_regulatory_false_statement?: string | null;
  disclosure_firm_self_regulatory_suspension_restrictions?: string | null;
  disclosure_firm_self_regulatory_violation?: string | null;
  // Court Actions
  disclosure_firm_court_ruling_dismissal?: string | null;
  disclosure_firm_court_ruling_investment?: string | null;
  disclosure_firm_court_ruling_ongoing_litigation?: string | null;
  disclosure_firm_court_ruling_violation?: string | null;
}

interface DisclosureCategory {
  label: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  items: { key: string; label: string; description: string }[];
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
    label: 'Self-Regulatory Organization (SRO) Actions',
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

const SEVERITY_STYLES = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-800', icon: '🔴' },
  serious: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800', icon: '🟠' },
  moderate: { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
  minor: { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-700', icon: '⚪' },
};

interface RegulatoryDisclosuresProps {
  firmData: FirmDisclosureData;
}

export default function RegulatoryDisclosures({ firmData }: RegulatoryDisclosuresProps) {
  // Check each category for Y values
  const flaggedCategories = CATEGORIES.map(category => {
    const flaggedItems = category.items.filter(item => {
      const val = (firmData as Record<string, string | null | undefined>)[item.key];
      return val === 'Y' || val === 'y';
    });
    return { ...category, flaggedItems };
  }).filter(c => c.flaggedItems.length > 0);

  const totalFlags = flaggedCategories.reduce((sum, c) => sum + c.flaggedItems.length, 0);
  const hasCleanRecord = totalFlags === 0;
  const hasCritical = flaggedCategories.some(c => c.severity === 'critical');
  const hasSerious = flaggedCategories.some(c => c.severity === 'serious');

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Regulatory Disclosures</h2>
          {hasCleanRecord ? (
            <Badge className="bg-green-100 text-green-800">✓ Clean Record</Badge>
          ) : (
            <Badge className={hasCritical ? 'bg-red-100 text-red-800' : hasSerious ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}>
              {totalFlags} disclosure{totalFlags !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {hasCleanRecord ? (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-green-800 font-medium">No regulatory disclosures on file</p>
            <p className="text-green-700 text-sm mt-1">
              This firm has no criminal, regulatory, SEC/CFTC, self-regulatory, or court disclosures
              reported in their SEC filings. This is a positive indicator of regulatory compliance.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-600 text-sm">
              The following disclosures were reported in this firm&apos;s SEC filings. Disclosures don&apos;t
              necessarily mean wrongdoing — some may be routine or resolved — but they warrant review.
            </p>

            {flaggedCategories.map((category) => {
              const styles = SEVERITY_STYLES[category.severity];
              return (
                <div key={category.label} className={`rounded-lg border ${styles.border} ${styles.bg} p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span>{styles.icon}</span>
                    <h3 className="font-semibold text-slate-900 text-sm">{category.label}</h3>
                    <Badge className={`${styles.badge} text-xs`}>
                      {category.flaggedItems.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {category.flaggedItems.map((item) => (
                      <div key={item.key} className="pl-6">
                        <p className="text-sm font-medium text-slate-800">{item.label}</p>
                        <p className="text-sm text-slate-600">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-slate-400 mt-4">
          Source: SEC Form ADV filings. Last updated based on most recent filing.
        </p>
      </CardContent>
    </Card>
  );
}
