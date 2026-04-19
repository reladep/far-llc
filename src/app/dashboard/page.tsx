import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import FirmRow from '@/components/dashboard/FirmRow';
import type { FirmRowData } from '@/components/dashboard/FirmRow';
import PlanBanner from '@/components/dashboard/PlanBanner';
import '@/components/dashboard/dashboard.css';

export const metadata: Metadata = {
  title: 'Dashboard - Visor Index',
};

const CSS = `
  /* FirmRow styles (inlined for server component compat) */
  .fr-list { border:1px solid var(--rule); background:var(--rule); display:flex; flex-direction:column; gap:1px; }
  .fr-row {
    background:#fff; display:grid; align-items:center; gap:12px; padding:13px 16px;
    transition:background .1s; text-decoration:none;
  }
  .fr-row:hover { background:#f7faf8; }
  .fr-name { font-size:13px; font-weight:600; color:var(--ink); margin-bottom:2px; text-decoration:none; display:block; }
  .fr-name:hover { color:var(--green); }
  .fr-meta { font-family:var(--mono); font-size:10px; color:var(--ink-3); display:flex; gap:8px; flex-wrap:wrap; }
  .fr-aum { font-family:var(--mono); font-size:11px; color:var(--ink-3); text-align:right; }
  .fr-ring { position:relative; width:36px; height:36px; flex-shrink:0; }
  .fr-ring svg { transform:rotate(-90deg); }
  .fr-ring-label {
    position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    font-family:var(--serif); font-size:12px; font-weight:700; line-height:1;
  }
  .fr-ring-na {
    width:36px; height:36px; flex-shrink:0;
    display:grid; place-items:center;
    font-family:var(--serif); font-size:10px; color:var(--ink-3);
    background:var(--white); border-radius:50%;
  }

  .do-stats {
    display:flex; align-items:center; justify-content:center; gap:28px;
    padding:16px 0; margin-bottom:20px; border-bottom:1px solid var(--rule);
  }
  .do-stat-divider {
    width:1px; height:28px; background:var(--rule); flex-shrink:0;
  }
  .do-stat {
    text-align:center;
  }
  .do-stat-value {
    font-family:var(--serif); font-size:20px; font-weight:700; color:var(--ink); margin-bottom:1px;
  }
  .do-stat-label {
    font-family:var(--mono); font-size:10px; font-weight:600;
    letter-spacing:.12em; text-transform:uppercase; color:var(--ink-3);
  }
  .do-stat-sub {
    font-family:var(--sans); font-size:11px; color:var(--green);
    font-weight:500; margin-top:2px;
  }

  .do-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:24px; }

  .do-card {
    background:#fff; border:1px solid var(--rule);
    box-shadow:0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.03);
  }
  .do-card-hd {
    padding:14px 20px; border-bottom:1px solid var(--rule);
    display:flex; align-items:center; justify-content:space-between;
  }
  .do-card-title {
    font-family:var(--mono); font-size:10px; font-weight:700;
    letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3);
  }
  .do-card-link {
    font-family:var(--sans); font-size:11px; color:var(--ink-3);
    text-decoration:none; transition:color .15s;
  }
  .do-card-link:hover { color:var(--green); }
  .do-card-body { padding:16px 20px; }

  .do-recent-row { grid-template-columns:1fr 36px; padding:10px 0; }
  .do-recent-row .fr-meta { display:none; }
  .do-recent-row .fr-aum { display:none; }
  .do-recent-list { border:none; background:transparent; gap:0; }
  .do-recent-list .fr-row { border-bottom:1px solid var(--rule); }
  .do-recent-list .fr-row:last-child { border-bottom:none; }

  .do-info-row {
    display:flex; align-items:center; justify-content:space-between;
    padding:8px 0; border-bottom:1px solid var(--rule);
  }
  .do-info-row:last-child { border-bottom:none; }
  .do-info-meta {
    font-family:var(--mono); font-size:10px; color:var(--ink-3);
  }

  .do-actions {
    display:flex; gap:10px; flex-wrap:wrap;
  }
  .do-action {
    flex:1; min-width:140px;
    display:flex; align-items:center; gap:10px;
    padding:16px 20px;
    background:#fff; border:1px solid var(--rule);
    text-decoration:none; transition:all .15s;
  }
  .do-action:hover { border-color:var(--green); }
  .do-action-icon {
    flex-shrink:0; width:24px; display:grid; place-items:center; color:var(--ink-3);
  }
  .do-action-text { font-size:12px; font-weight:500; color:var(--ink); font-family:var(--sans); }
  .do-action-sub { font-size:10px; color:var(--ink-3); font-family:var(--sans); margin-top:1px; }

  .do-active-status { font-size:12px; font-weight:600; color:var(--green); }
  .do-results-btn {
    display:inline-block; font-size:11px; font-weight:600;
    letter-spacing:.1em; text-transform:uppercase;
    color:var(--ink-3); background:none; border:1px solid var(--rule);
    padding:7px 16px; text-decoration:none;
    font-family:var(--sans); transition:all .15s;
  }
  .do-results-btn:hover { border-color:var(--green); color:var(--green); }

  .do-empty-msg {
    font-size:13px; color:var(--ink-3); font-family:var(--sans); padding:4px 0;
  }

  /* ---- Welcome checklist (empty state) ---- */
  .do-welcome {
    background:#fff; border:1px solid var(--rule);
    padding:32px 28px; margin-bottom:20px;
  }
  .do-welcome-title {
    font-family:var(--serif); font-size:20px; font-weight:700;
    color:var(--ink); margin-bottom:4px;
  }
  .do-welcome-sub {
    font-size:13px; color:var(--ink-3); margin-bottom:24px;
  }
  .do-checklist { display:flex; flex-direction:column; gap:0; }
  .do-check-item {
    display:flex; align-items:center; gap:14px;
    padding:14px 0; border-top:1px solid var(--rule);
    text-decoration:none; transition:background .1s;
  }
  .do-check-item:first-child { border-top:none; }
  .do-check-ring {
    width:24px; height:24px; flex-shrink:0;
    border:1.5px solid var(--rule); border-radius:50%;
    display:grid; place-items:center;
  }
  .do-check-text { flex:1; }
  .do-check-title { font-size:13px; font-weight:600; color:var(--ink); }
  .do-check-desc { font-size:12px; color:var(--ink-3); margin-top:1px; }
  .do-check-arrow { font-size:12px; color:var(--rule); transition:color .12s; }
  .do-check-item:hover .do-check-arrow { color:var(--green); }
  .do-check-item:hover .do-check-ring { border-color:var(--green); }

  @media(max-width:640px){
    .do-stats { flex-direction:column; gap:14px; }
    .do-stat-divider { width:60px; height:1px; }
    .do-grid { grid-template-columns:1fr; }
    .do-actions { flex-direction:column; }
  }
`;

