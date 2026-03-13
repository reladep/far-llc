import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  navy: "#0A1C2A", navy2: "#0F2538",
  green: "#1A7A4A", green2: "#22995E", green3: "#2DBD74", greenPale: "#E6F4ED",
  white: "#F6F8F7", ink: "#0C1810", ink2: "#2E4438", ink3: "#5A7568", rule: "#CAD8D0",
  amber: "#B45309", red: "#DC2626",
};
const SERIF = "'Cormorant Garamond', serif";
const SANS  = "'DM Sans', sans-serif";
const MONO  = "'DM Mono', monospace";

// ── State data ─────────────────────────────────────────────────────────────
const STATE_DATA = {
  "01":{abbr:"AL",name:"Alabama",firms:142,aum:"$89.4B",feeOnly:28,medianFee:"1.02%"},
  "02":{abbr:"AK",name:"Alaska",firms:18,aum:"$9.1B",feeOnly:6,medianFee:"1.10%"},
  "04":{abbr:"AZ",name:"Arizona",firms:312,aum:"$198.3B",feeOnly:89,medianFee:"0.98%"},
  "05":{abbr:"AR",name:"Arkansas",firms:89,aum:"$41.2B",feeOnly:21,medianFee:"1.05%"},
  "06":{abbr:"CA",name:"California",firms:2849,aum:"$4.2T",feeOnly:812,medianFee:"0.92%"},
  "08":{abbr:"CO",name:"Colorado",firms:521,aum:"$312.8B",feeOnly:187,medianFee:"0.95%"},
  "09":{abbr:"CT",name:"Connecticut",firms:287,aum:"$521.4B",feeOnly:94,medianFee:"0.89%"},
  "10":{abbr:"DE",name:"Delaware",firms:67,aum:"$89.3B",feeOnly:18,medianFee:"0.96%"},
  "11":{abbr:"DC",name:"D.C.",firms:214,aum:"$312.4B",feeOnly:78,medianFee:"0.91%"},
  "12":{abbr:"FL",name:"Florida",firms:1124,aum:"$892.1B",feeOnly:312,medianFee:"0.97%"},
  "13":{abbr:"GA",name:"Georgia",firms:389,aum:"$241.7B",feeOnly:104,medianFee:"0.99%"},
  "15":{abbr:"HI",name:"Hawaii",firms:42,aum:"$18.2B",feeOnly:12,medianFee:"1.04%"},
  "16":{abbr:"ID",name:"Idaho",firms:94,aum:"$52.3B",feeOnly:31,medianFee:"1.01%"},
  "17":{abbr:"IL",name:"Illinois",firms:842,aum:"$1.1T",feeOnly:241,medianFee:"0.93%"},
  "18":{abbr:"IN",name:"Indiana",firms:248,aum:"$138.4B",feeOnly:68,medianFee:"1.00%"},
  "19":{abbr:"IA",name:"Iowa",firms:178,aum:"$98.2B",feeOnly:52,medianFee:"1.01%"},
  "20":{abbr:"KS",name:"Kansas",firms:142,aum:"$78.9B",feeOnly:39,medianFee:"1.03%"},
  "21":{abbr:"KY",name:"Kentucky",firms:162,aum:"$94.5B",feeOnly:44,medianFee:"1.02%"},
  "22":{abbr:"LA",name:"Louisiana",firms:128,aum:"$67.8B",feeOnly:32,medianFee:"1.04%"},
  "23":{abbr:"ME",name:"Maine",firms:62,aum:"$38.1B",feeOnly:22,medianFee:"1.00%"},
  "24":{abbr:"MD",name:"Maryland",firms:312,aum:"$412.8B",feeOnly:96,medianFee:"0.94%"},
  "25":{abbr:"MA",name:"Massachusetts",firms:521,aum:"$1.8T",feeOnly:178,medianFee:"0.90%"},
  "26":{abbr:"MI",name:"Michigan",firms:412,aum:"$284.3B",feeOnly:118,medianFee:"0.97%"},
  "27":{abbr:"MN",name:"Minnesota",firms:387,aum:"$421.8B",feeOnly:124,medianFee:"0.94%"},
  "28":{abbr:"MS",name:"Mississippi",firms:98,aum:"$42.1B",feeOnly:22,medianFee:"1.06%"},
  "29":{abbr:"MO",name:"Missouri",firms:298,aum:"$198.7B",feeOnly:84,medianFee:"0.98%"},
  "30":{abbr:"MT",name:"Montana",firms:68,aum:"$38.9B",feeOnly:24,medianFee:"1.01%"},
  "31":{abbr:"NE",name:"Nebraska",firms:112,aum:"$82.4B",feeOnly:34,medianFee:"1.00%"},
  "32":{abbr:"NV",name:"Nevada",firms:198,aum:"$112.3B",feeOnly:58,medianFee:"0.99%"},
  "33":{abbr:"NH",name:"New Hampshire",firms:78,aum:"$62.4B",feeOnly:28,medianFee:"0.99%"},
  "34":{abbr:"NJ",name:"New Jersey",firms:648,aum:"$892.4B",feeOnly:192,medianFee:"0.93%"},
  "35":{abbr:"NM",name:"New Mexico",firms:98,aum:"$48.2B",feeOnly:28,medianFee:"1.02%"},
  "36":{abbr:"NY",name:"New York",firms:1842,aum:"$8.4T",feeOnly:412,medianFee:"0.94%"},
  "37":{abbr:"NC",name:"North Carolina",firms:342,aum:"$218.4B",feeOnly:98,medianFee:"0.97%"},
  "38":{abbr:"ND",name:"North Dakota",firms:38,aum:"$22.8B",feeOnly:10,medianFee:"1.04%"},
  "39":{abbr:"OH",name:"Ohio",firms:521,aum:"$412.8B",feeOnly:148,medianFee:"0.96%"},
  "40":{abbr:"OK",name:"Oklahoma",firms:148,aum:"$82.1B",feeOnly:40,medianFee:"1.02%"},
  "41":{abbr:"OR",name:"Oregon",firms:218,aum:"$142.8B",feeOnly:72,medianFee:"0.96%"},
  "42":{abbr:"PA",name:"Pennsylvania",firms:612,aum:"$712.4B",feeOnly:174,medianFee:"0.94%"},
  "44":{abbr:"RI",name:"Rhode Island",firms:48,aum:"$42.1B",feeOnly:16,medianFee:"0.98%"},
  "45":{abbr:"SC",name:"South Carolina",firms:162,aum:"$98.4B",feeOnly:48,medianFee:"0.99%"},
  "46":{abbr:"SD",name:"South Dakota",firms:42,aum:"$28.4B",feeOnly:12,medianFee:"1.03%"},
  "47":{abbr:"TN",name:"Tennessee",firms:228,aum:"$148.2B",feeOnly:64,medianFee:"0.99%"},
  "48":{abbr:"TX",name:"Texas",firms:1248,aum:"$1.2T",feeOnly:342,medianFee:"0.96%"},
  "49":{abbr:"UT",name:"Utah",firms:218,aum:"$128.4B",feeOnly:68,medianFee:"0.98%"},
  "50":{abbr:"VT",name:"Vermont",firms:52,aum:"$42.8B",feeOnly:18,medianFee:"0.99%"},
  "51":{abbr:"VA",name:"Virginia",firms:428,aum:"$512.4B",feeOnly:128,medianFee:"0.94%"},
  "53":{abbr:"WA",name:"Washington",firms:312,aum:"$218.4B",feeOnly:98,medianFee:"0.95%"},
  "54":{abbr:"WV",name:"West Virginia",firms:62,aum:"$38.4B",feeOnly:18,medianFee:"1.02%"},
  "55":{abbr:"WI",name:"Wisconsin",firms:248,aum:"$198.4B",feeOnly:74,medianFee:"0.97%"},
  "56":{abbr:"WY",name:"Wyoming",firms:48,aum:"$28.9B",feeOnly:14,medianFee:"1.03%"},
};

