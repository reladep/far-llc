/**
 * Worker: Scrape Contact Emails
 * Finds up to 10 email addresses per firm, ranked by quality score
 * 
 * Usage: node workers/scrape-contact-emails.js [limit] [--json]
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tgbatuqvvltemslwtpia.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnYmF0dXF2dmx0ZW1zbHd0cGlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjgwNTYyMSwiZXhwIjoyMDc4MzgxNjIxfQ.aFLJhDRJ8BewaJ24ylUw6Wb32aT5c9U-JljgjOf4VcY';

const args = process.argv.slice(2);
const LIMIT = parseInt(args[0]) || 20;
const SAVE_JSON = args.includes('--json');
const MAX_EMAILS = 10;

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const dns = require('dns');
const dnsResolveMx = promisify(dns.resolveMx);

// Contact page URL patterns
const CONTACT_PATTERNS = [
  '/contact', '/contact-us', '/contact-us/', '/about', '/about-us',
  '/get-in-touch', '/reach-us', '/connect', '/contact.html', '/contact.htm'
];

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Scoring constants
const SCORE_DOMAIN_MATCH = 200;
const SCORE_CLIENT_FACING = 100;
const SCORE_BUSINESS_DOMAIN = 50;
const PENALTY_AVOID_PREFIX = 50;
const PENALTY_THIRD_PARTY = 100;

const CLIENT_FACING_PREFIXES = [
  'contact', 'info', 'sales', 'hello', 'getstarted', 'newclient',
  'client', 'investor', 'advisor', 'wealth', 'invest', 'partners',
  'team', 'growth', 'ahead', 'listen', 'questions', 'support'
];

const PREFERRED_DOMAINS = ['advisor', 'wealth', 'financial', 'invest', 'capital', 'management', 'partners', 'group'];

const AVOID_PREFIXES = [
  'privatebenchmarks', 'marketing', 'hr', 'jobs', 'careers', 'recruit',
  'support', 'help', 'noreply', 'no-reply', 'admin', 'webmaster',
  'postmaster', 'abuse', 'security', 'legal', 'compliance', 'accounts', 'finance'
];

const AVOID_DOMAINS = [
  // Website builders & CMS platforms
  'relume.io', 'webflow', 'squarespace', 'wix', 'godaddy', 'ionos', 'dreamhost',
  'shopify', 'wordpress', 'web.com', 'siteground', 'bluehost', 'hostgator',
  'staging.', 'dev.', 'test.', 'preview.',
  // Marketing & automation platforms
  'hubspot', 'calendly', 'mailchimp', 'klaviyo', 'convertkit', 'marketo',
  'zendesk', 'freshdesk', 'intercom', 'drift', 'pardot', 'eloqua', 'mailgun',
  // Lead gen & analytics
  'lonebeacon', 'leaddna', 'leadfeeder', 'demandbase', 'bizzabo', 'zoom_info',
  'clearbit', 'hunter.io', 'builtwith', 'similarweb',
  // Misc third-party
  'craigslist', 'wedevs', 'typeform', ' Jotform', 'formstack',
  // Known typo patterns
  'wnnwwealth'
];

// Block emails where domain is suspiciously different from firm website
function isSuspiciousDomain(emailDomain, firmWebsite) {
  try {
    const firmHost = new URL(firmWebsite).hostname.toLowerCase().replace(/^www\./, '');
    const firmName = firmHost.split('.')[0];  // e.g., "winnowwealth" from "winnowwealth.com"
    
    // If email domain doesn't contain firm name and isn't an exact match, be suspicious
    if (!emailDomain.includes(firmName) && emailDomain !== firmHost) {
      // Allow if it's a known business domain
      const trustedTlds = ['.com', '.net', '.org', '.io'];
      const isTrusted = trustedTlds.some(tld => emailDomain.endsWith(tld));
      if (!isTrusted) return true;
      
      // Extra check: firm name should be substrings of email domain
      const nameParts = firmName.replace(/[^a-z]/g, '');  // Remove hyphens etc
      if (nameParts.length > 3 && !emailDomain.replace(/[^a-z]/g, '').includes(nameParts)) {
        return true;
      }
    }
  } catch (e) { }
  return false;
}

const EXCLUDE_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'protonmail.com', 'live.com', 'msn.com'];

const EXCLUDE_PATTERNS = [ /\.png$/i, /\.jpg$/i, /\.jpeg$/i, /\.gif$/i, /\.svg$/i, /\.webp$/i, /^[a-z]+\s+/i ];

async function fetchWithTimeout(url, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function findEmailsWithSources(baseUrl) {
  const urlObj = new URL(baseUrl);
  const base = `${urlObj.protocol}//${urlObj.host}`;
  const allEmails = [];

  // Try homepage
  try {
    const res = await fetchWithTimeout(baseUrl, 5000);
    if (res.ok) {
      const text = await res.text();
      const emails = text.match(EMAIL_REGEX) || [];
      emails.forEach(e => allEmails.push({ address: e, source: '/' }));
    }
  } catch (e) { /* skip */ }

  // Try contact pages
  for (const pattern of CONTACT_PATTERNS) {
    try {
      const contactUrl = base + pattern;
      const res = await fetchWithTimeout(contactUrl, 5000);
      if (res.ok) {
        const text = await res.text();
        const emails = text.match(EMAIL_REGEX) || [];
        emails.forEach(e => {
          if (!allEmails.find(ex => ex.address === e)) {
            allEmails.push({ address: e, source: pattern });
          }
        });
      }
    } catch (e) { continue; }
  }

  return allEmails;
}

