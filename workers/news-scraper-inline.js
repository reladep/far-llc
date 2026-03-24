#!/usr/bin/env node
const { supabase } = require('./config');

const GNEWS_RSS = (q) => `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
const MA_KW = ['acquire', 'acquired', 'acquires', 'acquiring', 'acquisition', 'merger', 'merges', 'merging', 'merged', 'sold to', 'takes over', 'takeover', 'takes private', 'buyout', 'bought', 'purchase', 'purchased', 'combines with', 'combined with'];
const RIA_CTX = ['RIA', 'wealth management', 'investment adviser', 'financial advisory', 'registered investment', 'assets under management', 'AUM', 'wealth firm', 'financial planning', 'investment management', 'private wealth'];
const NOISE = ['stock', 'stocks', 'trading', 'securities', 'equities', 'ETF', 'fund', 'crypto', 'bitcoin', 'ethereum', 'blockchain', 'trading platform'];
const STOCK_PAT = ['shares acquired', 'shares purchased', 'shares bought', 'stake in', 'new stake', 'new position', 'shares of', 'stock in', 'holdings in', 'position in'];

function parseRSS(xml) {
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
        snippet: description?.substring(0, 500) || null,
      });
    }
  }
  return items;
}

async function fetchNews(firm) {
  try {
    const res = await fetch(GNEWS_RSS(`"${firm.primary_business_name}"`), { headers: { 'User-Agent': 'FAR-NewsBot/1.0' } });
    return res.ok ? parseRSS(await res.text()) : [];
  } catch { return []; }
}

function buildMAQuery(name) {
  const terms = ['acquired', 'acquisition', 'merger', 'acquires', 'buyout', 'sold to'];
  return `(${terms.map(t => `"${name}" ${t}`).join(' OR ')}) AND (${RIA_CTX.join(' OR ')})`;
}

function isMARelevant(title, snippet) {
  const txt = `${title} ${snippet || ''}`.toLowerCase();
  if (!MA_KW.some(k => txt.includes(k.toLowerCase()))) return false;
  if (STOCK_PAT.some(p => txt.includes(p.toLowerCase()))) return false;
  const hasNoise = NOISE.some(t => txt.includes(t.toLowerCase()));
  const hasCtx = RIA_CTX.some(t => txt.includes(t.toLowerCase()));
  return !(hasNoise && !hasCtx);
}

async function fetchMA(firm) {
  try {
    const res = await fetch(GNEWS_RSS(buildMAQuery(firm.primary_business_name)), { headers: { 'User-Agent': 'FAR-NewsBot/1.0' } });
    if (!res.ok) return [];
    return parseRSS(await res.text()).filter(a => isMARelevant(a.title, a.snippet));
  } catch { return []; }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function processArticles(crd, name, articles, isMA = false) {
  let ins = 0, alerts = 0;
  for (const a of articles) {
    const { data: ex } = await supabase.from('news_articles').select('id').eq('crd', crd).eq('url', a.url).limit(1);
    if (ex?.length) continue;
    const txt = `${a.title} ${a.snippet || ''}`.toLowerCase();
    const nameWords = name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const matched = nameWords.filter(w => txt.includes(w));
    const rel = matched.length / Math.max(nameWords.length, 1);
    if (rel < (isMA ? 0.3 : 0.5)) continue;
    const { error } = await supabase.from('news_articles').insert({ crd, title: a.title, url: a.url, source: a.source, published_at: a.published_at, snippet: a.snippet, relevance_score: Math.round(rel * 100) / 100, matched_keywords: matched });
    if (error) continue;
    ins++;
    if (rel >= (isMA ? 0.3 : 0.7)) {
      const { error: ae } = await supabase.from('firm_alerts').insert({ crd, alert_type: 'news', severity: isMA ? 'medium' : 'low', title: `${isMA ? 'M&A' : 'News'}: ${name}`, summary: a.title, detail: { url: a.url, source: a.source, published_at: a.published_at, is_ma_related: isMA }, source: 'news_scraper' });
      if (!ae) { alerts++; if (isMA) console.log(`🚨 M&A: ${name} - ${a.title.substring(0, 50)}...`); }
    }
  }
  return { inserted: ins, alerts };
}

(async () => {
  console.log(`[News] Start ${new Date().toISOString()}`);
  const { data: firms } = await supabase.from('firmdata_current').select('crd, primary_business_name').order('crd').range(0, 149);
  console.log(`[News] ${firms.length} firms`);
  
  let totA = 0, totAl = 0, maA = 0, maAl = 0;
  
  for (let i = 0; i < firms.length; i++) {
    const f = firms[i];
    const arts = await fetchNews(f);
    if (arts.length) { const r = await processArticles(f.crd, f.primary_business_name, arts, false); totA += r.inserted; totAl += r.alerts; }
    if (i % 2 === 0) {
      const maArts = await fetchMA(f);
      if (maArts.length) { const r = await processArticles(f.crd, f.primary_business_name, maArts, true); maA += r.inserted; maAl += r.alerts; }
    }
    if (i < firms.length - 1) await sleep(1000);
    if ((i + 1) % 50 === 0) console.log(`[News] ${i+1}/${firms.length} (MA: ${maAl})`);
  }
  console.log(`[News] Done: ${totA} art, ${totAl} alerts | MA: ${maA} art, ${maAl} alerts`);
})();