// ── Sample firms (reused across all states, names vary by state) ────────────
const BASE_FIRMS = [
  {name:"Rockbridge Family Partners",legal:"ROCKBRIDGE FAMILY PARTNERS LLC",score:91,aum:"$2.1B",growth:"+14.2%",growDir:"up",fee:"0.75–1.50%",feeType:"Tiered, fee-only",bps:"−26 bps vs median",bpsDir:"below",tags:["Fee-only","MFO"],flag:null,emp:38},
  {name:"Silverpeak Wealth Advisors",legal:"SILVERPEAK WEALTH MANAGEMENT LLC",score:88,aum:"$4.8B",growth:"+9.1%",growDir:"up",fee:"0.60–1.20%",feeType:"Tiered, fee-only",bps:"−34 bps vs median",bpsDir:"below",tags:["Fee-only","RIA"],flag:null,emp:62},
  {name:"Meridian Vantage Advisors",legal:"MERIDIAN VANTAGE ADVISORS LLC",score:87,aum:"$890M",growth:"+9.8%",growDir:"up",fee:"0.70–1.25%",feeType:"Tiered, fee-only",bps:"−24 bps vs median",bpsDir:"below",tags:["Fee-only"],flag:null,emp:24},
  {name:"Ashford Private Capital",legal:"ASHFORD PRIVATE CAPITAL LLC",score:84,aum:"$1.2B",growth:"+6.1%",growDir:"up",fee:"0.72–1.40%",feeType:"Tiered, fee-only",bps:"−22 bps vs median",bpsDir:"below",tags:["Fee-only","MFO"],flag:null,emp:31},
  {name:"Blackstone Personal Wealth",legal:"BLACKSTONE PERSONAL WEALTH SOLUTIONS LLC",score:79,aum:"$18.4B",growth:"+22.4%",growDir:"up",fee:"0.50–1.00%",feeType:"Tiered + performance",bps:"−44 bps vs median",bpsDir:"below",tags:["Institutional"],flag:"Affiliated broker-dealer",emp:284},
  {name:"Beacon Harbor Advisors",legal:"BEACON HARBOR ADVISORY GROUP LLC",score:76,aum:"$620M",growth:"+4.2%",growDir:"up",fee:"1.00–1.50%",feeType:"Flat rate",bps:"At median",bpsDir:"below",tags:["Fee-only"],flag:null,emp:18},
  {name:"Cornerstone Capital Group",legal:"CORNERSTONE CAPITAL GROUP INC",score:74,aum:"$2.9B",growth:"−1.2%",growDir:"dn",fee:"1.00–1.50%",feeType:"Tiered + 12b-1",bps:"+6 bps vs median",bpsDir:"above",tags:["Fee-based"],flag:"12b-1 fees disclosed",emp:89},
  {name:"Harbor Point Wealth Management",legal:"HARBOR POINT WEALTH MANAGEMENT LLC",score:72,aum:"$440M",growth:"+2.8%",growDir:"up",fee:"1.10–1.75%",feeType:"Flat rate",bps:"+16 bps vs median",bpsDir:"above",tags:["Fee-based"],flag:null,emp:14},
  {name:"Northgate Capital Advisors",legal:"NORTHGATE CAPITAL ADVISORS INC",score:68,aum:"$1.1B",growth:"+7.4%",growDir:"up",fee:"0.90–1.40%",feeType:"Tiered",bps:"−4 bps vs median",bpsDir:"below",tags:["Fee-only"],flag:null,emp:42},
  {name:"Manhattan Private Office",legal:"MANHATTAN PRIVATE OFFICE LLC",score:65,aum:"$3.2B",growth:"+11.8%",growDir:"up",fee:"1.25–1.75%",feeType:"Tiered + performance",bps:"+31 bps vs median",bpsDir:"above",tags:["MFO"],flag:"PE ownership (65%)",emp:56},
];