async function hasMxRecords(domain) {
  try {
    const mxRecords = await dnsResolveMx(domain);
    return mxRecords && mxRecords.length > 0;
  } catch (e) {
    return false;
  }
}

function classifyEmailType(local) {
  const namePattern = /^[a-z]+\.[a-z]+$/;
  const initialPattern = /^[a-z]{1,3}[a-z]+$/;
  if (namePattern.test(local) || (initialPattern.test(local) && !CLIENT_FACING_PREFIXES.includes(local))) {
    return 'individual';
  }
  return 'generic';
}

async function scoreAndFilterEmails(emailsWithSources, firmWebsite) {
  let firmDomain = '';
  try {
    firmDomain = new URL(firmWebsite).hostname.replace(/^www\./, '').toLowerCase();
  } catch (e) { }

  const scored = [];

  for (const { address, source } of emailsWithSources) {
    // Skip excluded patterns
    if (EXCLUDE_PATTERNS.some(p => p.test(address))) continue;

    const [local, domain] = address.toLowerCase().split('@');
    if (!local || !domain) continue;

    // Skip consumer emails
    if (EXCLUDE_DOMAINS.includes(domain)) continue;

    let score = 0;
    let isValid = false;

    // Domain match (highest priority)
    if (firmDomain && (domain === firmDomain || domain.endsWith('.' + firmDomain))) {
      score += SCORE_DOMAIN_MATCH;
      isValid = true;
    } else {
      // Check MX records for external domains
      try {
        const hasMx = await hasMxRecords(domain);
        if (hasMx) {
          score += 50; // Partial credit for valid mail server
          isValid = true;
        }
      } catch (e) {
        isValid = false;
      }
    }

    if (!isValid) continue;

    // Client-facing prefix bonus
    if (CLIENT_FACING_PREFIXES.some(p => local.startsWith(p) || local.includes(p))) {
      score += SCORE_CLIENT_FACING;
    }

    // Business domain bonus
    if (PREFERRED_DOMAINS.some(d => domain.includes(d))) {
      score += SCORE_BUSINESS_DOMAIN;
    }

    // Penalties
    if (AVOID_PREFIXES.some(p => local.startsWith(p))) {
      score -= PENALTY_AVOID_PREFIX;
    }
    if (AVOID_DOMAINS.some(d => domain.includes(d))) {
      score -= PENALTY_THIRD_PARTY;
    }
    
    // Extra check: suspicious domain mismatch
    if (isSuspiciousDomain(domain, firmWebsite)) {
      score -= 200;  // Heavy penalty
    }

    if (score > 0) {
      scored.push({
        address,
        type: classifyEmailType(local),
        score,
        source
      });
    }
  }

  // Sort by score descending, take top MAX_EMAILS
  scored.sort((a, b) => b.score - a.score);
  
  // Deduplicate by address
  const seen = new Set();
  const unique = [];
  for (const e of scored) {
    if (!seen.has(e.address.toLowerCase())) {
      seen.add(e.address.toLowerCase());
      unique.push(e);
    }
  }
  
  return unique.slice(0, MAX_EMAILS);
}

