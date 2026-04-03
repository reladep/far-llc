#!/usr/bin/env node
/**
 * Google News RSS Scraper
 * 
 * Fetches Google News RSS for each firm in our database.
 * Stores articles in news_articles, creates 'news' alerts for relevant ones.
 * 
 * Run: node workers/news-scraper.js
 * Schedule: every 30 minutes via cron
 */

const { supabase } = require('./config');

// Google News RSS URL template
const GNEWS_RSS = (query) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

// M&A keywords — high signal events clients care about
const MA_KEYWORDS = [
  'acquire', 'acquired', 'acquires', 'acquiring', 'acquisition',
  'merger', 'merges', 'merging', 'merged',
  'sold to', 'takes over', 'takeover', 'takes private',
  'buyout', 'bought', 'purchase', 'purchased',
  'combines with', 'combined with',
];

// RIA/wealth management context — filters out noise from other industries
const RIA_CONTEXT_TERMS = [
  'RIA', 'wealth management', 'investment adviser', 'financial advisory',
  'registered investment', 'assets under management', 'AUM', 'wealth firm',
  'financial planning', 'investment management', 'private wealth'
];

// Noise terms to exclude (non-RIA companies with similar names)
const NOISE_TERMS = [
  'stock', 'stocks', 'trading', 'securities', 'equities', 'ETF', 'fund',
  'crypto', 'bitcoin', 'ethereum', 'blockchain', 'trading platform'
];

async function getAllFirms() {
  // Limit to 50 firms per run to complete in time (rotate through firms)
  // With ~3s per firm (news + M&A search), 50 firms takes ~2.5min
  const { data, error } = await supabase
    .from('firmdata_current')
    .select('crd, primary_business_name')
    .order('crd', { ascending: true })
    .range(0, 49); // Process 50 firms per run, cycle through (150 total = 3 runs)

  if (error) {
    console.error('[News] Error fetching firms:', error.message);
    return [];
  }
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

async function fetchNewsForFirm(firm) {
  // Search for the firm name in quotes for exact matching
  const query = `"${firm.primary_business_name}"`;
  const url = GNEWS_RSS(query);

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FAR-NewsBot/1.0' },
    });

    if (!res.ok) {
      if (res.status === 429) {
        console.log(`[News] Rate limited, pausing...`);
        await sleep(5000);
        return [];
      }
      return [];
    }

    const xml = await res.text();
    return parseRSSItems(xml);
  } catch (err) {
    console.error(`[News] Fetch error for ${firm.primary_business_name}:`, err.message);
    return [];
  }
}

function buildMAQuery(firmName) {
  // Use a compact set of M&A terms for the search query (post-fetch filter handles the rest)
  const searchTerms = ['acquired', 'acquisition', 'merger', 'acquires', 'buyout', 'sold to'];
  const maPart = searchTerms.map(k => `"${firmName}" ${k}`).join(' OR ');
  const contextPart = RIA_CONTEXT_TERMS.join(' OR ');
  return `(${maPart}) AND (${contextPart})`;
}

// Patterns that indicate stock/portfolio transactions, NOT firm M&A
const STOCK_NOISE_PATTERNS = [
  'shares acquired', 'shares purchased', 'shares bought',
  'stake in', 'new stake', 'new position',
  'shares of', 'stock in', 'holdings in',
  'position in',
];

function isMARelevant(articleTitle, articleSnippet) {
  // Must contain at least one M&A keyword in the title or snippet
  const text = `${articleTitle} ${articleSnippet || ''}`.toLowerCase();
  
  const hasMAKeyword = MA_KEYWORDS.some(term => text.includes(term.toLowerCase()));
  if (!hasMAKeyword) return false;
  
  // Reject stock/portfolio transaction articles (biggest noise source)
  const isStockArticle = STOCK_NOISE_PATTERNS.some(p => text.includes(p.toLowerCase()));
  if (isStockArticle) return false;
  
  // Filter out noise (non-RIA content without wealth management context)
  const hasNoise = NOISE_TERMS.some(term => text.includes(term.toLowerCase()));
  const hasContext = RIA_CONTEXT_TERMS.some(term => text.includes(term.toLowerCase()));
  
  // If noise without context, reject
  if (hasNoise && !hasContext) return false;
  
  return true;
}