// ── VVS Ring ───────────────────────────────────────────────────────────────
function VVSRing({ score, size = 44 }) {
  const r = size * 0.41, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const color = score >= 85 ? C.green3 : score >= 70 ? C.amber : C.red;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", top: 0, left: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.rule} strokeWidth="3" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${circ * score / 100} ${circ * (1 - score / 100)}`}
          strokeDashoffset={circ * 0.25} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: size * 0.3, fontWeight: 700, color }}>
        {score}
      </div>
    </div>
  );
}

// ── US Map Component ───────────────────────────────────────────────────────
const W = 960, H = 560;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (window.__topoLoaded) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => { window.__topoLoaded = true; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function USMap({ selectedId, onSelect }) {
  const svgRef = useRef(null);
  const [features, setFeatures] = useState([]);
  const [pathGen, setPathGen] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    (async () => {
      try {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js");
        const res = await fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json");
        const us = await res.json();
        const proj = d3.geoAlbersUsa().scale(1280).translate([W / 2, H / 2]);
        const path = d3.geoPath().projection(proj);
        setFeatures(window.topojson.feature(us, us.objects.states).features);
        setPathGen(() => path);
        setStatus("ok");
      } catch (e) {
        setStatus("error");
      }
    })();
  }, []);

  const onMouseMove = useCallback((e, f) => {
    const sd = STATE_DATA[f.id];
    if (!sd) return;
    const rect = svgRef.current.getBoundingClientRect();
    setTooltip({
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
      sd,
    });
    setHovered(f.id);
  }, []);

  const onMouseLeave = useCallback(() => { setTooltip(null); setHovered(null); }, []);

  const fill = (id) => {
    if (id === selectedId) return C.green;
    if (id === hovered) return C.green2;
    return STATE_DATA[id] ? "#c8dfd5" : "#e8f0ed";
  };

  if (status === "loading") return (
    <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", color: C.ink3, fontFamily: MONO, fontSize: 12, gap: 10 }}>
      <span style={{ display: "inline-block", width: 16, height: 16, border: `2px solid ${C.green3}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      Loading map data…
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (status === "error") return (
    <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: C.red, fontSize: 13 }}>
      Could not load map. Please refresh.
    </div>
  );

  return (
    <div style={{ position: "relative" }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} onMouseLeave={onMouseLeave}>
        {features.map(f => (
          <path key={f.id} d={pathGen(f)}
            fill={fill(f.id)} stroke="#fff" strokeWidth={0.8} strokeLinejoin="round"
            style={{ cursor: STATE_DATA[f.id] ? "pointer" : "default", transition: "fill .12s" }}
            onMouseMove={e => onMouseMove(e, f)}
            onMouseEnter={e => onMouseMove(e, f)}
            onClick={() => STATE_DATA[f.id] && onSelect(f.id)}
          />
        ))}

        {/* Tooltip */}
        {tooltip && (
          <g transform={`translate(${Math.min(tooltip.x + 16, W - 190)},${Math.max(tooltip.y - 76, 8)})`} style={{ pointerEvents: "none" }}>
            <rect width={178} height={66} fill={C.navy} />
            <rect width={178} height={2} fill={C.green3} />
            <text x={12} y={22} fontFamily={SERIF} fontSize={14} fontWeight={700} fill="#fff">{tooltip.sd.name}</text>
            <text x={12} y={38} fontFamily={MONO} fontSize={10} fill={C.green3}>{tooltip.sd.firms.toLocaleString()} registered firms</text>
            <text x={12} y={53} fontFamily={MONO} fontSize={10} fill="rgba(255,255,255,.45)">{tooltip.sd.aum} · {tooltip.sd.medianFee} median fee</text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ── Firm Row ───────────────────────────────────────────────────────────────
function FirmRow({ firm }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 64px 110px 150px 110px 70px 28px",
        gap: 0,
        padding: "15px 24px",
        background: hover ? "#f0f6f3" : "#fff",
        borderBottom: `1px solid ${C.rule}`,
        alignItems: "center",
        cursor: "pointer",
        transition: "background .1s",
      }}
    >
      {/* Name */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 2, lineHeight: 1.3 }}>{firm.name}</div>
        <div style={{ fontSize: 10, color: C.ink3, fontFamily: MONO }}>{firm.legal}</div>
        <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
          {firm.tags.map(t => (
            <span key={t} style={{
              fontSize: 9, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase",
              padding: "2px 6px",
              background: t === "Fee-only" ? C.greenPale : C.white,
              color: t === "Fee-only" ? C.green : C.ink3,
              border: `1px solid ${t === "Fee-only" ? "rgba(26,122,74,.25)" : C.rule}`,
            }}>{t}</span>
          ))}
          {firm.flag && (
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".06em", padding: "2px 6px", background: "rgba(220,38,38,.07)", color: C.red, border: "1px solid rgba(220,38,38,.2)", display: "inline-flex", alignItems: "center", gap: 4 }}>
              ⚑ {firm.flag}
            </span>
          )}
        </div>
      </div>

      {/* VVS */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <VVSRing score={firm.score} />
      </div>

      {/* AUM */}
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: C.ink }}>{firm.aum}</div>
        <div style={{ fontFamily: MONO, fontSize: 10, marginTop: 2, color: firm.growDir === "up" ? C.green : C.red }}>{firm.growth} 1yr</div>
      </div>

      {/* Fee */}
      <div>
        <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 500, color: C.ink, marginBottom: 2 }}>{firm.fee}</div>
        <div style={{ fontSize: 10, color: C.ink3 }}>{firm.feeType}</div>
        <div style={{ fontFamily: MONO, fontSize: 10, marginTop: 2, color: firm.bpsDir === "below" ? C.green : C.amber }}>{firm.bps}</div>
      </div>

      {/* City */}
      <div style={{ fontFamily: MONO, fontSize: 11, color: C.ink2 }}>{firm.city || "New York"}</div>

      {/* Employees */}
      <div style={{ fontFamily: MONO, fontSize: 11, color: C.ink3, textAlign: "right" }}>{firm.emp}</div>

      {/* Arrow */}
      <div style={{ color: C.ink3, textAlign: "right", opacity: hover ? 1 : 0, transform: hover ? "translateX(2px)" : "none", transition: "opacity .1s, transform .15s", fontSize: 14 }}>→</div>
    </div>
  );
}

// ── State List View ────────────────────────────────────────────────────────
function StateList({ stateId, sd, onBack }) {
  const [sortBy, setSortBy] = useState("score");
  const [filters, setFilters] = useState([]);

  const sorts = [
    { key: "score", label: "VVS Score" },
    { key: "aum", label: "AUM" },
    { key: "fee", label: "Fee" },
    { key: "name", label: "A–Z" },
  ];
  const filterOpts = ["Fee-only", "$1B+ AUM", "No flags", sd.abbr === "NY" ? "NYC" : sd.abbr];

  const toggleFilter = (f) => setFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  // Generate city names based on state
  const firms = BASE_FIRMS.map((f, i) => ({
    ...f,
    city: ["New York", "Boston", "Chicago", "Los Angeles", "Houston", "Atlanta", "Seattle", "Denver", "Dallas", "Miami"][i % 10]
      .replace("New York", sd.name === "New York" ? ["New York", "Brooklyn", "Greenwich", "White Plains", "Stamford", "New York", "New York", "Stamford", "White Plains", "New York"][i] : sd.name.split(" ")[0])
  }));

  return (
    <div style={{ animation: "slideIn .25s ease" }}>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}`}</style>

      {/* Back breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: C.green, fontFamily: SANS, fontSize: 13, fontWeight: 500, padding: 0, display: "flex", alignItems: "center", gap: 5 }}>
          ← Back to map
        </button>
        <span style={{ color: C.rule }}>·</span>
        <span style={{ fontSize: 13, color: C.ink3 }}>Directory / {sd.name}</span>
      </div>

      {/* State hero */}
      <div style={{ background: C.navy, marginBottom: 1, padding: "32px 32px 28px" }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: C.green3, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 14, height: 1, background: C.green3, display: "inline-block" }} />
          {sd.name}
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 700, color: "#fff", letterSpacing: "-.02em", marginBottom: 20 }}>
          Financial Advisors<br />in {sd.name}
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          {[
            [sd.firms.toLocaleString(), "firms"],
            [sd.aum, "total AUM"],
            [sd.feeOnly, "fee-only"],
            [sd.medianFee, "state median fee"],
          ].map(([val, label], i) => (
            <div key={label} style={{ paddingRight: 28, marginRight: 28, borderRight: i < 3 ? "1px solid rgba(255,255,255,.1)" : "none" }}>
              <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ background: "rgba(246,248,247,.97)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.rule}`, padding: "0 0", position: "sticky", top: 0, zIndex: 200 }}>
        <div style={{ padding: "0 0", height: 48, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: C.ink3 }}>Sort</span>
            {sorts.map(s => (
              <button key={s.key} onClick={() => setSortBy(s.key)} style={{
                fontSize: 11, fontFamily: SANS, padding: "4px 10px", cursor: "pointer",
                background: sortBy === s.key ? C.navy : "none",
                color: sortBy === s.key ? "#fff" : C.ink3,
                border: `1px solid ${sortBy === s.key ? C.navy : C.rule}`,
                transition: "all .12s",
              }}>{s.label}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 14, borderLeft: `1px solid ${C.rule}` }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: C.ink3 }}>Filter</span>
            {filterOpts.map(f => (
              <button key={f} onClick={() => toggleFilter(f)} style={{
                fontSize: 11, fontFamily: SANS, padding: "4px 10px", cursor: "pointer",
                background: filters.includes(f) ? C.greenPale : "none",
                color: filters.includes(f) ? C.green : C.ink3,
                border: `1px solid ${filters.includes(f) ? "rgba(26,122,74,.3)" : C.rule}`,
                display: "flex", alignItems: "center", gap: 5, transition: "all .12s",
              }}>
                {filters.includes(f) ? "✓ " : ""}{f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ border: `1px solid ${C.rule}`, borderTop: `2px solid ${C.ink}` }}>
        {/* Header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 64px 110px 150px 110px 70px 28px",
          background: C.navy, padding: "10px 24px",
          position: "sticky", top: 48, zIndex: 100,
        }}>
          {["Firm", "VVS Score", "AUM", "Fee Structure", "City", "Employees", ""].map((h, i) => (
            <div key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.45)", textAlign: i === 2 || i === 5 ? "right" : "left" }}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {firms.map((f, i) => <FirmRow key={i} firm={f} />)}

        {/* Load more */}
        <div style={{ padding: "20px 24px", textAlign: "center", borderTop: `1px solid ${C.rule}` }}>
          <button style={{ fontFamily: SANS, fontSize: 12, color: C.green, background: "none", border: `1px solid rgba(26,122,74,.3)`, padding: "8px 24px", cursor: "pointer" }}>
            Load more firms ({(sd.firms - 10).toLocaleString()} remaining)
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Root App ───────────────────────────────────────────────────────────────
export default function VisorDirectory() {
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState("map"); // "map" | "state"
  const listRef = useRef(null);

  const handleSelect = (id) => {
    setSelectedId(id);
  };

  const handleBrowse = () => {
    setView("state");
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const handleBack = () => {
    setView("map");
    setSelectedId(null);
  };

  const sd = selectedId ? STATE_DATA[selectedId] : null;

  return (
    <div style={{ fontFamily: SANS, background: C.white, minHeight: "100vh" }}>

      {/* ── Hero ── */}
      <div style={{ background: C.navy, padding: "36px 0 40px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 40px" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: C.green3, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 16, height: 1, background: C.green3, display: "inline-block" }} />
            Advisor Directory
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 700, color: "#fff", letterSpacing: "-.02em", marginBottom: 6 }}>
            Browse by State
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.35)", lineHeight: 1.65, maxWidth: 480, marginBottom: 28 }}>
            Every SEC-registered RIA, organized by state. Click any state to explore firms, scores, fees, and regulatory history.
          </div>
          <div style={{ display: "flex", gap: 0 }}>
            {[["14,280","Registered firms"],["$48.2T","Total AUM covered"],["50","States indexed"],["Feb 2025","Last updated"]].map(([val, label], i) => (
              <div key={label} style={{ paddingLeft: i > 0 ? 28 : 0, marginLeft: i > 0 ? 28 : 0, borderLeft: i > 0 ? "1px solid rgba(255,255,255,.08)" : "none" }}>
                <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: "#fff" }}>{val}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "36px 40px 80px" }}>

        {view === "map" && (
          <>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.ink }}>Select a State</div>
              <div style={{ fontSize: 11, color: C.ink3, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.green3, display: "inline-block" }} />
                Click any state to view firms
              </div>
            </div>

            {/* Map card */}
            <div style={{ background: "#fff", border: `1px solid ${C.rule}`, borderTop: `2px solid ${C.ink}`, padding: "20px 20px 12px", marginBottom: 1 }}>
              <USMap selectedId={selectedId} onSelect={handleSelect} />
              <div style={{ display: "flex", alignItems: "center", gap: 20, paddingTop: 10, fontSize: 10, color: C.ink3 }}>
                {[["#c8dfd5","Has firms"],["#1A7A4A","Selected"],["#e8f0ed","No data"]].map(([bg, label]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 14, height: 10, background: bg, border: `1px solid ${C.rule}` }} />
                    <span style={{ fontFamily: MONO }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats bar */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: C.rule, border: `1px solid ${C.rule}` }}>
              {[
                { label: "Selected State", body: sd?.name ?? "—", sub: "Click map to select" },
                { label: "Registered Firms", body: sd ? sd.firms.toLocaleString() : "—", sub: "SEC-registered RIAs" },
                { label: "Total AUM", body: sd?.aum ?? "—", sub: "Assets under management" },
                { label: "Action", body: null, sub: sd ? `${sd.feeOnly} fee-only firms` : "Select a state first" },
              ].map((cell, i) => (
                <div key={i} style={{ background: "#fff", padding: "16px 20px" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: C.ink3, marginBottom: 6 }}>{cell.label}</div>
                  {i < 3 ? (
                    <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: C.ink, lineHeight: 1, marginBottom: 4 }}>{cell.body}</div>
                  ) : (
                    <div
                      onClick={sd ? handleBrowse : undefined}
                      style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: sd ? C.green : C.ink3, opacity: sd ? 1 : 0.35, cursor: sd ? "pointer" : "default", marginBottom: 4, userSelect: "none" }}
                    >
                      Browse Firms →
                    </div>
                  )}
                  <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink3 }}>{cell.sub}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── State firm list ── */}
        {view === "state" && sd && (
          <div ref={listRef}>
            <StateList stateId={selectedId} sd={sd} onBack={handleBack} />
          </div>
        )}
      </div>
    </div>
  );
}
