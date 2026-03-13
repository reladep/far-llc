import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

const STATE_DATA = {
  "01":{abbr:"AL",name:"Alabama",firms:142,aum:"$89.4B"},
  "02":{abbr:"AK",name:"Alaska",firms:18,aum:"$9.1B"},
  "04":{abbr:"AZ",name:"Arizona",firms:312,aum:"$198.3B"},
  "05":{abbr:"AR",name:"Arkansas",firms:89,aum:"$41.2B"},
  "06":{abbr:"CA",name:"California",firms:2849,aum:"$4.2T"},
  "08":{abbr:"CO",name:"Colorado",firms:521,aum:"$312.8B"},
  "09":{abbr:"CT",name:"Connecticut",firms:287,aum:"$521.4B"},
  "10":{abbr:"DE",name:"Delaware",firms:67,aum:"$89.3B"},
  "11":{abbr:"DC",name:"D.C.",firms:214,aum:"$312.4B"},
  "12":{abbr:"FL",name:"Florida",firms:1124,aum:"$892.1B"},
  "13":{abbr:"GA",name:"Georgia",firms:389,aum:"$241.7B"},
  "15":{abbr:"HI",name:"Hawaii",firms:42,aum:"$18.2B"},
  "16":{abbr:"ID",name:"Idaho",firms:94,aum:"$52.3B"},
  "17":{abbr:"IL",name:"Illinois",firms:842,aum:"$1.1T"},
  "18":{abbr:"IN",name:"Indiana",firms:248,aum:"$138.4B"},
  "19":{abbr:"IA",name:"Iowa",firms:178,aum:"$98.2B"},
  "20":{abbr:"KS",name:"Kansas",firms:142,aum:"$78.9B"},
  "21":{abbr:"KY",name:"Kentucky",firms:162,aum:"$94.5B"},
  "22":{abbr:"LA",name:"Louisiana",firms:128,aum:"$67.8B"},
  "23":{abbr:"ME",name:"Maine",firms:62,aum:"$38.1B"},
  "24":{abbr:"MD",name:"Maryland",firms:312,aum:"$412.8B"},
  "25":{abbr:"MA",name:"Massachusetts",firms:521,aum:"$1.8T"},
  "26":{abbr:"MI",name:"Michigan",firms:412,aum:"$284.3B"},
  "27":{abbr:"MN",name:"Minnesota",firms:387,aum:"$421.8B"},
  "28":{abbr:"MS",name:"Mississippi",firms:98,aum:"$42.1B"},
  "29":{abbr:"MO",name:"Missouri",firms:298,aum:"$198.7B"},
  "30":{abbr:"MT",name:"Montana",firms:68,aum:"$38.9B"},
  "31":{abbr:"NE",name:"Nebraska",firms:112,aum:"$82.4B"},
  "32":{abbr:"NV",name:"Nevada",firms:198,aum:"$112.3B"},
  "33":{abbr:"NH",name:"New Hampshire",firms:78,aum:"$62.4B"},
  "34":{abbr:"NJ",name:"New Jersey",firms:648,aum:"$892.4B"},
  "35":{abbr:"NM",name:"New Mexico",firms:98,aum:"$48.2B"},
  "36":{abbr:"NY",name:"New York",firms:1842,aum:"$8.4T"},
  "37":{abbr:"NC",name:"North Carolina",firms:342,aum:"$218.4B"},
  "38":{abbr:"ND",name:"North Dakota",firms:38,aum:"$22.8B"},
  "39":{abbr:"OH",name:"Ohio",firms:521,aum:"$412.8B"},
  "40":{abbr:"OK",name:"Oklahoma",firms:148,aum:"$82.1B"},
  "41":{abbr:"OR",name:"Oregon",firms:218,aum:"$142.8B"},
  "42":{abbr:"PA",name:"Pennsylvania",firms:612,aum:"$712.4B"},
  "44":{abbr:"RI",name:"Rhode Island",firms:48,aum:"$42.1B"},
  "45":{abbr:"SC",name:"South Carolina",firms:162,aum:"$98.4B"},
  "46":{abbr:"SD",name:"South Dakota",firms:42,aum:"$28.4B"},
  "47":{abbr:"TN",name:"Tennessee",firms:228,aum:"$148.2B"},
  "48":{abbr:"TX",name:"Texas",firms:1248,aum:"$1.2T"},
  "49":{abbr:"UT",name:"Utah",firms:218,aum:"$128.4B"},
  "50":{abbr:"VT",name:"Vermont",firms:52,aum:"$42.8B"},
  "51":{abbr:"VA",name:"Virginia",firms:428,aum:"$512.4B"},
  "53":{abbr:"WA",name:"Washington",firms:312,aum:"$218.4B"},
  "54":{abbr:"WV",name:"West Virginia",firms:62,aum:"$38.4B"},
  "55":{abbr:"WI",name:"Wisconsin",firms:248,aum:"$198.4B"},
  "56":{abbr:"WY",name:"Wyoming",firms:48,aum:"$28.9B"},
};

