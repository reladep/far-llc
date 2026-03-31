'use client';

import { useState, useEffect, useCallback } from 'react';

import Link from 'next/link';
import { Session } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

const supabase = createSupabaseBrowserClient();

// ─── INTERFACES ──────────────────────────────────────────────────────────────
interface FirmBasic {
  crd: number;
  primary_business_name: string;
  display_name?: string | null;
}

interface FeeTier {
  min_aum: string | null;
  max_aum: number | null;
  fee_pct: number | null;
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
  clientGrowth1yrPercentile: string | null;
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

// ─── CONSTANTS & HELPERS ─────────────────────────────────────────────────────
const INDUSTRY_MEDIANS = [
  { breakpoint: 500_000, median: 1.00 },
  { breakpoint: 1_000_000, median: 1.00 },
  { breakpoint: 5_000_000, median: 0.70 },
  { breakpoint: 10_000_000, median: 0.55 },
  { breakpoint: 25_000_000, median: 0.50 },
  { breakpoint: 50_000_000, median: 0.50 },
  { breakpoint: 100_000_000, median: 0.50 },
];

const FEE_TYPE_LABELS: Record<string, string> = {
  range: 'AUM-Based',
  tiered: 'Tiered',
  flat_percentage: 'Flat Fee',
  maximum_only: 'AUM-Based (Max)',
  minimum_only: 'AUM-Based (Min)',
  capped: 'Capped',
  not_disclosed: 'Negotiated',
};

function getIndustryMedian(amount: number): number {
  let closest = INDUSTRY_MEDIANS[0];
  for (const bp of INDUSTRY_MEDIANS) {
    if (Math.abs(amount - bp.breakpoint) <= Math.abs(amount - closest.breakpoint)) closest = bp;
  }
  return closest.median;
}

function calcTieredFee(amount: number, tiers: FeeTier[]): number {
  if (tiers.length === 0) return 0;
  const sorted = [...tiers].filter(t => t.fee_pct != null).sort((a, b) => parseInt(a.min_aum || '0') - parseInt(b.min_aum || '0'));
  let totalFee = 0, remaining = amount;
  for (const tier of sorted) {
    if (remaining <= 0) break;
    const tierMin = parseInt(tier.min_aum || '0');
    const tierMax = tier.max_aum;
    const bracketSize = tierMax ? tierMax - tierMin : remaining;
    const taxable = Math.min(remaining, bracketSize);
    totalFee += taxable * (tier.fee_pct! / 100);
    remaining -= taxable;
  }
  return totalFee;
}

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
  return score >= 80 ? 'var(--green)' : score >= 50 ? 'var(--amber)' : 'var(--red)';
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
    background: var(--bg); color: var(--ink); min-height: 100vh;
  }

  /* Header */
  .cp-hero { background: var(--navy); padding: 32px 48px 0; }
  .cp-hero-inner { max-width: 1200px; margin: 0 auto; }
  .cp-hero-eyebrow {
    font-size: 10px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase;
    color: var(--green); margin-bottom: 8px; display: flex; align-items: center; gap: 8px;
  }
  .cp-hero-eyebrow::before { content: ''; width: 16px; height: 1px; background: var(--green); }
  .cp-hero h1 {
    font-family: var(--serif); font-size: 34px; font-weight: 700;
    color: #fff; letter-spacing: -.02em; margin-bottom: 4px;
  }
  .cp-hero-sub { font-size: 12px; color: rgba(255,255,255,.3); margin-bottom: 22px; }

  /* Jump nav */
  .cp-jump-nav {
    display: flex; border-top: 1px solid rgba(255,255,255,.07);
    margin: 0 -48px; padding: 0 48px;
  }
  .cp-jn-link {
    font-size: 11px; font-weight: 500; color: rgba(255,255,255,.3);
    padding: 11px 20px 11px 0; margin-right: 4px; white-space: nowrap;
    text-decoration: none; border-bottom: 2px solid transparent;
    transition: all .15s; letter-spacing: .04em; display: inline-block;
  }
  .cp-jn-link:hover { color: rgba(255,255,255,.65); }
  .cp-jn-link.on { color: var(--green); border-bottom-color: var(--green); }

  /* Sticky firm header */
  .cp-firm-bar {
    position: sticky; top: 52px; z-index: 500;
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
    text-transform: uppercase; color: rgba(255,255,255,.2);
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
    justify-content: center; gap: 6px; cursor: pointer; opacity: .3;
    border-right: 1px solid rgba(255,255,255,.07); transition: opacity .2s;
  }
  .cp-add-slot:last-child { border-right: none; }
  .cp-add-slot:hover { opacity: .65; }

  /* Table body */
  .cp-table-wrap { max-width: 1200px; margin: 0 auto; padding: 0 48px 48px; overflow-x: auto; }
  .cp-table-inner { min-width: 700px; }

  /* Section cards */
  .cp-section-card {
    background: #fff; border: 0.5px solid var(--rule); border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.03);
    overflow: hidden; margin-bottom: 24px; margin-top: 8px;
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
    position: relative;
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
    color: var(--green); text-decoration: none; padding: 10px 20px;
    border-right: 0.5px solid rgba(0,0,0,.04); transition: background .12s;
  }
  .cp-view-profile a:hover { background: rgba(45,189,116,.04); }
  .cp-view-profile a:last-child { border-right: none; }

  /* Fee calculator */
  .cp-fee-section { max-width: 1200px; margin: 0 auto 80px; padding: 0 48px; }
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
  .cp-gate-wrap::after {
    content: ''; position: absolute; inset: 0; backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
    -webkit-mask-image: linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,.5) 12%,rgba(0,0,0,1) 28%,rgba(0,0,0,1) 100%);
    mask-image: linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,.5) 12%,rgba(0,0,0,1) 28%,rgba(0,0,0,1) 100%);
    pointer-events: none; z-index: 2;
  }
  .cp-gate-wrap {
    -webkit-mask-image: linear-gradient(to bottom,rgba(0,0,0,1) 0%,rgba(0,0,0,1) 22%,rgba(0,0,0,.4) 45%,rgba(0,0,0,0) 65%);
    mask-image: linear-gradient(to bottom,rgba(0,0,0,1) 0%,rgba(0,0,0,1) 22%,rgba(0,0,0,.4) 45%,rgba(0,0,0,0) 65%);
  }

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
    position: absolute; top: 220px; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 520px; z-index: 50;
    background: #fff; border: 0.5px solid var(--rule); border-top: 2px solid var(--navy);
    border-radius: 0 0 10px 10px;
    box-shadow: 0 32px 80px rgba(10,28,42,.13), 0 4px 20px rgba(10,28,42,.07);
    padding: 40px 44px; text-align: center;
  }
  .cp-gate-cta {
    display: flex; width: 100%; align-items: center; justify-content: center; gap: 10px;
    background: var(--green); color: #fff; padding: 15px; border-radius: 6px;
    font-family: var(--sans); font-size: 13px; font-weight: 600;
    letter-spacing: .08em; text-transform: uppercase; text-decoration: none;
    transition: background .15s; margin-bottom: 12px;
  }
  .cp-gate-cta:hover { background: #22995E; }

  /* Empty state */
  .cp-empty-state { max-width: 1200px; margin: 0 auto; padding: 80px 48px; text-align: center; }

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

  /* ── Mobile ─────────────────────────────────────────────────────────── */
  @media (max-width: 768px) {
    .cp-hero { padding: 24px 16px 0 !important; }
    .cp-hero h1 { font-size: 28px !important; }
    .cp-jump-nav { margin: 0 -16px !important; padding: 0 16px !important; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .cp-firm-bar-inner { padding: 0 8px !important; gap: 4px !important; }
    .cp-firm-slot { min-width: 0 !important; padding: 0 4px !important; }
    .cp-firm-name { font-size: 10px !important; max-width: 60px !important; }
    .cp-firm-avatar { width: 20px !important; height: 20px !important; font-size: 8px !important; }
    .cp-table-wrap { padding: 0 8px 32px !important; }
    .cp-section-card { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .cp-row { min-width: 600px; }
    .cp-row-label { font-size: 11px !important; min-width: 100px !important; }
    .cp-row-cell { font-size: 12px !important; min-width: 100px !important; }
    .cp-section-head { flex-wrap: wrap; gap: 4px; }
    .cp-section-title { font-size: 16px !important; }
    .cp-section-meta { font-size: 10px !important; }
    .cp-fee-section { padding: 0 8px !important; margin-bottom: 40px !important; }
    .cp-fee-input-row { flex-direction: column !important; gap: 12px !important; padding: 16px !important; }
    .cp-fee-input-row .cp-slider-wrap { width: 100% !important; }
    .cp-gate-card { top: 120px !important; padding: 28px 20px !important; max-width: calc(100% - 32px) !important; }
    .cp-empty-state { padding: 48px 16px !important; }
    .cp-search-card { margin: 0 16px; }
    .cp-similar-grid { grid-template-columns: 1fr !important; }
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
    <div className="cp-section-card" id={id} style={{ scrollMarginTop: 140 }}>
      <div className="cp-section-head">
        <span className="cp-section-title">{title}</span>
        <span className="cp-section-meta">{meta}</span>
      </div>
      {children}
    </div>
  );
}

function ScoreRow({
  label, tip, strong, scores, ring,
}: {
  label: string; tip?: string; strong?: boolean; scores: (number | null)[]; ring?: boolean;
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
        return (
          <div key={col} className={`cp-row-cell${isBest ? ' cp-best' : ''}${isWorst ? ' cp-worst' : ''}`}>
            {score != null ? (
              ring ? (
                <MiniRing score={score} />
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
              <span className={`val-tag ${val === 'None' || val === 'No' ? 'good' : 'warn'}`}>{val}</span>
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
  const [activeSection, setActiveSection] = useState('vvs');
  const [showSearch, setShowSearch] = useState(false);
  const [similarFirms, setSimilarFirms] = useState<{ crd: number; name: string; city: string | null; state: string; aum: number | null; score: number | null; reason: string }[]>([]);

  // Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

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
      supabase.from('firmdata_current').select('crd, aum, aum_discretionary, aum_non_discretionary, employee_total, employee_investment, main_office_city, main_office_state, client_hnw_number, client_non_hnw_number, client_pension_number, client_charitable_number, client_corporations_number, client_pooled_vehicles_number, client_other_number, client_banks_number, client_bdc_number, client_govt_number, client_insurance_number, client_investment_cos_number, client_other_advisors_number, client_swf_number, legal_structure, private_fund_advisor, latest_adv_filing, number_of_offices, asset_allocation_cash, asset_allocation_derivatives, asset_allocation_ig_corp_bonds, asset_allocation_non_ig_corp_bonds, asset_allocation_public_equity_direct, asset_allocation_private_equity_direct, asset_allocation_us_govt_bonds, asset_allocation_us_muni_bonds, asset_allocation_other, services_financial_planning, services_mgr_selection, services_pension_consulting, services_port_management_individuals, services_port_management_institutional, services_port_management_pooled, state_ak, state_al, state_ar, state_az, state_ca, state_co, state_ct, state_dc, state_de, state_fl, state_ga, state_hi, state_ia, state_id, state_il, state_in, state_ks, state_ky, state_la, state_ma, state_md, state_me, state_mi, state_mn, state_mo, state_ms, state_mt, state_nc, state_nd, state_ne, state_nh, state_nj, state_nm, state_nv, state_ny, state_oh, state_ok, state_or, state_pa, state_ri, state_sc, state_sd, state_tn, state_tx, state_ut, state_va, state_vt, state_wa, state_wi, state_wv').in('crd', crds),
      supabase.from('firmdata_feetiers').select('crd, fee_pct, min_aum, max_aum').in('crd', crds),
      supabase.from('firmdata_profile_text').select('crd, wealth_tier, client_base, investment_philosophy, firm_character').in('crd', crds),
      supabase.from('firmdata_website').select('crd, website').in('crd', crds),
      supabase.from('firm_scores').select('*').in('crd', crds),
      supabase.from('firmdata_feesandmins').select('crd, fee_structure_type, minimum_account_size, fee_range_min, fee_range_max, minimum_fee').in('crd', crds),
      supabase.from('firmdata_growth').select('crd, aum, date_submitted').in('crd', crds).order('date_submitted', { ascending: true }),
      supabase.from('firmdata_growth_rate_rankings').select('crd, aum_1y_growth_annualized, aum_5y_growth_annualized, aum_10y_growth_annualized, clients_1y_growth_annualized, clients_5y_growth_annualized, clients_10y_growth_annualized, rank_current_aum, rank_current_employees, rank_current_invest_employees, rank_current_clients, rank_aum_1y_growth_annualized, rank_aum_5y_growth_annualized, rank_clients_1y_growth_annualized').in('crd', crds),
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

    // Percentile helper: rank 1 = best → "Top 1%", using non-null totals
    const totalFirmsInRankings = totalFirmCount ?? 0;
    // Get non-null counts for specific rank columns (run in parallel)
    const rankCols = ['rank_current_aum', 'rank_current_employees', 'rank_current_invest_employees', 'rank_current_clients', 'rank_aum_1y_growth_annualized', 'rank_aum_5y_growth_annualized', 'rank_clients_1y_growth_annualized'] as const;
    const rankTotals = new Map<string, number>();
    await Promise.all(rankCols.map(async (col) => {
      const { count } = await supabase.from('firmdata_growth_rate_rankings').select('*', { count: 'exact', head: true }).not(col, 'is', null);
      if (count != null) rankTotals.set(col, count);
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

      const avgClientSize = aum && totalClients > 0
        ? formatAUM(aum / totalClients) : '—';

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
        ['Public Equity', 'asset_allocation_public_equity_direct'],
        ['US Gov Bonds', 'asset_allocation_us_govt_bonds'],
        ['Corp Bonds (IG)', 'asset_allocation_ig_corp_bonds'],
        ['Corp Bonds (HY)', 'asset_allocation_non_ig_corp_bonds'],
        ['Muni Bonds', 'asset_allocation_us_muni_bonds'],
        ['Private Equity', 'asset_allocation_private_equity_direct'],
        ['Cash', 'asset_allocation_cash'],
        ['Derivatives', 'asset_allocation_derivatives'],
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
        feeTiers: fees as FeeTier[],
        logoKey: logoMap.get(firm.crd) ?? null,
        // Scores
        finalScore: score?.final_score ?? null,
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
        hasDisciplinary: '—',
        privateFundAdvisor: current?.private_fund_advisor === 'Y' ? 'Yes' : 'No',
        legalStructure: current?.legal_structure || '—',
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
        avgClientPercentile: null,
        clientsPerAdvisorPercentile: derivedPctileMap.get(firm.crd)?.clientsPerAdvisor ?? null,
        aumGrowth1yrPercentile: rankToDecile(gr?.rank_aum_1y_growth_annualized, 'rank_aum_1y_growth_annualized'),
        aumGrowth5yrPercentile: rankToDecile(gr?.rank_aum_5y_growth_annualized, 'rank_aum_5y_growth_annualized'),
        clientGrowth1yrPercentile: rankToDecile(gr?.rank_clients_1y_growth_annualized, 'rank_clients_1y_growth_annualized'),
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
  const removeFirm = (crd: number) => setSelected(selected.filter(s => s.crd !== crd));

  // IntersectionObserver for jump nav
  useEffect(() => {
    const ids = ['vvs', 'aum', 'allocation', 'clients', 'services', 'regulatory', 'fees'];
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(entry.target.id); }),
      { threshold: 0.1, rootMargin: '-100px 0px -60% 0px' }
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [comparisonData, session]);

  // Fee calculator
  const feeAmount = parseInt(feeInput.replace(/[^0-9]/g, ''), 10) || 0;
  const industryMedian = getIndustryMedian(feeAmount || 10_000_000);
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

        {/* ── HERO ────────────────────────────────────────────────────── */}
        <div className="cp-hero">
          <div className="cp-hero-inner">
            <div className="cp-hero-eyebrow">Side-by-Side Comparison</div>
            <h1>Compare Firms</h1>
            <p className="cp-hero-sub">Up to 4 firms · Scores, fees, growth, and client profile</p>
            <div className="cp-jump-nav">
              {jumpLinks.map(link => (
                <a key={link.id} href={`#${link.id}`}
                  className={`cp-jn-link${activeSection === link.id ? ' on' : ''}`}
                >{link.label}</a>
              ))}
            </div>
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
            <div className="cp-table-wrap">
              <div className="cp-table-inner">

                {/* ── FIRM OVERVIEW ─────────────────────────────────────── */}
                <SectionCard id="overview" title="Firm Overview" meta="SEC ADV · IAPD">
                  {loading ? (
                    <>{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</>
                  ) : (
                    <>
                      <ScoreRow label="Visor Index Score" ring scores={comparisonData.map(f => f.finalScore)} />
                      <DataRow label="Headquarters" values={comparisonData.map(f => f.location)} serif={false} />
                      <DataRowWithPctile label="AUM" values={comparisonData.map(f => f.aum)} percentiles={comparisonData.map(f => f.aumPercentile)} serif={false} />
                      <DataRowWithPctile label="Employees" values={comparisonData.map(f => f.employees)} percentiles={comparisonData.map(f => f.employeePercentile)} serif={false} />
                      <DataRowWithPctile label="Total Clients" values={comparisonData.map(f => f.totalClients.toLocaleString())} percentiles={comparisonData.map(f => f.totalClientsPercentile)} serif={false} />
                      <DataRow label="Fee Structure" values={comparisonData.map(f => f.feeStructureType)} serif={false} />
                      <DataRow label="Wealth Tier" values={comparisonData.map(f => f.wealthTier)} serif={false} />
                      <DataRow label="Offices" values={comparisonData.map(f => f.numOffices)} serif={false} />
                      <DataRow label="Registered States" values={comparisonData.map(f => f.registeredStates > 0 ? f.registeredStates.toString() : '—')} serif={false} />
                      {/* Website */}
                      <div className="cp-row" style={{ borderBottom: 'none' }}>
                        <div className="cp-row-label">Website</div>
                        {Array.from({ length: 4 }).map((_, col) => {
                          const f = col < comparisonData.length ? comparisonData[col] : null;
                          const web = f?.website;
                          return (
                            <div key={col} className={`cp-row-cell${web && web !== '—' ? ' text-left' : ''}`}>
                              {web && web !== '—' ? (
                                <a href={web.startsWith('http') ? web : `https://${web}`} target="_blank" rel="noopener noreferrer" className="cp-web-link">
                                  {web.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
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
                      <ScoreRow label="Derivatives Risk" tip="Use of complex instruments in client portfolios" scores={comparisonData.map(f => f.derivativesScore)} />
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
                      <DataRowWithPctile label="AUM Growth (1yr)" values={comparisonData.map(f => f.aumGrowth1yr)} percentiles={comparisonData.map(f => f.aumGrowth1yrPercentile)} serif={false} />
                      <DataRowWithPctile label="AUM Growth (5yr)" values={comparisonData.map(f => f.aumGrowth5yr)} percentiles={comparisonData.map(f => f.aumGrowth5yrPercentile)} serif={false} />
                      <DataRow label="AUM Growth (10yr)" values={comparisonData.map(f => f.aumGrowth10yr)} serif={false} />
                      <DataRowWithPctile label="Client Growth (1yr)" values={comparisonData.map(f => f.clientGrowth1yr)} percentiles={comparisonData.map(f => f.clientGrowth1yrPercentile)} serif={false} />
                      <DataRow label="Client Growth (5yr)" values={comparisonData.map(f => f.clientGrowth5yr)} serif={false} />
                      {/* Discretionary / Non-Discretionary split */}
                      <div className="cp-row">
                        <div className="cp-row-label">AUM Split</div>
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
                            <div key={col} className="cp-row-cell" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 2 }}>
                              <div className="cp-split-bar">
                                <div className="cp-split-disc" style={{ width: `${discPct}%` }} />
                                <div className="cp-split-nondisc" style={{ width: `${100 - discPct}%` }} />
                              </div>
                              <div className="cp-split-labels">
                                <span>Disc. {discPct.toFixed(0)}%</span>
                                <span>Non-D. {(100 - discPct).toFixed(0)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <DataRowWithPctile label="Employees" values={comparisonData.map(f => f.employees)} percentiles={comparisonData.map(f => f.employeePercentile)} serif={false} />
                      <ViewProfileRow firms={comparisonData} />
                    </>
                  )}
                </SectionCard>

                {/* ASSET ALLOCATION */}
                <SectionCard id="allocation" title="Asset Allocation" meta="ADV Part 1 · Item 5.D">
                  {loading ? (
                    <>{Array.from({ length: 2 }).map((_, i) => <SkeletonRow key={i} />)}</>
                  ) : (
                    <>
                      <div className="cp-row" style={{ borderBottom: 'none' }}>
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
                                    style={{ width: `${a.pct}%`, background: a.color }} />
                                ))}
                              </div>
                              <div className="cp-alloc-legend">
                                {f.assetAllocation.map(a => (
                                  <span key={a.label} className="cp-alloc-legend-item">
                                    <span className="cp-alloc-dot" style={{ background: a.color }} />
                                    {a.label} {a.pct.toFixed(0)}%
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
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
                      <DataRow label="Avg. Client Size" values={comparisonData.map(f => f.avgClientSize)} serif={false} />
                      <DataRowWithPctile label="AUM per Investment Professional" values={comparisonData.map(f => f.aumPerAdvisor)} percentiles={comparisonData.map(f => f.invStaffPercentile)} serif={false} />
                      <DataRowWithPctile label="Clients per Investment Professional" values={comparisonData.map(f => f.clientsPerAdvisor)} percentiles={comparisonData.map(f => f.clientsPerAdvisorPercentile)} serif={false} />
                      <DataRow label="Minimum Account" values={comparisonData.map(f => f.minAccount)} serif={false} />
                      <DataRow label="Wealth Tier" values={comparisonData.map(f => f.wealthTier)} serif={false} />
                      <DataRow label="Client Base" values={comparisonData.map(f => f.clientBase)} serif={false} />
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

                {/* FEES & REGULATORY */}
                <SectionCard id="regulatory" title="Fees & Regulatory" meta="IAPD · SEC EDGAR · ADV Part 2A">
                  {loading ? (
                    <>{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</>
                  ) : (
                    <>
                      <DataRow label="Fee Structure" values={comparisonData.map(f => f.feeStructureType)} serif={false} />
                      <DataRow label="Fee Range (Min)" values={comparisonData.map(f => f.feeRangeMin)} serif={false} />
                      <DataRow label="Fee Range (Max)" values={comparisonData.map(f => f.feeRangeMax)} serif={false} />
                      <DataRow label="Minimum Fee" values={comparisonData.map(f => f.minimumFee)} serif={false} />
                      <DataRow label="Minimum Account" values={comparisonData.map(f => f.minAccount)} serif={false} />
                      <DataRow label="Disciplinary History" values={comparisonData.map(f => f.hasDisciplinary)} tag />
                      <DataRow label="Private Fund Advisor" values={comparisonData.map(f => f.privateFundAdvisor)} serif={false} />
                      <DataRow label="Legal Structure" values={comparisonData.map(f => f.legalStructure)} serif={false} textLeft />
                      <DataRow label="Latest Filing" values={comparisonData.map(f => f.latestFiling)} serif={false} textLeft />
                      {/* Investment Philosophy */}
                      <div className="cp-row" style={{ borderBottom: 'none' }}>
                        <div className="cp-row-label">Philosophy</div>
                        {Array.from({ length: 4 }).map((_, col) => {
                          const f = col < comparisonData.length ? comparisonData[col] : null;
                          const text = f?.investmentPhilosophy;
                          return (
                            <div key={col} className={`cp-row-cell${text && text !== '—' ? ' text-left' : ''}`}>
                              {text && text !== '—' ? (
                                <div className="cp-philosophy">{text}</div>
                              ) : <span className="val-dash">—</span>}
                            </div>
                          );
                        })}
                      </div>
                      <ViewProfileRow firms={comparisonData} />
                    </>
                  )}
                </SectionCard>

              </div>
            </div>

            {/* ── FEE CALCULATOR ──────────────────────────────────────── */}
            {/* ── FEE SCHEDULE COMPARISON ────────────────────────── */}
            {!loading && comparisonData.length > 0 && (
              <div className="cp-fee-section" style={{ marginBottom: 0, paddingBottom: 0 }}>
                <div className="cp-fee-card" style={{ marginBottom: 24 }}>
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

            <div id="fees" className="cp-fee-section" style={{ scrollMarginTop: 140 }}>
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
                        const annual = firm.feeTiers.length > 0 ? calcTieredFee(feeAmount, firm.feeTiers) : feeAmount * (industryMedian / 100);
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
                          const annual = firm.feeTiers.length > 0 ? calcTieredFee(feeAmount, firm.feeTiers) : feeAmount * (industryMedian / 100);
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
            </div>


          </div>{/* /gate-wrap */}

          {/* Gate overlay */}
          {isGated && (
            <>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '54%', background: 'var(--bg)', pointerEvents: 'none', zIndex: 5 }} />
              <div className="cp-gate-card">
                <div className="cp-hero-eyebrow" style={{ justifyContent: 'center' }}>
                  <span style={{ width: 20, height: 1, background: 'var(--green)', display: 'inline-block' }} />
                  Free to join
                  <span style={{ width: 20, height: 1, background: 'var(--green)', display: 'inline-block' }} />
                </div>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: 30, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.02em', lineHeight: 1.1, marginBottom: 10 }}>
                  Unlock the full comparison
                </h2>
                <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.75, maxWidth: 380, margin: '0 auto 24px' }}>
                  See scores, fees, AUM growth, client profile, regulatory history, and fee impact across all firms — side by side.
                </p>
                <div style={{ display: 'flex', border: '0.5px solid var(--rule)', marginBottom: 24, borderRadius: 6, overflow: 'hidden' }}>
                  {selected.length > 0 ? selected.slice(0, 4).map((firm, i) => (
                    <div key={firm.crd} style={{ flex: 1, padding: '12px 14px', borderRight: i < selected.length - 1 ? '0.5px solid var(--rule)' : 'none', textAlign: 'center' }}>
                      <div style={{ width: 26, height: 26, background: 'var(--navy)', display: 'grid', placeItems: 'center', fontFamily: 'var(--serif)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.45)', margin: '0 auto 5px' }}>
                        {(firm.display_name || firm.primary_business_name).slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {(firm.display_name || firm.primary_business_name).split(' ')[0]}
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--green)' }}>Score —</div>
                    </div>
                  )) : (
                    <div style={{ flex: 1, padding: '16px 14px', textAlign: 'center', color: 'var(--rule)', fontSize: 12 }}>
                      Search for firms to compare
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, textAlign: 'left', marginBottom: 24, padding: '14px 18px', background: 'var(--bg)', border: '0.5px solid var(--rule)', borderRadius: 6 }}>
                  {[
                    'Full Visor Index Score™ breakdown across 8 sub-metrics',
                    'AUM growth, client profile, and advisor bandwidth data',
                    'Regulatory history, conflict flags, and ownership structure',
                    'Fee Calculator — 10 & 20-year compounding impact side by side',
                  ].map(perk => (
                    <div key={perk} style={{ fontSize: 12, color: 'var(--ink-3)', display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.5 }}>
                      <span style={{ color: 'var(--green)', fontWeight: 700, flexShrink: 0 }}>✓</span>{perk}
                    </div>
                  ))}
                </div>
                <Link href="/auth/signup" className="cp-gate-cta">Create Free Account <span style={{ fontSize: 16 }}>→</span></Link>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  Already have an account?{' '}
                  <Link href="/auth/login" style={{ color: 'var(--ink)', fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid var(--rule)' }}>Sign in</Link>
                </div>
              </div>
              <div style={{ height: 580 }} />
            </>
          )}
        </div>

        {/* ── EMPTY STATE ────────────────────────────────────────────── */}
        {!isGated && session !== undefined && selected.length === 0 && !showSearch && (
          <div className="cp-empty-state">
            <div style={{ width: 56, height: 56, border: '0.5px solid var(--rule)', display: 'grid', placeItems: 'center', margin: '0 auto 24px', opacity: 0.5, borderRadius: 10 }}>
              <svg width="22" height="22" fill="none" stroke="var(--ink-3)" strokeWidth="1.5" viewBox="0 0 22 22">
                <circle cx="11" cy="11" r="9" /><line x1="11" y1="7" x2="11" y2="15" /><line x1="7" y1="11" x2="15" y2="11" />
              </svg>
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>No firms selected</h2>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.75, marginBottom: 28 }}>
              Search for up to 4 firms to compare their scores, fees, and client profile side by side.
            </p>
            <button
              onClick={() => setShowSearch(true)}
              style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, color: '#fff', background: 'var(--green)', border: 'none', padding: '12px 28px', cursor: 'pointer', borderRadius: 6 }}
            >Search Firms →</button>
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
