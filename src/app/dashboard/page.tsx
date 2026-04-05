import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import '@/components/dashboard/dashboard.css';

export const metadata: Metadata = {
  title: 'Dashboard - Visor Index',
};

const CSS = `
  .do-stats {
    display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:24px;
  }
  .do-stat {
    background:#fff; border:1px solid var(--rule); padding:20px;
  }
  .do-stat-value {
    font-family:var(--serif); font-size:28px; font-weight:700; color:var(--ink); margin-bottom:2px;
  }
  .do-stat-label {
    font-family:var(--mono); font-size:10px; font-weight:600;
    letter-spacing:.12em; text-transform:uppercase; color:var(--ink-3);
  }

  .do-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:24px; }

  .do-card { background:#fff; border:1px solid var(--rule); }
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

  .do-firm-row {
    display:flex; align-items:center; justify-content:space-between;
    padding:8px 0; border-bottom:1px solid var(--rule);
  }
  .do-firm-row:last-child { border-bottom:none; }
  .do-firm-name {
    font-size:13px; font-weight:500; color:var(--ink);
    text-decoration:none; transition:color .15s;
  }
  .do-firm-name:hover { color:var(--green); }
  .do-firm-meta {
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
    font-size:16px; flex-shrink:0; width:24px; text-align:center;
  }
  .do-action-text { font-size:12px; font-weight:500; color:var(--ink); font-family:var(--sans); }
  .do-action-sub { font-size:10px; color:var(--ink-3); font-family:var(--sans); margin-top:1px; }

  .do-empty-msg {
    font-size:13px; color:var(--ink-3); font-family:var(--sans); padding:4px 0;
  }

  @media(max-width:640px){
    .do-stats { grid-template-columns:1fr; }
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
  ]);

  // Fetch firm names for recent favorites
  const recentCrds = recentFavorites?.map(f => f.crd) ?? [];
  let recentFirms: { crd: number; name: string; savedAt: string }[] = [];
  if (recentCrds.length > 0) {
    const { data: firmData } = await supabaseAdmin
      .from('firmdata_current')
      .select('crd, legal_name')
      .in('crd', recentCrds);

    // Check for display names
    const { data: displayNames } = await supabaseAdmin
      .from('firm_names')
      .select('crd, display_name')
      .in('crd', recentCrds);

    const nameMap = new Map<number, string>();
    firmData?.forEach(f => nameMap.set(f.crd, f.legal_name));
    displayNames?.forEach(f => { if (f.display_name) nameMap.set(f.crd, f.display_name); });

    recentFirms = (recentFavorites ?? []).map(f => ({
      crd: f.crd,
      name: nameMap.get(f.crd) ?? `CRD #${f.crd}`,
      savedAt: new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));
  }

  const hasMatch = !!matchProfile?.answers;
  const matchDate = matchProfile?.updated_at
    ? new Date(matchProfile.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="db-panel-title">Overview</div>
      <div className="db-panel-sub">Your activity at a glance.</div>
      <div className="db-panel-divider" />

      {/* Stats */}
      <div className="do-stats">
        <div className="do-stat">
          <div className="do-stat-value">{savedCount ?? 0}</div>
          <div className="do-stat-label">Saved Firms</div>
        </div>
        <div className="do-stat">
          <div className="do-stat-value">{alertCount ?? 0}</div>
          <div className="do-stat-label">Active Alerts</div>
        </div>
        <div className="do-stat">
          <div className="do-stat-value">{hasMatch ? '1' : '0'}</div>
          <div className="do-stat-label">Match Profile{hasMatch && matchDate ? ` · ${matchDate}` : ''}</div>
        </div>
      </div>

      {/* Recent activity + Match status */}
      <div className="do-grid">
        <div className="do-card">
          <div className="do-card-hd">
            <span className="do-card-title">Recently Saved</span>
            <Link href="/dashboard/saved-firms" className="do-card-link">View all →</Link>
          </div>
          <div className="do-card-body">
            {recentFirms.length === 0 ? (
              <div className="do-empty-msg">No saved firms yet.</div>
            ) : (
              recentFirms.map(f => (
                <div key={f.crd} className="do-firm-row">
                  <Link href={`/firm/${f.crd}`} className="do-firm-name">{f.name}</Link>
                  <span className="do-firm-meta">{f.savedAt}</span>
                </div>
              ))
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
                <div className="do-firm-row">
                  <span className="do-firm-meta">Status</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1A7A4A' }}>Active</span>
                </div>
                {matchDate && (
                  <div className="do-firm-row">
                    <span className="do-firm-meta">Last updated</span>
                    <span className="do-firm-meta">{matchDate}</span>
                  </div>
                )}
                <div style={{ marginTop: 12 }}>
                  <Link
                    href="/match/results"
                    style={{ fontSize: 11, fontWeight: 600, color: '#5A7568', textDecoration: 'none', border: '1px solid #CAD8D0', padding: '6px 14px', transition: 'all .15s' }}
                  >
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
          <span className="do-action-icon">⌕</span>
          <div>
            <div className="do-action-text">Search Advisors</div>
            <div className="do-action-sub">Browse and filter firms</div>
          </div>
        </Link>
        <Link href="/compare" className="do-action">
          <span className="do-action-icon">⇄</span>
          <div>
            <div className="do-action-text">Compare Firms</div>
            <div className="do-action-sub">Side-by-side analysis</div>
          </div>
        </Link>
        <Link href="/negotiate" className="do-action">
          <span className="do-action-icon">↕</span>
          <div>
            <div className="do-action-text">Negotiate Fees</div>
            <div className="do-action-sub">Get your fee playbook</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
