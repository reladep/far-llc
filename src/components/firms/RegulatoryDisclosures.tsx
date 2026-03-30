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
  severity: 'critical' | 'serious' | 'moderate';
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
    severity: 'moderate',
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
};

const SEVERITY_LABEL: Record<string, string> = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
};

interface RegulatoryDisclosuresProps {
  firmData: FirmDisclosureData;
  crd?: number;
}

const CSS = `
  .rd-card {
    background:#fff; border:0.5px solid var(--rule); border-radius:9px; overflow:hidden;
  }

  /* ── Summary strip (flagged state) ── */
  .rd-summary {
    display:flex; align-items:center; gap:16px;
    padding:14px 20px; border-bottom:1px solid var(--rule);
    background:rgba(239,68,68,.02);
  }
  .rd-summary-icon {
    width:32px; height:32px; flex-shrink:0;
    border-radius:50%; background:rgba(239,68,68,.08);
    display:grid; place-items:center;
  }
  .rd-summary-title {
    font-family:var(--sans); font-size:13px; font-weight:600; color:var(--ink-2); margin-bottom:3px;
  }
  .rd-summary-detail {
    display:flex; align-items:center; gap:12px; flex-wrap:wrap;
  }
  .rd-summary-sev {
    display:inline-flex; align-items:center; gap:4px;
    font-family:var(--mono); font-size:10px; color:var(--ink-3);
  }
  .rd-summary-sev-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }

  /* ── Clean state ── */
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
  .rd-clean-title { font-family:var(--sans); font-size:13px; font-weight:600; color:var(--ink-2); margin-bottom:3px; }
  .rd-clean-sub { font-family:var(--sans); font-size:13px; color:var(--ink-3); line-height:1.5; }

  /* ── Table rows ── */
  .rd-table { padding:0 20px; }
  .rd-row {
    display:grid; grid-template-columns:1fr auto 28px;
    align-items:center; border-bottom:1px solid var(--rule);
    transition:background .12s; border-radius:0;
  }
  .rd-row:last-child { border-bottom:none; }
  .rd-row.flagged:hover { background:rgba(239,68,68,.02); }
  .rd-cat {
    display:flex; align-items:center; gap:10px; padding:12px 0;
  }
  .rd-dot {
    width:8px; height:8px; border-radius:50%; flex-shrink:0;
  }
  .rd-cat-label { font-family:var(--sans); font-size:13px; color:var(--ink-2); font-weight:500; }
  .rd-cat-count {
    font-family:var(--mono); font-size:10px; font-weight:600; color:#fff;
    background:var(--count-bg, var(--ink-3));
    min-width:16px; height:16px; border-radius:8px;
    display:inline-flex; align-items:center; justify-content:center;
    padding:0 5px; margin-left:6px;
  }
  .rd-status {
    padding:12px 0;
  }
  .rd-chip-none {
    font-family:var(--mono); font-size:10px; color:var(--ink-3);
    letter-spacing:.05em;
  }
  .rd-chevron {
    padding:12px 0; text-align:right;
    font-size:10px; color:var(--ink-3);
    display:flex; align-items:center; justify-content:flex-end;
  }

  /* ── Expanded detail ── */
  .rd-detail {
    grid-column:1/-1;
    border-top:1px solid var(--rule);
    padding:14px 0 14px 18px;
    background:var(--white);
  }
  .rd-detail-item {
    display:flex; align-items:flex-start; gap:8px;
    margin-bottom:10px;
  }
  .rd-detail-item:last-child { margin-bottom:0; }
  .rd-detail-bullet {
    width:4px; height:4px; border-radius:50%; flex-shrink:0; margin-top:6px;
  }
  .rd-detail-label { font-family:var(--sans); font-size:13px; font-weight:600; color:var(--ink-2); margin-bottom:2px; }
  .rd-detail-desc { font-family:var(--sans); font-size:13px; color:var(--ink-3); line-height:1.6; }

  /* ── Footer ── */
  .rd-source {
    display:flex; align-items:center; justify-content:center; gap:6px;
    padding:8px 24px; border-top:0.5px solid var(--rule);
    font-family:var(--mono); font-size:10px; color:var(--ink-3);
  }
  .rd-source a {
    color:var(--green); text-decoration:none;
  }
  .rd-source a:hover { text-decoration:underline; }
`;

