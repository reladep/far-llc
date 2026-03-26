const { supabase } = require('./workers/config');

const GNEWS_RSS = (query) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

async function testFirm(num) {
  const { data } = await supabase.from('firmdata_current').select('crd, primary_business_name').range(num, num);
  const firm = data[0];
  console.log(`Testing firm ${num}: ${firm.primary_business_name}`);
  
  const url = GNEWS_RSS(`"${firm.primary_business_name}"`);
  console.log('URL:', url);
  
  const res = await fetch(url, { headers: { 'User-Agent': 'FAR-NewsBot/1.0' }});
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response length:', text.length);
  console.log('---');
}

// Test firms around position 50
[48, 49, 50, 51].forEach(n => testFirm(n));