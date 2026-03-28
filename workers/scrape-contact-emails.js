/**
 * Worker: Scrape Contact Emails
 * Fetches firm websites, finds contact pages, extracts email addresses
 * 
 * Usage: node workers/scrape-contact-emails.js [limit]
 * 
 * Environment: 
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tgbatuqvvltemslwtpia.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnYmF0dXF2dmx0ZW1zbHd0cGlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjgwNTYyMSwiZXhwIjoyMDc4MzgxNjIxfQ.aFLJhDRJ8BewaJ24ylUw6Wb32aT5c9U-JljgjOf4VcY';

const LIMIT = parseInt(process.argv[2]) || 50;

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

// Known business email patterns (prefer these over generic contacts)
const PREFERRED_DOMAINS = ['advisor', 'wealth', 'financial', 'invest', 'capital', 'management', 'partners'];

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

function selectBestEmail(emails) {
  // Filter out common non-business emails
  const excludeDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com'];
  
  const valid = emails.filter(e => {
    const domain = e.split('@')[1]?.toLowerCase();
    return !excludeDomains.includes(domain);
  });
  
  if (valid.length > 0) {
    // Prefer emails with business-related keywords in the local part
    for (const domain of PREFERRED_DOMAINS) {
      const found = valid.find(e => e.toLowerCase().includes(domain));
      if (found) return found;
    }
    return valid[0];
  }
  
  // Fall back to any email if no business email found
  return emails[0];
}

async function getFirmsWithoutEmails(limit) {
  // Get firms with websites but no contact_email in firmdata_manual
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/firmdata_website?website=not.is.null&select=crd,website,primary_business_name&limit=${limit}`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  );
  const firms = await res.json();
  
  // Get already scraped CRDs
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
  
  return firms.filter(f => !scrapedCrds.has(f.crd));
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
        body: JSON.stringify({ contact_email: email })
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
        body: JSON.stringify({ crd, contact_email: email })
      }
    );
  }
}

async function main() {
  console.log(`[${new Date().toISOString()}] Starting contact email scrape (limit: ${LIMIT})`);
  
  const firms = await getFirmsWithoutEmails(LIMIT);
  console.log(`Found ${firms.length} firms to scrape`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const firm of firms) {
    try {
      console.log(`Scraping ${firm.primary_business_name} (${firm.website})...`);
      
      const result = await findContactPage(firm.website);
      
      if (result) {
        const bestEmail = selectBestEmail(result.emails);
        await updateFirmEmail(firm.crd, bestEmail);
        console.log(`  ✓ Found: ${bestEmail}`);
        successCount++;
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
  
  console.log(`\n[${new Date().toISOString()}] Complete: ${successCount} found, ${failCount} failed`);
}

main().catch(console.error);