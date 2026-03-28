/**
 * Worker: Scrape Contact Emails
 * Fetches firm websites, finds contact pages, extracts email addresses
 * 
 * Usage: node workers/scrape-contact-emails.js [limit] [--json]
 * 
 * With --json flag: saves results to data/contact_emails.json
 * Without --json: uploads to Supabase firmdata_manual table
 * 
 * Environment: 
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tgbatuqvvltemslwtpia.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnYmF0dXF2dmx0ZW1zbHd0cGlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjgwNTYyMSwiZXhwIjoyMDc4MzgxNjIxfQ.aFLJhDRJ8BewaJ24ylUw6Wb32aT5c9U-JljgjOf4VcY';

const args = process.argv.slice(2);
const LIMIT = parseInt(args[0]) || 20;
const SAVE_JSON = args.includes('--json');

const fs = require('fs');
const path = require('path');

// Contact page URL patterns to try
const CONTACT_PATTERNS = [
  '/contact',
  '/contact-us', 
  '/contact-us/',
  '/about',
  '/about-us',
  '/get-in-touch',
  '/reach-us',
  '/connect',
  '/contact.html',
  '/contact.htm'
];

// Email regex pattern
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Client-facing email prefixes (highest priority - direct contact for new clients)
const CLIENT_FACING_PREFIXES = [
  'contact', 'info', 'sales', 'hello', 'getstarted', 'newclient', 
  'client', 'investor', 'advisor', 'wealth', 'invest', 'partners',
  'team', 'growth', 'ahead', 'listen', 'questions', 'support'
];

// Known business email domains (prefer these over generic consumer emails)
const PREFERRED_DOMAINS = ['advisor', 'wealth', 'financial', 'invest', 'capital', 'management', 'partners', 'group'];

// Generic/internal emails to AVOID (lowest priority)
const AVOID_PREFIXES = [
  'privatebenchmarks', 'marketing', 'hr', 'jobs', 'careers', 'recruit',
  'support', 'help', 'noreply', 'no-reply', 'admin', 'webmaster',
  'postmaster', 'abuse', 'security', 'legal', 'compliance', 'accounts', 'finance'
];

// Third-party platform domains to AVOID (not the firm's actual email)
const AVOID_DOMAINS = [
  'relume.io', 'hubspot', 'calendly', 'mailchimp', 'klaviyo', 'convertkit',
  'zendesk', 'freshdesk', 'intercom', 'drift', 'craigslist', 'wedevs',
  'webflow', 'squarespace', 'wix', 'godaddy', 'ionos', 'dreamhost',
  'lonebeacon', 'leaddna', 'leadfeeder', 'demandbase', 'bizzabo'
];

// Exclude patterns - anything matching these should be filtered out entirely
const EXCLUDE_PATTERNS = [
  /\.png$/i, /\.jpg$/i, /\.jpeg$/i, /\.gif$/i, /\.svg$/i, /\.webp$/i,
  /^[a-z]+\s+/i  // Starts with word followed by space (likely misparse from alt text)
];

async function fetchWithTimeout(url, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function findContactPage(baseUrl) {
  const urlObj = new URL(baseUrl);
  const base = `${urlObj.protocol}//${urlObj.host}`;
  
  // Try homepage first
  try {
    const homeRes = await fetchWithTimeout(baseUrl, 5000);
    const homeText = await homeRes.text();
    const emails = homeText.match(EMAIL_REGEX);
    if (emails && emails.length > 0) {
      return { url: baseUrl, emails: [...new Set(emails)] };
    }
  } catch (e) {
    // Continue to contact pages
  }
  
  // Try contact page patterns
  for (const pattern of CONTACT_PATTERNS) {
    try {
      const contactUrl = base + pattern;
      const res = await fetchWithTimeout(contactUrl, 5000);
      if (res.ok) {
        const text = await res.text();
        const emails = text.match(EMAIL_REGEX);
        if (emails && emails.length > 0) {
          return { url: contactUrl, emails: [...new Set(emails)] };
        }
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function selectBestEmail(emails, firmWebsite) {
  // Extract firm domain for matching
  let firmDomain = '';
  try {
    const urlObj = new URL(firmWebsite);
    firmDomain = urlObj.hostname.replace(/^www\./, '').toLowerCase();
  } catch (e) {
    // Ignore
  }
  
  // Filter out common non-business consumer emails and invalid matches
  const excludeDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'protonmail.com', 'live.com', 'msn.com'];
  
  const valid = emails.filter(e => {
    // Skip if matches exclude patterns (likely not an email)
    for (const pattern of EXCLUDE_PATTERNS) {
      if (pattern.test(e)) return false;
    }
    const domain = e.split('@')[1]?.toLowerCase();
    return domain && !excludeDomains.includes(domain);
  });
  
  if (valid.length === 0) return null;
  
  // Score each email based on client-facing likelihood
  const scored = valid.map(email => {
    const local = email.split('@')[0]?.toLowerCase() || '';
    const domain = email.split('@')[1]?.toLowerCase() || '';
    let score = 0;
    
    // Priority 0: Domain match (highest priority) - email domain matches firm website
    if (firmDomain && (domain === firmDomain || domain.endsWith('.' + firmDomain))) {
      score += 200;
    }
    
    // Priority 1: Client-facing prefixes (highest score)
    for (const prefix of CLIENT_FACING_PREFIXES) {
      if (local.startsWith(prefix) || local.includes(prefix)) {
        score += 100;
        break;
      }
    }
    
    // Priority 2: Preferred business domains
    for (const d of PREFERRED_DOMAINS) {
      if (domain.includes(d)) {
        score += 50;
        break;
      }
    }
    
    // Penalty: Avoid internal/generic prefixes
    for (const prefix of AVOID_PREFIXES) {
      if (local.startsWith(prefix)) {
        score -= 50;
        break;
      }
    }
    
    // Penalty: Avoid third-party platform domains
    for (const d of AVOID_DOMAINS) {
      if (domain.includes(d)) {
        score -= 100;
        break;
      }
    }
    
    return { email, score };
  });
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  // Only return if score is positive (has client-facing indicators or domain match)
  const best = scored[0];
  if (best && best.score > 0) {
    return best.email;
  }
  
  return null;
}

function classifyEmail(email) {
  if (!email) return { type: 'unknown', prefix: null };
  
  const local = email.split('@')[0].toLowerCase();
  const domain = email.split('@')[1].toLowerCase();
  
  // Check if it's a known individual (has a name-like pattern)
  const namePattern = /^[a-z]+\.[a-z]+$/;  // e.g., john.smith
  const initialPattern = /^[a-z]{1,2}[a-z]+$/;  // e.g., bwrubel, jimmy
  
  if (namePattern.test(local) || (initialPattern.test(local) && !CLIENT_FACING_PREFIXES.includes(local))) {
    return { type: 'individual', prefix: local };
  }
  
  return { type: 'generic', prefix: local };
}

async function getFirmsWithoutEmails(limit) {
  // Get firms with websites
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/firmdata_website?website=not.is.null&select=crd,website,primary_business_name&limit=${limit * 3}`, // fetch more to filter
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  );
  let firms = await res.json();
  
  // If JSON mode, check against existing JSON file instead of Supabase
  if (SAVE_JSON) {
    const jsonPath = path.join(__dirname, '..', 'data', 'contact_emails.json');
    let scrapedCrds = new Set();
    
    if (fs.existsSync(jsonPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        scrapedCrds = new Set(existing.map(e => e.crd));
      } catch (e) {
        // Ignore
      }
    }
    
    firms = firms.filter(f => !scrapedCrds.has(f.crd));
  } else {
    // Get already scraped CRDs from Supabase
    const manualRes = await fetch(
      `${SUPABASE_URL}/rest/v1/firmdata_manual?select=crd,contact_email&contact_email=not.is.null`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );
    const manualData = await manualRes.json();
    const scrapedCrds = new Set(manualData.map(m => m.crd));
    
    firms = firms.filter(f => !scrapedCrds.has(f.crd));
  }
  
  return firms.slice(0, limit);
}

async function updateFirmEmail(crd, email) {
  // First check if firm exists in firmdata_manual
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/firmdata_manual?crd=eq.${crd}&select=crd`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  );
  const existing = await checkRes.json();
  
  const { type, prefix } = classifyEmail(email);
  
  if (existing.length > 0) {
    // Update existing
    await fetch(
      `${SUPABASE_URL}/rest/v1/firmdata_manual?crd=eq.${crd}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ contact_email: email, email_type: type, email_prefix: prefix })
      }
    );
  } else {
    // Insert new
    await fetch(
      `${SUPABASE_URL}/rest/v1/firmdata_manual`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ crd, contact_email: email, email_type: type, email_prefix: prefix })
      }
    );
  }
}

async function main() {
  console.log(`[${new Date().toISOString()}] Starting contact email scrape (limit: ${LIMIT})`);
  console.log(`Mode: ${SAVE_JSON ? 'JSON file' : 'Supabase'}`);
  
  const firms = await getFirmsWithoutEmails(LIMIT);
  console.log(`Found ${firms.length} firms to scrape`);
  
  const results = [];
  let successCount = 0;
  let failCount = 0;
  
  for (const firm of firms) {
    try {
      console.log(`Scraping ${firm.primary_business_name} (${firm.website})...`);
      
      const result = await findContactPage(firm.website);
      
      if (result) {
        const bestEmail = selectBestEmail(result.emails, firm.website);
        
        if (bestEmail) {
          const { type, prefix } = classifyEmail(bestEmail);
          
          const firmResult = {
            crd: firm.crd,
            firm_name: firm.primary_business_name,
            website: firm.website,
            contact_email: bestEmail,
            email_type: type,
            email_prefix: prefix,
            source_url: result.url
          };
          
          results.push(firmResult);
          
          if (!SAVE_JSON) {
            await updateFirmEmail(firm.crd, bestEmail);
          }
          
          console.log(`  ✓ Found: ${bestEmail} (${type}: ${prefix})`);
          successCount++;
        } else {
          console.log(`  ✗ No quality email found`);
          failCount++;
        }
      } else {
        console.log(`  ✗ No email found`);
        failCount++;
      }
      
      // Rate limit - be nice to websites
      await new Promise(r => setTimeout(r, 1000));
      
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`);
      failCount++;
    }
  }
  
  // Save to JSON if requested
  if (SAVE_JSON && results.length > 0) {
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const jsonPath = path.join(dataDir, 'contact_emails.json');
    
    // Read existing file if it exists
    let existing = [];
    if (fs.existsSync(jsonPath)) {
      try {
        existing = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      } catch (e) {
        // Start fresh if file is invalid
      }
    }
    
    // Merge new results (avoid duplicates by CRD)
    const existingCrds = new Set(existing.map(e => e.crd));
    const newResults = results.filter(r => !existingCrds.has(r.crd));
    const combined = [...existing, ...newResults];
    
    fs.writeFileSync(jsonPath, JSON.stringify(combined, null, 2));
    console.log(`\nSaved ${newResults.length} new emails to ${jsonPath}`);
    console.log(`Total emails in file: ${combined.length}`);
  }
  
  console.log(`\n[${new Date().toISOString()}] Complete: ${successCount} found, ${failCount} failed`);
  
  // Cost estimate (assuming $0.0001 per webpage fetch)
  const totalRequests = firms.length * 2; // homepage + contact page attempts
  const estimatedCost = (totalRequests * 0.0001).toFixed(4);
  console.log(`Estimated cost for ${totalRequests} requests: $${estimatedCost}`);
}

main().catch(console.error);