const W = 960, H = 560;

// Load topojson-client from CDN at runtime (works in browser)
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function VisorDirectory() {
  const svgRef = useRef(null);
  const [features, setFeatures] = useState([]);
  const [pathGen, setPathGen] = useState(null);
  const [selected, setSelected] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        // Load topojson-client lib
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js");

        // Fetch the TopoJSON (works in browser environment)
        const res = await fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json");
        const us = await res.json();

        // Use d3.geoAlbersUsa — correct, built-in, handles Alaska + Hawaii insets
        const projection = d3.geoAlbersUsa()
          .scale(1280)
          .translate([W / 2, H / 2]);

        const path = d3.geoPath().projection(projection);

        // topojson is now on window
        const stateFeatures = window.topojson.feature(us, us.objects.states).features;

        setFeatures(stateFeatures);
        setPathGen(() => path);
        setLoading(false);
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleMouseMove = useCallback((e, feature) => {
    const sd = STATE_DATA[feature.id];
    if (!sd) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const svgY = ((e.clientY - rect.top) / rect.height) * H;
    setTooltip({ x: svgX, y: svgY, data: sd });
    setHovered(feature.id);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
    setHovered(null);
  }, []);

  const handleClick = useCallback((feature) => {
    const sd = STATE_DATA[feature.id];
    if (!sd) return;
    setSelected(prev => prev?.id === feature.id ? null : { id: feature.id, ...sd });
  }, []);

  const getFill = (id) => {
    if (selected?.id === id) return "#1A7A4A";
    if (hovered === id) return "#22995E";
    return STATE_DATA[id] ? "#c8dfd5" : "#e8f0ed";
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#F6F8F7", minHeight: "100vh" }}>

      {/* Hero */}
      <div style={{ background: "#0A1C2A", padding: "0 0 0 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 48px 40px" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: "#2DBD74", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 16, height: 1, background: "#2DBD74", display: "inline-block" }} />
            Advisor Directory
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 700, color: "#fff", letterSpacing: "-.02em", marginBottom: 6 }}>
            Browse by State
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.35)", lineHeight: 1.65, maxWidth: 480, marginBottom: 28 }}>
            Every SEC-registered RIA, organized by state. Click any state to browse firms, scores, fees, and regulatory history.
          </div>
          <div style={{ display: "flex", gap: 32 }}>
            {[["14,280","Registered firms"],["$48.2T","Total AUM"],["50","States indexed"],["Feb 2025","Last updated"]].map(([val, label]) => (
              <div key={label} style={{ borderLeft: "1px solid rgba(255,255,255,.08)", paddingLeft: 20 }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700, color: "#fff" }}>{val}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map section */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 48px 64px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700, color: "#0C1810" }}>
            Browse by State
          </div>
          <div style={{ fontSize: 11, color: "#5A7568", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2DBD74", display: "inline-block" }} />
            Click any state to view firms
          </div>
        </div>

        {/* Map card */}
        <div style={{ background: "#fff", border: "1px solid #CAD8D0", borderTop: "2px solid #0C1810", padding: "20px 20px 12px", marginBottom: 1 }}>
          {loading && (
            <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", color: "#5A7568", fontSize: 13 }}>
              Loading map…
            </div>
          )}
          {error && (
            <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", color: "#c0392b", fontSize: 13 }}>
              Could not load map data. Please refresh.
            </div>
          )}
          {!loading && !error && (
            <div style={{ position: "relative" }}>
              <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                style={{ width: "100%", height: "auto", display: "block" }}
                onMouseLeave={handleMouseLeave}
              >
                {features.map(f => (
                  <path
                    key={f.id}
                    d={pathGen(f)}
                    fill={getFill(f.id)}
                    stroke="#fff"
                    strokeWidth={0.8}
                    strokeLinejoin="round"
                    style={{ cursor: STATE_DATA[f.id] ? "pointer" : "default", transition: "fill .12s ease" }}
                    onMouseMove={e => handleMouseMove(e, f)}
                    onMouseEnter={e => handleMouseMove(e, f)}
                    onClick={() => handleClick(f)}
                  />
                ))}

                {/* Tooltip in SVG space */}
                {tooltip && (
                  <g
                    transform={`translate(${Math.min(tooltip.x + 16, W - 185)},${Math.max(tooltip.y - 72, 8)})`}
                    style={{ pointerEvents: "none" }}
                  >
                    <rect width={174} height={62} fill="#0A1C2A" rx={0} />
                    <rect width={174} height={2} fill="#2DBD74" />
                    <text x={12} y={20} fontFamily="Cormorant Garamond, serif" fontSize={14} fontWeight={700} fill="white">
                      {tooltip.data.name}
                    </text>
                    <text x={12} y={36} fontFamily="DM Mono, monospace" fontSize={10} fill="#2DBD74">
                      {tooltip.data.firms.toLocaleString()} registered firms
                    </text>
                    <text x={12} y={51} fontFamily="DM Mono, monospace" fontSize={10} fill="rgba(255,255,255,.45)">
                      {tooltip.data.aum} total AUM
                    </text>
                  </g>
                )}
              </svg>
            </div>
          )}

          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, paddingTop: 8, fontSize: 10, color: "#5A7568" }}>
            {[["#c8dfd5","Has firms"],["#1A7A4A","Selected"],["#e8f0ed","No data"]].map(([bg, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 14, height: 10, background: bg, border: "1px solid #CAD8D0" }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "#CAD8D0" }}>
          {[
            { label: "Selected State", val: selected?.name ?? "—", sub: "Click map to select" },
            { label: "Registered Firms", val: selected ? selected.firms.toLocaleString() : "—", sub: "SEC-registered RIAs" },
            { label: "Total AUM", val: selected?.aum ?? "—", sub: "Assets under management" },
            { label: "Action", val: null, sub: selected ? `View all firms in ${selected.name}` : "Select a state first" },
          ].map((cell, i) => (
            <div key={i} style={{ background: "#fff", padding: "16px 20px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#5A7568", marginBottom: 6 }}>
                {cell.label}
              </div>
              {i < 3 ? (
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 700, color: "#0C1810", lineHeight: 1, marginBottom: 3 }}>
                  {cell.val}
                </div>
              ) : (
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 700,
                    color: selected ? "#1A7A4A" : "#5A7568",
                    opacity: selected ? 1 : 0.4,
                    cursor: selected ? "pointer" : "default",
                    marginBottom: 3,
                    userSelect: "none",
                  }}
                >
                  Browse Firms →
                </div>
              )}
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#5A7568" }}>
                {cell.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