export default async function DashboardOverview() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch all dashboard data in parallel
  const [
    { count: savedCount },
    { count: alertCount },
    { data: matchProfile },
    { data: recentFavorites },
    { data: userProfile },
  ] = await Promise.all([
    supabaseAdmin
      .from('user_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabaseAdmin
      .from('alert_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabaseAdmin
      .from('user_match_profiles')
      .select('answers, updated_at')
      .eq('user_id', user.id)
      .single(),
    supabaseAdmin
      .from('user_favorites')
      .select('crd, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),
    supabaseAdmin
      .from('user_profiles')
      .select('plan_tier')
      .eq('user_id', user.id)
      .single(),
  ]);

  // Fetch firm details for recent favorites
  const recentCrds = recentFavorites?.map(f => f.crd) ?? [];
  let recentFirms: (FirmRowData & { savedAt: string })[] = [];
  if (recentCrds.length > 0) {
    const [{ data: firmData }, { data: displayNames }, { data: scores }] = await Promise.all([
      supabaseAdmin
        .from('firmdata_current')
        .select('crd, legal_name, main_office_city, main_office_state, aum')
        .in('crd', recentCrds),
      supabaseAdmin
        .from('firm_names')
        .select('crd, display_name')
        .in('crd', recentCrds),
      supabaseAdmin
        .from('firm_scores')
        .select('crd, final_score')
        .in('crd', recentCrds),
    ]);

    const firmMap = new Map<number, { name: string; city: string | null; state: string | null; aum: number | null }>();
    firmData?.forEach(f => firmMap.set(f.crd, { name: f.legal_name, city: f.main_office_city, state: f.main_office_state, aum: f.aum }));
    const displayMap = new Map<number, string>();
    displayNames?.forEach(f => { if (f.display_name) displayMap.set(f.crd, f.display_name); });
    const scoreMap = new Map<number, number | null>();
    scores?.forEach(s => scoreMap.set(s.crd, s.final_score));

    recentFirms = (recentFavorites ?? []).map(f => {
      const firm = firmMap.get(f.crd);
      const aum = firm?.aum;
      const aumStr = aum ? (aum >= 1e9 ? `$${(aum / 1e9).toFixed(1)}B` : aum >= 1e6 ? `$${(aum / 1e6).toFixed(0)}M` : `$${Math.round(aum / 1000)}K`) : '';
      return {
        crd: f.crd,
        name: firm?.name ?? `CRD #${f.crd}`,
        displayName: displayMap.get(f.crd),
        city: firm?.city ?? null,
        state: firm?.state ?? null,
        aum: aumStr,
        visorScore: scoreMap.get(f.crd) ?? null,
        savedAt: new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    });
  }

  const hasMatch = !!matchProfile?.answers;
  const matchDate = matchProfile?.updated_at
    ? new Date(matchProfile.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="db-panel-eyebrow">Dashboard</div>
      <div className="db-panel-title">Overview</div>
      <div className="db-panel-sub">Your activity at a glance.</div>
      <div className="db-panel-divider" />

      {(!userProfile?.plan_tier || userProfile.plan_tier === 'none') && <PlanBanner />}

      {(savedCount ?? 0) === 0 && (alertCount ?? 0) === 0 && !hasMatch ? (
        /* Welcome checklist — shown when the user has no activity yet */
        <div className="do-welcome">
          <div className="do-welcome-title">Get started</div>
          <div className="do-welcome-sub">Three steps to make the most of Visor Index.</div>
          <div className="do-checklist">
            <Link href="/search" className="do-check-item">
              <span className="do-check-ring" />
              <div className="do-check-text">
                <div className="do-check-title">Search for an advisor</div>
                <div className="do-check-desc">Browse 40,000+ SEC-registered firms by name, city, or CRD number.</div>
              </div>
              <span className="do-check-arrow">→</span>
            </Link>
            <Link href="/match" className="do-check-item">
              <span className="do-check-ring" />
              <div className="do-check-text">
                <div className="do-check-title">Take the 2-minute match quiz</div>
                <div className="do-check-desc">Answer a few questions and get matched with advisors that fit your needs.</div>
              </div>
              <span className="do-check-arrow">→</span>
            </Link>
            <Link href="/search" className="do-check-item">
              <span className="do-check-ring" />
              <div className="do-check-text">
                <div className="do-check-title">Save a firm to your watchlist</div>
                <div className="do-check-desc">Bookmark firms you're evaluating and track changes over time.</div>
              </div>
              <span className="do-check-arrow">→</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Stats strip — shown when the user has at least one data point */
        <div className="do-stats">
          <div className="do-stat">
            <div className="do-stat-value">{savedCount ?? 0}</div>
            <div className="do-stat-label">Saved Firms</div>
          </div>
          <div className="do-stat-divider" />
          <div className="do-stat">
            <div className="do-stat-value">{alertCount ?? 0}</div>
            <div className="do-stat-label">Firms with Alerts</div>
          </div>
          <div className="do-stat-divider" />
          <div className="do-stat">
            <div className="do-stat-value">{hasMatch ? 'Active' : '—'}</div>
            <div className="do-stat-label">Match Profile{hasMatch && matchDate ? ` · ${matchDate}` : ''}</div>
          </div>
        </div>
      )}

      {/* Recent activity + Match status */}
      <div className="do-grid">
        <div className="do-card">
          <div className="do-card-hd">
            <span className="do-card-title">Recently Saved</span>
            <Link href="/dashboard/saved-firms" className="do-card-link">View all →</Link>
          </div>
          <div className="do-card-body" style={{ padding: recentFirms.length > 0 ? '4px 20px' : undefined }}>
            {recentFirms.length === 0 ? (
              <div className="do-empty-msg">No saved firms yet.</div>
            ) : (
              <div className="do-recent-list fr-list">
                {recentFirms.map(f => (
                  <FirmRow key={f.crd} firm={f} className="do-recent-row" />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="do-card">
          <div className="do-card-hd">
            <span className="do-card-title">Match Profile</span>
            <Link href="/dashboard/matches" className="do-card-link">View matches →</Link>
          </div>
          <div className="do-card-body">
            {hasMatch ? (
              <>
                <div className="do-info-row">
                  <span className="do-info-meta">Status</span>
                  <span className="do-active-status">Active</span>
                </div>
                {matchDate && (
                  <div className="do-info-row">
                    <span className="do-info-meta">Last updated</span>
                    <span className="do-info-meta">{matchDate}</span>
                  </div>
                )}
                <div style={{ marginTop: 12 }}>
                  <Link href="/match/results" className="do-results-btn">
                    View Results →
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="do-empty-msg" style={{ marginBottom: 12 }}>
                  No match profile yet. Take the 2-minute questionnaire.
                </div>
                <Link href="/match" className="db-empty-link">Start Matching</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="do-actions">
        <Link href="/search" className="do-action">
          <span className="do-action-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7.5" cy="7.5" r="5.5" /><path d="M11.5 11.5L16 16" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <div className="do-action-text">Search Advisors</div>
            <div className="do-action-sub">Browse and filter firms</div>
          </div>
        </Link>
        <Link href="/compare" className="do-action">
          <span className="do-action-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 3H3v12h3M12 3h3v12h-3M6 9h6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <div className="do-action-text">Compare Firms</div>
            <div className="do-action-sub">Side-by-side analysis</div>
          </div>
        </Link>
        <Link href="/negotiate" className="do-action">
          <span className="do-action-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 2v14M5 5l4-3 4 3M5 13l4 3 4-3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <div className="do-action-text">Negotiate Fees</div>
            <div className="do-action-sub">Get your fee playbook</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
