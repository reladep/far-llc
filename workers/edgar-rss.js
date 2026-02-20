#!/usr/bin/env node
/**
 * EDGAR RSS Poller
 * 
 * Polls the SEC EDGAR full-text search RSS feed for recent ADV/ADV-A filings.
 * When a filing is found for a firm in our database, creates a firm_alert.
 * 
 * Run: node workers/edgar-rss.js
 * Schedule: every 15 minutes via cron
 */

const { supabase } = require('./config');

const EDGAR_FULL_TEXT_URL = 'https://efts.sec.gov/LATEST/search-index?q=%22ADV%22&dateRange=custom&startdt={START}&enddt={END}&forms=ADV,ADV-A,ADV/A,ADV-W';
const EDGAR_SEARCH_URL = 'https://efts.sec.gov/LATEST/search-index';
const EDGAR_RSS_URL = 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=ADV&dateb=&owner=include&count=40&search_text=&action=getcompany&output=atom';

// EDGAR EFTS API — search recent ADV filings
const EFTS_API = 'https://efts.sec.gov/LATEST/search-index';

async function fetchRecentADVFilings() {
  // Use EDGAR full-text search API for recent ADV filings
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const fmt = d => d.toISOString().split('T')[0];
  
  const url = `https://efts.sec.gov/LATEST/search-index?q=%22Form+ADV%22&forms=ADV,ADV-A,ADV%2FA,ADV-W&dateRange=custom&startdt=${fmt(yesterday)}&enddt=${fmt(today)}`;
  
  // EDGAR EFTS is JSON-based
  const searchUrl = `https://efts.sec.gov/LATEST/search-index?q=%22Form+ADV%22&forms=ADV,ADV-A&dateRange=custom&startdt=${fmt(yesterday)}&enddt=${fmt(today)}&from=0&size=50`;
  
  // Actually, let's use the simpler EDGAR company search RSS
  // This gives us recent filings as Atom XML
  const rssUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=ADV&dateb=&owner=include&count=100&search_text=&action=getcompany&output=atom`;
  
  console.log(`[EDGAR RSS] Fetching recent ADV filings...`);
  
  // Use EDGAR EFTS JSON API instead — more reliable
  const eftsUrl = `https://efts.sec.gov/LATEST/search-index?q=%22Form+ADV%22&forms=ADV%2CADV-A%2CADV%2FA&dateRange=custom&startdt=${fmt(yesterday)}&enddt=${fmt(today)}`;
  
  const res = await fetch(eftsUrl);
  if (!res.ok) {
    // Fallback: try the EDGAR full-text search API
    console.log(`[EDGAR RSS] EFTS returned ${res.status}, trying full-text search...`);
    return await fetchViaFullTextSearch(fmt(yesterday), fmt(today));
  }
  
  const data = await res.json();
  console.log(`[EDGAR RSS] Found ${data.hits?.total?.value || 0} filings`);
  return parseEFTSResults(data);
}

async function fetchViaFullTextSearch(startDate, endDate) {
  const url = `https://efts.sec.gov/LATEST/search-index?q=%22ADV%22&forms=ADV%2CADV-A&startdt=${startDate}&enddt=${endDate}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[EDGAR RSS] Full-text search also failed: ${res.status}`);
    return [];
  }
  const data = await res.json();
  return parseEFTSResults(data);
}

function parseEFTSResults(data) {
  const hits = data.hits?.hits || [];
  return hits.map(hit => ({
    cik: hit._source?.entity_id || hit._source?.ciks?.[0],
    companyName: hit._source?.display_names?.[0] || hit._source?.entity_name,
    formType: hit._source?.form_type || hit._source?.file_type,
    filedDate: hit._source?.file_date || hit._source?.period_of_report,
    accessionNumber: hit._id || hit._source?.accession_no,
    url: `https://www.sec.gov/Archives/edgar/data/${hit._source?.entity_id || hit._source?.ciks?.[0]}/${(hit._id || '').replace(/-/g, '')}`,
  }));
}

async function getOurCRDs() {
  // Get all CRD numbers from our database
  const { data, error } = await supabase
    .from('firmdata_current')
    .select('crd, primary_business_name');
  
  if (error) {
    console.error('[EDGAR RSS] Error fetching CRDs:', error.message);
    return new Map();
  }
  
  // Build a map of firm name → CRD for matching
  const firmMap = new Map();
  for (const firm of data) {
    firmMap.set(firm.primary_business_name?.toLowerCase()?.trim(), firm.crd);
  }
  console.log(`[EDGAR RSS] Loaded ${firmMap.size} firms from database`);
  return firmMap;
}

async function processFilings(filings, firmMap) {
  let matched = 0;
  let alerts = 0;

  for (const filing of filings) {
    if (!filing.companyName) continue;
    
    const name = filing.companyName.toLowerCase().trim();
    const crd = firmMap.get(name);
    
    if (!crd) continue;
    matched++;

    // Check if we already have an alert for this filing
    const { data: existing } = await supabase
      .from('firm_alerts')
      .select('id')
      .eq('crd', crd)
      .eq('alert_type', 'disclosure')
      .eq('source', 'edgar_rss')
      .contains('detail', { accession_number: filing.accessionNumber })
      .limit(1);

    if (existing && existing.length > 0) continue;

    // Create alert
    const { error } = await supabase
      .from('firm_alerts')
      .insert({
        crd,
        alert_type: 'disclosure',
        severity: filing.formType?.includes('ADV-W') ? 'high' : 'low',
        title: `New SEC Filing: ${filing.formType}`,
        summary: `${filing.companyName} filed ${filing.formType} on ${filing.filedDate}`,
        detail: {
          form_type: filing.formType,
          filed_date: filing.filedDate,
          accession_number: filing.accessionNumber,
          cik: filing.cik,
          url: filing.url,
        },
        source: 'edgar_rss',
      });

    if (error) {
      console.error(`[EDGAR RSS] Error inserting alert for CRD ${crd}:`, error.message);
    } else {
      alerts++;
      console.log(`[EDGAR RSS] Alert created: ${filing.companyName} → ${filing.formType}`);
    }
  }

  return { matched, alerts };
}

async function main() {
  console.log(`[EDGAR RSS] Starting at ${new Date().toISOString()}`);
  
  const [filings, firmMap] = await Promise.all([
    fetchRecentADVFilings(),
    getOurCRDs(),
  ]);

  console.log(`[EDGAR RSS] ${filings.length} filings to check against ${firmMap.size} firms`);

  const { matched, alerts } = await processFilings(filings, firmMap);

  console.log(`[EDGAR RSS] Done. Matched: ${matched}, New alerts: ${alerts}`);
}

main().catch(err => {
  console.error('[EDGAR RSS] Fatal error:', err);
  process.exit(1);
});
