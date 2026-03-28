const { supabase } = require('./workers/config');

const GNEWS_RSS = (q) => `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;

async function test() {
  const { data } = await supabase.from('firmdata_current').select('crd, primary_business_name').range(0,4);
  console.log('Testing with', data.length, 'firms');
  
  for (const firm of data) {
    const query = `"${firm.primary_business_name}"`;
    const url = GNEWS_RSS(query);
    console.log('Fetching:', firm.primary_business_name);
    const res = await fetch(url, { headers: { 'User-Agent': 'FAR-NewsBot/1.0' }});
    console.log('Status:', res.status, res.ok ? 'OK' : 'FAIL');
    if (!res.ok) break;
    const txt = await res.text();
    console.log('Response length:', txt.length);
  }
  console.log('Done');
}
test();