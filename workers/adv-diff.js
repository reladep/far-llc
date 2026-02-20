#!/usr/bin/env node
/**
 * ADV Diff Checker
 * 
 * Compares current firmdata against the most recent snapshot.
 * Creates alerts for significant changes (AUM, fees, employees, clients).
 * Also takes a new snapshot for future comparison.
 * 
 * Run: node workers/adv-diff.js
 * Schedule: every 6 hours via cron
 */

const { supabase } = require('./config');

// Thresholds for alert generation
const THRESHOLDS = {
  aum_change: 0.10,           // 10% AUM change
  employee_change: 0.20,      // 20% employee count change
  client_count_change: 0.15,  // 15% client count change
};

async function getAllFirms() {
  const { data, error } = await supabase
    .from('firmdata_current')
    .select('crd, primary_business_name, aum, accounts_total, employee_total, aum_discretionary, aum_non_discretionary');

  if (error) {
    console.error('[ADV Diff] Error fetching firms:', error.message);
    return [];
  }
  console.log(`[ADV Diff] Loaded ${data.length} firms`);
  return data;
}

async function getFeeTiers(crd) {
  const { data } = await supabase
    .from('firmdata_feetiers')
    .select('min_aum, max_aum, fee_pct')
    .eq('crd', crd)
    .order('min_aum', { ascending: true });
  return data || [];
}

async function getLatestSnapshot(crd) {
  const { data } = await supabase
    .from('firm_snapshots')
    .select('*')
    .eq('crd', crd)
    .order('snapshot_date', { ascending: false })
    .limit(1);
  return data?.[0] || null;
}

function pctChange(oldVal, newVal) {
  if (!oldVal || oldVal === 0) return newVal ? 1 : 0;
  return Math.abs((newVal - oldVal) / oldVal);
}

function severity(pct) {
  if (pct >= 0.50) return 'high';
  if (pct >= 0.20) return 'medium';
  return 'low';
}

function formatPct(pct) {
  return `${(pct * 100).toFixed(1)}%`;
}

function formatDollar(val) {
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
  return `$${val}`;
}

async function diffFirm(firm, snapshot) {
  const alerts = [];

  // AUM change
  if (snapshot.aum && firm.aum) {
    const pct = pctChange(snapshot.aum, firm.aum);
    if (pct >= THRESHOLDS.aum_change) {
      const direction = firm.aum > snapshot.aum ? 'increased' : 'decreased';
      alerts.push({
        crd: firm.crd,
        alert_type: 'aum_change',
        severity: severity(pct),
        title: `AUM ${direction} ${formatPct(pct)}`,
        summary: `${firm.primary_business_name} AUM ${direction} from ${formatDollar(snapshot.aum)} to ${formatDollar(firm.aum)} (${formatPct(pct)})`,
        detail: {
          old_value: snapshot.aum,
          new_value: firm.aum,
          change_pct: pct,
          direction,
        },
        source: 'adv_diff',
      });
    }
  }

  // Employee change
  if (snapshot.total_employees && firm.employee_total) {
    const pct = pctChange(snapshot.total_employees, firm.employee_total);
    if (pct >= THRESHOLDS.employee_change) {
      const direction = firm.employee_total > snapshot.total_employees ? 'increased' : 'decreased';
      alerts.push({
        crd: firm.crd,
        alert_type: 'employee_change',
        severity: severity(pct),
        title: `Employee count ${direction} ${formatPct(pct)}`,
        summary: `${firm.primary_business_name} employees ${direction} from ${snapshot.total_employees} to ${firm.employee_total}`,
        detail: {
          old_value: snapshot.total_employees,
          new_value: firm.employee_total,
          change_pct: pct,
          direction,
        },
        source: 'adv_diff',
      });
    }
  }

  // Client count change
  if (snapshot.total_accounts && firm.accounts_total) {
    const pct = pctChange(snapshot.total_accounts, firm.accounts_total);
    if (pct >= THRESHOLDS.client_count_change) {
      const direction = firm.accounts_total > snapshot.total_accounts ? 'increased' : 'decreased';
      alerts.push({
        crd: firm.crd,
        alert_type: 'client_count_change',
        severity: severity(pct),
        title: `Client count ${direction} ${formatPct(pct)}`,
        summary: `${firm.primary_business_name} accounts ${direction} from ${snapshot.total_accounts} to ${firm.accounts_total}`,
        detail: {
          old_value: snapshot.total_accounts,
          new_value: firm.accounts_total,
          change_pct: pct,
          direction,
        },
        source: 'adv_diff',
      });
    }
  }

  // Fee change — compare fee tiers
  const currentTiers = await getFeeTiers(firm.crd);
  const oldTiers = snapshot.fee_tiers || [];
  
  if (oldTiers.length > 0 && currentTiers.length > 0) {
    const oldStr = JSON.stringify(oldTiers);
    const newStr = JSON.stringify(currentTiers);
    if (oldStr !== newStr) {
      alerts.push({
        crd: firm.crd,
        alert_type: 'fee_change',
        severity: 'high',
        title: 'Fee schedule changed',
        summary: `${firm.primary_business_name} updated their fee schedule`,
        detail: {
          old_tiers: oldTiers,
          new_tiers: currentTiers,
        },
        source: 'adv_diff',
      });
    }
  }

  return alerts;
}

