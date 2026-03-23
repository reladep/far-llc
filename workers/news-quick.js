#!/usr/bin/env node
const { supabase } = require('./config');
const https = require('https');

const GNEWS_RSS = (q) => `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
const MA_KW = ["acquire","acquired","acquires","acquisition","merger","merges","merging","merged","sold to","takeover","buyout","bought","purchase"];
const RIA_T = ["RIA","wealth management","investment adviser","financial advisory","assets under management","AUM","wealth firm"];
const NOISE = ["stock","ETF","fund","crypto","bitcoin"];

const fetch = (url) => new Promise((r,j) => https.get(url, s => { let d=""; s.on("data",c=>d+=c); s.on("end",()=>r(d)); }).on("error",j));

const parse = (xml) => {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const b = m[1];
    const t = b.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g,"$1")?.trim();
    const l = b.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim();
    if (t && l) items.push({t, l});
  }
  return items;
};

const hasR = (s) => RIA_T.some(x => s.toLowerCase().includes(x.toLowerCase()));
const isN = (s) => NOISE.some(x => s.toLowerCase().includes(x.toLowerCase()));
const hasM = (s) => MA_KW.some(x => s.toLowerCase().includes(x.toLowerCase()));

(async () => {
  console.log("[News] Scanning 40 firms (parallel)...");
  const { data: firms } = await supabase.from("firmdata_current").select("crd,primary_business_name").order("crd").limit(40);
  
  const results = await Promise.all(firms.map(async (f) => {
    try {
      const xml = await fetch(GNEWS_RSS(f.primary_business_name));
      const arts = parse(xml).slice(0,3);
      return { firm: f, arts };
    } catch(e) { return { firm: f, arts: [] }; }
  }));
  
  let newArts = 0, maAlerts = 0, maList = [];
  
  for (const r of results) {
    for (const a of r.arts) {
      const tl = a.t.toLowerCase();
      if (isN(tl) || !hasR(tl)) continue;
      const { data: ex } = await supabase.from("news_articles").select("url").eq("url", a.l).maybeSingle();
      if (ex) continue;
      
      newArts++;
      await supabase.from("news_articles").insert({ crd: r.firm.crd, title: a.t, url: a.l });
      
      if (hasM(tl)) {
        maAlerts++;
        maList.push(r.firm.primary_business_name.substring(0,20) + ": " + a.t.substring(0,50));
        await supabase.from("firm_alerts").insert({ crd: r.firm.crd, alert_type: "M&A", title: a.t, url: a.l });
      }
    }
  }
  
  console.log("[News] Results: " + newArts + " new articles, " + maAlerts + " M&A alerts");
  if (maList.length) console.log("[M&A] " + maList.join(" | "));
})();
