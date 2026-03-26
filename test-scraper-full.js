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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
  const searchTerms = ['acquired', 'acquisition', 'merger', 'acquires', 'buyout', 'sold to'];
  const maPart = searchTerms.map(k => `"${firmName}" ${k}`).join(' OR ');
  const contextPart = RIA_CONTEXT_TERMS.join(' OR ');
  return `(${maPart}) AND (${contextPart})`;
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

async function fetchMANewsForFirm(firm) {
  const query = buildMAQuery(firm.primary_business_name);
  const url = GNEWS_RSS(query);

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FAR-NewsBot/1.0' },
    });

    if (!res.ok) {
      if (res.status === 429) {
        console.log(`[News] MA: Rate limited, pausing...`);
        await sleep(5000);
        return [];
      }
      return [];
    }

    const xml = await res.text();
    const items = parseRSSItems(xml);
    
    // Filter for M&A relevance
    return items.filter(item => isMARelevant(item.title, item.snippet));
  } catch (err) {
    console.error(`[News] MA fetch error for ${firm.primary_business_name}:`, err.message);
    return [];
  }
}

async function main() {
  console.log('[Test] Starting with 10 firms...');
  
  const { data: firms, error } = await supabase
    .from('firmdata_current')
    .select('crd, primary_business_name')
    .order('crd', { ascending: true })
    .range(0, 9);

  if (error) {
    console.error('[Test] Error:', error);
    return;
  }

  console.log(`[Test] Got ${firms.length} firms`);
  
  let totalNewArticles = 0;
  let totalAlerts = 0;
  let maAlerts = 0;
  let maAlertDetails = [];

  for (let i = 0; i < firms.length; i++) {
    const firm = firms[i];
    console.log(`[Test] Processing ${i+1}/10: ${firm.primary_business_name}`);
    
    // Regular news
    const articles = await fetchNewsForFirm(firm);
    console.log(`[Test]   Got ${articles.length} articles`);
    
    // M&A news
    const maArticles = await fetchMANewsForFirm(firm);
    console.log(`[Test]   Got ${maArticles.length} M&A articles`);
    
    if (maArticles.length > 0) {
      maAlerts += maArticles.length;
      maAlertDetails.push(...maArticles.map(a => ({ firm: firm.primary_business_name, ...a })));
    }
    
    totalNewArticles += articles.length;
    totalAlerts += articles.length;
    
    // Small delay between firms
    await sleep(500);
  }

  console.log('---');
  console.log(`Total new articles: ${totalNewArticles}`);
  console.log(`Total alerts: ${totalAlerts}`);
  console.log(`M&A alerts: ${maAlerts}`);
  if (maAlertDetails.length > 0) {
    console.log('M&A Alert Details:');
    maAlertDetails.forEach(a => {
      console.log(`  - ${a.firm}: ${a.title}`);
    });
  }
}

main();