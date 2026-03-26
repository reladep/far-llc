#!/usr/bin/env node
/**
 * News Scraper - Batch Runner
 * Run: node workers/news-batch.js [batchNumber]
 * batchNumber: 1 (firms 0-49), 2 (50-99), 3 (100-149)
 */

import { supabase } from './config.js';

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

function isMARelevant(articleTitle, articleSnippet) {
  const text = `${articleTitle} ${articleSnippet || ''}`.toLowerCase();
  const hasMAKeyword = MA_KEYWORDS.some(term => text.includes(term.toLowerCase()));
  if (!hasMAKeyword) return false;
  const isStockArticle = STOCK_NOISE_PATTERNS.some(p => text.includes(p.toLowerCase()));
  if (isStockArticle) return false;
  const hasNoise = NOISE_TERMS.some(term => text.includes(term.toLowerCase()));
  const hasContext = RIA_CONTEXT_TERMS.some(term => text.includes(term.toLowerCase()));
  if (hasNoise && !hasContext) return false;
  return true;
}

function buildMAQuery(firmName) {
  const searchTerms = ['acquired', 'acquisition', 'merger', 'acquires', 'buyout', 'sold to'];
  const maPart = searchTerms.map(k => `"${firmName}" ${k}`).join(' OR ');
  const contextPart = RIA_CONTEXT_TERMS.join(' OR ');
  return `(${maPart}) AND (${contextPart})`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runBatch(batchNum) {
  const start = (batchNum - 1) * 50;
  const end = start + 49;
  
  console.log(`Starting batch ${batchNum}/3 (firms ${start}-${end})`);
  
  const { data: firms, error } = await supabase
    .from('firmdata_current')
    .select('crd, primary_business_name')
    .order('crd')
    .range(start, end);
  
  if (error) {
    console.error('Error fetching firms:', error.message);
    return;
  }
  
  console.log(`Scanning ${firms.length} firms`);
  
  let totalArticles = 0, totalAlerts = 0, totalMAArticles = 0, totalMAAlerts = 0;
  
  for (let i = 0; i < firms.length; i++) {
    const firm = firms[i];
    
    // Regular news
    const url = GNEWS_RSS(`"${firm.primary_business_name}"`);
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'FAR-NewsBot/1.0' } });
      if (res.ok) {
        const xml = await res.text();
        const articles = parseRSSItems(xml);
        
        for (const article of articles) {
          const { data: existing } = await supabase
            .from('news_articles')
            .select('id')
            .eq('crd', firm.crd)
            .eq('url', article.url)
            .limit(1);
          
          if (existing?.length) continue;
          
          const text = `${article.title} ${article.snippet || ''}`.toLowerCase();
          const name = firm.primary_business_name.toLowerCase();
          const nameWords = name.split(/[\s,\&]+/).filter(w => w.length > 2);
          const matchedWords = nameWords.filter(w => text.includes(w));
          const relevance = matchedWords.length / Math.max(nameWords.length, 1);
          
          if (relevance < 0.5) continue;
          
          const { error: insertError } = await supabase
            .from('news_articles')
            .insert({
              crd: firm.crd,
              title: article.title,
              url: article.url,
              source: article.source,
              published_at: article.published_at,
              snippet: article.snippet,
              relevance_score: Math.round(relevance * 100) / 100,
              matched_keywords: matchedWords,
            });
          
          if (!insertError) {
            totalArticles++;
            if (relevance >= 0.7) {
              totalAlerts++;
              await supabase.from('firm_alerts').insert({
                crd: firm.crd,
                alert_type: 'news',
                severity: 'low',
                title: `News: ${firm.primary_business_name}`,
                summary: article.title,
                detail: { url: article.url, source: article.source, published_at: article.published_at },
                source: 'news_scraper'
              });
            }
          }
        }
      }
    } catch (err) {
      // Silently continue on error
    }
    
    // M&A news (every other firm to save API calls)
    if (i % 2 === 0) {
      const maUrl = GNEWS_RSS(buildMAQuery(firm.primary_business_name));
      try {
        const res = await fetch(maUrl, { headers: { 'User-Agent': 'FAR-NewsBot/1.0' } });
        if (res.ok) {
          const xml = await res.text();
          const articles = parseRSSItems(xml).filter(a => isMARelevant(a.title, a.snippet));
          
          for (const article of articles) {
            const { data: existing } = await supabase
              .from('news_articles')
              .select('id')
              .eq('crd', firm.crd)
              .eq('url', article.url)
              .limit(1);
            
            if (existing?.length) continue;
            
            const { error: insertError } = await supabase
              .from('news_articles')
              .insert({
                crd: firm.crd,
                title: article.title,
                url: article.url,
                source: article.source,
                published_at: article.published_at,
                snippet: article.snippet,
                relevance_score: 0.5,
                matched_keywords: [],
              });
            
            if (!insertError) {
              totalMAArticles++;
              totalMAAlerts++;
              console.log(`🚨 M&A Alert: ${firm.primary_business_name} — ${article.title.substring(0, 60)}`);
              
              await supabase.from('firm_alerts').insert({
                crd: firm.crd,
                alert_type: 'news',
                severity: 'medium',
                title: `🏢 M&A Alert: ${firm.primary_business_name}`,
                summary: article.title,
                detail: { url: article.url, source: article.source, published_at: article.published_at, is_ma_related: true },
                source: 'news_scraper'
              });
            }
          }
        }
      } catch (err) {
        // Silently continue
      }
    }
    
    if (i < firms.length - 1) await sleep(1000);
    if ((i + 1) % 25 === 0) {
      console.log(`Progress: ${i + 1}/${firms.length} (MA: ${totalMAAlerts} alerts so far)`);
    }
  }
  
  console.log(`Batch ${batchNum} Done. Regular: ${totalArticles} articles, ${totalAlerts} alerts | M&A: ${totalMAArticles} articles, ${totalMAAlerts} alerts`);
}

const batch = parseInt(process.argv[2]) || 1;
runBatch(batch).catch(console.error);