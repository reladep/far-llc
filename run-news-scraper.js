#!/usr/bin/env node
const { supabase } = require('./workers/config');

const GNEWS_RSS = (query) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

const MA_KEYWORDS = [
  'acquire', 'acquired', 'acquires', 'acquiring', 'acquisition',
  'merger', 'merges', 'merging', 'merged',
  'sold to', 'takes over', 'takeover', 'takes private',
  'buyout', 'bought', 'purchase', 'purchased',
  'combines with', 'combined with',
];

const RIA_CONTEXT_TERMS = [
  'RIA', 'wealth management', 'investment adviser', 'financial advisory',
  'registered investment', 'assets under management', 'AUM', 'wealth firm',
  'financial planning', 'investment management', 'private wealth'
];

const NOISE_TERMS = [
  'stock', 'stocks', 'trading', 'securities', 'equities', 'ETF', 'fund',
  'crypto', 'bitcoin', 'ethereum', 'blockchain', 'trading platform'
];

const STOCK_NOISE_PATTERNS = [
  'shares acquired', 'shares purchased', 'shares bought',
  'stake in', 'new stake', 'new position',
  'shares of', 'stock in', 'holdings in',
  'position in',
];

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function parseRSSItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')?.trim();
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim();
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim();
    const source = block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')?.trim();
    const description = block.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')?.replace(/<[^>]+>/g, '')?.trim();
    if (title && link) {
      items.push({
        title,
        url: link,
        published_at: pubDate ? new Date(pubDate).toISOString() : null,
        source: source || null,
        snippet: description?.substring(0, 500) || null
      });
    }
  }
  return items;
}

async function fetchNewsForFirm(firm) {
  const url = GNEWS_RSS(`"${firm.primary_business_name}"`);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'FAR-NewsBot/1.0' } });
    if (!res.ok) return [];
    return parseRSSItems(await res.text());
  } catch (err) { return []; }
}

async function fetchMANewsForFirm(firm) {
  const searchTerms = ['acquired', 'acquisition', 'merger', 'acquires', 'buyout', 'sold to'];
  const maPart = searchTerms.map(k => `"${firm.primary_business_name}" ${k}`).join(' OR ');
  const contextPart = RIA_CONTEXT_TERMS.join(' OR ');
  const url = GNEWS_RSS(`(${maPart}) AND (${contextPart})`);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'FAR-NewsBot/1.0' } });
    if (!res.ok) return [];
    const items = parseRSSItems(await res.text());
    return items.filter(item => {
      const text = `${item.title} ${item.snippet || ''}`.toLowerCase();
      if (!MA_KEYWORDS.some(term => text.includes(term.toLowerCase()))) return false;
      if (STOCK_NOISE_PATTERNS.some(p => text.includes(p.toLowerCase()))) return false;
      const hasNoise = NOISE_TERMS.some(term => text.includes(term.toLowerCase()));
      const hasContext = RIA_CONTEXT_TERMS.some(term => text.includes(term.toLowerCase()));
      return !(hasNoise && !hasContext);
    });
  } catch (err) { return []; }
}

async function main() {
  console.log('[News] Starting...');
  const { data: firms } = await supabase.from('firmdata_current').select('crd, primary_business_name').order('crd', { ascending: true }).range(0, 149);
  console.log(`[News] Scanning ${firms.length} firms`);

  let totalArticles = 0, totalAlerts = 0, totalMAAlerts = 0, maDetails = [];

  for (let i = 0; i < firms.length; i++) {
    const firm = firms[i];
    const articles = await fetchNewsForFirm(firm);
    totalArticles += articles.length;
    totalAlerts += articles.length;

    if (i % 2 === 0) {
      const maArticles = await fetchMANewsForFirm(firm);
      totalMAAlerts += maArticles.length;
      if (maArticles.length > 0) {
        maDetails.push(...maArticles.map(a => ({ firm: firm.primary_business_name, ...a })));
      }
    }

    if ((i + 1) % 25 === 0) {
      console.log(`[News] Progress: ${i + 1}/${firms.length} (MA: ${totalMAAlerts} alerts)`);
    }
    if (i < firms.length - 1) await sleep(800);
  }

  console.log(`[News] Complete. Articles: ${totalArticles}, Alerts: ${totalAlerts}, M&A Alerts: ${totalMAAlerts}`);
  if (maDetails.length) {
    console.log('M&A Details:');
    maDetails.forEach(a => console.log(`  - ${a.firm}: ${a.title}`));
  }
}

main();