'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import FirmLogo from '@/components/firms/FirmLogo';
import { useSearchParams } from 'next/navigation';
import { Session } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import {
  INDUSTRY_ALL,
  getClosestBreakpoint,
  getNextBreakpoint,
  calcTieredFeeSimple,
  synthesizeRangeTiers,
  synthesizeMaxOnlyTiers,
  formatDollar,
  formatCompact,
  projectGrowth,
  computeAskRate,
  computeLeverage,
  type LeverageLevel,
  type FeeTier,
} from '@/lib/fee-utils';
import { getSimilarFirms, type SimilarFirm } from '@/lib/similar-firms';
import CompoundingImpact from '@/components/negotiate/CompoundingImpact';

// ── Types ─────────────────────────────────────────────────────────────────────
type FeeMode = 'flat' | 'tiered' | 'dollar' | 'unknown';
type ClientStatus = 'existing' | 'prospective';

interface PlaybookItem {
  type: 'primary' | 'rebuttal';
  tag: string;
  head: string;
  text: string;
  quote?: string;
}

// ── Firm data types ──────────────────────────────────────────────────────────
interface FirmData {
  crd: number;
  name: string;
  logoKey: string | null;
  aum: number | null;
  employees: number | null;
  clientTotal: number | null;
  feeStructureType: string | null;
  feeRangeMin: number | null;
  feeRangeMax: number | null;
  feeNotes: string | null;
  tiers: FeeTier[];
  score: number | null;
  website: string | null;
  privateFundAdvisor: boolean;
  disciplinaryHistory: boolean;
  conflictFlags: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Convert ALL-CAPS firm names to title case, preserving short acronyms (≤3 chars). */
function formatFirmName(name: string): string {
  // Only transform if the name is mostly uppercase
  if (name !== name.toUpperCase()) return name;
  return name
    .replace(/,?\s*(LLC|LLP|INC|LP|CO|CORP)\.?$/i, '') // strip trailing legal suffixes
    .split(/\s+/)
    .map(w => w.length <= 3 ? w.toUpperCase() : w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function NegotiatePage() {
  const searchParams = useSearchParams();
  const crdParam = searchParams.get('crd');
  const aumParam = searchParams.get('aum');
  const feeParam = searchParams.get('fee');

  // ── PROTECTED STATE ──────────────────────────────────────────────────────
  const [rawAum, setRawAum] = useState('');
  const [rawFee, setRawFee] = useState('');
  const [feeMode, setFeeMode] = useState<FeeMode>('flat');
  const [showResults, setShowResults] = useState(false);

  const [feeTiers, setFeeTiers] = useState<{ min: number; max: number | null; fee: number }[]>([
    { min: 0, max: 500000, fee: 1.0 },
    { min: 500000, max: null, fee: 0.8 },
  ]);
  const [tierFeeRaw, setTierFeeRaw] = useState<Record<number, string>>({});
  const [showMinAumWarning, setShowMinAumWarning] = useState(false);
  const [showDollarFeeWarning, setShowDollarFeeWarning] = useState(false);
  const [showFeeCapWarning, setShowFeeCapWarning] = useState(false);
  const [showAumCapWarning, setShowAumCapWarning] = useState(false);

  // ── FIRM STATE ─────────────────────────────────────────────────────────
  const [firmData, setFirmData] = useState<FirmData | null>(null);
  const [firmLoading, setFirmLoading] = useState(false);
  const [firmPrefilled, setFirmPrefilled] = useState(false);

  // ── SIMILAR FIRMS STATE ────────────────────────────────────────────
  const [similarFirms, setSimilarFirms] = useState<SimilarFirm[]>([]);

  // ── FIRM SEARCH STATE ──────────────────────────────────────────────────
  const [firmQuery, setFirmQuery] = useState('');
  const [firmResults, setFirmResults] = useState<{ crd: number; name: string }[]>([]);
  const [firmSelectedIndex, setFirmSelectedIndex] = useState(-1);
  const [bannerSearchOpen, setBannerSearchOpen] = useState(false);

  // ── ENTRY MODE STATE ──────────────────────────────────────────────────
  // 'choose' = show two-path picker, 'firm' = searching for firm, 'manual' = enter fees yourself
  const [entryMode, setEntryMode] = useState<'firm' | 'manual'>('manual');

  // ── PRESENTATION STATE ───────────────────────────────────────────────────
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [clientStatus, setClientStatus] = useState<ClientStatus>('existing');
  const [showGate, setShowGate] = useState(false);
  const [gateEmail, setGateEmail] = useState('');
  const [gateError, setGateError] = useState(false);
  const [animated, setAnimated] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Dynamic page title
  useEffect(() => {
    document.title = firmData
      ? `Negotiate Fees with ${firmData.name} | Visor Index`
      : 'Fee Negotiation Tool — Are You Overpaying? | Visor Index';
  }, [firmData]);

  // Session detection
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  // ── FIRM DATA FETCH (reusable) ───────────────────────────────────────────
  const loadFirm = useCallback((crd: number) => {
    setFirmLoading(true);
    setFirmData(null);   // Clear stale data so prefill doesn't re-run with old firm
    setFirmPrefilled(false);
    const supabase = createSupabaseBrowserClient();

    Promise.all([
      supabase.from('firm_names').select('display_name').eq('crd', crd).maybeSingle(),
      supabase.from('firmdata_current').select('aum, employee_total, primary_business_name, private_fund_advisor, disclosure_firm_suspension_revoked, disclosure_firm_sec_cftc_violations, disclosure_firm_sec_cftc_monetary_penalty, disclosure_firm_felony_conviction, disclosure_firm_court_ruling_violation, disclosure_firm_current_regulatory_proceedings').eq('crd', crd).maybeSingle(),
      supabase.from('firmdata_feetiers').select('min_aum, max_aum, fee_pct').eq('crd', crd).order('min_aum', { ascending: true }),
      supabase.from('firmdata_feesandmins').select('fee_structure_type, fee_range_min, fee_range_max, notes').eq('crd', crd).maybeSingle(),
      supabase.from('firm_scores').select('final_score').eq('crd', crd).maybeSingle(),
      supabase.from('firm_logos').select('logo_key').eq('crd', crd).maybeSingle(),
      supabase.from('firmdata_website').select('website').eq('crd', crd).maybeSingle(),
      supabase.from('firmdata_percentiles').select('client_total').eq('crd', crd).maybeSingle(),
    ]).then(([nameRes, currentRes, tiersRes, feesRes, scoreRes, logoRes, webRes, pctRes]) => {
      const cur = currentRes.data;
      const rawName = nameRes.data?.display_name || cur?.primary_business_name;
      if (!rawName) { setFirmLoading(false); return; }
      const firmName = formatFirmName(rawName);

      const conflicts: string[] = [];
      const hasDiscip = cur?.disclosure_firm_suspension_revoked === 'Y' || cur?.disclosure_firm_felony_conviction === 'Y';
      const hasRegulatory = cur?.disclosure_firm_sec_cftc_violations === 'Y' || cur?.disclosure_firm_sec_cftc_monetary_penalty === 'Y' || cur?.disclosure_firm_current_regulatory_proceedings === 'Y';
      const hasCivil = cur?.disclosure_firm_court_ruling_violation === 'Y';
      if (hasDiscip) conflicts.push('Disciplinary Disclosure');
      if (hasRegulatory) conflicts.push('Regulatory Disclosure');
      if (hasCivil) conflicts.push('Civil/Judicial Disclosure');

      setFirmData({
        crd,
        name: firmName,
        logoKey: logoRes.data?.logo_key || null,
        aum: cur?.aum || null,
        employees: cur?.employee_total || null,
        clientTotal: pctRes.data?.client_total || null,
        feeStructureType: feesRes.data?.fee_structure_type || null,
        feeRangeMin: feesRes.data?.fee_range_min || null,
        feeRangeMax: feesRes.data?.fee_range_max || null,
        feeNotes: feesRes.data?.notes || null,
        tiers: ((tiersRes.data || []) as FeeTier[]).sort((a, b) => parseInt(a.min_aum || '0') - parseInt(b.min_aum || '0')),
        score: scoreRes.data?.final_score || null,
        website: webRes.data?.website || null,
        privateFundAdvisor: cur?.private_fund_advisor === 'Y',
        disciplinaryHistory: hasDiscip,
        conflictFlags: conflicts,
      });
      setFirmLoading(false);
    });
  }, []);

  // Load from URL param on mount (requires auth — wait for session to resolve)
  useEffect(() => {
    if (!crdParam || session === undefined) return; // wait for auth check
    if (session === null) {
      // Redirect to clean negotiate page — unauthenticated users can't import firms
      window.location.replace('/negotiate');
      return;
    }
    const crd = parseInt(crdParam, 10);
    if (!isNaN(crd)) loadFirm(crd);
  }, [crdParam, session, loadFirm]);

  // ── SIMILAR FIRMS FETCH ────────────────────────────────────────────────
  useEffect(() => {
    if (!firmData || !firmData.aum) { setSimilarFirms([]); return; }
    const supabase = createSupabaseBrowserClient();
    // Fetch the firm's full row for similarity vectors
    supabase.from('firmdata_current')
      .select('crd, aum, main_office_state, client_hnw_number, client_non_hnw_number, client_pension_number, client_charitable_number, client_corporations_number, client_pooled_vehicles_number, client_other_number, client_banks_number, client_govt_number, client_insurance_number, client_investment_cos_number, client_other_advisors_number, services_financial_planning, services_mgr_selection, services_pension_consulting, services_port_management_individuals, services_port_management_institutional, services_port_management_pooled')
      .eq('crd', firmData.crd).maybeSingle()
      .then(({ data: firmRow }) => {
        if (!firmRow || !firmRow.main_office_state) return;
        getSimilarFirms({
          supabase,
          crd: firmData.crd,
          state: firmRow.main_office_state,
          aum: firmData.aum,
          firmRow,
          limit: 6,
          includeFees: true,
        }).then(setSimilarFirms);
      });
  }, [firmData]);

  // ── FIRM SEARCH (debounced) ────────────────────────────────────────────
  useEffect(() => {
    if (firmQuery.length < 2) { setFirmResults([]); return; }
    const timer = setTimeout(async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from('firmdata_current')
        .select('crd, primary_business_name')
        .ilike('primary_business_name', `%${firmQuery}%`)
        .limit(8);
      if (!data) { setFirmResults([]); return; }
      const crds = data.map(d => d.crd);
      const { data: names } = await supabase
        .from('firm_names')
        .select('crd, display_name')
        .in('crd', crds);
      const nameMap = new Map((names || []).map(n => [n.crd, n.display_name]));
      setFirmResults(data.filter(d => d.primary_business_name).map(d => ({
        crd: d.crd,
        name: nameMap.get(d.crd) || d.primary_business_name!,
      })));
    }, 300);
    return () => clearTimeout(timer);
  }, [firmQuery]);

  // ── FIRM SELECT / CLEAR ────────────────────────────────────────────────
  const selectFirm = useCallback((crd: number) => {
    setFirmQuery('');
    setFirmResults([]);
    setFirmSelectedIndex(-1);
    setBannerSearchOpen(false);
    setEntryMode('manual');
    loadFirm(crd);
  }, [loadFirm]);

  const clearFirm = useCallback(() => {
    setFirmData(null);
    setSimilarFirms([]);
    setFirmPrefilled(false);
    setFirmQuery('');
    setFirmResults([]);
    // Reset fee inputs to defaults
    setFeeMode('flat');
    setRawFee('');
    setFeeTiers([
      { min: 0, max: 500000, fee: 1.0 },
      { min: 500000, max: null, fee: 0.8 },
    ]);
    setShowResults(false);
    setShowGate(false);
  }, []);

  // ── PRE-FILL from URL params (runs once on mount, before firm data loads) ──
  useEffect(() => {
    if (aumParam) setRawAum(aumParam);
    if (feeParam) setRawFee(feeParam);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── PRE-FILL from firm data ────────────────────────────────────────────
  useEffect(() => {
    if (!firmData || firmPrefilled) return;
    setFirmPrefilled(true);

    // Reset fee inputs before applying new firm's data
    setRawFee('');
    setFeeTiers([
      { min: 0, max: 500000, fee: 1.0 },
      { min: 500000, max: null, fee: 0.8 },
    ]);
    setShowResults(false);

    const type = firmData.feeStructureType;

    if (type === 'tiered' && firmData.tiers.length > 0) {
      setFeeMode('tiered');
      const mapped = firmData.tiers.map((t, i) => ({
        min: parseInt(t.min_aum || '0'),
        max: t.max_aum,
        fee: t.fee_pct ?? 0,
      }));
      setFeeTiers(mapped);
    } else if (type === 'flat_percentage' && firmData.feeRangeMax) {
      setFeeMode('flat');
      setRawFee(firmData.feeRangeMax.toString());
    } else if (type === 'range' && firmData.feeRangeMin != null && firmData.feeRangeMax != null) {
      // Synthesize tiers from full range
      const avgClientSize = (firmData.aum && firmData.clientTotal && firmData.clientTotal > 0)
        ? firmData.aum / firmData.clientTotal
        : 1_000_000;
      const synthTiers = synthesizeRangeTiers(firmData.feeRangeMin, firmData.feeRangeMax, avgClientSize);
      if (synthTiers.length > 0) {
        setFeeMode('tiered');
        setFeeTiers(synthTiers.map(t => ({
          min: parseInt(t.min_aum || '0'),
          max: t.max_aum,
          fee: t.fee_pct ?? 0,
        })));
      } else {
        setFeeMode('flat');
        setRawFee(firmData.feeRangeMax.toString());
      }
    } else if ((type === 'maximum_only' || type === 'range') && firmData.feeRangeMax) {
      // Max-only or range with only max — synthesize from max + industry data
      const avgClient = (firmData.aum && firmData.clientTotal && firmData.clientTotal > 0)
        ? firmData.aum / firmData.clientTotal
        : 0;
      if (avgClient > 0) {
        const synthTiers = synthesizeMaxOnlyTiers(firmData.feeRangeMax, avgClient);
        if (synthTiers.length > 0) {
          setFeeMode('tiered');
          setFeeTiers(synthTiers.map(t => ({
            min: parseInt(t.min_aum || '0'),
            max: t.max_aum,
            fee: t.fee_pct ?? 0,
          })));
        } else {
          setFeeMode('flat');
          setRawFee(firmData.feeRangeMax.toString());
        }
      } else {
        // No avg client data — treat as not disclosed
        setFeeMode('unknown');
      }
    } else {
      // Firm has no disclosed fee structure — use industry median
      setFeeMode('unknown');
    }
  }, [firmData, firmPrefilled]);

  // Animate bars when results revealed
  useEffect(() => {
    if (showResults) {
      const t = setTimeout(() => setAnimated(true), 120);
      return () => clearTimeout(t);
    }
    setAnimated(false);
  }, [showResults]);

  // ── PROTECTED CALLBACKS ──────────────────────────────────────────────────
  const addFeeTier = useCallback(() => {
    if (feeTiers.length >= 7) return;
    const lastTier = feeTiers[feeTiers.length - 1];
    const newMin = lastTier.max || (lastTier.min * 2) || 500000;
    const newFee = Math.max(0, Math.round((lastTier.fee - 0.1) * 100) / 100);
    setFeeTiers([...feeTiers, { min: newMin, max: null, fee: newFee }]);
  }, [feeTiers]);

  const updateFeeTier = useCallback((index: number, field: 'min' | 'max' | 'fee', value: number | null) => {
    const newTiers = [...feeTiers];
    if (field === 'fee' && typeof value === 'number') {
      value = Math.min(value, 3);
      if (index > 0 && value >= newTiers[index - 1].fee) {
        value = Math.max(0, newTiers[index - 1].fee - 0.01);
        value = Math.round(value * 100) / 100;
      }
    }
    newTiers[index] = { ...newTiers[index], [field]: value };
    if (field === 'max' && index < newTiers.length - 1 && value !== null) {
      newTiers[index + 1] = { ...newTiers[index + 1], min: value };
    }
    if (field === 'fee') {
      for (let i = index + 1; i < newTiers.length; i++) {
        if (newTiers[i].fee >= newTiers[i - 1].fee) {
          newTiers[i] = { ...newTiers[i], fee: Math.max(0, Math.round((newTiers[i - 1].fee - 0.01) * 100) / 100) };
        }
      }
    }
    setFeeTiers(newTiers);
  }, [feeTiers]);

  const removeFeeTier = useCallback((index: number) => {
    if (feeTiers.length <= 2) return;
    setFeeTiers(feeTiers.filter((_, i) => i !== index));
  }, [feeTiers]);

  // ── PROTECTED COMPUTED VALUES ────────────────────────────────────────────
  const aum = useMemo(() => {
    const num = parseInt(rawAum.replace(/[^0-9]/g, ''), 10);
    const maxAum = feeMode === 'dollar' ? 30_000_000 : 1_000_000_000;
    return isNaN(num) ? 0 : Math.min(num, maxAum);
  }, [rawAum, feeMode]);

  const feePercent = useMemo(() => {
    if (feeMode === 'unknown') {
      if (aum <= 0) return 0;
      return getClosestBreakpoint(aum).median;
    }
    if (feeMode === 'dollar') {
      const num = parseFloat(rawFee.replace(/[^0-9.]/g, ''));
      if (isNaN(num) || aum === 0) return 0;
      return Math.min((num / aum) * 100, 3);
    } else if (feeMode === 'tiered') {
      if (feeTiers.length > 0 && aum > 0) {
        let totalFee = 0, remaining = aum;
        for (const tier of feeTiers) {
          if (remaining <= 0) break;
          const tierMax = tier.max ?? Infinity;
          const tierSize = Math.min(remaining, tierMax - tier.min);
          if (tierSize > 0) { totalFee += tierSize * (Math.min(tier.fee, 3) / 100); remaining -= tierSize; }
        }
        return aum > 0 ? (totalFee / aum) * 100 : 0;
      }
      return 0;
    } else {
      const num = parseFloat(rawFee);
      return isNaN(num) ? 0 : Math.max(0, Math.min(num, 3));
    }
  }, [rawFee, feeMode, aum, feeTiers]);

  // True when the firm prefill logic was able to extract a concrete fee structure
  const firmHasDisclosedFees = firmData
    ? (
        (firmData.feeStructureType === 'tiered' && firmData.tiers.length > 0) ||
        (firmData.feeStructureType === 'flat_percentage' && firmData.feeRangeMax != null) ||
        ((firmData.feeStructureType === 'range' || firmData.feeStructureType === 'maximum_only') && firmData.feeRangeMax != null)
      )
    : true;

  const hasValidInput = aum >= 10_000 && feePercent > 0;
  const bracket = useMemo(() => (aum > 0 ? getClosestBreakpoint(aum) : null), [aum]);

  const annualFee   = aum * (feePercent / 100);
  const medianFee   = bracket ? aum * (bracket.median / 100) : 0;
  const p25Fee      = bracket ? aum * (bracket.p25 / 100) : 0;
  const feeDiff     = annualFee - medianFee;
  const bps         = Math.round(feePercent * 100);
  const medianBps   = bracket ? Math.round(bracket.median * 100) : 0;

  const isOverpaying       = bracket ? feePercent > bracket.median + 0.005 : false;
  const isSignificantlyOver = bracket ? feePercent > bracket.p75 : false;
  const isUnder            = bracket ? feePercent < bracket.median - 0.005 : false;

  const tenYearCurrent  = useMemo(() => projectGrowth(aum, feePercent / 100, 10), [aum, feePercent]);
  const tenYearMedian   = useMemo(() => bracket ? projectGrowth(aum, bracket.median / 100, 10) : null, [aum, bracket]);

  const compoundingCost = tenYearMedian ? tenYearMedian.value - tenYearCurrent.value : 0;
  const gaugeMax = bracket ? Math.max(bracket.p75 * 1.5, feePercent * 1.15) : 2;
  const pctPos = (val: number) => Math.min((val / gaugeMax) * 100, 95);

  // Ask rate (recommended fee = blended effective p25 for this AUM)
  const askRate    = aum > 0 ? computeAskRate(aum) : 0;
  const askSavings = feePercent > askRate ? (feePercent - askRate) * aum / 100 : 0;
  const leverage   = computeLeverage(aum, firmData?.aum, firmData?.clientTotal);
  const nextBp     = getNextBreakpoint(aum);

  // ── PROTECTED HANDLERS ───────────────────────────────────────────────────
  const handleAumChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, '');
    if (!digits) { setRawAum(''); setShowResults(false); setShowGate(false); return; }
    let num = parseInt(digits, 10);
    const maxAum = feeMode === 'dollar' ? 30_000_000 : 1_000_000_000;
    if (num > maxAum) {
      num = maxAum;
      setShowAumCapWarning(true);
      setTimeout(() => setShowAumCapWarning(false), 4000);
    }
    setRawAum(num.toLocaleString('en-US'));
    setShowResults(false);
    setShowGate(false);
  }, [feeMode]);

  const handleFeeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (feeMode === 'unknown') return;
    const val = e.target.value;
    if (feeMode === 'dollar') {
      const digits = val.replace(/[^0-9]/g, '');
      if (!digits) { setRawFee(''); return; }
      let num = parseInt(digits, 10);
      if (isNaN(num)) { setRawFee(''); return; }
      const maxDollar = aum > 0 ? Math.floor(aum * 0.03) : 999_999_999;
      if (num > maxDollar && aum > 0) {
        num = maxDollar;
        setShowDollarFeeWarning(true);
        setTimeout(() => setShowDollarFeeWarning(false), 4000);
      }
      setRawFee(num.toLocaleString('en-US'));
      return;
    }
    if (feeMode === 'flat') {
      if (val !== '' && !/^\d*\.?\d{0,2}$/.test(val)) return;
      const num = parseFloat(val);
      if (!isNaN(num) && num > 3) {
        setRawFee('3');
        setShowFeeCapWarning(true);
        setTimeout(() => setShowFeeCapWarning(false), 4000);
        return;
      }
    }
    setRawFee(val);
  }, [feeMode, aum]);

  // Modified: adds gate path for unauthenticated users
  const handleCalculate = useCallback(() => {
    if (aum > 0 && aum < 10_000) {
      setShowMinAumWarning(true);
      setTimeout(() => setShowMinAumWarning(false), 3000);
      return;
    }
    if (!hasValidInput) return;
    if (session === null) {
      setShowGate(true);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    } else {
      setShowResults(true);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    }
  }, [hasValidInput, aum, session]);

  // Auto-trigger analysis when arriving from firm profile with AUM param
  useEffect(() => {
    if (firmPrefilled && aumParam) {
      const t = setTimeout(() => handleCalculate(), 300);
      return () => clearTimeout(t);
    }
  }, [firmPrefilled, aumParam, handleCalculate]);

  // Gate unlock (email submit)
  const handleGateUnlock = useCallback(() => {
    if (!gateEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gateEmail)) {
      setGateError(true);
      return;
    }
    setGateError(false);
    setShowGate(false);
    setShowResults(true);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }, [gateEmail]);

  // ── PLAYBOOK ITEMS ───────────────────────────────────────────────────────
  const playbookItems = useMemo<PlaybookItem[]>(() => {
    if (!bracket || !hasValidInput) return [];
    const items: PlaybookItem[] = [];
    const targetRate = askRate.toFixed(2);

    // ── LEVERAGE-AWARE TONE ──────────────────────────────────────────────
    const leverageText = leverage === 'very-high'
      ? 'At your portfolio size, firms compete for your business. Name your terms.'
      : leverage === 'high'
      ? 'Your portfolio represents meaningful revenue for this firm — you have clear leverage.'
      : leverage === 'moderate'
      ? 'The data supports a conversation about your rate.'
      : '';

    // ── KNOW YOUR POSITION (firm-specific context card) ────────────────
    if (firmData && firmData.aum && firmData.clientTotal && firmData.clientTotal > 0) {
      const avgClient = firmData.aum / firmData.clientTotal;
      const ratioToAvg = aum / avgClient;
      const estRevenue = aum * (feePercent / 100);
      const pctOfFirmAum = (aum / firmData.aum) * 100;
      const fn = firmData.name;
      const fnPoss = fn.endsWith('s') || fn.endsWith('S') ? `${fn}\u2019` : `${fn}\u2019s`;

      const sizeLabel = ratioToAvg >= 2 ? `${ratioToAvg.toFixed(1)}× their average client`
        : ratioToAvg >= 0.8 ? 'near their average client size'
        : `${(ratioToAvg * 100).toFixed(0)}% of their average client size`;

      items.push({
        type: 'primary', tag: 'Know Your Position', head: 'Your portfolio in context',
        text: `${fn} manages ${formatCompact(firmData.aum)} across ${firmData.clientTotal.toLocaleString()} clients, with an average client portfolio of ~${formatCompact(avgClient)}. Your ${formatCompact(aum)} portfolio is ${sizeLabel}. At your current fee, you represent approximately ${formatCompact(estRevenue)}/yr in revenue to the firm — and ${pctOfFirmAum < 0.01 ? 'less than 0.01' : pctOfFirmAum.toFixed(2)}% of ${fnPoss} total assets.`,
      });
    }

    // ── OPENING MOVE (all users) ─────────────────────────────────────────
    const belowP25 = feePercent <= bracket.p25;
    const belowMedian = feePercent <= bracket.median;

    if (belowP25) {
      items.push({
        type: 'primary', tag: 'Opening Move', head: 'Lead with the data',
        text: `Your rate is already below the best quartile — that's a strong position. Use this as a foundation to lock in your rate and ensure it stays competitive as your assets grow.`,
        quote: `"I've been reviewing fee data on Visor Index for wealth management firms managing near ${formatCompact(aum)}. The industry median is ${bracket.median.toFixed(2)}% and the 25th percentile is ${bracket.p25.toFixed(2)}% — so I know my current rate of ${feePercent.toFixed(2)}% is competitive. I'd like to formalize this rate and discuss how the fee structure scales as my portfolio grows."`,
      });
    } else if (belowMedian) {
      items.push({
        type: 'primary', tag: 'Opening Move', head: 'Lead with the data',
        text: `Your rate is below the peer median but there's still room to move toward the best quartile. Reference the benchmarks to frame the conversation around where you'd like to end up.`,
        quote: `"I've been reviewing fee data on Visor Index for wealth management firms managing near ${formatCompact(aum)}. The industry median for comparable clients is ${bracket.median.toFixed(2)}%, and the 25th percentile is ${bracket.p25.toFixed(2)}%. My current rate of ${feePercent.toFixed(2)}% is competitive, but I'd like to discuss moving closer to the best-quartile benchmark — especially as my assets grow."`,
      });
    } else {
      items.push({
        type: 'primary', tag: 'Opening Move', head: 'Lead with the data',
        text: `Reference real benchmarks when you open the conversation — it reframes this as research, not a complaint.`,
        quote: leverage === 'very-high' || leverage === 'high'
          ? `"I've been reviewing fee data on Visor Index for wealth management firms managing near ${formatCompact(aum)}. The industry median for comparable clients is ${bracket.median.toFixed(2)}%, and the 25th percentile is ${bracket.p25.toFixed(2)}%. Since I'm currently paying ${feePercent.toFixed(2)}%, and given my portfolio size, I'd like to discuss this."`
          : `"I've been reviewing fee data on Visor Index for wealth management firms managing near ${formatCompact(aum)}. The industry median for comparable clients is ${bracket.median.toFixed(2)}%, and the 25th percentile is ${bracket.p25.toFixed(2)}%. Since I'm currently paying ${feePercent.toFixed(2)}%, I'd like to discuss this."`,
      });
    }

    // ── THE ASK (all users — tone varies by leverage) ────────────────────

    if (leverage === 'low') {
      items.push({
        type: 'primary', tag: 'The Ask', head: 'Negotiate for value, not just rate',
        text: belowP25
          ? `Your fee is already excellent — better than the best quartile. Focus on locking in this rate and maximizing the services you receive.`
          : `At your portfolio size, fee reductions are harder to negotiate directly. But you can get significantly more value for what you're paying — and ask for the rate to improve as your assets grow.`,
        quote: belowP25
          ? `"I'd like to confirm my current rate of ${feePercent.toFixed(2)}% is locked in — and discuss what additional services are included at this level, plus how the fee adjusts as my assets grow."`
          : `"The best-quartile effective rate for my AUM is ${targetRate}%. I understand that may not be achievable today at my current portfolio size — but I'd like to discuss what additional services are included, and how my rate will improve as my assets grow."`,
      });
    } else if (belowP25) {
      items.push({
        type: 'primary', tag: 'The Ask', head: 'Lock in your rate',
        text: `Your fee is already excellent — better than the best quartile. Your priority is locking this rate in writing and securing automatic reductions as your assets grow.${leverageText ? ' ' + leverageText : ''}`,
        quote: `"My current rate of ${feePercent.toFixed(2)}% is competitive. I'd like to formalize this in our agreement and ensure automatic reductions are built in as my portfolio grows."`,
      });
    } else {
      items.push({
        type: 'primary', tag: 'The Ask', head: 'Make a specific ask',
        text: isOverpaying
          ? `Be direct. Advisors expect this conversation. Specificity signals confidence — "I'd like to discuss" is weaker than naming a number.${leverageText ? ' ' + leverageText : ''}`
          : `Your fee is already competitive — but the best-quartile effective rate for your AUM is ${targetRate}%. Push for it now, and lock in reductions as your assets grow.${leverageText ? ' ' + leverageText : ''}`,
        quote: isOverpaying
          ? `"Based on that benchmark, I'd like to move to ${targetRate}%. That brings me in line with the best-quartile effective rate for my asset level."`
          : `"My research shows the best-quartile effective rate for portfolios near ${formatCompact(aum)} is ${targetRate}%. I'd like to discuss moving toward that — and formalizing fee reductions as my assets grow."`,
      });
    }

    // ── MAXIMIZE YOUR VALUE (low leverage only) ──────────────────────────
    if (leverage === 'low') {
      items.push({
        type: 'primary', tag: 'Maximize Value', head: 'Ask for more services',
        text: `Even if the rate doesn't move, the services included should justify what you're paying. Many advisors bundle these for clients who ask — but don't offer them proactively.`,
        quote: `"I'd like to understand exactly what's included in my advisory fee. Specifically — do I get a comprehensive financial plan, tax-loss harvesting, estate planning coordination, an annual insurance review, and education planning if applicable?"`,
      });
    }

    // ── GROWTH BREAKPOINT (all leverage levels) ──────────────────────────
    if (nextBp) {
      items.push({
        type: 'primary', tag: 'Growth Commitment', head: 'Lock in future reductions',
        text: `As your assets grow, your effective rate should decline. Ask your advisor to commit to automatic reductions at the next AUM threshold.`,
        quote: `"I'd like to formalize fee breakpoints in our agreement — specifically, a reduction when my portfolio reaches ${nextBp.label}. The industry benchmark at that level is ${nextBp.p25.toFixed(2)}%."`,
      });
    }

    // ── CLIENT STATUS LEVERAGE ───────────────────────────────────────────
    if (clientStatus === 'existing') {
      items.push({
        type: 'primary', tag: 'Relationship Leverage', head: 'Reference your tenure',
        text: `Long-standing clients have leverage. Loyalty has real economic value for an advisor — use that.`,
        quote: `"I've been a client for several years. As my relationship deepens and my assets grow, I'd expect the fee structure to reflect that."`,
      });
    } else if (clientStatus === 'prospective') {
      items.push({
        type: 'primary', tag: 'Prospective Leverage', head: 'You haven\'t signed yet',
        text: `As a prospective client you have maximum negotiating power. This is the moment to set the right terms.`,
        quote: `"Before I commit, I'd like to confirm the fee structure. My current portfolio is ${formatCompact(aum)} — I'd expect a rate in line with the ${targetRate}% effective benchmark I've seen from comparable firms."`,
      });
    } else {
      items.push({
        type: 'primary', tag: 'Comparison Leverage', head: 'Use your research as a signal',
        text: `Even exploratory conversations signal seriousness. Letting them know you're comparing firms creates urgency.`,
        quote: `"I'm currently evaluating a few advisory relationships. Fee structure is a key variable for me — and the data I've reviewed suggests ${targetRate}% is a competitive effective rate for my AUM."`,
      });
    }

    // ── REBUTTALS ────────────────────────────────────────────────────────
    if (isOverpaying) {
      items.push({
        type: 'rebuttal', tag: 'Handle the Pushback',
        head: `If they say your fee covers comprehensive planning…`,
        text: `Separate the fee components. Planning and asset management are distinct services — each can be negotiated independently.`,
        quote: `"I understand the value of the planning services. What I'm asking is whether the asset management fee specifically can be priced closer to the ${bracket.median.toFixed(2)}% benchmark — that's what comparable firms charge for the investment management component."`,
      });
    }

    if (isSignificantlyOver && (leverage === 'high' || leverage === 'very-high')) {
      items.push({
        type: 'primary', tag: 'Nuclear Option', head: 'Name the competition',
        text: `If they won't move, introducing a competitive alternative creates urgency. You don't need to be bluffing — advisors at the best-quartile rate are plentiful.${leverage === 'very-high' ? ' At your portfolio size, the firm has more to lose than you do.' : ''}`,
        quote: `"I've spoken with other fee-only advisors managing similar portfolios — several have quoted effective rates near ${targetRate}%. I'd prefer to stay, but I need this to be competitive."`,
      });
    } else if (isSignificantlyOver && (leverage === 'low' || leverage === 'moderate')) {
      items.push({
        type: 'rebuttal', tag: 'Walk, Don\'t Bluff',
        head: `If they won't negotiate…`,
        text: `If you're considering leaving, be honest about it rather than using it as a tactic — but know that retention is cheaper than acquisition for any firm.`,
        quote: `"I appreciate the relationship, but the fee gap is significant. If we can't find a path to a more competitive rate over time, I'll need to explore other options."`,
      });
    }

    if (compoundingCost > 1000) {
      items.push({
        type: 'primary', tag: 'Long-Term Framing', head: 'Show them the 20-year cost',
        text: `Quantifying the compounding impact of even a small fee difference makes the stakes concrete — for both of you.`,
        quote: `"A ${(feePercent - bracket.median).toFixed(2)}% fee difference compounds to roughly ${formatCompact(compoundingCost)} in lost portfolio value over 10 years. That's not a small ask — it's a structural issue."`,
      });
    }

    // ── FIRM-SPECIFIC PLAYBOOK ITEMS ──────────────────────────────────────
    if (firmData) {
      const fn = firmData.name;
      const fnPoss = fn.endsWith('s') || fn.endsWith('S') ? `${fn}'` : `${fn}'s`;

      if (firmData.conflictFlags.length > 0) {
        const flagList = firmData.conflictFlags.join(', ');
        items.push({
          type: 'primary', tag: 'ADV Disclosure Flag', head: `${fn} has filed disclosures`,
          text: `According to their ADV filing, ${fn} has disclosed: ${flagList}. This doesn't mean wrongdoing, but you should understand what it means for your relationship.`,
          quote: `"I noticed your ADV filing includes a ${firmData.conflictFlags[0].toLowerCase()}. Can you walk me through what that involves and how it might affect my account?"`,
        });
      }


      if (firmData.tiers.length > 0 && firmData.feeStructureType === 'tiered') {
        const topTier = firmData.tiers[firmData.tiers.length - 1];
        if (topTier.fee_pct != null) {
          items.push({
            type: 'primary', tag: 'Their Own Schedule', head: `Reference ${fnPoss} published tiers`,
            text: `${fnPoss} ADV Part 2A discloses a tiered fee schedule. Their highest tier starts at ${formatCompact(parseInt(topTier.min_aum || '0'))} at ${topTier.fee_pct}%. Use this as a floor for your negotiation.`,
            quote: `"Your own fee schedule shows ${topTier.fee_pct}% for accounts above ${formatCompact(parseInt(topTier.min_aum || '0'))}. I'd like to discuss how we can get closer to that rate given my portfolio trajectory."`,
          });
        }
      }

      if (firmData.feeRangeMin != null && firmData.feeRangeMax != null && firmData.feeRangeMin < firmData.feeRangeMax) {
        items.push({
          type: 'primary', tag: 'ADV Fee Range', head: `${fn} discloses a fee range`,
          text: `According to their ADV filing, ${fn} charges between ${firmData.feeRangeMin}% and ${firmData.feeRangeMax}%.${firmData.feeStructureType === 'range' ? ' The fee tiers shown above are estimated from this range based on Visor Index data — actual breakpoints may differ.' : ''} If you're near the top of that range, there's room to negotiate down.`,
          quote: `"Your filing shows fees ranging from ${firmData.feeRangeMin}% to ${firmData.feeRangeMax}%. Given my portfolio size of ${formatCompact(aum)}, I'd like to discuss where I fall within that range and whether we can move toward the lower end."`,
        });
      }

      // ── NO DISCLOSED FEE STRUCTURE ──────────────────────────────────
      if (!firmHasDisclosedFees) {
        items.push({
          type: 'primary', tag: 'Fee Transparency', head: `${fn} doesn't publicly disclose fees`,
          text: `Unlike many registered advisors, this firm doesn't publish a standard fee schedule in their ADV filing. This often means fees are negotiated individually — which means there's room to negotiate.`,
          quote: `"I noticed your firm doesn't publish a standard fee schedule. Before we move forward, I'd like to understand the complete fee structure in writing — including any platform fees, fund expenses, or transaction charges."`,
        });

        items.push({
          type: 'primary', tag: 'Discovery', head: 'Get the full picture before negotiating',
          text: `Ask for a written breakdown of all fees: advisory fee, fund expense ratios, platform/custody fees, and any performance-based charges. Comparable firms in your AUM bracket charge a median of ${bracket.median.toFixed(2)}% and the best quartile charges ${bracket.p25.toFixed(2)}%.`,
          quote: `"I'd like a written breakdown of the total cost of your advisory services — advisory fee, fund expense ratios, platform fees, and any other charges. I've been reviewing data on Visor Index and comparable firms charge between ${bracket.p25.toFixed(2)}% and ${bracket.median.toFixed(2)}% for my portfolio size."`,
        });
      }
    }

    return items;
  }, [bracket, hasValidInput, aum, feePercent, clientStatus, askRate, leverage, nextBp, isOverpaying, isSignificantlyOver, compoundingCost, firmData, firmHasDisclosedFees]);

  // ── HELPERS FOR RENDER ───────────────────────────────────────────────────
  const feeColor   = isSignificantlyOver ? '#EF4444' : isOverpaying ? '#F59E0B' : '#1A7A4A';
  const feeLabel   = isSignificantlyOver ? 'Above 75th Percentile' : isOverpaying ? 'Above Median' : isUnder ? 'Below Median' : 'At Median';


  const STATUS_OPTS: { val: ClientStatus; label: string }[] = [
    { val: 'existing',    label: 'Existing Client' },
    { val: 'prospective', label: 'Prospective' },
  ];

  const FEE_TABS: { val: FeeMode; label: string }[] = [
    { val: 'flat',    label: 'Flat %' },
    { val: 'tiered',  label: 'Tiered %' },
    { val: 'dollar',  label: 'Dollar Amount' },
    { val: 'unknown', label: 'Not Disclosed' },
  ];

  const showContent = showGate || showResults;

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .ng-page { background: #F6F8F7; color: #0C1810; font-family: 'DM Sans', sans-serif; min-height: 100vh; }

        /* Entry mode bar */
        .entry-bar { display: flex; margin-bottom: 0; }
        .entry-bar-tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 16px; border: 1px solid #CAD8D0; border-bottom: none; background: #F6F8F7; font-size: 12px; font-weight: 500; color: #5A7568; cursor: pointer; transition: all .15s; }
        .entry-bar-tab:first-child { border-right: none; }
        .entry-bar-tab.active { background: #fff; color: #0C1810; font-weight: 600; border-bottom: 1px solid #fff; margin-bottom: -1px; z-index: 1; }
        .entry-bar-tab:hover:not(.active) { color: #0C1810; background: #fff; }
        .entry-bar-label { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; font-family: 'DM Mono', monospace; font-size: 9px; font-weight: 600; color: #2DBD74; border: 1px solid #2DBD74; flex-shrink: 0; }

        /* Firm search in entry mode */
        .entry-firm-search { background: #fff; border: 1px solid #CAD8D0; border-top: none; padding: 16px 20px; margin-bottom: 32px; }
        .entry-firm-input { width: 100%; padding: 11px 14px; border: 1px solid #CAD8D0; background: #fff; font-size: 13px; font-family: 'DM Mono', monospace; color: #0C1810; outline: none; transition: border .15s; }
        .entry-firm-input:focus { border-color: #1A7A4A; }
        .entry-firm-input::placeholder { color: #CAD8D0; }
        .entry-firm-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #CAD8D0; border-top: none; z-index: 20; max-height: 280px; overflow-y: auto; }
        .entry-firm-result { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 12px 16px; border: none; background: none; text-align: left; font-size: 13px; color: #0C1810; cursor: pointer; transition: background .1s; }
        .entry-firm-result:hover, .entry-firm-result.active { background: rgba(45,189,116,.06); }

        .sf-card { display: block; text-decoration: none; color: inherit; border: 1px solid #CAD8D0; padding: 12px; transition: border-color .15s, box-shadow .15s; }
        .sf-card:hover { border-color: #1A7A4A; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
        .sf-card-name { font-size: 13px; font-weight: 600; color: #0C1810; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .sf-card-loc { font-size: 10px; color: #5A7568; margin-top: 2px; }
        .sf-card-why { font-family: 'DM Mono', monospace; font-size: 9px; color: #1A7A4A; margin-top: 6px; letter-spacing: .03em; }

        .ng-step { border: 1px solid #CAD8D0; background: #fff; margin-bottom: 32px; }
        .ng-step:last-child { margin-bottom: 0; }
        .ng-step-hd { padding: 18px 24px; border-bottom: 1px solid #CAD8D0; display: flex; align-items: center; gap: 12px; }
        .step-n { width: 20px; height: 20px; background: #0A1C2A; display: grid; place-items: center; font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; color: #fff; flex-shrink: 0; }
        .step-title { font-size: 11px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: #0C1810; }
        .step-meta { font-size: 10px; color: #5A7568; margin-left: auto; }

        .tog-btn { flex: 1; padding: 8px 12px; border: 1px solid #CAD8D0; border-right: none; background: #fff; font-size: 11px; font-weight: 500; color: #5A7568; cursor: pointer; transition: all .15s; white-space: nowrap; }
        .tog-btn:last-child { border-right: 1px solid #CAD8D0; }
        .tog-btn.on { background: #0A1C2A; color: #fff; border-color: #0A1C2A; z-index: 1; }
        .tog-btn:hover:not(.on) { color: #0C1810; border-color: #5A7568; }

        .fee-tab { flex: 1; padding: 8px 10px; font-size: 11px; font-weight: 500; color: #5A7568; cursor: pointer; border: none; background: #fff; transition: all .15s; border-right: 1px solid #CAD8D0; text-align: center; white-space: nowrap; }
        .fee-tab:last-child { border-right: none; }
        .fee-tab.on { background: #0A1C2A; color: #fff; }
        .fee-tab:hover:not(.on) { color: #0C1810; }

        .ng-input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }

        .ng-tier-row { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
        .ng-tier-range { display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0; }
        .ng-tier-range .money-input-wrap { flex: 1; min-width: 0; }
        .ng-tier-fee { display: flex; align-items: center; gap: 4px; width: 90px; flex-shrink: 0; }

        .money-input-wrap { display: flex; border: 1px solid #CAD8D0; background: #F6F8F7; transition: border-color .15s; }
        .money-input-wrap:focus-within { border-color: #2DBD74; }

        .analyze-btn { width: 100%; background: #1A7A4A; color: #fff; border: none; padding: 14px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: background .15s; }
        .analyze-btn:hover:not(:disabled) { background: #22995E; }
        .analyze-btn:disabled { background: #CAD8D0; cursor: not-allowed; }
        .analyze-btn-arrow { font-size: 16px; transition: transform .2s; }
        .analyze-btn:hover:not(:disabled) .analyze-btn-arrow { transform: translateX(4px); }

        .firm-upgrade { border-left: 3px solid #2DBD74; background: #fff; }
        .firm-upgrade-hd { padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
        .firm-upgrade-body { max-height: 0; overflow: hidden; transition: max-height .35s cubic-bezier(.16,1,.3,1), padding .3s; padding-left: 20px; padding-right: 20px; }
        .firm-upgrade-body.open { max-height: 300px; padding: 16px 20px; }

        .bm-track { position: relative; height: 8px; border-radius: 4px; background: linear-gradient(to right, #2DBD74 0%, #2DBD74 40%, #F59E0B 65%, #EF4444 100%); margin: 24px 0 36px; }
        .bm-dot { position: absolute; top: 50%; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.15); transform: translateY(-50%) translateX(-50%); transition: left .6s cubic-bezier(.16,1,.3,1); }
        .bm-dot.you  { background: #2DBD74; box-shadow: 0 0 0 3px rgba(45,189,116,.25), 0 1px 4px rgba(0,0,0,.15); }
        .bm-dot.peer { background: #5A7568; }
        .bm-dot.p25  { background: #2DBD74; opacity: .5; }
        .bm-dot-label { position: absolute; top: calc(100% + 8px); transform: translateX(-50%); font-family: 'DM Mono', monospace; font-size: 10px; color: #5A7568; white-space: nowrap; text-align: center; line-height: 1.4; }
        .bm-dot-label strong { display: block; font-size: 10px; color: #0C1810; }
        .bm-dot-label.above { top: auto; bottom: calc(100% + 8px); }

        .stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #CAD8D0; border: 1px solid #CAD8D0; margin-top: 8px; }
        .stat-cell { background: #fff; padding: 16px 20px; text-align: center; }
        .stat-label { font-size: 10px; color: #5A7568; margin-bottom: 5px; }
        .stat-val { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 700; color: #0C1810; }

        .cost-card { border: 1px solid #CAD8D0; background: #fff; }
        .cost-compare { display: grid; grid-template-columns: 1fr 1fr; }
        .cost-col { padding: 20px 24px; text-align: center; }
        .cost-col:first-child { border-right: 1px solid #CAD8D0; }
        .cost-col-label { font-size: 9px; letter-spacing: .14em; text-transform: uppercase; color: #5A7568; margin-bottom: 6px; }
        .cost-col-val { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 700; color: #0C1810; line-height: 1; }
        .cost-col-sub { font-family: 'DM Mono', monospace; font-size: 10px; color: #8BA89B; margin-top: 4px; }
        .cost-diff { border-top: 1px solid #CAD8D0; padding: 14px 24px; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .cost-diff-val { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 700; line-height: 1; }
        .cost-diff-badge { font-family: 'DM Mono', monospace; font-size: 10px; padding: 2px 8px; display: inline-flex; }
        .cost-diff-badge.over  { color: #EF4444; background: rgba(239,68,68,.07); border: 1px solid rgba(239,68,68,.2); }
        .cost-diff-badge.under { color: #1A7A4A; background: rgba(45,189,116,.07); border: 1px solid rgba(45,189,116,.2); }
        .cost-diff-badge.even  { color: #5A7568; background: rgba(90,117,104,.07); border: 1px solid rgba(90,117,104,.2); }


        .ask-card { border: 1px solid #CAD8D0; background: #fff; }
        .ask-compare { display: grid; grid-template-columns: 1fr 1fr; }
        .ask-col { padding: 20px 24px; text-align: center; }
        .ask-col:first-child { border-right: 1px solid #CAD8D0; }
        .ask-col-label { font-size: 9px; letter-spacing: .14em; text-transform: uppercase; color: #5A7568; margin-bottom: 6px; }
        .ask-col-val { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 700; line-height: 1; }
        .ask-col-sub { font-family: 'DM Mono', monospace; font-size: 10px; color: #8BA89B; margin-top: 4px; }
        .ask-footer { border-top: 1px solid #CAD8D0; padding: 12px 24px; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: 'DM Mono', monospace; font-size: 11px; color: #5A7568; }

        .playbook-items { display: flex; flex-direction: column; gap: 18px; }
        .pb-item { padding: 20px 24px; border: 1px solid #CAD8D0; border-left: 3px solid #1A7A4A; background: #fff; }
        .pb-tag  { font-size: 10px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #1A7A4A; margin-bottom: 4px; }
        .pb-head { font-size: 14px; font-weight: 600; color: #0C1810; margin-bottom: 6px; }
        .pb-text { font-size: 13px; color: #5A7568; line-height: 1.65; }
        .pb-quote { margin-top: 10px; padding: 10px 14px; border-left: 2px solid #2DBD74; font-style: italic; font-size: 12px; color: #5A7568; background: #F6F8F7; line-height: 1.65; }

        .enrich-nudge { background: #0A1C2A; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .en-btn { font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; background: #1A7A4A; color: #fff; border: none; padding: 9px 18px; cursor: pointer; transition: background .15s; white-space: nowrap; flex-shrink: 0; }
        .en-btn:hover { background: #22995E; }

        .cta-card { padding: 24px 28px; background: #fff; border: 1px solid #CAD8D0; border-top: 2px solid #0C1810; display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .cta-primary { display: inline-flex; align-items: center; gap: 8px; background: #1A7A4A; color: #fff; padding: 12px 22px; font-size: 12px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; text-decoration: none; transition: background .15s; }
        .cta-primary:hover { background: #22995E; }
        .cta-sec { display: inline-flex; align-items: center; gap: 8px; border: 1px solid #CAD8D0; color: #5A7568; padding: 12px 22px; font-size: 12px; font-weight: 500; text-decoration: none; transition: border-color .15s; background: #fff; cursor: pointer; }
        .cta-sec:hover { border-color: #5A7568; }

        .gate-preview-wrap { pointer-events: none; user-select: none; filter: blur(2px); max-height: 500px; overflow: hidden; -webkit-mask-image: linear-gradient(to bottom, #000 40%, transparent 100%); mask-image: linear-gradient(to bottom, #000 40%, transparent 100%); }
        .gate-card { position: absolute; top: 180px; left: 50%; transform: translateX(-50%); width: calc(100% - 32px); max-width: 480px; background: #0F2538; border: 1px solid rgba(255,255,255,.09); border-top: 2px solid #1A7A4A; box-shadow: 0 8px 48px rgba(0,0,0,0.5); padding: 36px 40px; text-align: left; z-index: 30; }
        .gc-eyebrow { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; font-size: 9px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: #2DBD74; }
        .gc-eyebrow svg { width: 12px; height: 12px; }
        .gc-headline { font-family: 'Cormorant Garamond', serif; font-size: clamp(22px, 2.5vw, 30px); font-weight: 700; line-height: 1.2; letter-spacing: -.02em; color: #fff; margin-bottom: 12px; }
        .gc-sub { font-size: 13px; color: rgba(255,255,255,.55); line-height: 1.7; border-top: 1px solid rgba(255,255,255,.06); padding-top: 16px; margin-bottom: 24px; }
        .gc-ctas { display: flex; gap: 12px; flex-wrap: wrap; }
        .gc-cta-primary { display: inline-flex; align-items: center; padding: 12px 28px; background: #1A7A4A; color: #fff; font-size: 13px; font-weight: 600; text-decoration: none; transition: background .15s; }
        .gc-cta-primary:hover { background: #22995E; }
        .gc-cta-secondary { display: inline-flex; align-items: center; padding: 12px 28px; border: 1px solid rgba(255,255,255,.1); color: rgba(255,255,255,.6); font-size: 13px; text-decoration: none; transition: all .15s; }
        .gc-cta-secondary:hover { border-color: rgba(255,255,255,.3); color: #fff; }
        .ng-firm-chip { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: rgba(45,189,116,.06); border: 1px solid rgba(26,122,74,.2); }
        .ng-fc-logo { width: 32px; height: 32px; background: #0A1C2A; display: grid; place-items: center; flex-shrink: 0; overflow: hidden; font-family: 'Cormorant Garamond', serif; font-size: 14px; font-weight: 700; color: rgba(255,255,255,.5); }
        .ng-fc-remove { background: none; border: none; cursor: pointer; color: rgba(10,28,42,.3); font-size: 20px; padding: 0 4px; transition: color .15s; flex-shrink: 0; }
        .ng-fc-remove:hover { color: #EF4444; }
        .ng-firm-input { width: 100%; border: 1px solid #CAD8D0; background: #F6F8F7; padding: 10px 14px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: #0C1810; outline: none; transition: border-color .15s; }
        .ng-firm-input:focus { border-color: #2DBD74; }
        .ng-firm-input::placeholder { color: #CAD8D0; }
        .ng-firm-dropdown { position: absolute; top: 100%; left: 0; right: 0; z-index: 20; border: 1px solid #CAD8D0; border-top: none; max-height: 240px; overflow-y: auto; background: #fff; box-shadow: 0 8px 24px rgba(0,0,0,.08); }
        .ng-firm-result { display: block; width: 100%; text-align: left; padding: 10px 14px; background: #fff; border: none; border-bottom: 1px solid #F6F8F7; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; color: #0C1810; transition: background .1s; }
        .ng-firm-result:hover, .ng-firm-result.active { background: rgba(26,122,74,.06); }
        .firm-banner { display: flex; align-items: center; gap: 16px; padding: 16px 24px; background: #fff; border: 1px solid #CAD8D0; border-left: 3px solid #2DBD74; margin-bottom: 32px; }
        .fb-name { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 700; color: #0C1810; transition: color .15s; }
        .fb-name:hover { color: #1A7A4A; }
        .fb-change { background: none; border: 1px solid #CAD8D0; padding: 6px 12px; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; color: #5A7568; cursor: pointer; transition: all .15s; white-space: nowrap; flex-shrink: 0; }
        .fb-change:hover { border-color: #5A7568; color: #0C1810; }
        .fb-search-wrap { width: 100%; margin-top: 12px; position: relative; }
        .fb-flags { display: flex; gap: 6px; flex-wrap: wrap; }
        .fb-flag { font-size: 10px; font-weight: 600; letter-spacing: .08em; padding: 3px 10px; color: #EF4444; background: rgba(239,68,68,.06); border: 1px solid rgba(239,68,68,.15); }
        .fb-flag.pfa { color: #F59E0B; background: rgba(245,158,11,.06); border-color: rgba(245,158,11,.15); }
        .firm-selector-row { display: flex; border: 1px solid #CAD8D0; cursor: pointer; transition: border-color .15s; margin-bottom: 8px; }
        .firm-selector-row:hover { border-color: #2DBD74; }
        .fs-logo { width: 40px; height: 40px; background: #0A1C2A; display: grid; place-items: center; font-family: 'Cormorant Garamond', serif; font-size: 13px; font-weight: 700; color: rgba(255,255,255,.45); flex-shrink: 0; }
        .firm-chip-wrap { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: rgba(45,189,116,.07); border: 1px solid rgba(45,189,116,.2); margin-bottom: 20px; }
        .fc-remove { background: none; border: none; cursor: pointer; color: rgba(10,28,42,.3); font-size: 16px; transition: color .15s; margin-left: auto; padding: 0 2px; }
        .fc-remove:hover { color: #0A1C2A; }
        @media (max-width: 640px) {
          .ng-content-wrap { padding-left: 0 !important; padding-right: 0 !important; }
          .ng-step { border-left: none; border-right: none; }
          .firm-banner { border-right: none; padding: 14px 16px; }
          .entry-bar-tab:first-child { border-left: none; }
          .entry-bar-tab:last-child { border-right: none; }
          .entry-firm-search { border-left: none; border-right: none; }
          .entry-bar-tab { font-size: 11px; padding: 10px 12px; }
          .gate-card { top: 120px; padding: 28px 20px; max-width: calc(100% - 32px); }
          .gc-ctas { flex-wrap: nowrap; }
          .gc-cta-primary, .gc-cta-secondary { padding: 12px 16px; font-size: 12px; white-space: nowrap; }
          .ng-input-grid { grid-template-columns: 1fr; }
          .ng-tier-range .money-input-wrap input { font-size: 11px; padding: 9px 6px; }
          .bps-hint { font-size: 10px !important; padding: 0 6px !important; }
          .fee-tab { font-size: 10px; padding: 8px 6px; }
          .cost-col { padding: 16px 14px; }
          .cost-col-val { font-size: 24px; }
          .cost-diff { padding: 12px 14px; gap: 8px; }
          .cost-diff-val { font-size: 18px; }
          .sf-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .ask-col { padding: 16px 14px; }
          .ask-col-val { font-size: 24px; }
          .cta-card { flex-direction: column; align-items: stretch; }
        }
        @media (max-width: 480px) {
          .ng-page { padding: 0; }
          .ng-page > div[style*="padding: '44px 48px"] { padding: 28px 16px 36px !important; }
          .ng-hero-wrap { padding: 28px 16px 36px !important; }
          .ng-content-wrap { padding: 0 0 16px !important; }
          .firm-banner { padding: 12px 14px; gap: 12px; border-left: 3px solid #2DBD74; border-right: none; }
          .fb-name { font-size: 15px; }
          .ng-step { border-left: none; border-right: none; }
          .entry-bar { margin-left: 0; margin-right: 0; }
          .entry-bar-tab:first-child { border-left: none; }
          .entry-bar-tab:last-child { border-right: none; }
          .entry-firm-search { border-left: none; border-right: none; }
          .enrich-nudge { border-left: none !important; border-right: none !important; }
          .bm-dot-label { font-size: 9px; }
          .bm-track { margin: 32px 0 32px; }
          .bm-dot.p25 .bm-dot-label { top: auto !important; bottom: calc(100% + 6px) !important; transform: translateX(-90%) !important; }
          .bm-dot.peer .bm-dot-label { top: auto !important; bottom: calc(100% + 6px) !important; transform: translateX(-10%) !important; }
          .step-row { gap: 8px; }
          .fc-bar { height: 28px; }
          .fc-val { font-size: 13px; }
          .sf-grid { grid-template-columns: 1fr !important; }
          .enrich-nudge { flex-direction: column; gap: 12px; align-items: stretch; }
          .en-btn { text-align: center; }
          .stat-row { grid-template-columns: repeat(2, 1fr) !important; }
          .stat-cell { padding: 12px 10px; }
          .stat-val { font-size: 18px; }
          .ng-tier-range .money-input-wrap input { font-size: 10px !important; padding: 9px 4px !important; }
          .ng-tier-range .money-input-wrap span { padding: 0 5px !important; font-size: 14px !important; }
          .ng-tier-fee { width: 72px !important; }
          .ng-tier-fee input { font-size: 11px !important; padding: 9px 4px !important; }
          .cost-compare { grid-template-columns: 1fr 1fr; }
          .cost-col { padding: 12px 10px; }
          .cost-col-val { font-size: 20px; }
          .cost-diff-val { font-size: 16px; }
        }
      ` }} />

      <div className="ng-page" key={firmData ? `firm-${firmData.crd}` : 'no-firm'}>
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <div className="ng-hero-wrap" style={{
          background: '#0A1C2A',
          padding: '44px 48px 52px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -60, right: -80, width: 400, height: 400, background: 'radial-gradient(circle, rgba(45,189,116,.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
          <div key={firmData ? `hero-${firmData.crd}` : 'hero-default'} style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: '#2DBD74', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 16, height: 1, background: '#2DBD74', display: 'inline-block' }} />
              Fee Negotiation Tool
            </div>
            {firmData ? (
              <h1 className="ng-hero-h1" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 7vw, 42px)', fontWeight: 700, color: '#fff', letterSpacing: '-.025em', lineHeight: 1.06, marginBottom: 0, whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                Negotiate with <em style={{ fontStyle: 'normal', color: '#2DBD74' }}>{firmData.name}</em>
              </h1>
            ) : (
              <h1 className="ng-hero-h1" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 7vw, 42px)', fontWeight: 700, color: '#fff', letterSpacing: '-.025em', lineHeight: 1.06, marginBottom: 0, whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                Are you paying <em style={{ fontStyle: 'normal', color: '#2DBD74' }}>too much?</em>
              </h1>
            )}
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.38)', lineHeight: 1.75, maxWidth: 500, marginTop: 12 }}>
              {firmData
                ? !firmHasDisclosedFees
                  ? `${firmData.name} doesn't publicly disclose a standard fee schedule. We'll benchmark against industry data so you know what to expect — and what to ask.`
                  : (firmData.feeStructureType === 'range' || firmData.feeStructureType === 'maximum_only')
                    ? `We've estimated ${firmData.name.endsWith('s') || firmData.name.endsWith('S') ? firmData.name + "'" : firmData.name + "'s"} fee tiers based on their SEC ADV filing and industry data. Enter your portfolio value to benchmark and build your personalized playbook.`
                    : `We've pre-filled ${firmData.name.endsWith('s') || firmData.name.endsWith('S') ? firmData.name + "'" : firmData.name + "'s"} disclosed fee schedule from their SEC ADV filing. Enter your portfolio value to benchmark and build your personalized playbook.`
                : `Enter your portfolio value and what you pay — we'll benchmark it against thousands of fee structures and build your negotiation playbook.`
              }
            </p>
          </div>
        </div>

        {/* ── MAIN ─────────────────────────────────────────────────────────── */}
        <div className="ng-content-wrap" style={{ maxWidth: 800, margin: '0 auto', padding: '40px 48px' }}>

          {/* ── FIRM BANNER (when firm is loaded) ──────────────────────── */}
          {firmData && (
            <div className="firm-banner" style={{ flexWrap: 'wrap' }}>
              <FirmLogo logoKey={firmData.logoKey} firmName={firmData.name} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/firm/${firmData.crd}`} className="fb-name" style={{ textDecoration: 'none' }}>{firmData.name}</Link>
              </div>
              <button
                className="fb-change"
                onClick={() => { setBannerSearchOpen(!bannerSearchOpen); setFirmQuery(''); setFirmResults([]); }}
              >
                {bannerSearchOpen ? 'Cancel' : 'Change firm'}
              </button>
              {bannerSearchOpen && (
                <div className="fb-search-wrap">
                  <input
                    type="text"
                    value={firmQuery}
                    onChange={e => { setFirmQuery(e.target.value); setFirmSelectedIndex(-1); }}
                    onKeyDown={e => {
                      if (e.key === 'ArrowDown') { e.preventDefault(); setFirmSelectedIndex(prev => Math.min(prev + 1, firmResults.length - 1)); }
                      else if (e.key === 'ArrowUp') { e.preventDefault(); setFirmSelectedIndex(prev => Math.max(prev - 1, -1)); }
                      else if (e.key === 'Enter' && firmSelectedIndex >= 0 && firmResults[firmSelectedIndex]) { e.preventDefault(); selectFirm(firmResults[firmSelectedIndex].crd); }
                      else if (e.key === 'Escape') { setBannerSearchOpen(false); setFirmQuery(''); setFirmResults([]); }
                    }}
                    placeholder="Search for a different firm..."
                    className="entry-firm-input"
                    autoFocus
                  />
                  {firmResults.length > 0 && (
                    <div className="entry-firm-dropdown">
                      {firmResults.map((r, idx) => (
                        <button
                          key={r.crd}
                          onClick={() => selectFirm(r.crd)}
                          className={`entry-firm-result${idx === firmSelectedIndex ? ' active' : ''}`}
                        >
                          {r.name}
                          <span style={{ color: '#CAD8D0', fontSize: 11 }}>#{r.crd}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {firmLoading && <div style={{ fontSize: 11, color: '#5A7568', marginTop: 6 }}>Loading firm data...</div>}
                </div>
              )}
            </div>
          )}
          {/* ── ENTRY MODE BAR ──────────────────────────────────────── */}
          {!crdParam && (
            <div className="entry-bar">
              <button
                className={`entry-bar-tab${entryMode !== 'firm' ? ' active' : ''}`}
                onClick={() => { if (firmData) clearFirm(); setEntryMode('manual'); }}
              >
                <span className="entry-bar-label">A</span>
                Enter Manually
              </button>
              <button
                className={`entry-bar-tab${entryMode === 'firm' ? ' active' : ''}`}
                onClick={() => { if (session === null) return; if (firmData) clearFirm(); setEntryMode('firm'); }}
                style={session === null ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
              >
                <span className="entry-bar-label">B</span>
                Import from Firm
                {session === null && (
                  <svg style={{ width: 10, height: 10, marginLeft: 4, opacity: 0.4 }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>
                )}
              </button>
            </div>
          )}

          {/* ── FIRM SEARCH (when import tab active) ─────────────────── */}
          {entryMode === 'firm' && !firmData && (
            <div className="entry-firm-search">
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={firmQuery}
                  onChange={e => { setFirmQuery(e.target.value); setFirmSelectedIndex(-1); }}
                  onKeyDown={e => {
                    if (e.key === 'ArrowDown') { e.preventDefault(); setFirmSelectedIndex(prev => Math.min(prev + 1, firmResults.length - 1)); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); setFirmSelectedIndex(prev => Math.max(prev - 1, -1)); }
                    else if (e.key === 'Enter' && firmSelectedIndex >= 0 && firmResults[firmSelectedIndex]) { e.preventDefault(); selectFirm(firmResults[firmSelectedIndex].crd); }
                    else if (e.key === 'Escape') { setFirmQuery(''); setFirmResults([]); setEntryMode('manual'); }
                  }}
                  placeholder="Search by firm name to auto-import fees..."
                  className="entry-firm-input"
                  autoFocus
                />
                {firmResults.length > 0 && (
                  <div className="entry-firm-dropdown">
                    {firmResults.map((r, idx) => (
                      <button
                        key={r.crd}
                        onClick={() => selectFirm(r.crd)}
                        className={`entry-firm-result${idx === firmSelectedIndex ? ' active' : ''}`}
                      >
                        {r.name}
                        <span style={{ color: '#CAD8D0', fontSize: 11 }}>#{r.crd}</span>
                      </button>
                    ))}
                  </div>
                )}
                {firmLoading && <div style={{ fontSize: 11, color: '#5A7568', marginTop: 6 }}>Loading firm data...</div>}
              </div>
            </div>
          )}

          {/* ── STEP 01: INPUT ─────────────────────────────────────────────── */}
          <div className="ng-step">
            <div className="ng-step-hd">
              <div className="step-n">01</div>
              <div className="step-title">Your portfolio &amp; fee</div>
              {firmData && <div className="step-meta">Visor Index</div>}
            </div>
            <div style={{ padding: 24 }}>

              {/* Input grid: AUM + Status */}
              <div className="ng-input-grid">
                {/* AUM */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: '#5A7568', marginBottom: 8, fontFamily: 'DM Mono, monospace' }}>
                    Portfolio Value (AUM)
                  </div>
                  <div className="money-input-wrap">
                    <span style={{ padding: '0 12px', fontFamily: 'Cormorant Garamond, serif', fontSize: 19, color: '#5A7568', borderRight: '1px solid #CAD8D0', lineHeight: '44px', flexShrink: 0 }}>$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 1,000,000"
                      value={rawAum}
                      onChange={handleAumChange}
                      style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontFamily: 'DM Mono, monospace', fontSize: 14, color: '#0C1810', padding: '11px 14px' }}
                    />
                  </div>
                  {showMinAumWarning && (
                    <p style={{ fontSize: 11, color: '#F59E0B', marginTop: 6 }}>Minimum portfolio value is $10,000</p>
                  )}
                  {showAumCapWarning && (
                    <p style={{ fontSize: 11, color: '#EF4444', marginTop: 6 }}>Max portfolio size is $1B. For larger portfolios, fee structures vary significantly — reach out and let&rsquo;s talk!</p>
                  )}
                </div>

                {/* Client status */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: '#5A7568', marginBottom: 8, fontFamily: 'DM Mono, monospace', display: 'flex', justifyContent: 'space-between' }}>
                    Your Status
                    <span style={{ fontSize: 10, fontWeight: 400, letterSpacing: 0, textTransform: 'none', color: '#CAD8D0' }}>affects talking points</span>
                  </div>
                  <div style={{ display: 'flex' }}>
                    {STATUS_OPTS.map(opt => (
                      <button
                        key={opt.val}
                        onClick={() => setClientStatus(opt.val)}
                        className={`tog-btn${clientStatus === opt.val ? ' on' : ''}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fee type tabs */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: '#5A7568', marginBottom: 8, fontFamily: 'DM Mono, monospace' }}>
                  How is your fee structured?
                </div>
                <div style={{ display: 'flex', border: '1px solid #CAD8D0' }}>
                  {FEE_TABS.map(t => (
                    <button
                      key={t.val}
                      onClick={() => { setFeeMode(t.val); setRawFee(''); setShowResults(false); setShowGate(false); }}
                      className={`fee-tab${feeMode === t.val ? ' on' : ''}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee input area */}
              {feeMode === 'unknown' ? (
                <div style={{ padding: '12px 16px', background: '#F6F8F7', border: '1px solid #CAD8D0', fontSize: 13, color: '#5A7568', lineHeight: 1.6 }}>
                  {firmData && !firmHasDisclosedFees
                    ? `${firmData.name} does not publicly disclose their fee structure, and has not self-reported to Visor Index. We'll use the industry median as your baseline.`
                    : `No problem — we'll use the industry median as your baseline. You can compare how you'd look at each benchmark.`
                  }
                </div>
              ) : feeMode === 'tiered' ? (
                <div style={{ marginBottom: 4 }}>
                  {feeTiers.map((tier, index) => (
                    <div key={index} className="ng-tier-row">
                      <div className="ng-tier-range">
                        <div className="money-input-wrap" style={{ flex: 1 }}>
                          <span style={{ padding: '0 8px', fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: '#5A7568', borderRight: '1px solid #CAD8D0', lineHeight: '40px', flexShrink: 0 }}>$</span>
                          <input type="text" value={tier.min === 0 ? '0' : tier.min.toLocaleString()} readOnly style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#5A7568', padding: '9px 10px', cursor: 'not-allowed' }} />
                        </div>
                        <span style={{ fontSize: 11, color: '#5A7568', flexShrink: 0 }}>–</span>
                        <div className="money-input-wrap" style={{ flex: 1 }}>
                          <span style={{ padding: '0 8px', fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: '#5A7568', borderRight: '1px solid #CAD8D0', lineHeight: '40px', flexShrink: 0 }}>$</span>
                          {index === feeTiers.length - 1 ? (
                            <input type="text" value="∞" readOnly style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontFamily: 'DM Mono, monospace', fontSize: 18, color: '#5A7568', padding: '6px 10px', cursor: 'not-allowed' }} />
                          ) : (
                            <input
                              type="text" inputMode="numeric" placeholder="Enter max"
                              value={tier.max !== null ? tier.max.toLocaleString() : ''}
                              onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); updateFeeTier(index, 'max', val === '' ? null : parseInt(val, 10)); }}
                              style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#0C1810', padding: '9px 10px' }}
                            />
                          )}
                        </div>
                      </div>
                      <div className="ng-tier-fee">
                        <input
                          type="text" inputMode="decimal" placeholder="0.00"
                          value={tierFeeRaw[index] !== undefined ? tierFeeRaw[index] : (tier.fee > 0 ? tier.fee.toString() : '')}
                          onFocus={() => { if (tierFeeRaw[index] === undefined) setTierFeeRaw(p => ({ ...p, [index]: tier.fee > 0 ? tier.fee.toString() : '' })); }}
                          onBlur={() => setTierFeeRaw(p => { const n = { ...p }; delete n[index]; return n; })}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '' || /^\d*\.?\d{0,2}$/.test(raw)) {
                              const val = parseFloat(raw);
                              if (!isNaN(val) && val > 3) {
                                setTierFeeRaw(p => ({ ...p, [index]: '3' }));
                                updateFeeTier(index, 'fee', 3);
                                setShowFeeCapWarning(true);
                                setTimeout(() => setShowFeeCapWarning(false), 4000);
                                return;
                              }
                              setTierFeeRaw(p => ({ ...p, [index]: raw }));
                              updateFeeTier(index, 'fee', isNaN(val) ? 0 : val);
                            }
                          }}
                          style={{ width: '100%', border: '1px solid #CAD8D0', background: '#F6F8F7', outline: 'none', fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#0C1810', padding: '9px 8px', textAlign: 'right' }}
                        />
                        <span style={{ fontSize: 12, color: '#5A7568', flexShrink: 0 }}>%</span>
                        {feeTiers.length > 2 && (
                          <button onClick={() => removeFeeTier(index)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>×</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {feeTiers.length < 7 && (
                    <button onClick={addFeeTier} style={{ fontSize: 12, color: '#1A7A4A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>+ Add Tier</button>
                  )}
                  {showFeeCapWarning && (
                    <p style={{ fontSize: 11, color: '#EF4444', marginTop: 6 }}>Max fee is 3% of your portfolio. If you're paying more than that, please contact us ASAP.</p>
                  )}
                  {session && aum > 0 && feePercent > 0 && (
                    <p style={{ fontSize: 11, color: '#5A7568', marginTop: 8 }}>
                      Blended effective rate: <strong style={{ color: '#0C1810' }}>{feePercent.toFixed(2)}%</strong> on {formatCompact(aum)}
                    </p>
                  )}
                  {firmData?.feeStructureType === 'range' && firmData.feeRangeMin != null && (
                    <p style={{ fontSize: 10, color: '#9CB3A5', marginTop: 8, lineHeight: 1.5, fontStyle: 'italic' }}>
                      These tiers are estimated based on {firmData.name.endsWith('s') ? firmData.name + '\u2019' : firmData.name + '\u2019s'} disclosed fee range ({firmData.feeRangeMin}%–{firmData.feeRangeMax}%) and average client size. Actual tier breakpoints may differ. Source: Visor Index.
                    </p>
                  )}
                  {firmData?.feeStructureType === 'range' && firmData.feeRangeMin == null && feeMode === 'tiered' && (
                    <p style={{ fontSize: 10, color: '#9CB3A5', marginTop: 8, lineHeight: 1.5, fontStyle: 'italic' }}>
                      These tiers are estimated from {firmData.name.endsWith('s') ? firmData.name + '\u2019' : firmData.name + '\u2019s'} disclosed maximum fee ({firmData.feeRangeMax}%) and industry data for comparable firms. Actual fees may differ — ask for a written fee schedule. Source: Visor Index.
                    </p>
                  )}
                  {firmData?.feeStructureType === 'tiered' && (
                    <p style={{ fontSize: 10, color: '#9CB3A5', marginTop: 8, lineHeight: 1.5, fontStyle: 'italic' }}>
                      These tiers are from {firmData.name.endsWith('s') ? firmData.name + '\u2019' : firmData.name + '\u2019s'} SEC ADV filing. Your actual fee schedule may differ — adjust the tiers above to match your agreement. Source: Visor Index.
                    </p>
                  )}
                  {firmData?.feeStructureType === 'maximum_only' && feeMode === 'tiered' && (
                    <p style={{ fontSize: 10, color: '#9CB3A5', marginTop: 8, lineHeight: 1.5, fontStyle: 'italic' }}>
                      These tiers are estimated from {firmData.name.endsWith('s') ? firmData.name + '\u2019' : firmData.name + '\u2019s'} disclosed maximum fee ({firmData.feeRangeMax}%) and industry data for comparable firms. Actual fees may differ — ask for a written fee schedule. Source: Visor Index.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="money-input-wrap">
                    <span style={{ padding: '0 12px', fontFamily: 'Cormorant Garamond, serif', fontSize: 19, color: '#5A7568', borderRight: '1px solid #CAD8D0', lineHeight: '44px', flexShrink: 0 }}>
                      {feeMode === 'dollar' ? '$' : '%'}
                    </span>
                    <input
                      type="text"
                      inputMode={feeMode === 'dollar' ? 'numeric' : 'decimal'}
                      placeholder={feeMode === 'dollar' ? 'e.g. 10,000' : 'e.g. 1.00'}
                      value={rawFee}
                      onChange={handleFeeChange}
                      style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontFamily: 'DM Mono, monospace', fontSize: 14, color: '#0C1810', padding: '11px 14px' }}
                    />
                    {feeMode === 'flat' && rawFee && (
                      <span className="bps-hint" style={{ padding: '0 10px', fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#5A7568', borderLeft: '1px solid #CAD8D0', lineHeight: '44px', flexShrink: 0, whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                        {bps > 0 ? `${bps} bps` : ''}
                      </span>
                    )}
                  </div>
                  {showDollarFeeWarning && (
                    <p style={{ fontSize: 11, color: '#EF4444', marginTop: 6 }}>Max fee is 3% of your portfolio. If you're paying more than that, please contact us ASAP.</p>
                  )}
                  {showFeeCapWarning && feeMode === 'flat' && (
                    <p style={{ fontSize: 11, color: '#EF4444', marginTop: 6 }}>Max fee is 3% of your portfolio. If you're paying more than that, please contact us ASAP.</p>
                  )}
                  {feeMode === 'dollar' && aum > 0 && feePercent > 0 && (
                    <p style={{ fontSize: 11, color: '#5A7568', marginTop: 6 }}>= {feePercent.toFixed(2)}% of your portfolio</p>
                  )}
                </div>
              )}

              {/* Analyze button */}
              <button
                className="analyze-btn"
                style={{ marginTop: 20 }}
                disabled={!hasValidInput}
                onClick={handleCalculate}
              >
                Analyze My Fee <span className="analyze-btn-arrow">→</span>
              </button>

            </div>
          </div>

          {/* ── RESULTS / GATE ────────────────────────────────────────────── */}
          {showContent && hasValidInput && bracket && (
            <div ref={resultsRef} style={{ position: 'relative' }}>

              {/* Blurred gate preview */}
              {showGate && (
                <div className="gate-preview-wrap">
                  <ResultsPreview
                    bracket={bracket}
                    aum={aum}
                    feePercent={feePercent}
                    annualFee={annualFee}
                    medianFee={medianFee}
                    p25Fee={p25Fee}
                    feeDiff={feeDiff}
                    feeColor={feeColor}
                    feeLabel={feeLabel}
                    pctPos={pctPos}
                    bps={bps}
                    medianBps={medianBps}
                    isOverpaying={isOverpaying}
                    isSignificantlyOver={isSignificantlyOver}
                    askRate={askRate}
                    askSavings={askSavings}
                    playbookItems={playbookItems}
                    animated={false}
                    firmData={firmData}
                    feeMode={feeMode}
                  />
                </div>
              )}

              {/* Gate card */}
              {showGate && (
                <div className="gate-card">
                  <div className="gc-eyebrow">
                    <svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>
                    Unlock Full Analysis
                  </div>
                  <h2 className="gc-headline">
                    See how your fees stack up.
                  </h2>
                  <p className="gc-sub">
                    Your results are ready. Get your full benchmark, 20-year compounding impact, and personalized negotiation playbook.
                  </p>
                  <div className="gc-ctas">
                    <Link href="/auth/signup" className="gc-cta-primary">Get Full Access →</Link>
                    <Link href="/pricing" className="gc-cta-secondary">View Pricing</Link>
                  </div>
                </div>
              )}

              {/* Full results */}
              {showResults && (
                <ResultsPreview
                  bracket={bracket}
                  aum={aum}
                  feePercent={feePercent}
                  annualFee={annualFee}
                  medianFee={medianFee}
                  p25Fee={p25Fee}
                  feeDiff={feeDiff}
                  feeColor={feeColor}
                  feeLabel={feeLabel}
                  pctPos={pctPos}
                  bps={bps}
                  medianBps={medianBps}
                  isOverpaying={isOverpaying}
                  isSignificantlyOver={isSignificantlyOver}
                  askRate={askRate}
                  askSavings={askSavings}
                  playbookItems={playbookItems}
                  animated={animated}
                  firmData={firmData}
                  similarFirms={similarFirms}
                  feeMode={feeMode}
                />
              )}

            </div>
          )}

        </div>
      </div>
    </>
  );
}

// ── Results sub-component (shared between preview and full view) ───────────────
interface ResultsProps {
  bracket: ReturnType<typeof getClosestBreakpoint>;
  aum: number;
  feePercent: number;
  annualFee: number;
  medianFee: number;
  p25Fee: number;
  feeDiff: number;
  feeColor: string;
  feeLabel: string;
  pctPos: (val: number) => number;
  bps: number;
  medianBps: number;
  isOverpaying: boolean;
  isSignificantlyOver: boolean;
  askRate: number;
  askSavings: number;
  playbookItems: PlaybookItem[];
  animated: boolean;
  firmData?: FirmData | null;
  similarFirms?: SimilarFirm[];
  feeMode?: FeeMode;
}

function ResultsPreview({
  bracket, aum, feePercent, annualFee, medianFee, p25Fee, feeDiff,
  feeColor, feeLabel, pctPos, bps, medianBps, isOverpaying, isSignificantlyOver,
  askRate, askSavings, playbookItems,
  animated,
  firmData,
  similarFirms = [],
  feeMode,
}: ResultsProps) {
  const firmHasDisclosedFees = firmData
    ? (
        (firmData.feeStructureType === 'tiered' && firmData.tiers.length > 0) ||
        (firmData.feeStructureType === 'flat_percentage' && firmData.feeRangeMax != null) ||
        ((firmData.feeStructureType === 'range' || firmData.feeStructureType === 'maximum_only') && firmData.feeRangeMax != null)
      )
    : true;

  // Label collision: flip overlapping labels above the track
  const labelPositions = (() => {
    if (!bracket) return { p25: 'below' as const, median: 'below' as const };
    const p25P = pctPos(bracket.p25);
    const medP = pctPos(bracket.median);
    const youP = pctPos(feePercent);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 480;
    const T = isMobile ? 16 : 8;
    let p25L: 'above' | 'below' = 'below';
    let medL: 'above' | 'below' = 'below';
    if (Math.abs(medP - youP) < T) medL = 'above';
    if (Math.abs(p25P - youP) < T) p25L = 'above';
    if (Math.abs(p25P - medP) < T && medL === p25L) p25L = 'above';
    return { p25: p25L, median: medL };
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── STEP 02: BENCHMARK ─────────────────────────────────────────── */}
      <div className="ng-step">
        <div className="ng-step-hd">
          <div className="step-n">02</div>
          <div className="step-title">How your fee compares</div>
          <div className="step-meta">{bracket.label} AUM bracket</div>
        </div>
        <div style={{ padding: '24px 24px 28px' }}>

          {/* Benchmark track — percentages only, labels in stat row below */}
          <div className="bm-track">
            <div className="bm-dot p25" style={{ left: `${pctPos(bracket.p25)}%` }}>
              <div className={`bm-dot-label${labelPositions.p25 === 'above' ? ' above' : ''}`}>
                <strong>{bracket.p25.toFixed(2)}%</strong>
              </div>
            </div>
            <div className="bm-dot peer" style={{ left: `${pctPos(bracket.median)}%` }}>
              <div className={`bm-dot-label${labelPositions.median === 'above' ? ' above' : ''}`}>
                <strong>{bracket.median.toFixed(2)}%</strong>
              </div>
            </div>
            {feeMode !== 'unknown' && (
              <div className="bm-dot you" style={{ left: `${pctPos(feePercent)}%` }}>
                <div className="bm-dot-label">
                  <strong style={{ color: feeColor }}>{feePercent.toFixed(2)}%</strong>
                </div>
              </div>
            )}
          </div>

          {/* Stat row */}
          <div className="stat-row" style={firmData && firmData.feeRangeMax != null ? { gridTemplateColumns: 'repeat(4, 1fr)' } : undefined}>
            <div className="stat-cell">
              <div className="stat-label">P25 — Best Quartile</div>
              <div className="stat-val" style={{ color: '#1A7A4A' }}>{bracket.p25.toFixed(2)}%</div>
            </div>
            <div className="stat-cell">
              <div className="stat-label">Peer Median</div>
              <div className="stat-val">{bracket.median.toFixed(2)}%</div>
            </div>
            {firmData && firmData.feeRangeMax != null && firmHasDisclosedFees && (
              <div className="stat-cell">
                <div className="stat-label">{firmData.name}</div>
                <div className="stat-val" style={{ color: '#0A1C2A' }}>
                  {(firmData.feeStructureType === 'range' || firmData.feeStructureType === 'tiered') && firmData.feeRangeMin != null
                    ? `${firmData.feeRangeMin}–${firmData.feeRangeMax}%`
                    : `${firmData.feeRangeMax}%`
                  }
                </div>
              </div>
            )}
            <div className="stat-cell">
              <div className="stat-label">{feeMode === 'unknown' ? 'Industry Estimate' : 'Your Fee'}</div>
              <div className="stat-val" style={{ color: feeMode === 'unknown' ? '#5A7568' : feeColor }}>{feePercent.toFixed(2)}%</div>
            </div>
          </div>

          {/* Status badge */}
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            {feeMode === 'unknown' ? (
              <>
                <div style={{
                  display: 'inline-flex', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
                  padding: '3px 10px',
                  color: '#5A7568',
                  background: 'rgba(90,117,104,.07)',
                  border: '1px solid rgba(90,117,104,.2)',
                }}>
                  Industry Estimate
                </div>
                <span style={{ fontSize: 12, color: '#5A7568' }}>
                  Using industry median for {bracket.label} AUM bracket
                </span>
              </>
            ) : (
              <>
                <div style={{
                  display: 'inline-flex', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
                  padding: '3px 10px',
                  color: isSignificantlyOver ? '#EF4444' : isOverpaying ? '#F59E0B' : '#1A7A4A',
                  background: isSignificantlyOver ? 'rgba(239,68,68,.07)' : isOverpaying ? 'rgba(245,158,11,.07)' : 'rgba(26,122,74,.07)',
                  border: `1px solid ${isSignificantlyOver ? 'rgba(239,68,68,.2)' : isOverpaying ? 'rgba(245,158,11,.2)' : 'rgba(26,122,74,.2)'}`,
                }}>
                  {feeLabel}
                </div>
                <span style={{ fontSize: 12, color: '#5A7568' }}>
                  {bps} bps vs. {medianBps} bps peer median
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── STEP 03: DOLLAR IMPACT ─────────────────────────────────────── */}
      <div className="ng-step">
        <div className="ng-step-hd">
          <div className="step-n">03</div>
          <div className="step-title">{feeMode === 'unknown' ? 'Industry fee estimate' : 'What this costs you'}</div>
        </div>
        <div style={{ padding: 24 }}>

          {feeMode === 'unknown' ? (
            /* Informational card when firm doesn't disclose fees */
            <div className="cost-card">
              <div className="cost-compare">
                <div className="cost-col">
                  <div className="cost-col-label">Typical fee (median)</div>
                  <div className="cost-col-val">{bracket.median.toFixed(2)}%</div>
                  <div className="cost-col-sub">{formatCompact(medianFee)}/yr</div>
                </div>
                <div className="cost-col">
                  <div className="cost-col-label">Best quartile (P25)</div>
                  <div className="cost-col-val" style={{ color: '#1A7A4A' }}>{bracket.p25.toFixed(2)}%</div>
                  <div className="cost-col-sub">{formatCompact(p25Fee)}/yr</div>
                </div>
              </div>
              <div className="cost-diff" style={{ flexDirection: 'column', gap: 4, textAlign: 'center' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#5A7568', lineHeight: 1.6 }}>
                  Based on industry data for your {bracket.label} AUM bracket.
                  <br />
                  Ask for a written fee schedule to compare against these benchmarks.
                </div>
              </div>
            </div>
          ) : (
            /* Standard cost comparison card */
            <div className="cost-card">
              <div className="cost-compare">
                <div className="cost-col">
                  <div className="cost-col-label">You pay annually</div>
                  <div className="cost-col-val">{formatCompact(annualFee)}</div>
                  <div className="cost-col-sub">{feePercent.toFixed(2)}% of AUM</div>
                </div>
                <div className="cost-col">
                  <div className="cost-col-label">Peer median pays</div>
                  <div className="cost-col-val">{formatCompact(medianFee)}</div>
                  <div className="cost-col-sub">{bracket.median.toFixed(2)}% of AUM</div>
                </div>
              </div>
              <div className="cost-diff">
                <div className="cost-diff-val" style={{ color: feeDiff > 0 ? '#EF4444' : feeDiff < 0 ? '#1A7A4A' : '#0C1810' }}>
                  {feeDiff === 0 ? '$0' : (feeDiff > 0 ? '+' : '-') + formatCompact(Math.abs(feeDiff))}
                </div>
                {feeDiff > 0 && <div className="cost-diff-badge over">You overpay by this</div>}
                {feeDiff < 0 && <div className="cost-diff-badge under">You save this</div>}
                {feeDiff === 0 && <div className="cost-diff-badge even">At median</div>}
              </div>
            </div>
          )}

          <CompoundingImpact
            aum={aum}
            feePercent={feePercent}
            bracket={bracket}
            isOverpaying={isOverpaying}
            isSignificantlyOver={isSignificantlyOver}
          />
        </div>
      </div>

      {/* ── STEP 04: PLAYBOOK ──────────────────────────────────────────── */}
      <div className="ng-step">
        <div className="ng-step-hd">
          <div className="step-n">04</div>
          <div className="step-title">Your negotiation playbook</div>
        </div>
        <div style={{ padding: 24, paddingBottom: 0 }}>

          {/* Ask card */}
          {askSavings > 0 && (
            <div className="ask-card" style={{ marginBottom: 24 }}>
              <div className="ask-compare">
                <div className="ask-col">
                  <div className="ask-col-label">Target rate</div>
                  <div className="ask-col-val" style={{ color: '#1A7A4A' }}>{askRate.toFixed(2)}%</div>
                  <div className="ask-col-sub">P25 for your AUM</div>
                </div>
                <div className="ask-col">
                  <div className="ask-col-label">Annual savings</div>
                  <div className="ask-col-val" style={{ color: '#0C1810' }}>{formatCompact(askSavings)}</div>
                  <div className="ask-col-sub">if advisor agrees</div>
                </div>
              </div>
              <div className="ask-footer">
                <span style={{ color: '#1A7A4A' }}>↓ {Math.round((feePercent - askRate) * 100)} bps</span> from current ({feePercent.toFixed(2)}%)
              </div>
            </div>
          )}

          {/* Playbook items */}
          <div className="playbook-items" style={{ marginBottom: 24 }}>
            {playbookItems.map((item, i) => (
              <div key={i} className={`pb-item${item.type === 'rebuttal' ? ' rebuttal' : ''}`}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="pb-tag">{item.tag}</div>
                  <div className="pb-head">{item.head}</div>
                  <div className="pb-text">{item.text}</div>
                  {item.quote && <div className="pb-quote">{item.quote}</div>}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Firm-specific nudge (only when firm is loaded) */}
      {firmData && (
        <div className="enrich-nudge" style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', maxWidth: 400, lineHeight: 1.6 }}>
            <strong style={{ color: '#2DBD74' }}>✓ Firm-specific playbook</strong> — includes ADV data, conflict flags, and verbatim citations for {firmData.name}.
          </div>
          <Link href={`/firm/${firmData.crd}`} className="en-btn" style={{ textDecoration: 'none' }}>View Firm Profile</Link>
        </div>
      )}

      {/* Step 5: Similar firms fee comparison */}
        {firmData && similarFirms.length > 0 && (
          <div className="ng-step">
            <div className="ng-step-hd">
              <div className="step-n">05</div>
              <div className="step-title">FEES AT SIMILAR FIRMS</div>
              <div className="step-meta">Visor Index</div>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: 13, color: '#5A7568', lineHeight: 1.6, margin: '0 0 16px' }}>
                These firms are similar to {firmData.name} in size, client base, and services offered. Use their fee data as additional leverage.
              </p>
              <div className="sf-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {similarFirms.map((sf) => {
                  const titleName = formatFirmName(sf.name);
                  const titleCity = sf.city?.replace(/\b\w+/g, w => w.charAt(0) + w.slice(1).toLowerCase());
                  return (
                    <Link key={sf.crd} href={`/firm/${sf.crd}`} className="sf-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="sf-card-name">{titleName}</div>
                          <div className="sf-card-loc">{titleCity && `${titleCity}, `}{sf.state} · {sf.aum ? formatCompact(sf.aum) : '—'}</div>
                        </div>
                        {sf.score != null && (() => {
                          const s = Math.round(sf.score!);
                          const col = s >= 70 ? '#2DBD74' : s >= 50 ? '#F59E0B' : '#EF4444';
                          const circ = 2 * Math.PI * 13;
                          const offset = circ * (1 - s / 100);
                          return (
                            <span style={{ position: 'relative', display: 'inline-block', width: 32, height: 32, flexShrink: 0 }}>
                              <svg width="32" height="32" viewBox="0 0 32 32">
                                <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(0,0,0,.06)" strokeWidth="2.5" />
                                <circle cx="16" cy="16" r="13" fill="none" stroke={col} strokeWidth="2.5"
                                  strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                                  style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
                              </svg>
                              <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, color: col }}>{s}</span>
                            </span>
                          );
                        })()}
                      </div>
                      {sf.reason && <div className="sf-card-why">{sf.reason}</div>}
                    </Link>
                  );
                })}
              </div>
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Link href="/search" style={{ fontSize: 12, color: '#1A7A4A', textDecoration: 'none', fontWeight: 500 }}>
                  Explore more firms →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Consultation CTA */}
        <div className="enrich-nudge">
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', maxWidth: 400, lineHeight: 1.6 }}>
            <strong style={{ color: '#2DBD74' }}>Go beyond the public filings</strong> — custom due diligence, investment reviews, background checks, and fee benchmarking.
          </div>
          <Link href="/contact" className="en-btn" style={{ textDecoration: 'none' }}>Request a Consultation</Link>
        </div>

    </div>
  );
}
