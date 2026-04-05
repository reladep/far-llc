'use client';

import { useState, useEffect, useCallback } from 'react';

import Link from 'next/link';
import { Session } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { type FeeTier, calcTieredFeeSimple, getClosestBreakpoint, synthesizeRangeTiers } from '@/lib/fee-utils';

const supabase = createSupabaseBrowserClient();

// ─── INTERFACES ──────────────────────────────────────────────────────────────
interface FirmBasic {
  crd: number;
  primary_business_name: string;
  display_name?: string | null;
}

interface AssetAlloc {
  label: string;
  pct: number;
  color: string;
}

interface FirmComparison {
  crd: number;
  name: string;
  location: string;
  aum: string;
  aumRaw: number | null;
  employees: string;
  employeeInvestment: number | null;
  totalClients: number;
  avgClientSize: string;
  minAccount: string;
  feeStructureType: string;
  feeMin: string;
  feeRangeMin: string;
  feeRangeMax: string;
  minimumFee: string;
  wealthTier: string;
  clientBase: string;
  website: string;
  feeTiers: FeeTier[];
  logoKey: string | null;
  // Scores
  finalScore: number | null;
  scorePercentile: string | null;
  disclosureScore: number | null;
  feeTransparencyScore: number | null;
  feeCompetitivenessScore: number | null;
  conflictFreeScore: number | null;
  aumGrowthScore: number | null;
  clientGrowthScore: number | null;
  advisorBandwidthScore: number | null;
  derivativesScore: number | null;
  // Growth (from firmdata_growth_rate_rankings)
  aumGrowth1yr: string;
  aumGrowth5yr: string;
  aumGrowth10yr: string;
  clientGrowth1yr: string;
  clientGrowth5yr: string;
  aumPerAdvisor: string;
  clientsPerAdvisor: string;
  // Regulatory
  hasDisciplinary: string;
  privateFundAdvisor: string;
  legalStructure: string;
  disclosureData: Record<string, string | null>;
  // Asset allocation
  assetAllocation: AssetAlloc[];
  // Client composition
  clientBreakdown: { label: string; count: number }[];
  // Services
  services: Record<string, boolean>;
  // AUM split
  aumDiscretionary: number | null;
  aumNonDiscretionary: number | null;
  // Percentiles
  aumPercentile: string | null;
  employeePercentile: string | null;
  invStaffPercentile: string | null;
  totalClientsPercentile: string | null;
  avgClientPercentile: string | null;
  clientsPerAdvisorPercentile: string | null;
  aumGrowth1yrPercentile: string | null;
  aumGrowth5yrPercentile: string | null;
  aumGrowth10yrPercentile: string | null;
  clientGrowth1yrPercentile: string | null;
  clientGrowth5yrPercentile: string | null;
  // Filing freshness
  latestFiling: string;
  // Offices
  numOffices: string;
  // State registrations
  registeredStates: number;
  // Philosophy
  investmentPhilosophy: string;
  firmCharacter: string;
}

// ─── REGULATORY CATEGORIES ──────────────────────────────────────────────────
const DISC_CATEGORIES = [
  {
    label: 'Criminal History', severity: 'critical' as const,
    keys: ['disclosure_firm_felony_charge', 'disclosure_firm_felony_conviction', 'disclosure_firm_misdemenor_charge', 'disclosure_firm_misdemenor_conviction'],
  },
  {
    label: 'Federal & Regulatory Actions', severity: 'serious' as const,
    keys: ['disclosure_firm_federal_violations', 'disclosure_firm_federal_revoke', 'disclosure_firm_federal_suspension_restrictions', 'disclosure_firm_federal_false_statement', 'disclosure_firm_federal_investment_order_10_years', 'disclosure_firm_current_regulatory_proceedings', 'disclosure_firm_suspension_revoked'],
  },
  {
    label: 'SEC & CFTC Actions', severity: 'serious' as const,
    keys: ['disclosure_firm_sec_cftc_violations', 'disclosure_firm_sec_cftc_monetary_penalty', 'disclosure_firm_sec_cftc_suspension_restrictions', 'disclosure_firm_sec_cftc_false_statement', 'disclosure_firm_sec_cftc_investment_order'],
  },
  {
    label: 'Self-Regulatory Organization (SRO)', severity: 'moderate' as const,
    keys: ['disclosure_firm_self_regulatory_violation', 'disclosure_firm_self_regulatory_discipline', 'disclosure_firm_self_regulatory_suspension_restrictions', 'disclosure_firm_self_regulatory_false_statement'],
  },
  {
    label: 'Court Actions', severity: 'moderate' as const,
    keys: ['disclosure_firm_court_ruling_violation', 'disclosure_firm_court_ruling_investment', 'disclosure_firm_court_ruling_ongoing_litigation', 'disclosure_firm_court_ruling_dismissal'],
  },
];
const SEV_COLOR: Record<string, string> = { critical: '#EF4444', serious: '#F97316', moderate: '#F59E0B' };

// ─── CONSTANTS & HELPERS ─────────────────────────────────────────────────────
const FEE_TYPE_LABELS: Record<string, string> = {
  range: 'AUM-Based',
  tiered: 'Tiered',
  flat_percentage: 'Flat Fee',
  maximum_only: 'AUM-Based (Max)',
  minimum_only: 'AUM-Based (Min)',
  capped: 'Capped',
  not_disclosed: 'Negotiated',
};

