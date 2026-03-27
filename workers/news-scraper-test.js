#!/usr/bin/env node
const fs = require('fs');
const logFile = '/tmp/scraper-progress.log';
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}

const { supabase } = require('./config');

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

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function getAllFirms() {
  log('Fetching firms...');
  const { data, error } = await supabase
    .from('firmdata_current')
    .select('crd, primary_business_name')
    .order('crd', { ascending: true })
    .range(0, 149);
  if (error) { log('Error fetching firms: ' + error.message); return []; }
  log('Got ' + data.length + ' firms');
  return data;
}

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
      items.push({ title, url: link, published_at: pubDate ? new Date(pubDate).toISOString() : null, source: source || null, snippet: description?.substring(0, 500) || null });
    }
  }
  return items;
}

async function fetchNewsForFirm(firm) {
  const query = `"${firm.primary_business_name}"`;
  const url = GNEWS_RSS(query);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'FAR-NewsBot/1.0' } });
    if (!res.ok) { log('Bad status ' + res.status + ' for ' + firm.primary_business_name); return []; }
    const xml = await res.text();
    return parseRSSItems(xml);
  } catch (err) { log('Fetch error for ' + firm.primary_business_name + ': ' + err.message); return []; }
}

function isMARelevant(articleTitle, articleSnippet) {
  const text = `${articleTitle} ${articleSnippet || ''}`.toLowerCase();
  const hasMAKeyword = MA_KEYWORDS.some(term => text.includes(term.toLowerCase()));
  if (!hasMAKeyword) return false;
  const hasNoise = NOISE_TERMS.some(term => text.includes(term.toLowerCase()));
  const hasContext = RIA_CONTEXT_TERMS.some(term => text.includes(term.toLowerCase()));
  if (hasNoise && !hasContext) return false;
  return true;
}

async function fetchMANewsForFirm(firm) {
  const searchTerms = ['acquired', 'acquisition', 'merger', 'acquires', 'buyout', 'sold to'];
  const maPart = searchTerms.map(k => `"${firm.primary_business_name}" ${k}`).join(' OR ');
  const contextPart = RIA_CONTEXT_TERMS.join(' OR ');
  const query = `(${maPart}) AND (${contextPart})`;
  const url = GNEWS_RSS(query);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'FAR-NewsBot/1.0' } });
    if (!res.ok) return [];
    const xml = await res.text();
    const articles = parseRSSItems(xml);
    return articles.filter(article => isMARelevant(article.title, article.snippet));
  } catch (err) { log('M&A fetch error: ' + err.message); return []; }
}

async function processArticles(crd, firmName, articles, isMA = false) {
  let inserted = 0, alerts = 0;
  for (const article of articles) {
    const { data: existing } = await supabase.from('news_articles').select('id').eq('crd', crd).eq('url', article.url).limit(1);
    if (existing && existing.length > 0) continue;
    const text = `${article.title} ${article.snippet || ''}`.toLowerCase();
    const name = firmName.toLowerCase();
    const nameWords = name.split(/\s+/).filter(w => w.length > 2);
    const matchedWords = nameWords.filter(w => text.includes(w));
    const relevance = matchedWords.length / Math.max(nameWords.length, 1);
    const minRelevance = isMA ? 0.3 : 0.5;
    if (relevance < minRelevance) continue;
    const insertData = { crd, title: article.title, url: article.url, source: article.source, published_at: article.published_at, snippet: article.snippet, relevance_score: Math.round(relevance * 100) / 100, matched_keywords: matchedWords };
    const { data: inserted_article, error } = await supabase.from('news_articles').insert(insertData).select('id').single();
    if (error) { log('Insert error: ' + error.message); continue; }
    inserted++;
    const alertThreshold = isMA ? 0.3 : 0.7;
    if (relevance >= alertThreshold) {
      const severity = isMA ? 'medium' : 'low';
      const alertType = 'news';
      const prefix = isMA ? 'M&A Alert' : 'News';
      const { error: alertErr } = await supabase.from('firm_alerts').insert({ crd, alert_type: alertType, severity, title: `${prefix}: ${firmName}`, summary: article.title, detail: { url: article.url, source: article.source, published_at: article.published_at, is_ma_related: isMA }, news_article_id: inserted_article.id, source: 'news_scraper' });
      if (!alertErr) { alerts++; if (isMA) log('M&A ALERT: ' + firmName + ' - ' + article.title.substring(0, 60)); }
    }
  }
  return { inserted, alerts };
}

async function main() {
  log('Starting news scraper');
  const firms = await getAllFirms();
  log('Scanning ' + firms.length + ' firms');
  let totalArticles = 0, totalAlerts = 0, totalMAArticles = 0, totalMAAlerts = 0;
  for (let i = 0; i < firms.length; i++) {
    const firm = firms[i];
    const articles = await fetchNewsForFirm(firm);
    if (articles.length > 0) {
      const { inserted, alerts } = await processArticles(firm.crd, firm.primary_business_name, articles, false);
      totalArticles += inserted; totalAlerts += alerts;
      if (inserted > 0) log(firm.primary_business_name + ': ' + inserted + ' articles, ' + alerts + ' alerts');
    }
    if (i % 2 === 0) {
      const maArticles = await fetchMANewsForFirm(firm);
      if (maArticles.length > 0) {
        const { inserted, alerts } = await processArticles(firm.crd, firm.primary_business_name, maArticles, true);
        totalMAArticles += inserted; totalMAAlerts += alerts;
      }
    }
    if (i < firms.length - 1) await sleep(1000);
    if ((i + 1) % 50 === 0) log('Progress: ' + (i + 1) + '/' + firms.length + ' (MA: ' + totalMAAlerts + ' alerts)');
  }
  log('Done. Regular: ' + totalArticles + ' articles, ' + totalAlerts + ' alerts | M&A: ' + totalMAArticles + ' articles, ' + totalMAAlerts + ' alerts');
}

main().catch(err => log('Fatal: ' + err)).finally(() => log('Script finished'));