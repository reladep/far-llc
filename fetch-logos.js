const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { promisify } = require('util');
const { JSDOM } = require('jsdom');

const delay = promisify(setTimeout);

// Supabase client
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://tgbatuqvvltemslwtpia.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnYmF0dXF2dmx0ZW1zbHd0cGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MDU2MjEsImV4cCI6MjA3ODM4MTYyMX0.IQWoSjxR9bnPChOxm6FfsJdSiJlcOLrc0jAUZksQz20'
);

// Blocklist: known non-logo domains and patterns
const BLOCKLIST = [
  'linkedin.com',
  'facebook.com',
  'twitter.com',
  'instagram.com',
  'brokercheck',
  'finra.org',
  'sec.gov',
  'adviserinfo',
  'youtube.com',
  'vimeo.com',
  'apple.com',
  'google.com',
  'amazon.com',
  'cloudflare.com',
  'wp.com',
  'wordpress',
  'sharethis',
  'addthis',
  'zendesk',
  'crunchbase',
  'bloomberg',
  'forbes',
  'wsj',
  'marketwatch',
];

// Known logo URL patterns (good indicators)
const LOGO_PATTERNS = [
  /logo/i,
  /brand/i,
  /header/i,
  /nav/i,
  /-logo/i,
  /_logo/i,
  /logo-/i,
];

// Fetch HTML from URL
async function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      timeout: 10000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// Check if URL is blocked
function isBlocked(url) {
  const lower = url.toLowerCase();
  return BLOCKLIST.some(blocked => lower.includes(blocked));
}

// Check if URL looks like a logo
function looksLikeLogo(url) {
  const lower = url.toLowerCase();
  // Must have logo in path OR be from og:image
  return LOGO_PATTERNS.some(pattern => pattern.test(lower));
}

// Find best logo from HTML
function findBestLogo(html, baseUrl) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const base = new URL(baseUrl);

  const candidates = [];

  // 1. Check og:image meta tags (usually best quality)
  const ogImages = doc.querySelectorAll('meta[property="og:image"]');
  ogImages.forEach(img => {
    const url = img.getAttribute('content');
    if (url && !isBlocked(url)) {
      const absolute = new URL(url, baseUrl).href;
      candidates.push({ url: absolute, score: 10, source: 'og:image' });
    }
  });

  // 2. Check link rel="icon"
  const icons = doc.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
  icons.forEach(link => {
    const url = link.getAttribute('href');
    if (url && !isBlocked(url)) {
      const absolute = new URL(url, baseUrl).href;
      // Low score for favicons
      candidates.push({ url: absolute, score: 1, source: 'favicon' });
    }
  });

  // 3. Check images with logo in URL
  const images = doc.querySelectorAll('img[src]');
  images.forEach(img => {
    const url = img.getAttribute('src');
    const alt = img.getAttribute('alt') || '';
    
    if (url && !isBlocked(url)) {
      const absolute = new URL(url, baseUrl).href;
      
      // Score based on alt text and URL
      let score = 0;
      if (alt.toLowerCase().includes('logo')) score += 5;
      if (looksLikeLogo(url)) score += 5;
      if (alt && alt.length > 2 && !alt.includes('menu') && !alt.includes('nav')) score += 2;
      
      if (score > 0) {
        candidates.push({ url: absolute, score, source: 'img' });
      }
    }
  });

  // Sort by score (highest first)
  candidates.sort((a, b) => b.score - a.score);
  
  return candidates[0]?.url || null;
}

// Download image
async function downloadImage(url, crd, ext) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      timeout: 10000,
    }, (res) => {
      // Check content type
      const contentType = res.headers['content-type'] || '';
      
      // Check content length (skip if too small = favicon)
      const contentLength = parseInt(res.headers['content-length'] || '0');
      if (contentLength > 0 && contentLength < 500) {
        resolve({ success: false, reason: 'too_small' });
        return;
      }

      // Determine extension from content type or URL
      let fileExt = ext;
      if (!fileExt) {
        if (contentType.includes('svg')) fileExt = '.svg';
        else if (contentType.includes('webp')) fileExt = '.webp';
        else if (contentType.includes('png')) fileExt = '.png';
        else if (contentType.includes('jpeg') || contentType.includes('jpg')) fileExt = '.jpg';
        else {
          // Try to get from URL
          const urlExt = path.extname(new URL(url).pathname);
          if (urlExt) fileExt = urlExt;
          else fileExt = '.png';
        }
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        
        // Skip if too small
        if (buffer.length < 500) {
          resolve({ success: false, reason: 'too_small' });
          return;
        }
        
        const filename = `${crd}${fileExt}`;
        const filepath = path.join(__dirname, 'logos-test', filename);
        
        fs.writeFileSync(filepath, buffer);
        resolve({ success: true, filename, size: buffer.length });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// Main function
async function main() {
  // Create output directory
  const outDir = path.join(__dirname, 'logos-test');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Get 20 firms with websites
  console.log('Fetching firms from Supabase...');
  const { data: firms, error } = await supabase
    .from('firmdata_website')
    .select('crd, primary_business_name, website')
    .not('website', 'is', null)
    .limit(20);

  if (error) {
    console.error('Error fetching firms:', error);
    return;
  }

  console.log(`Found ${firms.length} firms. Processing...\n`);

  const results = [];

  for (const firm of firms) {
    console.log(`\n[${firm.crd}] ${firm.primary_business_name}`);
    console.log(`  URL: ${firm.website}`);

    try {
      // Fetch HTML
      const html = await fetchHTML(firm.website);
      
      // Find best logo
      const logoUrl = findBestLogo(html, firm.website);
      
      if (!logoUrl) {
        console.log('  Result: NO LOGO FOUND');
        results.push({ crd: firm.crd, success: false, reason: 'no_logo_found' });
        continue;
      }

      console.log(`  Logo: ${logoUrl}`);

      // Check if blocked
      if (isBlocked(logoUrl)) {
        console.log('  Result: BLOCKED (social media)');
        results.push({ crd: firm.crd, success: false, reason: 'blocked' });
        continue;
      }

      // Download
      const ext = path.extname(new URL(logoUrl).pathname);
      const downloadResult = await downloadImage(logoUrl, firm.crd, ext);

      if (downloadResult.success) {
        console.log(`  Result: SUCCESS - ${downloadResult.filename} (${downloadResult.size} bytes)`);
        results.push({ 
          crd: firm.crd, 
          success: true, 
          filename: downloadResult.filename,
          logoUrl 
        });
      } else {
        console.log(`  Result: FAILED - ${downloadResult.reason}`);
        results.push({ crd: firm.crd, success: false, reason: downloadResult.reason });
      }

    } catch (err) {
      console.log(`  Result: ERROR - ${err.message}`);
      results.push({ crd: firm.crd, success: false, reason: err.message });
    }

    // Rate limiting
    await delay(1000);
  }

  // Summary
  console.log('\n\n=== SUMMARY ===');
  const successCount = results.filter(r => r.success).length;
  console.log(`Total: ${results.length}`);
  console.log(`Success: ${successCount} (${Math.round(successCount/results.length*100)}%)`);
  console.log(`Failed: ${results.length - successCount}`);

  // Save results
  fs.writeFileSync(
    path.join(outDir, 'results.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('\nResults saved to logos-test/results.json');
}

main().catch(console.error);