async function getFirmsToScrape(limit) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/firmdata_website?website=not.is.null&select=crd,website,primary_business_name&limit=${limit * 3}`,
    {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    }
  );
  let firms = await res.json();

  if (SAVE_JSON) {
    const jsonPath = path.join(__dirname, '..', 'data', 'contact_emails.json');
    let scrapedCrds = new Set();
    if (fs.existsSync(jsonPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        scrapedCrds = new Set(existing.map(e => e.crd));
      } catch (e) { }
    }
    firms = firms.filter(f => !scrapedCrds.has(f.crd));
  }

  return firms.slice(0, limit);
}

async function main() {
  console.log(`[${new Date().toISOString()}] Starting contact email scrape (limit: ${LIMIT}, max ${MAX_EMAILS} per firm)`);
  console.log(`Mode: ${SAVE_JSON ? 'JSON file' : 'Supabase'}`);

  const firms = await getFirmsToScrape(LIMIT);
  console.log(`Found ${firms.length} firms to scrape\n`);

  const results = [];
  let successCount = 0;
  let failCount = 0;
  let totalEmails = 0;

  for (const firm of firms) {
    try {
      console.log(`Scraping ${firm.primary_business_name}...`);

      const emailsWithSources = await findEmailsWithSources(firm.website);

      if (emailsWithSources.length === 0) {
        console.log(`  ✗ No emails found`);
        failCount++;
        continue;
      }

      const scoredEmails = await scoreAndFilterEmails(emailsWithSources, firm.website);

      if (scoredEmails.length === 0) {
        console.log(`  ✗ No quality emails after filtering`);
        failCount++;
        continue;
      }

      const result = {
        crd: firm.crd,
        firm_name: firm.primary_business_name,
        website: firm.website,
        emails: scoredEmails
      };

      results.push(result);
      totalEmails += scoredEmails.length;

      console.log(`  ✓ Found ${scoredEmails.length} email(s):`);
      scoredEmails.forEach((e, i) => {
        console.log(`    ${i + 1}. ${e.address} (${e.type}, score: ${e.score})`);
      });

      await new Promise(r => setTimeout(r, 1000));

    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`);
      failCount++;
    }
  }

  // Save to JSON
  if (SAVE_JSON && results.length > 0) {
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    const jsonPath = path.join(dataDir, 'contact_emails.json');
    let existing = [];
    if (fs.existsSync(jsonPath)) {
      try { existing = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); } catch (e) { }
    }

    const existingCrds = new Set(existing.map(e => e.crd));
    const newResults = results.filter(r => !existingCrds.has(r.crd));
    const combined = [...existing, ...newResults];

    fs.writeFileSync(jsonPath, JSON.stringify(combined, null, 2));
    console.log(`\nSaved ${newResults.length} firms (${totalEmails} emails) to ${jsonPath}`);
    console.log(`Total firms in file: ${combined.length}`);
  }

  console.log(`\n[${new Date().toISOString()}] Complete: ${successCount} firms with emails, ${failCount} failed`);
  console.log(`Total emails collected: ${totalEmails}`);
}

main().catch(console.error);