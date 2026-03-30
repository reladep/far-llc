'use client';

import { useState } from 'react';

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
      { key: 'disclosure_firm_federal_revoke', label: 'Registration Revoked', description: "A federal regulatory agency has revoked the firm's registration or license." },
      { key: 'disclosure_firm_federal_suspension_restrictions', label: 'Suspension or Restrictions', description: 'The firm has been suspended or had restrictions placed on its activities by a federal regulator.' },
      { key: 'disclosure_firm_federal_false_statement', label: 'False Statement', description: 'The firm has been found to have made false statements to a federal regulatory agency.' },
      { key: 'disclosure_firm_federal_investment_order_10_years', label: 'Investment Order (10 yr)', description: 'A federal regulator issued an order against the firm related to investment activities in the last 10 years.' },
      { key: 'disclosure_firm_current_regulatory_proceedings', label: 'Current Regulatory Proceedings', description: 'The firm is currently subject to pending regulatory proceedings.' },
      { key: 'disclosure_firm_suspension_revoked', label: 'Suspension / Revocation', description: "The firm's authorization to act as an investment advisor has been suspended or revoked." },
    ],
  },
  {
    label: 'SEC & CFTC Actions',
    severity: 'serious',
    items: [
      { key: 'disclosure_firm_sec_cftc_violations', label: 'SEC/CFTC Violations', description: 'The SEC or CFTC has found the firm in violation of securities or commodities regulations.' },
      { key: 'disclosure_firm_sec_cftc_monetary_penalty', label: 'Monetary Penalty', description: 'The firm has been ordered to pay a monetary penalty by the SEC or CFTC.' },
      { key: 'disclosure_firm_sec_cftc_suspension_restrictions', label: 'Suspension or Restrictions', description: "The SEC or CFTC has suspended or restricted the firm's activities." },
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
      { key: 'disclosure_firm_self_regulatory_suspension_restrictions', label: 'SRO Suspension/Restrictions', description: "A self-regulatory organization has suspended or restricted the firm's activities." },
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

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#EF4444',
  serious: '#F97316',
  moderate: '#F59E0B',
  minor: '#CAD8D0',
};

interface RegulatoryDisclosuresProps {
  firmData: FirmDisclosureData;
}

const CSS = `
  .rd-wrap {
    --green:#1A7A4A; --green-3:#2DBD74; --green-pale:#E6F4ED;
    --white:#F6F8F7; --ink:#0C1810; --ink-2:#2E4438; --ink-3:#5A7568;
    --rule:#CAD8D0; --amber:#F59E0B; --red:#EF4444;
    --serif:'Cormorant Garamond',serif; --sans:'DM Sans',sans-serif; --mono:'DM Mono',monospace;
  }
  .rd-card {
    background:#fff; border:0.5px solid var(--rule); border-radius:9px; overflow:hidden;
  }
  .rd-clean {
    display:flex; align-items:center; gap:16px;
    padding:16px 20px;
    background:rgba(45,189,116,.03);
  }
  .rd-clean-icon {
    width:32px; height:32px; flex-shrink:0;
    border-radius:50%; background:rgba(45,189,116,.12);
    display:grid; place-items:center;
  }
  .rd-clean-title { font-size:13px; font-weight:600; color:var(--ink-2); margin-bottom:3px; font-family:var(--sans); }
  .rd-clean-sub { font-size:13px; color:var(--ink-3); line-height:1.5; font-family:var(--sans); }
  .rd-source {
    display:flex; align-items:center; justify-content:center;
    padding:8px 24px; border-top:0.5px solid var(--rule);
    font-family:var(--mono); font-size:10px; color:var(--ink-3);
  }
  .rd-table { }
  .rd-row {
    display:grid; grid-template-columns:1fr 140px 100px;
    align-items:center; border-bottom:1px solid var(--rule);
  }
  .rd-row:last-child { border-bottom:none; }
  .rd-row-btn {
    all:unset; width:100%; cursor:pointer; display:contents;
  }
  .rd-row-inner {
    display:contents;
  }
  .rd-cat {
    display:flex; align-items:center; gap:10px; padding:14px 0;
  }
  .rd-dot {
    width:8px; height:8px; border-radius:50%; flex-shrink:0;
  }
  .rd-cat-label { font-size:12px; color:var(--ink-2); font-weight:500; }
  .rd-cat-count { font-family:var(--mono); font-size:10px; color:var(--ink-3); margin-left:4px; }
  .rd-status {
    padding:14px 0;
  }
  .rd-chip {
    display:inline-block; font-family:var(--mono); font-size:10px; font-weight:600;
    letter-spacing:.1em; text-transform:uppercase; padding:3px 9px;
    border-radius:2px;
  }
  .rd-chip.none { background:var(--green-pale); color:var(--green); }
  .rd-chip.flag { background:rgba(239,68,68,.08); color:var(--red); }
  .rd-chevron {
    padding:14px 0; text-align:right;
    font-size:10px; color:var(--ink-3); transition:transform .2s;
    display:flex; align-items:center; justify-content:flex-end;
  }
  .rd-detail {
    grid-column:1/-1;
    border-top:1px solid var(--rule);
    padding:14px 0 14px 28px;
    background:var(--white);
  }
  .rd-detail-item { margin-bottom:10px; }
  .rd-detail-item:last-child { margin-bottom:0; }
  .rd-detail-label { font-size:12px; font-weight:600; color:var(--ink-2); margin-bottom:2px; }
  .rd-detail-desc { font-size:11px; color:var(--ink-3); line-height:1.6; }
`;

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

  return (
    <div className="rd-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="rd-card">
      {hasCleanRecord ? (
        <div className="rd-clean">
          <div className="rd-clean-icon">
            <svg width="14" height="14" fill="none" stroke="#2DBD74" strokeWidth="2" viewBox="0 0 14 14">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 7l3 3 6-6" />
            </svg>
          </div>
          <div>
            <div className="rd-clean-title">No disciplinary events on record</div>
            <div className="rd-clean-sub">
              No criminal, regulatory, SEC/CFTC, SRO, or court disclosures found in this firm&apos;s ADV filing.
            </div>
          </div>
        </div>
      ) : (
        <div className="rd-table">
          {CATEGORIES.map((category) => {
            const flagged = flaggedCategories.find(c => c.label === category.label);
            const hasFlagged = !!flagged && flagged.flaggedItems.length > 0;
            const isExpanded = expandedCategory === category.label;
            const dotColor = SEVERITY_COLOR[category.severity] || '#CAD8D0';

            return (
              <div key={category.label} className="rd-row" style={{ flexWrap: 'wrap' }}>
                <button
                  style={{ all: 'unset', display: 'contents', cursor: hasFlagged ? 'pointer' : 'default' }}
                  onClick={() => hasFlagged && setExpandedCategory(isExpanded ? null : category.label)}
                >
                  <div className="rd-cat">
                    <div className="rd-dot" style={{ background: dotColor }} />
                    <span className="rd-cat-label">{category.label}</span>
                    {hasFlagged && (
                      <span className="rd-cat-count">{flagged.flaggedItems.length}</span>
                    )}
                  </div>
                  <div className="rd-status">
                    {hasFlagged ? (
                      <span className="rd-chip flag">Flagged</span>
                    ) : (
                      <span className="rd-chip none">None found</span>
                    )}
                  </div>
                  <div className="rd-chevron">
                    {hasFlagged && (
                      <svg
                        width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5"
                        viewBox="0 0 12 12"
                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }}
                      >
                        <path d="M2 4l4 4 4-4" />
                      </svg>
                    )}
                  </div>
                </button>

                {isExpanded && flagged && (
                  <div className="rd-detail">
                    {flagged.flaggedItems.map((item) => (
                      <div key={item.key} className="rd-detail-item">
                        <div className="rd-detail-label">{item.label}</div>
                        <div className="rd-detail-desc">{item.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="rd-source">Source: SEC Form ADV · Reported by registrant</div>
      </div>
    </div>
  );
}
