'use client';

import Link from 'next/link';
import '@/components/dashboard/dashboard.css';

interface SettingsPanelProps {
  email: string;
  createdAt: string;
  profile: {
    location_city: string | null;
    location_state: string | null;
    age: number | null;
    net_worth_range: string | null;
    occupation: string | null;
    has_existing_advisor: boolean | null;
    max_fee_pct: string | null;
    services_wanted: string[] | null;
    onboarding_completed: boolean | null;
  } | null;
  alertPrefs: {
    digest_frequency: string | null;
    digest_hour: number | null;
  } | null;
}

const CSS = `
  .sp-section {
    background: #fff;
    border: 1px solid var(--rule);
    margin-bottom: 20px;
  }
  .sp-section-header {
    padding: 14px 20px;
    border-bottom: 1px solid var(--rule);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .sp-section-title {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .sp-section-body {
    padding: 0;
  }
  .sp-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 13px 20px;
    border-bottom: 1px solid var(--rule);
    gap: 12px;
  }
  .sp-row:last-child { border-bottom: none; }
  .sp-row-label {
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 500;
    color: var(--ink-3);
    letter-spacing: .04em;
    min-width: 140px;
    flex-shrink: 0;
  }
  .sp-row-value {
    font-family: var(--sans);
    font-size: 13px;
    color: var(--ink);
    text-align: right;
  }
  .sp-row-value.muted {
    color: var(--rule);
  }
  .sp-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: flex-end;
  }
  .sp-tag {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: .04em;
    padding: 2px 8px;
    background: var(--white);
    border: 1px solid var(--rule);
    color: var(--ink-3);
  }
  .sp-link {
    font-family: var(--sans);
    font-size: 11px;
    font-weight: 500;
    color: var(--ink-3);
    text-decoration: none;
    transition: color .12s;
  }
  .sp-link:hover { color: var(--green); }

  .sp-danger {
    background: #fff;
    border: 1px solid var(--rule);
    padding: 20px;
    margin-top: 48px;
  }
  .sp-danger-title {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: #EF4444;
    margin-bottom: 8px;
  }
  .sp-danger-text {
    font-size: 13px;
    color: var(--ink-3);
    font-family: var(--sans);
    line-height: 1.6;
  }
  .sp-danger-text a {
    color: var(--green);
    text-decoration: none;
    font-weight: 500;
  }
  .sp-danger-text a:hover { text-decoration: underline; }

  @media (max-width: 640px) {
    .sp-row { flex-direction: column; align-items: flex-start; gap: 4px; }
    .sp-row-value { text-align: left; }
    .sp-tags { justify-content: flex-start; }
  }
`;

const DIGEST_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  none: 'Off',
};

const SERVICE_LABELS: Record<string, string> = {
  financial_planning: 'Financial Planning',
  tax_planning: 'Tax Planning',
  estate_planning: 'Estate Planning',
  retirement: 'Retirement',
  esg: 'ESG / Impact',
  insurance: 'Insurance',
  alternative_investments: 'Alternative Investments',
  trust_services: 'Trust Services',
};

export default function SettingsPanel({ email, createdAt, profile, alertPrefs }: SettingsPanelProps) {
  const memberSince = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
  const location = [profile?.location_city, profile?.location_state].filter(Boolean).join(', ') || null;
  const digestFreq = alertPrefs?.digest_frequency ?? 'weekly';

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="db-panel-eyebrow">Account</div>
      <div className="db-panel-title">Settings</div>
      <div className="db-panel-sub">Your account details and preferences.</div>
      <div className="db-panel-divider" />

      {/* Account Info */}
      <div className="sp-section">
        <div className="sp-section-header">
          <span className="sp-section-title">Account</span>
        </div>
        <div className="sp-section-body">
          <div className="sp-row">
            <span className="sp-row-label">Email</span>
            <span className="sp-row-value">{email}</span>
          </div>
          <div className="sp-row">
            <span className="sp-row-label">Member since</span>
            <span className="sp-row-value">{memberSince}</span>
          </div>
          <div className="sp-row">
            <span className="sp-row-label">Password</span>
            <span className="sp-row-value">
              <Link href="/auth/reset-password" className="sp-link">Change password →</Link>
            </span>
          </div>
        </div>
      </div>

      {/* Profile */}
      <div className="sp-section">
        <div className="sp-section-header">
          <span className="sp-section-title">Profile</span>
          <Link href="/onboarding" className="sp-link">Edit →</Link>
        </div>
        <div className="sp-section-body">
          <div className="sp-row">
            <span className="sp-row-label">Location</span>
            <span className={`sp-row-value${!location ? ' muted' : ''}`}>
              {location ?? 'Not set'}
            </span>
          </div>
          <div className="sp-row">
            <span className="sp-row-label">Occupation</span>
            <span className={`sp-row-value${!profile?.occupation ? ' muted' : ''}`}>
              {profile?.occupation ?? 'Not set'}
            </span>
          </div>
          <div className="sp-row">
            <span className="sp-row-label">Net worth range</span>
            <span className={`sp-row-value${!profile?.net_worth_range ? ' muted' : ''}`}>
              {profile?.net_worth_range ?? 'Not set'}
            </span>
          </div>
          <div className="sp-row">
            <span className="sp-row-label">Has advisor</span>
            <span className="sp-row-value">
              {profile?.has_existing_advisor === true ? 'Yes' : profile?.has_existing_advisor === false ? 'No' : 'Not set'}
            </span>
          </div>
          <div className="sp-row">
            <span className="sp-row-label">Max fee</span>
            <span className={`sp-row-value${!profile?.max_fee_pct ? ' muted' : ''}`}>
              {profile?.max_fee_pct ? `${profile.max_fee_pct}%` : 'Not set'}
            </span>
          </div>
          <div className="sp-row">
            <span className="sp-row-label">Services</span>
            {profile?.services_wanted && profile.services_wanted.length > 0 ? (
              <div className="sp-tags">
                {profile.services_wanted.map(s => (
                  <span key={s} className="sp-tag">
                    {SERVICE_LABELS[s] || s}
                  </span>
                ))}
              </div>
            ) : (
              <span className="sp-row-value muted">Not set</span>
            )}
          </div>
        </div>
      </div>

      {/* Alert Preferences */}
      <div className="sp-section">
        <div className="sp-section-header">
          <span className="sp-section-title">Notifications</span>
          <Link href="/dashboard/alerts" className="sp-link">Manage →</Link>
        </div>
        <div className="sp-section-body">
          <div className="sp-row">
            <span className="sp-row-label">Email digest</span>
            <span className="sp-row-value">{DIGEST_LABELS[digestFreq] || digestFreq}</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="sp-danger">
        <div className="sp-danger-title">Danger Zone</div>
        <div className="sp-danger-text">
          To delete your account and all associated data, please{' '}
          <Link href="/contact">contact support</Link>. This action is irreversible.
        </div>
      </div>
    </div>
  );
}