function formatCompact(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatAUM(value: number | null): string {
  if (!value) return '—';
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000).toLocaleString()}K`;
  return `$${Math.round(value).toLocaleString()}`;
}

function scoreColor(score: number | null): string {
  if (score == null) return 'var(--rule)';
  return score >= 80 ? 'var(--green-3)' : score >= 50 ? 'var(--amber)' : 'var(--red)';
}

/** Convert score to 0-100 range for visual display (bar width, color threshold) */
function toPercent(score: number | null): number {
  if (score == null) return 0;
  return score <= 10 ? score * 10 : score;
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const PAGE_CSS = `
  .cp-page {
    --navy:#172438; --navy-2:#0F2538;
    --green:#1A7A4A; --green-2:#22995E; --green-3:#2DBD74; --green-pale:#E6F4ED;
    --bg:#F6F8F7; --ink:#0C1810; --ink-2:#2E4438; --ink-3:#5A7568;
    --rule:#CAD8D0; --rule-2:#B0C4BA;
    --red:#EF4444; --amber:#F59E0B;
    --serif:'Cormorant Garamond',serif;
    --sans:'DM Sans',sans-serif;
    --mono:'DM Mono',monospace;
    background: var(--bg); color: var(--ink); min-height: 100vh; padding-bottom: 48px;
  }

  /* Header */

  /* Jump nav — sticky below breadcrumb */
  .cp-jump-bar {
    position: sticky; top: 61px; z-index: 500;
    background: var(--navy-2); border-bottom: 1px solid rgba(255,255,255,.07);
    overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none;
  }
  .cp-jump-bar::-webkit-scrollbar { display: none; }
  .cp-jump-nav {
    display: flex; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 48px;
  }
  .cp-jump-nav-links {
    display: flex; flex: 1; overflow-x: auto; scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }
  .cp-jump-nav-links::-webkit-scrollbar { display: none; }
  .cp-jump-actions { flex-shrink: 0; padding-left: 12px; }
  .cp-jn-link {
    font-size: 11px; font-weight: 500; color: rgba(255,255,255,.3);
    padding: 10px 20px 10px 0; margin-right: 4px; white-space: nowrap;
    text-decoration: none; border-bottom: 2px solid transparent;
    transition: all .15s; letter-spacing: .04em; display: inline-block;
  }
  .cp-jn-link:hover { color: rgba(255,255,255,.65); }
  .cp-jn-link.on { color: var(--green-3); border-bottom-color: var(--green-3); }

  /* Sticky firm header — below jump nav */
  .cp-firm-bar {
    position: sticky; top: 101px; z-index: 499;
    background: var(--navy); border-bottom: 2px solid rgba(255,255,255,.07);
    box-shadow: 0 4px 20px rgba(0,0,0,.15); overflow-x: auto;
  }
  .cp-firm-bar-inner {
    display: grid; grid-template-columns: 180px repeat(4, 1fr);
    max-width: 1200px; margin: 0 auto; padding: 0 48px; min-width: 700px;
  }
  .cp-firm-slot {
    padding: 14px 20px; display: flex; align-items: center; gap: 10px;
    border-right: 1px solid rgba(255,255,255,.07); min-width: 0;
  }
  .cp-firm-slot:last-child { border-right: none; }
  .cp-firm-slot-label {
    font-size: 10px; font-weight: 600; letter-spacing: .18em;
    text-transform: uppercase; color: rgba(255,255,255,.65);
  }
  .cp-firm-avatar {
    width: 28px; height: 28px; flex-shrink: 0;
    background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1);
    display: grid; place-items: center;
    font-family: var(--serif); font-size: 11px; font-weight: 700;
    color: rgba(255,255,255,.5);
  }
  .cp-firm-name {
    font-size: 12px; font-weight: 600; color: #fff;
    min-width: 0; flex: 1; line-height: 1.3;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .cp-firm-name a { color: inherit; text-decoration: none; }
  .cp-firm-name a:hover { text-decoration: underline; text-underline-offset: 2px; }
  .cp-remove-btn {
    background: none; border: none; cursor: pointer;
    color: rgba(255,255,255,.2); font-size: 15px; line-height: 1;
    flex-shrink: 0; padding: 0 2px; transition: color .15s; margin-left: auto;
  }
  .cp-remove-btn:hover { color: rgba(255,255,255,.7); }
  .cp-add-slot {
    padding: 14px 20px; display: flex; align-items: center;
    justify-content: center; gap: 6px; cursor: pointer; opacity: .75;
    border-right: 1px solid rgba(255,255,255,.07); transition: opacity .2s;
  }
  .cp-add-slot:last-child { border-right: none; }
  .cp-add-slot:hover { opacity: .85; }

  /* Table body */
  .cp-table-wrap { max-width: 1200px; margin: 0 auto; padding: 0 48px 8px; overflow-x: auto; }
  .cp-table-inner { min-width: 700px; }

  /* Section cards */
  .cp-section-card {
    background: #fff; border: 0.5px solid var(--rule); border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.03);
    overflow: visible; margin-bottom: 24px; margin-top: 8px;
  }
  .cp-section-head {
    display: flex; align-items: baseline; justify-content: space-between;
    padding: 16px 20px 12px; border-bottom: 0.5px solid var(--rule);
  }
  .cp-section-title {
    font-family: var(--serif); font-size: 19px; font-weight: 700; color: var(--ink);
  }
  .cp-section-meta {
    font-size: 10px; color: var(--ink-3); font-family: var(--mono);
  }

  /* Rows */
  .cp-row {
    display: grid; grid-template-columns: 180px repeat(4, 1fr);
    border-bottom: 0.5px solid var(--rule); transition: background .12s;
  }
  .cp-row:last-child { border-bottom: none; }
  .cp-row:hover { background: rgba(26,122,74,.02); }
  .cp-row-label {
    padding: 12px 16px 12px 20px; display: flex; align-items: center; gap: 5;
    border-right: 0.5px solid var(--rule);
    font-family: var(--sans); font-size: 12px; color: var(--ink-3); font-weight: 500;
  }
  .cp-row-label.strong { color: var(--ink); font-weight: 600; }
  .cp-row-cell {
    padding: 12px 20px; display: flex; align-items: center; justify-content: center;
    border-right: 0.5px solid rgba(0,0,0,.04); text-align: center;
  }
  .cp-row-cell:last-child { border-right: none; }
  .cp-row-cell.text-left { justify-content: flex-start; text-align: left; }
  .cp-row-cell .val-serif {
    font-family: var(--serif); font-size: 17px; font-weight: 700; color: var(--ink);
  }
  .cp-row-cell .val-mono {
    font-family: var(--mono); font-size: 12px; color: var(--ink-2);
  }
  .cp-row-cell .val-dash { color: var(--rule); font-size: 18px; }
  .cp-row-cell .val-tag {
    font-family: var(--sans); font-size: 10px; font-weight: 600;
    letter-spacing: .06em; text-transform: uppercase;
    padding: 2px 8px; border-radius: 3px;
  }
  .cp-row-cell .val-tag.good { background: rgba(45,189,116,.08); color: var(--green); }
  .cp-row-cell .val-tag.warn { background: rgba(245,158,11,.08); color: var(--amber); }
  .cp-row-cell .val-tag.risk { background: rgba(239,68,68,.08); color: var(--red); }

  /* Score bar */
  .cp-score-bar { display: flex; align-items: center; gap: 9px; width: 100%; }
  .cp-score-num { font-family: var(--serif); font-weight: 700; width: 26px; flex-shrink: 0; line-height: 1; }
  .cp-score-track { flex: 1; height: 3px; background: var(--rule); border-radius: 2px; overflow: hidden; }
  .cp-score-fill { height: 100%; border-radius: 2px; transition: width 1s ease; }

  /* Mini ring (overall score) */
  .cp-mini-ring { position: relative; width: 42px; height: 42px; display: inline-block; }
  .cp-mini-ring svg { transform: rotate(-90deg); }
  .cp-mini-ring-label {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    font-family: var(--serif); font-size: 14px; font-weight: 700; line-height: 1;
  }

  /* Info tip */
  .cp-tip {
    font-size: 10px; color: var(--ink-3); cursor: default; opacity: .5;
    position: relative; margin-left: 4px;
  }
  .cp-tip:hover { opacity: 1; }
  .cp-tip:hover::after {
    content: attr(title); position: absolute; left: 50%; bottom: calc(100% + 6px);
    transform: translateX(-50%); background: var(--ink); color: #fff;
    font-size: 11px; line-height: 1.5; padding: 8px 12px; border-radius: 6px;
    white-space: nowrap; z-index: 100; pointer-events: none;
  }

  /* View profile row */
  .cp-view-profile {
    display: grid; grid-template-columns: 180px repeat(4, 1fr);
    border-top: 0.5px solid var(--rule); background: rgba(0,0,0,.01);
  }
  .cp-view-profile a {
    font-family: var(--sans); font-size: 11px; font-weight: 600;
    color: var(--green); text-decoration: none; padding: 10px 20px; text-align: center;
    border-right: 0.5px solid rgba(0,0,0,.04); transition: background .12s;
  }
  .cp-view-profile a:hover { background: rgba(45,189,116,.04); }
  .cp-view-profile a:last-child { border-right: none; }

  /* Fee calculator */
  .cp-fee-section { max-width: 1200px; margin: 0 auto 24px; padding: 0 48px; }
  .cp-fee-card {
    background: #fff; border: 0.5px solid var(--rule); border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.03);
    overflow: hidden;
  }
  .cp-fee-input-row {
    padding: 20px 24px; display: flex; align-items: center; gap: 24;
    border-bottom: 0.5px solid var(--rule);
  }
  .fee-slider-input {
    -webkit-appearance: none; appearance: none; width: 100%; height: 2px;
    background: var(--rule); outline: none; cursor: pointer;
  }
  .fee-slider-input::-webkit-slider-thumb {
    -webkit-appearance: none; width: 16px; height: 16px;
    background: var(--green); border-radius: 50%; border: 2px solid #fff;
    box-shadow: 0 0 0 1px var(--green); cursor: pointer;
  }
  .fee-slider-input::-moz-range-thumb {
    width: 16px; height: 16px; background: var(--green); border-radius: 50%;
    border: 2px solid #fff; cursor: pointer;
  }

  /* Gate */
  .cp-gate-wrap { pointer-events: none; user-select: none; position: relative; }
  .cp-gate-wrap .cp-table-wrap {
    filter: blur(1.5px); max-height: 600px; overflow: hidden;
    mask-image: linear-gradient(to bottom, #000 55%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, #000 55%, transparent 100%);
  }
  .cp-gate-wrap .cp-firm-bar { position: static; }
  .cp-jump-bar-gated { position: static; pointer-events: none; }
  .cp-jump-bar-gated .cp-jn-link { color: rgba(255,255,255,.7); }

  /* Search modal */
  .cp-search-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(10,28,42,.7); backdrop-filter: blur(4px);
    display: flex; align-items: flex-start; justify-content: center; padding-top: 120px;
  }
  .cp-search-card {
    background: #fff; width: 100%; max-width: 520px;
    border: 0.5px solid var(--rule); border-top: 2px solid var(--green);
    border-radius: 0 0 10px 10px; padding: 24px;
  }
  .cp-search-result {
    display: block; width: 100%; text-align: left; padding: 10px 14px;
    background: #fff; border: none; border-bottom: 0.5px solid var(--rule);
    cursor: pointer; font-family: var(--sans); font-size: 13px; color: var(--ink);
    transition: background .1s;
  }
  .cp-search-result:hover, .cp-search-result.active { background: rgba(26,122,74,.06); }
  .cp-search-chip {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: var(--green); background: rgba(45,189,116,.08);
    border: 1px solid rgba(26,122,74,.25); padding: 4px 10px; border-radius: 3px;
  }

  /* Gate card */
  .cp-gate-card {
    width: 100%; max-width: 480px; position: absolute; top: 200px; left: 50%; transform: translateX(-50%); z-index: 30;
    background: #0F2538; border: 1px solid rgba(255,255,255,.09); border-top: 2px solid var(--green);
    box-shadow: 0 8px 48px rgba(0,0,0,0.5);
    padding: 36px 40px 32px; text-align: left;
  }
  .cp-gate-eyebrow {
    display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
    font-size: 9px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: var(--green-3);
  }
  .cp-gate-eyebrow svg { width: 12px; height: 12px; }
  .cp-gate-headline {
    font-family: var(--serif); font-size: clamp(22px, 2.5vw, 30px); font-weight: 700;
    line-height: 1.2; letter-spacing: -.02em; color: #fff; margin-bottom: 12px;
  }
  .cp-gate-sub {
    font-size: 13px; color: rgba(255,255,255,.55); line-height: 1.7;
    border-top: 1px solid rgba(255,255,255,.06); padding-top: 16px; margin-bottom: 24px;
  }
  .cp-gate-ctas { display: flex; gap: 12px; flex-wrap: wrap; }
  .cp-gate-cta-primary {
    display: inline-flex; align-items: center; padding: 12px 28px;
    background: var(--green); color: #fff; font-size: 13px; font-weight: 600;
    text-decoration: none; transition: background .15s;
  }
  .cp-gate-cta-primary:hover { background: #22995E; }
  .cp-gate-cta-secondary {
    display: inline-flex; align-items: center; padding: 12px 28px;
    border: 1px solid rgba(255,255,255,.1); color: rgba(255,255,255,.6);
    font-size: 13px; text-decoration: none; transition: all .15s;
  }
  .cp-gate-cta-secondary:hover { border-color: rgba(255,255,255,.3); color: #fff; }

  /* Empty state banner */
  .cp-empty-banner {
    max-width: 1200px; margin: 0 auto; padding: 0 48px;
  }
  .cp-empty-banner-inner {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    background: rgba(45,189,116,.04); border: 1px solid rgba(45,189,116,.15);
    border-radius: 8px; padding: 16px 20px;
  }
  .cp-empty-banner-title {
    font-family: var(--sans); font-size: 14px; font-weight: 600; color: var(--ink); margin-bottom: 3px;
  }
  .cp-empty-banner-sub {
    font-family: var(--sans); font-size: 12px; color: var(--ink-3); line-height: 1.5;
  }
  .cp-empty-banner-btn {
    display: flex; align-items: center; gap: 6px; flex-shrink: 0;
    font-family: var(--sans); font-size: 12px; font-weight: 600; color: var(--green);
    background: none; border: 1px solid var(--green); border-radius: 4px;
    padding: 8px 16px; cursor: pointer; white-space: nowrap; transition: all .15s;
  }
  .cp-empty-banner-btn:hover { background: rgba(45,189,116,.06); }

  /* Loading skeleton */
  @keyframes cp-shimmer { to { background-position: -200% 0; } }
  .cp-skel {
    height: 14px; width: 60px; border-radius: 3px;
    background: linear-gradient(90deg, var(--rule) 25%, rgba(0,0,0,.04) 50%, var(--rule) 75%);
    background-size: 200% 100%; animation: cp-shimmer 1.5s infinite;
  }

  /* ── Best / Worst highlighting ─────────────────────────────────────── */
  .cp-best { background: rgba(45,189,116,.06); }
  .cp-worst { background: rgba(245,158,11,.06); }

  /* ── Breadcrumb ──────────────────────────────────────────────────── */
  .cp-breadcrumb {
    position: sticky; top: 52px; z-index: 501;
    background: rgba(15,37,56,.92); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(255,255,255,.06);
  }
  .cp-breadcrumb-inner {
    max-width: 1200px; margin: 0 auto; padding: 10px 48px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .cp-breadcrumb-trail {
    display: flex; align-items: center; gap: 8px;
    font-family: var(--sans); font-size: 12px; color: rgba(255,255,255,.35);
  }
  .cp-breadcrumb-trail a { color: rgba(255,255,255,.35); text-decoration: none; transition: color .15s; }
  .cp-breadcrumb-trail a:hover { color: rgba(255,255,255,.75); }
  .cp-breadcrumb-trail .sep { font-size: 10px; }
  .cp-breadcrumb-trail .current { color: rgba(255,255,255,.6); }
  .cp-breadcrumb-actions { display: flex; align-items: center; gap: 8px; }
  .cp-share-btn {
    display: flex; align-items: center; gap: 6px;
    background: none; border: 1px solid rgba(255,255,255,.12); border-radius: 4px;
    color: rgba(255,255,255,.5); font-family: var(--sans); font-size: 11px; font-weight: 500;
    padding: 5px 12px; cursor: pointer; transition: all .15s;
  }
  .cp-share-btn:hover { border-color: rgba(255,255,255,.3); color: rgba(255,255,255,.8); }
  .cp-share-btn.copied { border-color: var(--green-3); color: var(--green-3); }

  /* ── Section entry animations ────────────────────────────────────── */
  @keyframes cp-section-enter {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .cp-section-card {
    animation: cp-section-enter 0.4s ease-out both;
  }

  /* ── Long text truncation ────────────────────────────────────────── */
  .cp-truncate-cell {
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
    overflow: hidden; font-family: var(--sans); font-size: 12px; color: var(--ink-2);
    line-height: 1.5; max-width: 200px;
  }

  /* ── Mobile ─────────────────────────────────────────────────────────── */
  /* ── Tablet (≤ 960px) ──────────────────────────────────────────── */
  @media (max-width: 960px) {
    .cp-jump-nav { padding: 0 24px; }
    .cp-breadcrumb-inner { padding: 10px 24px; }
    .cp-firm-bar-inner { padding: 0 16px; }
    .cp-firm-slot { padding: 10px 12px; }
    .cp-firm-name { font-size: 11px; max-width: 80px; }
    .cp-table-wrap { padding: 0 16px 40px; }
    .cp-row-label { font-size: 11px; min-width: 120px; padding: 10px 12px; }
    .cp-row-cell { padding: 10px 12px; }
    .cp-section-head { padding: 14px 16px 10px; }
    .cp-fee-section { padding: 0 16px; }
    .cp-similar-grid { grid-template-columns: repeat(2, 1fr); }
  }

  /* ── Mobile (≤ 768px) ──────────────────────────────────────────── */
  @media (max-width: 768px) {
    .cp-jump-nav { padding: 0 16px; }
    .cp-breadcrumb-inner { padding: 8px 16px; }
    .cp-jump-bar { top: 55px; }
    .cp-firm-bar { top: 95px; }
    .cp-breadcrumb-trail { font-size: 11px; }
    .cp-firm-bar-inner { padding: 0 8px; gap: 4px; }
    .cp-firm-slot { min-width: 0; padding: 8px 6px; }
    .cp-firm-name { font-size: 10px; max-width: 60px; }
    .cp-firm-avatar { width: 20px; height: 20px; font-size: 8px; }
    .cp-table-wrap { padding: 0 8px 32px; }
    .cp-section-card { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .cp-row { min-width: 600px; }
    .cp-row-label { font-size: 11px; min-width: 100px; }
    .cp-row-cell { font-size: 12px; min-width: 100px; }
    .cp-section-head { flex-wrap: wrap; gap: 4px; }
    .cp-section-title { font-size: 16px; }
    .cp-section-meta { font-size: 10px; }
    .cp-fee-section { padding: 0 8px; }
    .cp-fee-input-row { flex-direction: column; gap: 12px; padding: 16px; }
    .cp-fee-input-row .cp-slider-wrap { width: 100%; }
    .cp-gate-card { top: 140px; padding: 28px 20px; max-width: calc(100% - 32px); }
    .cp-gate-ctas { flex-wrap: nowrap; }
    .cp-gate-cta-primary, .cp-gate-cta-secondary { padding: 12px 16px; font-size: 12px; white-space: nowrap; }
    .cp-empty-banner { padding: 0 16px; }
    .cp-empty-banner-inner { flex-direction: column; text-align: center; }
    .cp-search-card { margin: 0 16px; }
    .cp-similar-grid { grid-template-columns: 1fr; }
    .cp-share-btn span { display: none; }
  }

  /* ── Reduced motion ──────────────────────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    .cp-section-card { animation: none; }
    .cp-alloc-seg { transition: none; }
    .cp-split-disc, .cp-split-nondisc { transition: none; }
    .cp-skel { animation: none; background: var(--rule); }
  }

  /* ── Similar Firms ───────────────────────────────────────────────── */
  .cp-similar-section { max-width: 1200px; margin: 0 auto; padding: 0 48px 24px; }
  .cp-similar-card {
    background: #fff; border: 0.5px solid var(--rule); border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.03);
  }
  .cp-similar-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 0;
  }
  .cp-similar-item {
    padding: 16px 20px; border-bottom: 0.5px solid var(--rule);
    border-right: 0.5px solid var(--rule);
    display: flex; align-items: center; gap: 14;
    transition: background .15s;
  }
  .cp-similar-item:hover { background: rgba(26,122,74,.02); }
  .cp-similar-item:nth-child(3n) { border-right: none; }
  .cp-similar-info { flex: 1; min-width: 0; }
  .cp-similar-name {
    font-family: var(--sans); font-size: 13px; font-weight: 600; color: var(--ink);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .cp-similar-loc { font-family: var(--sans); font-size: 11px; color: var(--ink-3); margin-top: 2px; }
  .cp-similar-why { font-family: var(--mono); font-size: 9px; color: var(--green); margin-top: 3px; letter-spacing: .03em; }
  .cp-similar-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
  .cp-similar-add {
    background: none; border: 1px solid var(--rule); border-radius: 4px;
    font-family: var(--sans); font-size: 11px; font-weight: 600; color: var(--green);
    padding: 5px 12px; cursor: pointer; transition: all .15s; white-space: nowrap;
  }
  .cp-similar-add:hover { background: rgba(45,189,116,.06); border-color: var(--green); }

  /* ── Stacked bar (asset allocation) ────────────────────────── */
  .cp-alloc-bar { display: flex; height: 20px; border-radius: 4px; overflow: hidden; width: 100%; }
  .cp-alloc-seg { transition: width .6s cubic-bezier(.16,1,.3,1); }
  .cp-alloc-legend { display: flex; flex-wrap: wrap; gap: 4px 10px; margin-top: 6px; }
  .cp-alloc-legend-item {
    display: flex; align-items: center; gap: 4px;
    font-family: var(--mono); font-size: 9px; color: var(--ink-3);
  }
  .cp-alloc-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

  /* ── Services grid ─────────────────────────────────────────── */
  .cp-svc-check { color: var(--green); font-weight: 700; font-size: 13px; }
  .cp-svc-x { color: var(--rule); font-size: 13px; }

  /* ── AUM split bar ─────────────────────────────────────────── */
  .cp-split-bar { display: flex; height: 8px; border-radius: 4px; overflow: hidden; width: 100%; background: var(--rule); }
  .cp-split-disc { background: var(--green); transition: width .6s ease; }
  .cp-split-nondisc { background: var(--amber); transition: width .6s ease; }
  .cp-split-labels { display: flex; justify-content: space-between; margin-top: 4px; font-family: var(--mono); font-size: 9px; color: var(--ink-3); }

  /* ── Percentile tag ────────────────────────────────────────── */
  .cp-pctile {
    font-family: var(--mono); font-size: 9px; font-weight: 500;
    color: var(--ink-3); letter-spacing: .02em;
    white-space: nowrap; display: block; margin-top: 2px;
  }
  .cp-pctile-high { color: var(--green); }
  .cp-val-stack { display: flex; flex-direction: column; align-items: center; }

  /* ── Philosophy truncate ───────────────────────────────────── */
  .cp-philosophy {
    font-family: var(--sans); font-size: 11px; color: var(--ink-2);
    line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3;
    -webkit-box-orient: vertical; overflow: hidden;
  }

  /* ── Website link ──────────────────────────────────────────── */
  .cp-web-link {
    font-family: var(--mono); font-size: 11px; color: var(--green);
    text-decoration: none; word-break: break-all;
  }
  .cp-web-link:hover { text-decoration: underline; }

  /* ── Firm logo in header ───────────────────────────────────── */
  .cp-firm-logo {
    height: 26px; max-width: 56px; flex-shrink: 0; border-radius: 4px;
    background: rgba(255,255,255,.95); border: 1px solid rgba(255,255,255,.15);
    overflow: hidden; display: grid; place-items: center; padding: 2px 4px;
  }
  .cp-firm-logo img { max-width: 100%; max-height: 100%; object-fit: contain; }

  /* ── Client comp bars ──────────────────────────────────────── */
  .cp-client-bar { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
  .cp-client-bar-label { font-family: var(--sans); font-size: 10px; color: var(--ink-3); width: 80px; flex-shrink: 0; text-align: right; }
  .cp-client-bar-track { flex: 1; height: 6px; background: var(--rule); border-radius: 3px; overflow: hidden; }
  .cp-client-bar-fill { height: 100%; border-radius: 3px; background: var(--green); transition: width .5s ease; }
  .cp-client-bar-count { font-family: var(--mono); font-size: 9px; color: var(--ink-3); width: 30px; }

  /* ── Firm Overview ─────────────────────────────────────────── */
  /* Uses standard row/column table layout (DataRow, ScoreRow, etc.) */
`;

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function SectionCard({ id, title, meta, children }: {
  id: string; title: string; meta: string; children: React.ReactNode;
}) {
  return (
    <div className="cp-section-card" id={id} style={{ scrollMarginTop: 180 }}>
      <div className="cp-section-head">
        <span className="cp-section-title">{title}</span>
        <span className="cp-section-meta">{meta}</span>
      </div>
      {children}
    </div>
  );
}

function ScoreRow({
  label, tip, strong, scores, ring, percentiles,
}: {
  label: string; tip?: string; strong?: boolean; scores: (number | null)[]; ring?: boolean; percentiles?: (string | null)[];
}) {
  // Best/worst highlighting when 2+ non-null scores
  const valid = scores.filter((s): s is number => s != null);
  const best = valid.length >= 2 ? Math.max(...valid) : null;
  const worst = valid.length >= 2 ? Math.min(...valid) : null;
  const allSame = best === worst;

  return (
    <div className="cp-row">
      <div className={`cp-row-label${strong ? ' strong' : ''}`}>
        {label}
        {tip && <span className="cp-tip" title={tip}>ⓘ</span>}
      </div>
      {Array.from({ length: 4 }).map((_, col) => {
        const score = col < scores.length ? scores[col] : null;
        const pct = toPercent(score);
        const color = scoreColor(pct);
        const isBest = !allSame && score != null && score === best;
        const isWorst = !allSame && score != null && score === worst;
        const pctile = percentiles && col < percentiles.length ? percentiles[col] : null;
        return (
          <div key={col} className={`cp-row-cell${isBest ? ' cp-best' : ''}${isWorst ? ' cp-worst' : ''}`} style={pctile ? { flexDirection: 'column', gap: 2 } : undefined}>
            {score != null ? (
              ring ? (
                <>
                  <MiniRing score={score} />
                  {pctile && <span className="cp-pctile">{pctile}</span>}
                </>
              ) : (
                <div className="cp-score-bar">
                  <span className="cp-score-num" style={{ fontSize: strong ? 19 : 15, color }}>{Math.round(score)}</span>
                  <div className="cp-score-track">
                    <div className="cp-score-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              )
            ) : (
              <span className="val-dash">—</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MiniRing({ score }: { score: number }) {
  const r = 17, circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = scoreColor(score);
  return (
    <div className="cp-mini-ring">
      <svg width="42" height="42" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r={r} fill="none" stroke="var(--rule)" strokeWidth="3" />
        <circle cx="21" cy="21" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="cp-mini-ring-label" style={{ color }}>{score}</span>
    </div>
  );
}

function DataRow({ label, values, strong, serif, tag, textLeft }: {
  label: string; values: string[]; strong?: boolean; serif?: boolean; tag?: boolean; textLeft?: boolean;
}) {
  return (
    <div className="cp-row">
      <div className={`cp-row-label${strong ? ' strong' : ''}`}>{label}</div>
      {Array.from({ length: 4 }).map((_, col) => {
        const val = col < values.length ? values[col] : null;
        const isEmpty = val == null || val === '—' || val === 'N/A' || val === '';
        return (
          <div key={col} className={`cp-row-cell${textLeft && !isEmpty ? ' text-left' : ''}`}>
            {isEmpty ? (
              <span className="val-dash">—</span>
            ) : tag ? (
              <span className={`val-tag ${val === 'None' || val === 'No' || val === 'Clean' ? 'good' : 'warn'}`}>{val}</span>
            ) : serif !== false ? (
              <span className="val-serif">{val}</span>
            ) : (
              <span className="val-mono">{val}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DataRowWithPctile({ label, values, percentiles, strong, serif }: {
  label: string; values: string[]; percentiles: (string | null)[]; strong?: boolean; serif?: boolean;
}) {
  return (
    <div className="cp-row">
      <div className={`cp-row-label${strong ? ' strong' : ''}`}>{label}</div>
      {Array.from({ length: 4 }).map((_, col) => {
        const val = col < values.length ? values[col] : null;
        const pctile = col < percentiles.length ? percentiles[col] : null;
        const isEmpty = val == null || val === '—' || val === 'N/A' || val === '';
        // Decile >= 70th is "high"
        const isHigh = pctile ? parseInt(pctile) >= 70 : false;
        return (
          <div key={col} className="cp-row-cell">
            {isEmpty ? (
              <span className="val-dash">—</span>
            ) : (
              <div className="cp-val-stack">
                {serif !== false ? (
                  <span className="val-serif">{val}</span>
                ) : (
                  <span className="val-mono">{val}</span>
                )}
                {pctile && <span className={`cp-pctile${isHigh ? ' cp-pctile-high' : ''}`}>{pctile}</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ViewProfileRow({ firms }: { firms: FirmComparison[] }) {
  return (
    <div className="cp-view-profile">
      <div />
      {Array.from({ length: 4 }).map((_, col) => {
        const firm = col < firms.length ? firms[col] : null;
        return firm ? (
          <Link key={col} href={`/firm/${firm.crd}`}>View Profile →</Link>
        ) : <div key={col} />;
      })}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="cp-row">
      <div className="cp-row-label"><div className="cp-skel" style={{ width: 80 }} /></div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="cp-row-cell"><div className="cp-skel" /></div>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function ComparePage() {
  const [query, setQuery] = useState('');

  const [results, setResults] = useState<FirmBasic[]>([]);
  const [selected, setSelected] = useState<FirmBasic[]>([]);
  const [comparisonData, setComparisonData] = useState<FirmComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [initialLoad, setInitialLoad] = useState(true);
  const [feeInput, setFeeInput] = useState('10,000,000');
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [activeSection, setActiveSection] = useState('overview');
  const [copied, setCopied] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [similarFirms, setSimilarFirms] = useState<{ crd: number; name: string; city: string | null; state: string; aum: number | null; score: number | null; reason: string }[]>([]);
  const [popularFirms, setPopularFirms] = useState<{ crd: number; name: string; city: string | null; state: string | null; aum: number | null; score: number | null }[]>([]);
  const [savedFirms, setSavedFirms] = useState<{ crd: number; name: string; city: string | null; state: string | null; aum: number | null; score: number | null }[]>([]);
  const [emptyQuery, setEmptyQuery] = useState('');
  const [emptyResults, setEmptyResults] = useState<FirmBasic[]>([]);
  const [emptySelectedIdx, setEmptySelectedIdx] = useState(-1);

  // Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  // Fetch popular firms (top-scored) for empty state
  useEffect(() => {
    if (selected.length > 0) return;
    (async () => {
      const { data: topScores } = await supabase
        .from('firm_scores')
        .select('crd, final_score')
        .not('final_score', 'is', null)
        .order('final_score', { ascending: false })
        .limit(6);
      if (!topScores || topScores.length === 0) return;
      const crds = topScores.map(s => s.crd);
      const [{ data: firmData }, { data: nameData }] = await Promise.all([
        supabase.from('firmdata_current').select('crd, primary_business_name, main_office_city, main_office_state, aum').in('crd', crds),
        supabase.from('firm_names').select('crd, display_name').in('crd', crds),
      ]);
      const firmMap = new Map((firmData || []).map(f => [f.crd, f]));
      const nameMap = new Map((nameData || []).map(n => [n.crd, n.display_name]));
      const merged = topScores.map(s => {
        const f = firmMap.get(s.crd);
        const titleCase = (str: string | null) => str?.replace(/\b\w+/g, w => {
            const lower = w.toLowerCase();
            if (w.length <= 3 && w === w.toUpperCase() && /[A-Z]/.test(w)) return w;
            return ['and','of','the','for','in','on','at','to','by','llc','llp','inc'].includes(lower)
              ? lower : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
          }) || null;
        return {
          crd: s.crd,
          name: titleCase(nameMap.get(s.crd) || f?.primary_business_name || null) || `CRD #${s.crd}`,
          city: titleCase(f?.main_office_city as string | null),
          state: f?.main_office_state as string | null,
          aum: (f?.aum as number | null) ?? null,
          score: s.final_score != null ? Math.round(s.final_score) : null,
        };
      }).filter(f => f.score != null);
      setPopularFirms(merged);
    })();
  }, [selected.length]);

  // Fetch saved firms for empty state (if logged in)
  useEffect(() => {
    if (selected.length > 0 || !session) return;
    (async () => {
      const { data: favs } = await supabase
        .from('user_favorites')
        .select('crd')
        .order('created_at', { ascending: false })
        .limit(6);
      if (!favs || favs.length === 0) { setSavedFirms([]); return; }
      const crds = favs.map(f => f.crd);
      const [{ data: firmData }, { data: nameData }, { data: scoreData }] = await Promise.all([
        supabase.from('firmdata_current').select('crd, primary_business_name, main_office_city, main_office_state, aum').in('crd', crds),
        supabase.from('firm_names').select('crd, display_name').in('crd', crds),
        supabase.from('firm_scores').select('crd, final_score').in('crd', crds),
      ]);
      const firmMap = new Map((firmData || []).map(f => [f.crd, f]));
      const nameMap = new Map((nameData || []).map(n => [n.crd, n.display_name]));
      const scoreMap = new Map((scoreData || []).map(s => [s.crd, s.final_score]));
      const titleCase = (str: string | null) => str?.replace(/\b\w+/g, w => {
            const lower = w.toLowerCase();
            if (w.length <= 3 && w === w.toUpperCase() && /[A-Z]/.test(w)) return w;
            return ['and','of','the','for','in','on','at','to','by','llc','llp','inc'].includes(lower)
              ? lower : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
          }) || null;
      const merged = crds.map(crd => {
        const f = firmMap.get(crd);
        return {
          crd,
          name: titleCase(nameMap.get(crd) || f?.primary_business_name || null) || `CRD #${crd}`,
          city: titleCase(f?.main_office_city as string | null),
          state: f?.main_office_state as string | null,
          aum: (f?.aum as number | null) ?? null,
          score: scoreMap.get(crd) != null ? Math.round(scoreMap.get(crd)!) : null,
        };
      });
      setSavedFirms(merged);
    })();
  }, [selected.length, session]);

  // Debounced search for empty state inline search
  useEffect(() => {
    if (emptyQuery.length < 2) { setEmptyResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('firmdata_current')
        .select('crd, primary_business_name')
        .ilike('primary_business_name', `%${emptyQuery}%`)
        .limit(8);
      if (!data) { setEmptyResults([]); return; }
      const crds = data.map(d => d.crd);
      const { data: names } = await supabase.from('firm_names').select('crd, display_name').in('crd', crds);
      const nameMap = new Map((names || []).map(n => [n.crd, n.display_name]));
      setEmptyResults(data.filter(d => d.primary_business_name).map(d => ({
        crd: d.crd,
        primary_business_name: d.primary_business_name!,
        display_name: nameMap.get(d.crd) || null,
      })) as FirmBasic[]);
    }, 300);
    return () => clearTimeout(timer);
  }, [emptyQuery]);

  // Handle ?add=CRD or ?crds=CRD1,CRD2 or ?firms=CRD1,CRD2
  useEffect(() => {
    if (!initialLoad) return;
    const params = new URLSearchParams(window.location.search);
    const addCrds = params.get('add') || params.get('crds') || params.get('firms');
    if (addCrds) {
      const crds = addCrds.split(',').map(c => parseInt(c)).filter(c => !isNaN(c));
      if (crds.length > 0) {
        Promise.all([
          supabase.from('firmdata_current').select('crd, primary_business_name').in('crd', crds),
          supabase.from('firm_names').select('crd, display_name').in('crd', crds),
        ]).then(([{ data }, { data: names }]) => {
          if (data && data.length > 0) {
            const nameMap = new Map((names || []).map(n => [n.crd, n.display_name]));
            const firms = data.map(d => ({ crd: d.crd, primary_business_name: d.primary_business_name!, display_name: nameMap.get(d.crd) || null }));
            setSelected(firms.slice(0, 4));
          }
        });
        window.history.replaceState(null, '', '/compare');
      }
    }
    setInitialLoad(false);
  }, [initialLoad]);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('firmdata_current')
        .select('crd, primary_business_name')
        .ilike('primary_business_name', `%${query}%`)
        .limit(10);
      if (!data) { setResults([]); return; }
      const crds = data.map(d => d.crd);
      const { data: names } = await supabase.from('firm_names').select('crd, display_name').in('crd', crds);
      const nameMap = new Map((names || []).map(n => [n.crd, n.display_name]));
      setResults(data.filter(d => d.primary_business_name).map(d => ({
        crd: d.crd,
        primary_business_name: d.primary_business_name!,
        display_name: nameMap.get(d.crd) || null,
      })) as FirmBasic[]);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch comparison data — parallel across all firms
  const fetchComparison = useCallback(async () => {
    if (selected.length === 0) { setComparisonData([]); return; }
    setLoading(true);
    const crds = selected.map(s => s.crd);

    // Parallel batch queries for all firms at once
    const [
      { data: allCurrent },
      { data: allFees },
      { data: allProfiles },
      { data: allWeb },
      { data: allScores },
      { data: allFeesAndMins },
      { data: allGrowth },
      { data: allGrowthRank },
      { data: allLogos },
      { count: totalFirmCount },
    ] = await Promise.all([
      supabase.from('firmdata_current').select('crd, aum, aum_discretionary, aum_non_discretionary, employee_total, employee_investment, main_office_city, main_office_state, client_hnw_number, client_non_hnw_number, client_pension_number, client_charitable_number, client_corporations_number, client_pooled_vehicles_number, client_other_number, client_banks_number, client_bdc_number, client_govt_number, client_insurance_number, client_investment_cos_number, client_other_advisors_number, client_swf_number, legal_structure, private_fund_advisor, latest_adv_filing, number_of_offices, asset_allocation_cash, asset_allocation_derivatives, asset_allocation_ig_corp_bonds, asset_allocation_non_ig_corp_bonds, asset_allocation_public_equity_direct, asset_allocation_private_equity_direct, asset_allocation_us_govt_bonds, asset_allocation_us_muni_bonds, asset_allocation_other, services_financial_planning, services_mgr_selection, services_pension_consulting, services_port_management_individuals, services_port_management_institutional, services_port_management_pooled, state_ak, state_al, state_ar, state_az, state_ca, state_co, state_ct, state_dc, state_de, state_fl, state_ga, state_hi, state_ia, state_id, state_il, state_in, state_ks, state_ky, state_la, state_ma, state_md, state_me, state_mi, state_mn, state_mo, state_ms, state_mt, state_nc, state_nd, state_ne, state_nh, state_nj, state_nm, state_nv, state_ny, state_oh, state_ok, state_or, state_pa, state_ri, state_sc, state_sd, state_tn, state_tx, state_ut, state_va, state_vt, state_wa, state_wi, state_wv, disclosure_firm_felony_charge, disclosure_firm_felony_conviction, disclosure_firm_misdemenor_charge, disclosure_firm_misdemenor_conviction, disclosure_firm_federal_violations, disclosure_firm_federal_revoke, disclosure_firm_federal_suspension_restrictions, disclosure_firm_federal_false_statement, disclosure_firm_federal_investment_order_10_years, disclosure_firm_current_regulatory_proceedings, disclosure_firm_suspension_revoked, disclosure_firm_sec_cftc_violations, disclosure_firm_sec_cftc_monetary_penalty, disclosure_firm_sec_cftc_suspension_restrictions, disclosure_firm_sec_cftc_false_statement, disclosure_firm_sec_cftc_investment_order, disclosure_firm_self_regulatory_violation, disclosure_firm_self_regulatory_discipline, disclosure_firm_self_regulatory_suspension_restrictions, disclosure_firm_self_regulatory_false_statement, disclosure_firm_court_ruling_violation, disclosure_firm_court_ruling_investment, disclosure_firm_court_ruling_ongoing_litigation, disclosure_firm_court_ruling_dismissal').in('crd', crds),
      supabase.from('firmdata_feetiers').select('crd, fee_pct, min_aum, max_aum').in('crd', crds),
      supabase.from('firmdata_profile_text').select('crd, wealth_tier, client_base, investment_philosophy, firm_character').in('crd', crds),
      supabase.from('firmdata_website').select('crd, website').in('crd', crds),
      supabase.from('firm_scores').select('*').in('crd', crds),
      supabase.from('firmdata_feesandmins').select('crd, fee_structure_type, minimum_account_size, fee_range_min, fee_range_max, minimum_fee').in('crd', crds),
      supabase.from('firmdata_growth').select('crd, aum, date_submitted').in('crd', crds).order('date_submitted', { ascending: true }),
      supabase.from('firmdata_growth_rate_rankings').select('crd, aum_1y_growth_annualized, aum_5y_growth_annualized, aum_10y_growth_annualized, clients_1y_growth_annualized, clients_5y_growth_annualized, clients_10y_growth_annualized, rank_current_aum, rank_current_employees, rank_current_invest_employees, rank_current_clients, rank_aum_1y_growth_annualized, rank_aum_5y_growth_annualized, rank_aum_10y_growth_annualized, rank_clients_1y_growth_annualized, rank_clients_5y_growth_annualized').in('crd', crds),
      supabase.from('firm_logos').select('crd, logo_key').eq('has_logo', true).in('crd', crds),
      supabase.from('firmdata_growth_rate_rankings').select('*', { count: 'exact', head: true }),
    ]);

    // Index by CRD
    const currentMap = new Map((allCurrent || []).map(r => [r.crd, r]));
    const profileMap = new Map((allProfiles || []).map(r => [r.crd, r]));
    const webMap = new Map((allWeb || []).map(r => [r.crd, r]));
    const scoreMap = new Map((allScores || []).map(r => [r.crd, r]));
    const feesMinMap = new Map((allFeesAndMins || []).map(r => [r.crd, r]));
    const growthRankMap = new Map((allGrowthRank || []).map(r => [r.crd, r]));
    const logoMap = new Map((allLogos || []).map(r => [r.crd, r.logo_key]));

    // Percentile helper: rank 1 = best → "Top 1%", using non-null totals per column
    // Get non-null counts for specific rank columns (run in parallel)
    const rankCols = ['rank_current_aum', 'rank_current_employees', 'rank_current_invest_employees', 'rank_current_clients', 'rank_aum_1y_growth_annualized', 'rank_aum_5y_growth_annualized', 'rank_clients_1y_growth_annualized'] as const;
    const rankTotals = new Map<string, number>();
    const allRankCols = [...rankCols, 'rank_aum_10y_growth_annualized', 'rank_clients_5y_growth_annualized'];
    await Promise.all(allRankCols.map(async (col) => {
      try {
        const { count } = await supabase.from('firmdata_growth_rate_rankings').select('*', { count: 'exact', head: true }).not(col, 'is', null);
        if (count != null) rankTotals.set(col, count);
      } catch { /* column may not exist */ }
    }));
    const rankToDecile = (rank: unknown, col: string): string | null => {
      const r = typeof rank === 'string' ? parseInt(rank) : Number(rank);
      const total = rankTotals.get(col);
      if (isNaN(r) || !total || total === 0) return null;
      const pct = (r / total) * 100;
      // Round to nearest decile (10th, 20th, ... 90th)
      const decile = Math.min(Math.max(Math.round((100 - pct) / 10) * 10, 10), 90);
      return `${decile}th percentile`;
    };

    // Score percentile: for each firm, count how many firms score higher
    const { count: totalScored } = await supabase.from('firm_scores').select('*', { count: 'exact', head: true }).not('final_score', 'is', null);
    const scorePercentileMap = new Map<number, string | null>();
    await Promise.all(selected.map(async (firm) => {
      const s = scoreMap.get(firm.crd);
      const fs = s?.final_score;
      if (fs == null || !totalScored) { scorePercentileMap.set(firm.crd, null); return; }
      const { count: above } = await supabase.from('firm_scores').select('*', { count: 'exact', head: true }).gt('final_score', fs);
      const rank = (above ?? 0) + 1;
      const pct = (rank / totalScored) * 100;
      const decile = Math.min(Math.max(Math.round((100 - pct) / 10) * 10, 10), 90);
      scorePercentileMap.set(firm.crd, `${decile}th percentile`);
    }));

    // Group fees and growth by CRD
    const feesByCrd = new Map<number, typeof allFees>();
    (allFees || []).forEach(f => {
      if (!feesByCrd.has(f.crd)) feesByCrd.set(f.crd, []);
      feesByCrd.get(f.crd)!.push(f);
    });
    const growthByCrd = new Map<number, typeof allGrowth>();
    (allGrowth || []).forEach(g => {
      if (!growthByCrd.has(g.crd)) growthByCrd.set(g.crd, []);
      growthByCrd.get(g.crd)!.push(g);
    });

    // Pre-compute derived percentiles (clients_per_advisor, avg_client_size) from firmdata_percentiles
    // Fetch all firms' aum + client_total for avg client size ranking
    const { data: allPctRows } = await supabase.from('firmdata_percentiles').select('aum, client_total').not('aum', 'is', null).not('client_total', 'is', null).gt('client_total', 0);
    const allAvgClients = (allPctRows || []).map(r => r.aum / r.client_total).sort((a, b) => a - b);

    const derivedPctileMap = new Map<number, { clientsPerAdvisor: string | null; avgClient: string | null }>();
    await Promise.all(selected.map(async (firm) => {
      const c = currentMap.get(firm.crd);
      if (!c) return;
      const pn = (v: unknown): number | null => { if (v == null) return null; const n = typeof v === 'string' ? parseFloat(v) : Number(v); return isNaN(n) ? null : n; };
      const empInv = pn(c.employee_investment);
      const aumVal = pn(c.aum);
      const clientFields = ['client_hnw_number', 'client_non_hnw_number', 'client_pension_number', 'client_charitable_number', 'client_corporations_number', 'client_pooled_vehicles_number', 'client_other_number'];
      const tc = clientFields.reduce((sum, f) => sum + (pn((c as Record<string, unknown>)[f]) || 0), 0);

      const cpa = (tc > 0 && empInv && empInv > 0) ? tc / empInv : null;
      const avgCs = (aumVal && tc > 0) ? aumVal / tc : null;

      const result: { clientsPerAdvisor: string | null; avgClient: string | null } = { clientsPerAdvisor: null, avgClient: null };

      // Avg client size percentile (computed client-side from pre-fetched data)
      if (avgCs != null && allAvgClients.length > 0) {
        const below = allAvgClients.filter(v => v < avgCs).length;
        const rawPct = Math.round((below / allAvgClients.length) * 100);
        const decile = Math.min(Math.max(Math.round(rawPct / 10) * 10, 10), 90);
        result.avgClient = `${decile}th percentile`;
      }

      const queries: Array<{ key: 'clientsPerAdvisor' | 'avgClient'; col: string; val: number | null; invert?: boolean }> = [
        { key: 'clientsPerAdvisor', col: 'clients_per_advisor', val: cpa, invert: true },
      ];
      await Promise.all(queries.map(async (q) => {
        if (q.val == null) return;
        const [{ count: below }, { count: total }] = await Promise.all([
          supabase.from('firmdata_percentiles').select('*', { count: 'exact', head: true }).lt(q.col, q.val).not(q.col, 'is', null),
          supabase.from('firmdata_percentiles').select('*', { count: 'exact', head: true }).not(q.col, 'is', null),
        ]);
        if (total && total > 0) {
          const rawPct = Math.round(((below ?? 0) / total) * 100);
          const pct = q.invert ? (100 - rawPct) : rawPct;
          const decile = Math.min(Math.max(Math.round(pct / 10) * 10, 10), 90);
          result[q.key] = `${decile}th percentile`;
        }
      }));
      derivedPctileMap.set(firm.crd, result);
    }));

    const data: FirmComparison[] = selected.map(firm => {
      const current = currentMap.get(firm.crd);
      const profile = profileMap.get(firm.crd);
      const web = webMap.get(firm.crd);
      const score = scoreMap.get(firm.crd);
      const feesMin = feesMinMap.get(firm.crd);
      const fees = feesByCrd.get(firm.crd) || [];
      const growthRows = growthByCrd.get(firm.crd) || [];

      // Parse numeric fields (may come as strings from bigint columns)
      const parseNum = (v: unknown): number | null => {
        if (v == null) return null;
        const n = typeof v === 'string' ? parseFloat(v) : Number(v);
        return isNaN(n) ? null : n;
      };

      const aum = parseNum(current?.aum);
      const empTotal = parseNum(current?.employee_total);
      const empInv = parseNum(current?.employee_investment);
      const minAcct = parseNum(feesMin?.minimum_account_size);

      // Total clients
      const totalClients = current ? (
        (parseNum(current.client_hnw_number) || 0) + (parseNum(current.client_non_hnw_number) || 0) +
        (parseNum(current.client_pension_number) || 0) + (parseNum(current.client_charitable_number) || 0) +
        (parseNum(current.client_corporations_number) || 0) + (parseNum(current.client_pooled_vehicles_number) || 0) +
        (parseNum(current.client_other_number) || 0)
      ) : 0;

      const avgClientRaw = aum && totalClients > 0 ? aum / totalClients : null;
      const avgClientSize = avgClientRaw ? formatAUM(avgClientRaw) : '—';

      // AUM per advisor & clients per advisor
      const aumPerAdvisor = aum && empInv
        ? formatAUM(aum / empInv) : '—';
      const clientsPerAdvisor = totalClients > 0 && empInv
        ? Math.round(totalClients / empInv).toLocaleString() : '—';

      // Growth from rankings table (preferred) or fallback to manual calculation
      const gr = growthRankMap.get(firm.crd);
      const fmtGrowth = (v: unknown): string => {
        if (v == null) return '—';
        const n = typeof v === 'string' ? parseFloat(v) : Number(v);
        if (isNaN(n)) return '—';
        return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
      };

      let aumGrowth1yr = fmtGrowth(gr?.aum_1y_growth_annualized);
      let aumGrowth5yr = fmtGrowth(gr?.aum_5y_growth_annualized);
      const aumGrowth10yr = fmtGrowth(gr?.aum_10y_growth_annualized);
      const clientGrowth1yr = fmtGrowth(gr?.clients_1y_growth_annualized);
      const clientGrowth5yr = fmtGrowth(gr?.clients_5y_growth_annualized);

      // Fallback growth from firmdata_growth if rankings unavailable
      if (aumGrowth1yr === '—' && growthRows.length >= 2) {
        const byYear = new Map<number, number>();
        growthRows.forEach(g => {
          const parts = (g.date_submitted || '').split('/');
          if (parts.length !== 3) return;
          const year = parseInt(parts[2]);
          const a = typeof g.aum === 'string' ? parseFloat(g.aum.replace(/[$,]/g, '')) : g.aum;
          if (!isNaN(year) && a > 0) byYear.set(year, a);
        });
        const years = Array.from(byYear.entries()).sort((a, b) => a[0] - b[0]);
        if (years.length >= 2) {
          const latest = years[years.length - 1][1];
          const prev = years[years.length - 2][1];
          const pct1 = ((latest - prev) / prev * 100);
          aumGrowth1yr = `${pct1 >= 0 ? '+' : ''}${pct1.toFixed(1)}%`;
          if (years.length >= 6) {
            const fiveAgo = years[years.length - 6][1];
            const pct5 = ((latest - fiveAgo) / fiveAgo * 100);
            aumGrowth5yr = `${pct5 >= 0 ? '+' : ''}${pct5.toFixed(0)}%`;
          }
        }
      }

      // Fee structure type
      const feeType = feesMin?.fee_structure_type
        ? (FEE_TYPE_LABELS[feesMin.fee_structure_type] || feesMin.fee_structure_type)
        : (fees.length > 1 ? 'Tiered' : fees.length === 1 ? 'Flat Fee' : '—');

      const minFeeRate = fees.length > 0
        ? Math.min(...fees.filter((f: { fee_pct: number | null }) => f.fee_pct != null).map((f: { fee_pct: number | null }) => f.fee_pct!))
        : null;

      // Fee range from feesandmins
      const feeRangeMinVal = parseNum(feesMin?.fee_range_min);
      const feeRangeMaxVal = parseNum(feesMin?.fee_range_max);
      const minimumFeeVal = parseNum(feesMin?.minimum_fee);

      // Asset allocation
      const ALLOC_COLORS = ['#2DBD74', '#1A7A4A', '#22995E', '#6BB8E0', '#A0A0CC', '#7DC8A0', '#80B0D0', '#B0A0C8', '#70C0B0'];
      const ALLOC_FIELDS: [string, string][] = [
        ['Individual Stocks', 'asset_allocation_public_equity_direct'],
        ['US Treasury Bonds', 'asset_allocation_us_govt_bonds'],
        ['IG Corp Bonds', 'asset_allocation_ig_corp_bonds'],
        ['Non-IG Corp Bonds', 'asset_allocation_non_ig_corp_bonds'],
        ['US Municipal Bonds', 'asset_allocation_us_muni_bonds'],
        ['Private Equity', 'asset_allocation_private_equity_direct'],
        ['Cash & Equivalents', 'asset_allocation_cash'],
        ['Funds, ETFs, and Alternatives', 'asset_allocation_derivatives'],
        ['Other', 'asset_allocation_other'],
      ];
      const assetAllocation: AssetAlloc[] = current
        ? ALLOC_FIELDS.map(([label, field], i) => {
            const raw = parseNum((current as Record<string, unknown>)[field]);
            return raw && raw > 0 ? { label, pct: raw, color: ALLOC_COLORS[i] } : null;
          }).filter((a): a is AssetAlloc => a != null)
        : [];

      // Client composition — all 14 client type fields
      const CLIENT_FIELDS: [string, string][] = [
        ['High Net Worth', 'client_hnw_number'],
        ['Non-HNW Individuals', 'client_non_hnw_number'],
        ['Pension Plans', 'client_pension_number'],
        ['Charitable Orgs', 'client_charitable_number'],
        ['Corporations', 'client_corporations_number'],
        ['Pooled Vehicles', 'client_pooled_vehicles_number'],
        ['Banks', 'client_banks_number'],
        ['Insurance Cos', 'client_insurance_number'],
        ['Investment Cos', 'client_investment_cos_number'],
        ['Government', 'client_govt_number'],
        ['Other Advisors', 'client_other_advisors_number'],
        ['Sovereign Wealth', 'client_swf_number'],
        ['BDCs', 'client_bdc_number'],
        ['Other', 'client_other_number'],
      ];
      const clientBreakdown = current
        ? CLIENT_FIELDS.map(([label, field]) => {
            const count = parseNum((current as Record<string, unknown>)[field]) || 0;
            return { label, count };
          }).filter(c => c.count > 0).sort((a, b) => b.count - a.count).slice(0, 5)
        : [];

      // Services
      const services: Record<string, boolean> = {
        'Financial Planning': current?.services_financial_planning === 'Y',
        'Manager Selection': current?.services_mgr_selection === 'Y',
        'Pension Consulting': current?.services_pension_consulting === 'Y',
        'Individual Portfolios': current?.services_port_management_individuals === 'Y',
        'Institutional Mgmt': current?.services_port_management_institutional === 'Y',
        'Pooled Vehicles': current?.services_port_management_pooled === 'Y',
      };

      // AUM split
      const aumDisc = parseNum(current?.aum_discretionary);
      const aumNonDisc = parseNum(current?.aum_non_discretionary);

      // Filing freshness
      const latestFiling = current?.latest_adv_filing || '—';

      // Offices
      const offices = parseNum(current?.number_of_offices);

      return {
        crd: firm.crd,
        name: firm.display_name || firm.primary_business_name,
        location: current ? `${current.main_office_city || ''}, ${current.main_office_state || ''}` : '—',
        aum: formatAUM(aum),
        aumRaw: aum,
        employees: empTotal ? empTotal.toLocaleString() : '—',
        employeeInvestment: empInv,
        totalClients,
        avgClientSize,
        minAccount: minAcct ? formatAUM(minAcct) : '—',
        feeStructureType: feeType,
        feeMin: minFeeRate != null ? `${minFeeRate}%` : '—',
        feeRangeMin: feeRangeMinVal != null ? `${feeRangeMinVal}%` : '—',
        feeRangeMax: feeRangeMaxVal != null ? `${feeRangeMaxVal}%` : '—',
        minimumFee: minimumFeeVal != null ? formatCompact(minimumFeeVal) : '—',
        wealthTier: profile?.wealth_tier || '—',
        clientBase: profile?.client_base || '—',
        website: web?.website || '—',
        feeTiers: fees.length > 0
          ? fees as FeeTier[]
          : (feeRangeMinVal != null && feeRangeMaxVal != null && avgClientRaw
            ? synthesizeRangeTiers(feeRangeMinVal, feeRangeMaxVal, avgClientRaw)
            : feeRangeMaxVal != null
              ? [{ min_aum: '0', max_aum: null, fee_pct: feeRangeMaxVal }]
              : []),
        logoKey: logoMap.get(firm.crd) ?? null,
        // Scores
        finalScore: score?.final_score ?? null,
        scorePercentile: scorePercentileMap.get(firm.crd) ?? null,
        disclosureScore: score?.disclosure_score ?? null,
        feeTransparencyScore: score?.fee_transparency_score ?? null,
        feeCompetitivenessScore: score?.fee_competitiveness_score ?? null,
        conflictFreeScore: score?.conflict_free_score ?? null,
        aumGrowthScore: score?.aum_growth_score ?? null,
        clientGrowthScore: score?.client_growth_score ?? null,
        advisorBandwidthScore: score?.advisor_bandwidth_score ?? null,
        derivativesScore: score?.derivatives_score ?? null,
        // Growth
        aumGrowth1yr,
        aumGrowth5yr,
        aumGrowth10yr,
        clientGrowth1yr,
        clientGrowth5yr,
        aumPerAdvisor,
        clientsPerAdvisor,
        // Regulatory
        hasDisciplinary: (() => {
          if (!current) return '—';
          const allKeys = DISC_CATEGORIES.flatMap(c => c.keys);
          const flagCount = allKeys.filter(k => (current as Record<string, unknown>)[k] === 'Y' || (current as Record<string, unknown>)[k] === 'y').length;
          return flagCount > 0 ? `${flagCount} Disclosure${flagCount !== 1 ? 's' : ''}` : 'Clean';
        })(),
        privateFundAdvisor: current?.private_fund_advisor === 'Y' ? 'Yes' : 'No',
        legalStructure: current?.legal_structure || '—',
        disclosureData: current ? Object.fromEntries(
          DISC_CATEGORIES.flatMap(c => c.keys).map(k => [k, (current as Record<string, unknown>)[k] as string | null])
        ) : {},
        // New fields
        assetAllocation,
        clientBreakdown,
        services,
        aumDiscretionary: aumDisc,
        aumNonDiscretionary: aumNonDisc,
        aumPercentile: rankToDecile(gr?.rank_current_aum, 'rank_current_aum'),
        employeePercentile: rankToDecile(gr?.rank_current_employees, 'rank_current_employees'),
        invStaffPercentile: rankToDecile(gr?.rank_current_invest_employees, 'rank_current_invest_employees'),
        totalClientsPercentile: rankToDecile(gr?.rank_current_clients, 'rank_current_clients'),
        clientsPerAdvisorPercentile: derivedPctileMap.get(firm.crd)?.clientsPerAdvisor ?? null,
        aumGrowth1yrPercentile: rankToDecile(gr?.rank_aum_1y_growth_annualized, 'rank_aum_1y_growth_annualized'),
        aumGrowth5yrPercentile: rankToDecile(gr?.rank_aum_5y_growth_annualized, 'rank_aum_5y_growth_annualized'),
        aumGrowth10yrPercentile: rankToDecile(gr?.rank_aum_10y_growth_annualized, 'rank_aum_10y_growth_annualized'),
        clientGrowth1yrPercentile: rankToDecile(gr?.rank_clients_1y_growth_annualized, 'rank_clients_1y_growth_annualized'),
        clientGrowth5yrPercentile: rankToDecile(gr?.rank_clients_5y_growth_annualized, 'rank_clients_5y_growth_annualized'),
        avgClientPercentile: derivedPctileMap.get(firm.crd)?.avgClient ?? null,
        latestFiling,
        numOffices: offices ? offices.toLocaleString() : '—',
        registeredStates: current ? ['ak','al','ar','az','ca','co','ct','dc','de','fl','ga','hi','ia','id','il','in','ks','ky','la','ma','md','me','mi','mn','mo','ms','mt','nc','nd','ne','nh','nj','nm','nv','ny','oh','ok','or','pa','ri','sc','sd','tn','tx','ut','va','vt','wa','wi','wv'].filter(s => (current as Record<string, unknown>)[`state_${s}`] === 'Y').length : 0,
        investmentPhilosophy: profile?.investment_philosophy || '—',
        firmCharacter: profile?.firm_character || '—',
      };
    });

    setComparisonData(data);
    setLoading(false);
  }, [selected]);

  useEffect(() => { fetchComparison(); }, [fetchComparison]);

  // Fetch similar firms when comparison data changes
  useEffect(() => {
    if (comparisonData.length === 0 || selected.length >= 4) { setSimilarFirms([]); return; }
    const anchor = comparisonData[0]; // base similarity on the first firm
    if (!anchor.aumRaw) return;

    const selectedCrds = selected.map(s => s.crd);
    const aumLo = Math.round(anchor.aumRaw * 0.3);
    const aumHi = Math.round(anchor.aumRaw * 3);

    (async () => {
      try {
        // Same-state + out-of-state candidates
        const [{ data: sameState }, { data: otherState }] = await Promise.all([
          supabase.from('firmdata_current')
            .select('crd, primary_business_name, main_office_city, main_office_state, aum')
            .eq('main_office_state', anchor.location.split(', ').pop() || '')
            .not('aum', 'is', null)
            .gte('aum', aumLo).lte('aum', aumHi)
            .order('aum', { ascending: false })
            .limit(15),
          supabase.from('firmdata_current')
            .select('crd, primary_business_name, main_office_city, main_office_state, aum')
            .neq('main_office_state', anchor.location.split(', ').pop() || '')
            .not('aum', 'is', null)
            .gte('aum', Math.round(anchor.aumRaw! * 0.5)).lte('aum', Math.round(anchor.aumRaw! * 2))
            .order('aum', { ascending: false })
            .limit(15),
        ]);

        const all = [...(sameState || []), ...(otherState || [])]
          .filter(c => !selectedCrds.includes(c.crd));
        if (!all.length) { setSimilarFirms([]); return; }

        // Score by AUM proximity and geography
        const anchorAum = anchor.aumRaw!;
        const anchorState = anchor.location.split(', ').pop() || '';
        const scored = all.map(c => {
          const ratio = Math.min(c.aum, anchorAum) / Math.max(c.aum, anchorAum);
          const geo = c.main_office_state === anchorState ? 0.15 : 0;
          return { ...c, _score: ratio * 0.85 + geo };
        }).sort((a, b) => b._score - a._score).slice(0, 8);

        // Get display names and scores
        const crds = scored.map(s => s.crd);
        const [{ data: names }, { data: scores }] = await Promise.all([
          supabase.from('firm_names').select('crd, display_name').in('crd', crds),
          supabase.from('firm_scores').select('crd, final_score').in('crd', crds),
        ]);
        const nameMap = new Map((names || []).map(n => [n.crd, n.display_name]));
        const scoreMap = new Map((scores || []).map(s => [s.crd, s.final_score]));

        setSimilarFirms(scored.slice(0, 6).map(c => {
          const sameState = c.main_office_state === anchorState;
          const ratio = Math.min(c.aum, anchorAum) / Math.max(c.aum, anchorAum);
          const reason = [
            ratio > 0.6 ? 'Comparable AUM' : null,
            sameState ? 'Same State' : null,
          ].filter(Boolean).join(' · ') || 'Similar Scale';
          return {
            crd: c.crd,
            name: nameMap.get(c.crd) || c.primary_business_name || 'Unknown',
            city: c.main_office_city,
            state: c.main_office_state,
            aum: c.aum,
            score: scoreMap.get(c.crd) ?? null,
            reason,
          };
        }));
      } catch (e) {
        console.error('Similar firms error:', e);
        setSimilarFirms([]);
      }
    })();
  }, [comparisonData, selected]);

  // Handlers
  const addFirm = (firm: FirmBasic) => {
    if (selected.length >= 4 || selected.some(s => s.crd === firm.crd)) return;
    setSelected([...selected, firm]);
    setQuery(''); setResults([]); setShowSearch(false);
  };
  const addFirmFromEmpty = (firm: FirmBasic) => {
    if (selected.length >= 4 || selected.some(s => s.crd === firm.crd)) return;
    setSelected([...selected, firm]);
    setEmptyQuery(''); setEmptyResults([]);
  };
  const removeFirm = (crd: number) => setSelected(selected.filter(s => s.crd !== crd));

  // IntersectionObserver for jump nav
  useEffect(() => {
    const ids = ['overview', 'vvs', 'aum', 'allocation', 'clients', 'services', 'fees-pricing', 'regulatory', 'fees'];
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(entry.target.id); }),
      { threshold: 0.1, rootMargin: '-100px 0px -60% 0px' }
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [comparisonData, session]);

  // Fee calculator
  const feeAmount = parseInt(feeInput.replace(/[^0-9]/g, ''), 10) || 0;
  const industryMedian = getClosestBreakpoint(feeAmount || 10_000_000).median;
  const PEER_RATE = 0.0102;
  const GROSS_RETURN = 0.07;
  function growNet(a: number, g: number, fr: number, y: number) { return a * Math.pow(1 + g - fr, y); }
  const isGated = session === null;
  const jumpLinks = [
    { id: 'overview', label: 'Overview' },
    { id: 'vvs', label: 'Visor Index™' },
    { id: 'aum', label: 'AUM & Growth' },
    { id: 'allocation', label: 'Allocation' },
    { id: 'clients', label: 'Client Profile' },
    { id: 'services', label: 'Services' },
    { id: 'fees-pricing', label: 'Fees' },
    { id: 'regulatory', label: 'Regulatory' },
    { id: 'fees', label: 'Fee Calculator' },
  ];
  const feeDisplayStr = feeAmount >= 1e9 ? `$${(feeAmount / 1e9).toFixed(1)}B`
    : feeAmount >= 1e6 ? `$${(feeAmount / 1e6).toFixed(1)}M`
    : feeAmount >= 1e3 ? `$${(feeAmount / 1e3).toFixed(0)}K` : '—';

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style suppressHydrationWarning>{PAGE_CSS}</style>

      <div className="cp-page">

        {/* ── STICKY JUMP NAV ──────────────────────────────────────── */}
        <div className={`cp-jump-bar${isGated ? ' cp-jump-bar-gated' : ''}`}>
          <div className="cp-jump-nav">
            <div className="cp-jump-nav-links">
              {jumpLinks.map(link => (
                <a key={link.id} href={isGated ? undefined : `#${link.id}`}
                  className={`cp-jn-link${activeSection === link.id ? ' on' : ''}`}
                  onClick={isGated ? (e: React.MouseEvent) => e.preventDefault() : undefined}
                >{link.label}</a>
              ))}
            </div>
            {selected.length > 0 && (
              <div className="cp-jump-actions">
                <button
                  className={`cp-share-btn${copied ? ' copied' : ''}`}
                  onClick={() => {
                    const crds = selected.map(f => f.crd).join(',');
                    const url = `${window.location.origin}/compare?firms=${crds}`;
                    navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16">
                    <path d="M6 10l4-4M10.5 2.5a2.12 2.12 0 113 3L10 9l-4 1 1-4 3.5-3.5z"/>
                  </svg>
                  <span>{copied ? 'Link copied!' : 'Save Comparison'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── GATE WRAPPER ────────────────────────────────────────────── */}
        <div style={{ position: 'relative' }}>
          <div className={isGated ? 'cp-gate-wrap' : ''}>

            {/* ── STICKY FIRM HEADER ──────────────────────────────────── */}
            <div className="cp-firm-bar">
              <div className="cp-firm-bar-inner">
                <div className="cp-firm-slot">
                  <span className="cp-firm-slot-label">
                    {selected.length} {selected.length === 1 ? 'firm' : 'firms'}
                  </span>
                </div>
                {Array.from({ length: 4 }).map((_, col) => {
                  const firm = col < comparisonData.length ? comparisonData[col] : null;
                  const sel = col < selected.length ? selected[col] : null;

                  if (firm || sel) {
                    const displayName = firm?.name || sel?.display_name || sel?.primary_business_name || '';
                    const crd = firm?.crd || sel?.crd;
                    const lk = firm?.logoKey;
                    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
                    return (
                      <div key={col} className="cp-firm-slot">
                        {lk ? (
                          <div className="cp-firm-logo">
                            <img src={`${supaUrl}/storage/v1/object/public/firm-logos/${lk}`} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = `<span style="font-family:var(--serif);font-size:11px;font-weight:700;color:rgba(255,255,255,.5)">${displayName.slice(0, 2).toUpperCase()}</span>`; }} />
                          </div>
                        ) : (
                          <div className="cp-firm-avatar">{displayName.slice(0, 2).toUpperCase()}</div>
                        )}
                        <span className="cp-firm-name" title={displayName}>
                          <Link href={`/firm/${crd}`}>{displayName}</Link>
                        </span>
                        <button className="cp-remove-btn" onClick={() => crd && removeFirm(crd)}>×</button>
                      </div>
                    );
                  }

                  return (
                    <div key={col} className="cp-add-slot" onClick={() => !isGated && setShowSearch(true)}>
                      <div style={{ width: 22, height: 22, border: '1px solid rgba(255,255,255,.35)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 10 10">
                          <line x1="5" y1="1" x2="5" y2="9" /><line x1="1" y1="5" x2="9" y2="5" />
                        </svg>
                      </div>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', whiteSpace: 'nowrap' }}>Add a firm</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── COMPARISON TABLE ────────────────────────────────────── */}
            {<div className="cp-table-wrap">
              <div className="cp-table-inner">

                {/* ── FIRM OVERVIEW ─────────────────────────────────────── */}
                <SectionCard id="overview" title="Firm Overview" meta="SEC ADV · IAPD">
                  {loading ? (
                    <>{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</>
                  ) : (
                    <>
                      <ScoreRow label="Visor Index Score" ring scores={comparisonData.map(f => f.finalScore)} percentiles={comparisonData.map(f => f.scorePercentile)} />
                      <DataRow label="Headquarters" values={comparisonData.map(f => f.location)} serif={false} />
                      <DataRowWithPctile label="AUM" values={comparisonData.map(f => f.aum)} percentiles={comparisonData.map(f => f.aumPercentile)} serif={false} />
                      <DataRowWithPctile label="Employees" values={comparisonData.map(f => f.employees)} percentiles={comparisonData.map(f => f.employeePercentile)} serif={false} />
                      <DataRowWithPctile label="Investment Professionals" values={comparisonData.map(f => f.employeeInvestment != null ? f.employeeInvestment.toLocaleString() : '—')} percentiles={comparisonData.map(f => f.invStaffPercentile)} serif={false} />
                      <DataRowWithPctile label="Total Clients" values={comparisonData.map(f => f.totalClients.toLocaleString())} percentiles={comparisonData.map(f => f.totalClientsPercentile)} serif={false} />
                      <DataRowWithPctile label="Avg. Client Size" values={comparisonData.map(f => f.avgClientSize)} percentiles={comparisonData.map(f => f.avgClientPercentile)} serif={false} />
                      <DataRow label="Minimum Account" values={comparisonData.map(f => f.minAccount)} serif={false} />
                      <DataRow label="Minimum Fee" values={comparisonData.map(f => f.minimumFee)} serif={false} />
                      <DataRow label="Offices" values={comparisonData.map(f => f.numOffices)} serif={false} />
                      <DataRow label="Registered States" values={comparisonData.map(f => f.registeredStates > 0 ? f.registeredStates.toString() : '—')} serif={false} />
                      {/* Website */}
                      <div className="cp-row" style={{ borderBottom: 'none' }}>
                        <div className="cp-row-label">Website</div>
                        {Array.from({ length: 4 }).map((_, col) => {
                          const f = col < comparisonData.length ? comparisonData[col] : null;
                          const web = f?.website;
                          return (
                            <div key={col} className="cp-row-cell">
                              {web && web !== '—' && f ? (
                                <a href={web.startsWith('http') ? web : `https://${web}`} target="_blank" rel="noopener noreferrer" className="cp-web-link">
                                  {f.name}
                                </a>
                              ) : <span className="val-dash">—</span>}
                            </div>
                          );
                        })}
                      </div>
                      <ViewProfileRow firms={comparisonData} />
                    </>
                  )}
                </SectionCard>

                {/* VISOR INDEX SCORE */}
                <SectionCard id="vvs" title="Visor Index Score™" meta="Based on SEC ADV · Updated 2025">
                  {loading ? (
                    <>{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</>
                  ) : (
                    <>
                      <ScoreRow label="Overall Score" strong ring scores={comparisonData.map(f => f.finalScore)} />
                      <ScoreRow label="Disclosure Quality" tip="Completeness and clarity of ADV filings" scores={comparisonData.map(f => f.disclosureScore)} />
                      <ScoreRow label="Fee Transparency" tip="How explicitly the firm discloses its fee structure" scores={comparisonData.map(f => f.feeTransparencyScore)} />
                      <ScoreRow label="Fee Competitiveness" tip="Fees benchmarked against peers of similar AUM" scores={comparisonData.map(f => f.feeCompetitivenessScore)} />
                      <ScoreRow label="Conflict-Free" tip="Conflicts of interest including referral arrangements" scores={comparisonData.map(f => f.conflictFreeScore)} />
                      <ScoreRow label="AUM Growth" tip="AUM growth rate over 3 and 5 years vs peer median" scores={comparisonData.map(f => f.aumGrowthScore)} />
                      <ScoreRow label="Client Growth" tip="Year-over-year change in total client count" scores={comparisonData.map(f => f.clientGrowthScore)} />
                      <ScoreRow label="Advisor Bandwidth" tip="Ratio of clients to advisory staff" scores={comparisonData.map(f => f.advisorBandwidthScore)} />
                      <ScoreRow label="Investment Mix" tip="Use of complex instruments in client portfolios" scores={comparisonData.map(f => f.derivativesScore)} />
                      <ViewProfileRow firms={comparisonData} />
                    </>
                  )}
                </SectionCard>

                {/* AUM & GROWTH */}
                <SectionCard id="aum" title="AUM & Growth" meta="SEC ADV · Growth Rate Rankings">
                  {loading ? (
                    <>{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</>
                  ) : (
                    <>
                      {/* Current AUM with percentile */}
                      <DataRowWithPctile label="Current AUM" values={comparisonData.map(f => f.aum)} percentiles={comparisonData.map(f => f.aumPercentile)} serif={false} />
                      <DataRowWithPctile label="AUM Growth (1yr, ann.)" values={comparisonData.map(f => f.aumGrowth1yr)} percentiles={comparisonData.map(f => f.aumGrowth1yrPercentile)} serif={false} />
                      <DataRowWithPctile label="AUM Growth (5yr, ann.)" values={comparisonData.map(f => f.aumGrowth5yr)} percentiles={comparisonData.map(f => f.aumGrowth5yrPercentile)} serif={false} />
                      <DataRowWithPctile label="AUM Growth (10yr, ann.)" values={comparisonData.map(f => f.aumGrowth10yr)} percentiles={comparisonData.map(f => f.aumGrowth10yrPercentile)} serif={false} />
                      <DataRowWithPctile label="Client Growth (1yr, ann.)" values={comparisonData.map(f => f.clientGrowth1yr)} percentiles={comparisonData.map(f => f.clientGrowth1yrPercentile)} serif={false} />
                      <DataRowWithPctile label="Client Growth (5yr, ann.)" values={comparisonData.map(f => f.clientGrowth5yr)} percentiles={comparisonData.map(f => f.clientGrowth5yrPercentile)} serif={false} />
                      {/* Discretionary / Non-Discretionary split */}
                      <div className="cp-row">
                        <div className="cp-row-label">AUM Split<span className="cp-tip" title="Discretionary: directed by the firm. Non-discretionary: directed by the client.">ⓘ</span></div>
                        {Array.from({ length: 4 }).map((_, col) => {
                          const f = col < comparisonData.length ? comparisonData[col] : null;
                          if (!f || (f.aumDiscretionary == null && f.aumNonDiscretionary == null)) {
                            return <div key={col} className="cp-row-cell"><span className="val-dash">—</span></div>;
                          }
                          const disc = f.aumDiscretionary || 0;
                          const nonDisc = f.aumNonDiscretionary || 0;
                          const total = disc + nonDisc;
                          const discPct = total > 0 ? (disc / total) * 100 : 0;
                          return (
                            <div key={col} className="cp-row-cell" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 11 }}>
                                <span style={{ color: 'var(--green)' }}>{formatAUM(disc)}</span>
                                <span style={{ color: 'var(--amber)' }}>{formatAUM(nonDisc)}</span>
                              </div>
                              <div className="cp-split-bar">
                                <div className="cp-split-disc" style={{ width: `${discPct}%` }} />
                                <div className="cp-split-nondisc" style={{ width: `${100 - discPct}%` }} />
                              </div>
                              <div className="cp-split-labels">
                                <span>Discretionary {discPct.toFixed(0)}%</span>
                                <span>Non-Disc. {(100 - discPct).toFixed(0)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <ViewProfileRow firms={comparisonData} />
                    </>
                  )}
                </SectionCard>

                {/* ASSET ALLOCATION */}
                <SectionCard id="allocation" title="Asset Allocation" meta="ADV Part 1 · Item 5.D">
                  {loading ? (
                    <>{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</>
                  ) : (
                    <>
                      {/* Visual summary bar */}
                      <div className="cp-row">
                        <div className="cp-row-label strong">Breakdown</div>
                        {Array.from({ length: 4 }).map((_, col) => {
                          const f = col < comparisonData.length ? comparisonData[col] : null;
                          if (!f || f.assetAllocation.length === 0) {
                            return <div key={col} className="cp-row-cell"><span className="val-dash">—</span></div>;
                          }
                          return (
                            <div key={col} className="cp-row-cell" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4, padding: '14px 16px' }}>
                              <div className="cp-alloc-bar">
                                {f.assetAllocation.map(a => (
                                  <div key={a.label} className="cp-alloc-seg" title={`${a.label}: ${a.pct.toFixed(1)}%`}
                                    style={{ width: `${Math.max(a.pct, 2)}%`, background: a.color }} />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Individual asset class rows */}
                      {(() => {
                        const allLabels = new Set<string>();
                        comparisonData.forEach(f => f.assetAllocation.forEach(a => allLabels.add(a.label)));
                        const labelOrder = ['Individual Stocks', 'Private Equity', 'US Treasury Bonds', 'IG Corp Bonds', 'Non-IG Corp Bonds', 'US Municipal Bonds', 'Cash & Equivalents', 'Funds, ETFs, and Alternatives', 'Other'];
                        const sorted = labelOrder.filter(l => allLabels.has(l));
                        // Add any remaining labels not in the predefined order
                        allLabels.forEach(l => { if (!sorted.includes(l)) sorted.push(l); });
                        return sorted.map((label, idx) => (
                          <div key={label} className="cp-row" style={idx === sorted.length - 1 ? { borderBottom: 'none' } : undefined}>
                            <div className="cp-row-label" style={{ gap: 6 }}>
                              <span className="cp-alloc-dot" style={{ background: comparisonData.find(f => f.assetAllocation.find(a => a.label === label))?.assetAllocation.find(a => a.label === label)?.color || 'var(--rule)' }} />
                              {label}
                            </div>
                            {Array.from({ length: 4 }).map((_, col) => {
                              const f = col < comparisonData.length ? comparisonData[col] : null;
                              const alloc = f?.assetAllocation.find(a => a.label === label);
                              if (!f || !alloc || alloc.pct === 0) {
                                return <div key={col} className="cp-row-cell"><span className="val-dash">—</span></div>;
                              }
                              const estValue = f.aumRaw ? f.aumRaw * (alloc.pct / 100) : null;
                              return (
                                <div key={col} className="cp-row-cell" style={{ flexDirection: 'column', gap: 1 }}>
                                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{alloc.pct.toFixed(0)}%</span>
                                  {estValue != null && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>≈ {formatAUM(estValue)}</span>}
                                </div>
                              );
                            })}
                          </div>
                        ));
                      })()}
                      <ViewProfileRow firms={comparisonData} />
                    </>
                  )}
                </SectionCard>

                {/* CLIENT PROFILE */}
                <SectionCard id="clients" title="Client Profile" meta="ADV Part 1 · Schedule D">
                  {loading ? (
                    <>{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</>
                  ) : (
                    <>
                      <DataRowWithPctile label="Total Clients" values={comparisonData.map(f => f.totalClients > 0 ? f.totalClients.toLocaleString() : '—')} percentiles={comparisonData.map(f => f.totalClientsPercentile)} serif={false} />
                      <DataRowWithPctile label="Avg. Client Size" values={comparisonData.map(f => f.avgClientSize)} percentiles={comparisonData.map(f => f.avgClientPercentile)} serif={false} />
                      <DataRowWithPctile label="AUM per Investment Professional" values={comparisonData.map(f => f.aumPerAdvisor)} percentiles={comparisonData.map(f => f.invStaffPercentile)} serif={false} />
                      <DataRowWithPctile label="Clients per Investment Professional" values={comparisonData.map(f => f.clientsPerAdvisor)} percentiles={comparisonData.map(f => f.clientsPerAdvisorPercentile)} serif={false} />
                      <DataRow label="Minimum Account" values={comparisonData.map(f => f.minAccount)} serif={false} />
                      <DataRow label="Wealth Tier" values={comparisonData.map(f => f.wealthTier)} serif={false} />
                      {/* Client composition breakdown */}
                      <div className="cp-row" style={{ borderBottom: 'none' }}>
                        <div className="cp-row-label">Top Client Types</div>
                        {Array.from({ length: 4 }).map((_, col) => {
                          const f = col < comparisonData.length ? comparisonData[col] : null;
                          if (!f || f.clientBreakdown.length === 0) {
                            return <div key={col} className="cp-row-cell"><span className="val-dash">—</span></div>;
                          }
                          const maxCount = Math.max(...f.clientBreakdown.map(c => c.count));
                          return (
                            <div key={col} className="cp-row-cell" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 2, padding: '10px 14px' }}>
                              {f.clientBreakdown.slice(0, 4).map(c => (
                                <div key={c.label} className="cp-client-bar">
                                  <span className="cp-client-bar-label">{c.label}</span>
                                  <div className="cp-client-bar-track">
                                    <div className="cp-client-bar-fill" style={{ width: `${(c.count / maxCount) * 100}%` }} />
                                  </div>
                                  <span className="cp-client-bar-count">{c.count.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                      <ViewProfileRow firms={comparisonData} />
                    </>
                  )}
                </SectionCard>

                {/* SERVICES OFFERED */}
                <SectionCard id="services" title="Services Offered" meta="ADV Part 1 · Item 5.G">
                  {loading ? (
                    <>{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}</>
                  ) : (
                    <>
                      {['Financial Planning', 'Manager Selection', 'Pension Consulting', 'Individual Portfolios', 'Institutional Mgmt', 'Pooled Vehicles'].map(svc => (
                        <div key={svc} className="cp-row">
                          <div className="cp-row-label">{svc}</div>
                          {Array.from({ length: 4 }).map((_, col) => {
                            const f = col < comparisonData.length ? comparisonData[col] : null;
                            return (
                              <div key={col} className="cp-row-cell">
                                {f ? (
                                  f.services[svc]
                                    ? <span className="cp-svc-check">✓</span>
                                    : <span className="cp-svc-x">—</span>
                                ) : <span className="val-dash">—</span>}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                      <ViewProfileRow firms={comparisonData} />
                    </>
                  )}
                </SectionCard>

                {/* FEES & PRICING */}
                <SectionCard id="fees-pricing" title="Fees & Pricing" meta="ADV Part 2A">
                  {loading ? (
                    <>{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</>
                  ) : (
                    <>
                      <DataRow label="Fee Structure" values={comparisonData.map(f => f.feeStructureType)} serif={false} />
                      <DataRow label="Fee Range (Min)" values={comparisonData.map(f => f.feeRangeMin)} serif={false} />
                      <DataRow label="Fee Range (Max)" values={comparisonData.map(f => f.feeRangeMax)} serif={false} />
                      <DataRow label="Minimum Fee" values={comparisonData.map(f => f.minimumFee)} serif={false} />
                      <DataRow label="Minimum Account" values={comparisonData.map(f => f.minAccount)} serif={false} />
                      <ViewProfileRow firms={comparisonData} />
                    </>
                  )}
                </SectionCard>

                {/* REGULATORY */}
                <SectionCard id="regulatory" title="Regulatory" meta="IAPD · SEC EDGAR · FINRA BrokerCheck">
                  {loading ? (
                    <>{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}</>
                  ) : (
                    <>
                      {/* Summary row */}
                      <DataRow label="Disciplinary History" values={comparisonData.map(f => f.hasDisciplinary)} tag />
                      {/* Category breakdown */}
                      {DISC_CATEGORIES.map((cat) => (
                        <DataRow key={cat.label} label={cat.label} tag values={comparisonData.map(f => {
                          const flagCount = cat.keys.filter(k => f.disclosureData[k] === 'Y' || f.disclosureData[k] === 'y').length;
                          return flagCount > 0 ? `${flagCount} Found` : 'None';
                        })} />
                      ))}
                      {/* Other regulatory fields */}
                      <DataRow label="Private Fund Advisor" values={comparisonData.map(f => f.privateFundAdvisor)} serif={false} />
                      <DataRow label="Legal Structure" values={comparisonData.map(f => f.legalStructure)} serif={false} />
                      <DataRow label="Latest Filing" values={comparisonData.map(f => f.latestFiling)} serif={false} />
                      <ViewProfileRow firms={comparisonData} />
                    </>
                  )}
                </SectionCard>

              </div>
            </div>}

            {/* ── FEE CALCULATOR ──────────────────────────────────────── */}
            {/* ── FEE SCHEDULE COMPARISON ────────────────────────── */}
            {!loading && comparisonData.length > 0 && (
              <div className="cp-fee-section">
                <div className="cp-fee-card">
                  <div className="cp-section-head">
                    <span className="cp-section-title">Fee Schedule Comparison</span>
                    <span className="cp-section-meta">Side-by-side tier schedules from ADV Part 2A</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(comparisonData.length, 4)}, 1fr)`, borderTop: '0.5px solid var(--rule)' }}>
                    {comparisonData.map(firm => {
                      const sortedTiers = [...firm.feeTiers].filter(t => t.fee_pct != null).sort((a, b) => parseInt(a.min_aum || '0') - parseInt(b.min_aum || '0'));
                      return (
                        <div key={firm.crd} style={{ borderRight: '0.5px solid var(--rule)', padding: '16px 20px' }}>
                          <div style={{ fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>{firm.name}</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 12 }}>
                            {firm.feeStructureType} {firm.feeRangeMin !== '—' || firm.feeRangeMax !== '—' ? `· ${firm.feeRangeMin !== '—' ? firm.feeRangeMin : ''} – ${firm.feeRangeMax !== '—' ? firm.feeRangeMax : ''}` : ''}
                          </div>
                          {sortedTiers.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr>
                                  <th style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-3)', padding: '4px 0', borderBottom: '0.5px solid var(--rule)', textAlign: 'left' }}>AUM Range</th>
                                  <th style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-3)', padding: '4px 0', borderBottom: '0.5px solid var(--rule)', textAlign: 'right' }}>Rate</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortedTiers.map((tier, i) => {
                                  const min = parseInt(tier.min_aum || '0');
                                  const max = tier.max_aum;
                                  const isActive = feeAmount >= min && (max == null || feeAmount <= max);
                                  return (
                                    <tr key={i} style={{ background: isActive ? 'rgba(45,189,116,.06)' : 'transparent' }}>
                                      <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-2)', padding: '6px 0', borderBottom: '0.5px solid var(--rule)' }}>
                                        {formatCompact(min)} – {max ? formatCompact(max) : '∞'}
                                      </td>
                                      <td style={{ fontFamily: 'var(--serif)', fontSize: 14, fontWeight: 700, color: isActive ? 'var(--green)' : 'var(--ink)', padding: '6px 0', borderBottom: '0.5px solid var(--rule)', textAlign: 'right' }}>
                                        {tier.fee_pct}%
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          ) : (
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', padding: '12px 0' }}>
                              {firm.minimumFee !== '—' ? `Minimum fee: ${firm.minimumFee}` : 'No tier schedule disclosed'}
                            </div>
                          )}
                          {firm.minimumFee !== '—' && sortedTiers.length > 0 && (
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 8 }}>
                              Min. annual fee: {firm.minimumFee}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {selected.length > 0 && <div id="fees" className="cp-fee-section" style={{ scrollMarginTop: 180 }}>
              <div className="cp-fee-card">
                <div className="cp-section-head">
                  <span className="cp-section-title">Fee Calculator</span>
                  <span className="cp-section-meta">Enter your portfolio value to compare estimated fees</span>
                </div>

                <div className="cp-fee-input-row" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>Portfolio Value</span>
                  <div style={{ display: 'flex', alignItems: 'center', border: '0.5px solid var(--rule)', background: 'var(--bg)', flexShrink: 0, borderRadius: 4 }}>
                    <span style={{ padding: '0 12px', fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--ink-3)', borderRight: '0.5px solid var(--rule)', lineHeight: '44px' }}>$</span>
                    <input
                      type="text" inputMode="numeric" value={feeInput}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/[^0-9]/g, '');
                        if (!digits) { setFeeInput(''); return; }
                        let num = parseInt(digits, 10);
                        if (num > 1_000_000_000) num = 1_000_000_000;
                        setFeeInput(num.toLocaleString('en-US'));
                      }}
                      style={{ border: 'none', background: 'none', outline: 'none', fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--ink)', padding: '10px 14px', width: 180 }}
                    />
                  </div>
                  <div className="cp-slider-wrap" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <input type="range" className="fee-slider-input"
                      min={100_000} max={50_000_000} step={100_000}
                      value={Math.min(Math.max(feeAmount || 10_000_000, 100_000), 50_000_000)}
                      onChange={(e) => setFeeInput(parseInt(e.target.value).toLocaleString('en-US'))}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>
                      <span>$100K</span><span>$5M</span><span>$15M</span><span>$35M</span><span>$50M+</span>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', minWidth: 80 }}>
                    {feeDisplayStr}
                  </div>
                </div>

                {comparisonData.length > 0 && feeAmount > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '0.5px solid var(--rule)' }} className="cp-fee-body">
                    {/* Left: fee bars */}
                    <div style={{ padding: 24, borderRight: '0.5px solid var(--rule)' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 16 }}>
                        Annual Fee by Firm
                      </div>
                      {comparisonData.map(firm => {
                        const annual = firm.feeTiers.length > 0
                          ? calcTieredFeeSimple(feeAmount, firm.feeTiers)
                          : feeAmount * (industryMedian / 100);
                        const rate = feeAmount > 0 ? annual / feeAmount : 0;
                        const above = rate > PEER_RATE;
                        const barW = Math.min((rate * 100) / 1.6 * 100, 100);
                        const barColor = above ? 'var(--amber)' : 'var(--green)';
                        const diff = (Math.abs(rate - PEER_RATE) * 100).toFixed(2);
                        const rateStr = (rate * 100).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
                        return (
                          <div key={firm.crd} style={{ marginBottom: 18 }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{firm.name}</span>
                              <div>
                                <span style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>{formatCompact(annual)}</span>
                                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginLeft: 4 }}>({rateStr}%)</span>
                              </div>
                            </div>
                            <div style={{ height: 6, background: 'var(--rule)', borderRadius: 3, overflow: 'hidden', marginBottom: 3 }}>
                              <div style={{ height: '100%', borderRadius: 3, width: `${barW}%`, background: barColor, transition: 'width .5s cubic-bezier(.16,1,.3,1)' }} />
                            </div>
                            <div style={{ fontSize: 10, height: 14, color: barColor }}>{diff}% {above ? 'above' : 'below'} peer median</div>
                          </div>
                        );
                      })}
                      <div style={{ display: 'flex', gap: 14, fontSize: 10, color: 'var(--ink-3)', paddingTop: 16, borderTop: '0.5px solid var(--rule)', marginTop: 16, flexWrap: 'wrap' }}>
                        <span>Peer median ({(PEER_RATE * 100).toFixed(2)}%)</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} /> Below
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--amber)', display: 'inline-block' }} /> Above
                        </span>
                      </div>
                    </div>

                    {/* Right: projections */}
                    <div style={{ padding: 24 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 16 }}>
                        Portfolio Impact Over Time
                        <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>(7% annual return)</span>
                      </div>
                      {[10, 20].map(yr => {
                        const noFeeValue = feeAmount * Math.pow(1 + GROSS_RETURN, yr);
                        const projRows = comparisonData.map(firm => {
                          const annual = firm.feeTiers.length > 0
                            ? calcTieredFeeSimple(feeAmount, firm.feeTiers)
                            : feeAmount * (industryMedian / 100);
                          const rate = feeAmount > 0 ? annual / feeAmount : 0;
                          return { firm, annual, value: growNet(feeAmount, GROSS_RETURN, rate, yr) };
                        });
                        const bestValue = Math.max(...projRows.map(r => r.value));
                        return (
                          <div key={yr} style={{ marginBottom: 24 }}>
                            <div style={{ fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 8 }}>{yr}-Year Projection</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr>
                                  {['Firm', 'Annual Fee', 'Portfolio Value', 'Fees Paid'].map(h => (
                                    <th key={h} style={{ fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 600, letterSpacing: '.13em', textTransform: 'uppercase', color: 'var(--ink-3)', padding: '6px 8px', borderBottom: '0.5px solid var(--rule)', textAlign: h === 'Firm' ? 'left' : 'right' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {projRows.map(({ firm, annual, value }) => {
                                  const isBest = value === bestValue;
                                  return (
                                    <tr key={firm.crd}>
                                      <td style={{ padding: '10px 8px', borderBottom: '0.5px solid var(--rule)', fontFamily: 'var(--sans)', fontSize: 12, fontWeight: isBest ? 600 : 500, color: isBest ? 'var(--green)' : 'var(--ink)' }}>{firm.name}</td>
                                      <td style={{ padding: '10px 8px', borderBottom: '0.5px solid var(--rule)', fontFamily: 'var(--mono)', fontSize: 11, color: isBest ? 'var(--green)' : 'var(--ink-2)', textAlign: 'right' }}>{formatCompact(annual)}</td>
                                      <td style={{ padding: '10px 8px', borderBottom: '0.5px solid var(--rule)', fontFamily: 'var(--mono)', fontSize: 11, color: isBest ? 'var(--green)' : 'var(--ink-2)', textAlign: 'right' }}>{formatCompact(value)}</td>
                                      <td style={{ padding: '10px 8px', borderBottom: '0.5px solid var(--rule)', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--red)', textAlign: 'right' }}>−{formatCompact(noFeeValue - value)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                      })}
                      <div style={{ fontSize: 10, color: 'var(--ink-3)', lineHeight: 1.6, fontStyle: 'italic', paddingTop: 14, borderTop: '0.5px solid var(--rule)', marginTop: 14 }}>
                        Estimates based on disclosed fee schedules. Actual fees may be negotiated. Peer comparison uses national median for fee-only advisors at equivalent AUM. Projections assume constant blended fee rate and 7% gross annual return.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                    {comparisonData.length === 0 ? 'Add firms above to compare fees' : 'Enter a portfolio value above to see the fee comparison'}
                  </div>
                )}
              </div>
            </div>}


          </div>{/* /gate-wrap */}

          {/* Gate overlay */}
          {isGated && (
            <div className="cp-gate-card">
              <div className="cp-gate-eyebrow">
                <svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>
                Unlock Full Comparison
              </div>
              <h2 className="cp-gate-headline">
                Differentiate firms on the factors that matter.
              </h2>
              <p className="cp-gate-sub">
                Compare client types, growth rates, fees, and more across wealth management firms.
              </p>
              <div className="cp-gate-ctas">
                <Link href="/auth/signup" className="cp-gate-cta-primary">Get Full Access →</Link>
                <Link href="/pricing" className="cp-gate-cta-secondary">View Pricing</Link>
              </div>
            </div>
          )}
        </div>

        {/* ── EMPTY STATE BANNER ─────────────────────────────────────── */}
        {!isGated && session !== undefined && selected.length === 0 && !showSearch && (
          <div className="cp-empty-banner">
            <div className="cp-empty-banner-inner">
              <div>
                <div className="cp-empty-banner-title">Add a firm to get started</div>
                <div className="cp-empty-banner-sub">Click any &ldquo;Add a firm&rdquo; slot above to compare scores, fees, and growth side by side.</div>
              </div>
              <button className="cp-empty-banner-btn" onClick={() => setShowSearch(true)}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 12 12">
                  <line x1="6" y1="1" x2="6" y2="11" /><line x1="1" y1="6" x2="11" y2="6" />
                </svg>
                Search Firms
              </button>
            </div>
          </div>
        )}

        {/* ── 1-FIRM PROMPT ─────────────────────────────────────────── */}
        {!isGated && selected.length === 1 && !loading && !showSearch && (
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px 24px' }}>
            <div style={{
              background: 'rgba(45,189,116,.04)', border: '1px solid rgba(45,189,116,.15)',
              borderRadius: 8, padding: '14px 20px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 16,
            }}>
              <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                <strong style={{ color: 'var(--ink)' }}>Add another firm</strong> to start comparing scores, fees, and growth side by side.
              </div>
              <button
                onClick={() => setShowSearch(true)}
                style={{
                  fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600, color: 'var(--green)',
                  background: 'none', border: '1px solid var(--green)', borderRadius: 4,
                  padding: '7px 16px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s',
                }}
              >+ Add Firm</button>
            </div>
          </div>
        )}

        {/* ── SEARCH MODAL (with suggestions) ──────────────────────── */}
        {showSearch && !isGated && (
          <div className="cp-search-overlay"
            onClick={e => { if (e.target === e.currentTarget) { setShowSearch(false); setQuery(''); setResults([]); } }}
          >
            <div className="cp-search-card">
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 12 }}>Add a Firm to Compare</div>
              <input
                autoFocus type="text" value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIndex(-1); }}
                onKeyDown={e => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => Math.min(prev + 1, results.length - 1)); }
                  else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => Math.max(prev - 1, -1)); }
                  else if (e.key === 'Enter' && selectedIndex >= 0) { e.preventDefault(); if (results[selectedIndex] && selected.length < 4) addFirm(results[selectedIndex]); }
                  else if (e.key === 'Escape') { setShowSearch(false); setQuery(''); setResults([]); }
                }}
                placeholder="Search firms by name…"
                style={{ width: '100%', border: '0.5px solid var(--rule)', background: 'var(--bg)', padding: '10px 14px', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)', outline: 'none', marginBottom: 4, borderRadius: 4 }}
              />
              {results.length > 0 && (
                <div style={{ border: '0.5px solid var(--rule)', maxHeight: 240, overflowY: 'auto', borderRadius: 4 }}>
                  {results.map((r, idx) => (
                    <button key={r.crd} onClick={() => addFirm(r)}
                      className={`cp-search-result${idx === selectedIndex ? ' active' : ''}`}
                    >
                      {r.display_name || r.primary_business_name}
                      <span style={{ color: 'var(--rule)', fontSize: 11, marginLeft: 8 }}>#{r.crd}</span>
                    </button>
                  ))}
                </div>
              )}
              {query.length >= 2 && results.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--ink-3)', padding: '10px 0' }}>No results for &ldquo;{query}&rdquo;</p>
              )}

              {/* Suggested similar firms — shown when not actively searching */}
              {query.length < 2 && similarFirms.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 12, height: 1, background: 'var(--rule)', display: 'inline-block' }} />
                    Suggested
                    <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>based on {comparisonData[0]?.name || 'selected firms'}</span>
                  </div>
                  <div style={{ border: '0.5px solid var(--rule)', borderRadius: 4, overflow: 'hidden' }}>
                    {similarFirms.slice(0, 5).map(sf => {
                      const titleName = sf.name.replace(/\b\w+/g, w => {
                        const lower = w.toLowerCase();
                        return ['and','of','the','for','in','on','at','to','by','llc','llp'].includes(lower)
                          ? lower : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
                      });
                      const titleCity = sf.city?.replace(/\b\w+/g, w => w.charAt(0) + w.slice(1).toLowerCase());
                      const scoreVal = sf.score != null ? Math.round(sf.score) : null;
                      const col = scoreVal != null ? (scoreVal >= 80 ? 'var(--green)' : scoreVal >= 50 ? 'var(--amber)' : 'var(--red)') : 'var(--rule)';
                      return (
                        <button
                          key={sf.crd}
                          className="cp-search-result"
                          onClick={() => { addFirm({ crd: sf.crd, primary_business_name: sf.name }); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}
                        >
                          {scoreVal != null && (() => {
                            const circ = 2 * Math.PI * 10;
                            const offset = circ * (1 - scoreVal / 100);
                            return (
                              <svg width="24" height="24" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                                <circle cx="12" cy="12" r="10" fill="none" stroke="var(--rule)" strokeWidth="2" />
                                <circle cx="12" cy="12" r="10" fill="none" stroke={col} strokeWidth="2"
                                  strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                                  style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
                                <text x="12" y="12" textAnchor="middle" dominantBaseline="central"
                                  style={{ fontFamily: 'var(--serif)', fontSize: 8, fontWeight: 700, fill: col }}>{scoreVal}</text>
                              </svg>
                            );
                          })()}
                          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{titleName}</div>
                            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
                              {titleCity}, {sf.state} · {formatAUM(sf.aum)}
                              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--green)', marginLeft: 8 }}>{sf.reason}</span>
                            </div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', flexShrink: 0 }}>+ Add</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {selected.map(firm => (
                  <div key={firm.crd} className="cp-search-chip">
                    {firm.display_name || firm.primary_business_name}
                    <button onClick={() => removeFirm(firm.crd)} style={{ color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                  </div>
                ))}
                <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  {selected.length === 0 ? 'No firms selected yet' : selected.length < 4 ? `${4 - selected.length} slot${4 - selected.length !== 1 ? 's' : ''} remaining` : 'Maximum 4 firms'}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