export default function RegulatoryDisclosures({ firmData, crd }: RegulatoryDisclosuresProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const categoriesWithFlags = CATEGORIES.map(category => {
    const flaggedItems = category.items.filter(item => {
      const val = firmData[item.key];
      return val === 'Y' || val === 'y';
    });
    return { ...category, flaggedItems };
  });

  const flaggedCategories = categoriesWithFlags.filter(c => c.flaggedItems.length > 0);
  const totalFlags = flaggedCategories.reduce((sum, c) => sum + c.flaggedItems.length, 0);
  const hasCleanRecord = totalFlags === 0;

  // Build severity summary for the strip
  const severityCounts: Record<string, number> = {};
  flaggedCategories.forEach(c => {
    const sev = c.severity;
    severityCounts[sev] = (severityCounts[sev] || 0) + c.flaggedItems.length;
  });

  const iapd = crd ? `https://adviserinfo.sec.gov/firm/summary/${crd}` : null;

  return (
    <div>
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
          <>
            {/* Summary strip */}
            <div className="rd-summary">
              <div className="rd-summary-icon">
                <svg width="14" height="14" fill="none" stroke="#EF4444" strokeWidth="2" viewBox="0 0 14 14">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v3M7 9.5v.5" />
                  <circle cx="7" cy="7" r="6" />
                </svg>
              </div>
              <div>
                <div className="rd-summary-title">
                  {totalFlags} Disclosure{totalFlags !== 1 ? 's' : ''} Across {flaggedCategories.length} Categor{flaggedCategories.length !== 1 ? 'ies' : 'y'}
                </div>
                <div className="rd-summary-detail">
                  {Object.entries(severityCounts).map(([sev, count]) => (
                    <span key={sev} className="rd-summary-sev">
                      <span className="rd-summary-sev-dot" style={{ background: SEVERITY_COLOR[sev] }} />
                      {count} {SEVERITY_LABEL[sev]}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Category rows */}
            <div className="rd-table">
              {categoriesWithFlags.map((category) => {
                const hasFlagged = category.flaggedItems.length > 0;
                const isExpanded = expandedCategory === category.label;
                const dotColor = SEVERITY_COLOR[category.severity] || '#CAD8D0';

                return (
                  <div key={category.label} className={`rd-row ${hasFlagged ? 'flagged' : ''}`}>
                    <button
                      style={{ all: 'unset', display: 'contents', cursor: hasFlagged ? 'pointer' : 'default' }}
                      onClick={() => hasFlagged && setExpandedCategory(isExpanded ? null : category.label)}
                    >
                      <div className="rd-cat">
                        <div className="rd-dot" style={{ background: dotColor }} />
                        <span className="rd-cat-label">{category.label}</span>
                        {hasFlagged && (
                          <span className="rd-cat-count" style={{ '--count-bg': dotColor } as React.CSSProperties}>
                            {category.flaggedItems.length}
                          </span>
                        )}
                      </div>
                      <div className="rd-status">
                        {!hasFlagged && (
                          <span className="rd-chip-none">None found</span>
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

                    {isExpanded && (
                      <div className="rd-detail">
                        {category.flaggedItems.map((item) => (
                          <div key={item.key} className="rd-detail-item">
                            <div className="rd-detail-bullet" style={{ background: dotColor }} />
                            <div>
                              <div className="rd-detail-label">{item.label}</div>
                              <div className="rd-detail-desc">{item.description}</div>
                            </div>
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

        <div className="rd-source">
          <span>Source: SEC Form ADV · Reported by registrant</span>
          {iapd && (
            <>
              <span>·</span>
              <a href={iapd} target="_blank" rel="noopener noreferrer">View on IAPD</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
