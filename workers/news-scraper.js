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

async function getAllFirms() {
  const { data, error } = await supabase
    .from('firmdata_current')
    .select('crd, primary_business_name');

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processArticles(crd, firmName, articles) {
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

    // Only store if reasonably relevant (>50% of name words match)
    if (relevance < 0.5) continue;

    // Insert article
    const { data: inserted_article, error } = await supabase
      .from('news_articles')
      .insert({
        crd,
        title: article.title,
        url: article.url,
        source: article.source,
        published_at: article.published_at,
        snippet: article.snippet,
        relevance_score: Math.round(relevance * 100) / 100,
        matched_keywords: matchedWords,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`[News] Insert error:`, error.message);
      continue;
    }
    inserted++;

    // Create alert for high-relevance articles
    if (relevance >= 0.7) {
      const { error: alertErr } = await supabase
        .from('firm_alerts')
        .insert({
          crd,
          alert_type: 'news',
          severity: 'low',
          title: article.title,
          summary: `News about ${firmName}: ${article.title}`,
          detail: {
            url: article.url,
            source: article.source,
            published_at: article.published_at,
          },
          news_article_id: inserted_article.id,
          source: 'news_scraper',
        });

      if (!alertErr) alerts++;
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

  for (let i = 0; i < firms.length; i++) {
    const firm = firms[i];
    const articles = await fetchNewsForFirm(firm);

    if (articles.length > 0) {
      const { inserted, alerts } = await processArticles(firm.crd, firm.primary_business_name, articles);
      totalArticles += inserted;
      totalAlerts += alerts;

      if (inserted > 0) {
        console.log(`[News] ${firm.primary_business_name}: ${inserted} new articles, ${alerts} alerts`);
      }
    }

    // Rate limit: 1 request per second to be nice to Google
    if (i < firms.length - 1) {
      await sleep(1000);
    }

    // Progress log every 50 firms
    if ((i + 1) % 50 === 0) {
      console.log(`[News] Progress: ${i + 1}/${firms.length} firms scanned`);
    }
  }

  console.log(`[News] Done. New articles: ${totalArticles}, New alerts: ${totalAlerts}`);
}

main().catch(err => {
  console.error('[News] Fatal error:', err);
  process.exit(1);
});