async function takeSnapshot(firm) {
  const feeTiers = await getFeeTiers(firm.crd);
  
  const { error } = await supabase
    .from('firm_snapshots')
    .upsert({
      crd: firm.crd,
      snapshot_date: new Date().toISOString().split('T')[0],
      aum: firm.aum,
      total_accounts: firm.accounts_total,      // maps to firm_snapshots.total_accounts
      total_employees: firm.employee_total,      // maps to firm_snapshots.total_employees
      fee_tiers: feeTiers,
      discretionary_aum: firm.aum_discretionary,
      non_discretionary_aum: firm.aum_non_discretionary,
    }, { onConflict: 'crd,snapshot_date' });

  if (error) {
    console.error(`[ADV Diff] Snapshot error for CRD ${firm.crd}:`, error.message);
  }
}

async function insertAlerts(alerts) {
  if (alerts.length === 0) return 0;

  const { error } = await supabase
    .from('firm_alerts')
    .insert(alerts);

  if (error) {
    console.error('[ADV Diff] Error inserting alerts:', error.message);
    return 0;
  }
  return alerts.length;
}

async function processBatch(firms) {
  let totalAlerts = 0;
  let snapshotCount = 0;
  let diffCount = 0;

  // Process in parallel batches of 20
  const BATCH_SIZE = 20;
  for (let i = 0; i < firms.length; i += BATCH_SIZE) {
    const batch = firms.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (firm) => {
      const snapshot = await getLatestSnapshot(firm.crd);

      if (snapshot) {
        const alerts = await diffFirm(firm, snapshot);
        if (alerts.length > 0) {
          const inserted = await insertAlerts(alerts);
          totalAlerts += inserted;
          for (const a of alerts) {
            console.log(`[ADV Diff] ALERT: ${a.title} — ${a.summary}`);
          }
        }
        diffCount++;
      }

      await takeSnapshot(firm);
      snapshotCount++;
    }));

    if ((i + BATCH_SIZE) % 200 === 0) {
      console.log(`[ADV Diff] Progress: ${Math.min(i + BATCH_SIZE, firms.length)}/${firms.length}`);
    }
  }

  return { totalAlerts, snapshotCount, diffCount };
}

async function main() {
  console.log(`[ADV Diff] Starting at ${new Date().toISOString()}`);

  const firms = await getAllFirms();
  const { totalAlerts, snapshotCount, diffCount } = await processBatch(firms);

  console.log(`[ADV Diff] Done. Diffed: ${diffCount}, Snapshots: ${snapshotCount}, New alerts: ${totalAlerts}`);
}

main().catch(err => {
  console.error('[ADV Diff] Fatal error:', err);
  process.exit(1);
});