async function fetchMANewsForFirm(firm) {
  // M&A-specific search with RIA context filter
  const query = buildMAQuery(firm.primary_business_name);
  const url = GNEWS_RSS(query);

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FAR-NewsBot/1.0' },
    });

    if (!res.ok) {
      return [];
    }

    const xml = await res.text();
    const articles = parseRSSItems(xml);
    
    // Only keep articles that actually contain M&A keywords in title/snippet
    return articles.filter(article => isMARelevant(article.title, article.snippet));
  } catch (err) {
    console.error(`[News] M&A fetch error for ${firm.primary_business_name}:`, err.message);
    return [];
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processArticles(crd, firmName, articles, isMA = false) {
  let inserted = 0;
  let alerts = 0;

  for (const article of articles) {
    // Check if article already exists
    const { data: existing } = await supabase
      .from('news_articles')
      .select('id')
      .eq('crd', crd)
      .eq('url', article.url)
      .limit(1);

    if (existing && existing.length > 0) continue;

    // Simple relevance scoring based on title/snippet containing firm name
    const text = `${article.title} ${article.snippet || ''}`.toLowerCase();
    const name = firmName.toLowerCase();
    const nameWords = name.split(/\s+/).filter(w => w.length > 2);
    const matchedWords = nameWords.filter(w => text.includes(w));
    const relevance = matchedWords.length / Math.max(nameWords.length, 1);

    // For M&A, lower threshold since query is already filtered
    // For regular news, require >50% name match
    const minRelevance = isMA ? 0.3 : 0.5;
    if (relevance < minRelevance) continue;

    // Insert article (is_ma_related may not exist yet)
    const insertData = {
      crd,
      title: article.title,
      url: article.url,
      source: article.source,
      published_at: article.published_at,
      snippet: article.snippet,
      relevance_score: Math.round(relevance * 100) / 100,
      matched_keywords: matchedWords,
    };
    
    const { data: inserted_article, error } = await supabase
      .from('news_articles')
      .insert(insertData)
      .select('id')
      .single();

    if (error) {
      console.error(`[News] Insert error:`, error.message);
      continue;
    }
    inserted++;

    // Create alert for M&A articles (higher relevance threshold) or regular high-relevance
    const alertThreshold = isMA ? 0.3 : 0.7;
    if (relevance >= alertThreshold) {
      // M&A gets medium severity, regular gets low
      const severity = isMA ? 'medium' : 'low';
      // Use 'news' alert type for both (ma_news may not be in enum yet)
      const alertType = 'news';
      const prefix = isMA ? '🏢 M&A Alert' : 'News';
      
      const { error: alertErr } = await supabase
        .from('firm_alerts')
        .insert({
          crd,
          alert_type: alertType,
          severity,
          title: `${prefix}: ${firmName}`,
          summary: article.title,
          detail: {
            url: article.url,
            source: article.source,
            published_at: article.published_at,
            is_ma_related: isMA,
          },
          news_article_id: inserted_article.id,
          source: 'news_scraper',
        });

      if (!alertErr) {
        alerts++;
        if (isMA) {
          console.log(`[News] 🚨 M&A Alert: ${firmName} — ${article.title.substring(0, 60)}...`);
        }
      }
    }
  }

  return { inserted, alerts };
}

async function main() {
  console.log(`[News] Starting at ${new Date().toISOString()}`);

  const firms = await getAllFirms();
  console.log(`[News] Scanning news for ${firms.length} firms`);

  let totalArticles = 0;
  let totalAlerts = 0;
  let totalMAArticles = 0;
  let totalMAAlerts = 0;

  for (let i = 0; i < firms.length; i++) {
    const firm = firms[i];
    
    // Regular news search
    const articles = await fetchNewsForFirm(firm);

    if (articles.length > 0) {
      const { inserted, alerts } = await processArticles(firm.crd, firm.primary_business_name, articles, false);
      totalArticles += inserted;
      totalAlerts += alerts;

      if (inserted > 0) {
        console.log(`[News] ${firm.primary_business_name}: ${inserted} new articles, ${alerts} alerts`);
      }
    }

    // M&A-specific search (every other iteration to save API calls)
    if (i % 2 === 0) {
      const maArticles = await fetchMANewsForFirm(firm);
      if (maArticles.length > 0) {
        const { inserted, alerts } = await processArticles(firm.crd, firm.primary_business_name, maArticles, true);
        totalMAArticles += inserted;
        totalMAAlerts += alerts;
      }
    }

    // Rate limit: 1 request per second to be nice to Google
    if (i < firms.length - 1) {
      await sleep(1000);
    }

    // Progress log every 50 firms
    if ((i + 1) % 50 === 0) {
      console.log(`[News] Progress: ${i + 1}/${firms.length} firms scanned (MA: ${totalMAAlerts} alerts so far)`);
    }
  }

  console.log(`[News] Done. Regular: ${totalArticles} articles, ${totalAlerts} alerts | M&A: ${totalMAArticles} articles, ${totalMAAlerts} alerts`);
}

main().catch(err => {
  console.error('[News] Fatal error:', err);
  process.exit(1);
});
