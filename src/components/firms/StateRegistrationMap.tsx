"use client";

import { useState, memo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const STATE_FIPS: Record<string, string> = {
  al: "01", ak: "02", az: "04", ar: "05", ca: "06", co: "08", ct: "09",
  de: "10", fl: "12", ga: "13", hi: "15", id: "16", il: "17", in: "18",
  ia: "19", ks: "20", ky: "21", la: "22", me: "23", md: "24", ma: "25",
  mi: "26", mn: "27", ms: "28", mo: "29", mt: "30", ne: "31", nv: "32",
  nh: "33", nj: "34", nm: "35", ny: "36", nc: "37", nd: "38", oh: "39",
  ok: "40", or: "41", pa: "42", ri: "44", sc: "45", sd: "46", tn: "47",
  tx: "48", ut: "49", vt: "50", va: "51", wa: "53", wv: "54", wi: "55",
  wy: "56", dc: "11", pr: "72", vi: "78",
};

const FIPS_TO_ABBR: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_FIPS).map(([abbr, fips]) => [fips, abbr])
);

const STATE_NAMES: Record<string, string> = {
  al: "Alabama", ak: "Alaska", az: "Arizona", ar: "Arkansas", ca: "California",
  co: "Colorado", ct: "Connecticut", de: "Delaware", fl: "Florida", ga: "Georgia",
  hi: "Hawaii", id: "Idaho", il: "Illinois", in: "Indiana", ia: "Iowa",
  ks: "Kansas", ky: "Kentucky", la: "Louisiana", me: "Maine", md: "Maryland",
  ma: "Massachusetts", mi: "Michigan", mn: "Minnesota", ms: "Mississippi",
  mo: "Missouri", mt: "Montana", ne: "Nebraska", nv: "Nevada", nh: "New Hampshire",
  nj: "New Jersey", nm: "New Mexico", ny: "New York", nc: "North Carolina",
  nd: "North Dakota", oh: "Ohio", ok: "Oklahoma", or: "Oregon", pa: "Pennsylvania",
  ri: "Rhode Island", sc: "South Carolina", sd: "South Dakota", tn: "Tennessee",
  tx: "Texas", ut: "Utah", vt: "Vermont", va: "Virginia", wa: "Washington",
  wv: "West Virginia", wi: "Wisconsin", wy: "Wyoming", dc: "District of Columbia",
  pr: "Puerto Rico", vi: "US Virgin Islands",
};

interface Props {
  stateRegistrations: Record<string, string>;
}

function StateRegistrationMap({ stateRegistrations }: Props) {
  const [tooltip, setTooltip] = useState<{ name: string; registered: boolean } | null>(null);

  const totalStates = Object.keys(stateRegistrations).length;
  const registeredCount = Object.values(stateRegistrations).filter((v) => v === "Y").length;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <p className="text-sm text-slate-600 mb-2">
        Registered in <span className="font-semibold text-slate-900">{registeredCount}</span> states
      </p>

      <div className="relative">
        <ComposableMap projection="geoAlbersUsa" width={800} height={500}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const fips = String(geo.id).padStart(2, "0");
                const abbr = FIPS_TO_ABBR[fips];
                const value = abbr ? stateRegistrations[abbr] : undefined;
                if (value === undefined) return null;

                const isRegistered = value === "Y";
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isRegistered ? "#16a34a" : "#e5e7eb"}
                    stroke="#fff"
                    strokeWidth={0.5}
                    onMouseEnter={() =>
                      setTooltip({ name: STATE_NAMES[abbr] || abbr.toUpperCase(), registered: isRegistered })
                    }
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", opacity: 0.8 },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>

        {tooltip && (
          <div className="pointer-events-none absolute top-2 right-2 rounded bg-slate-800 px-3 py-1.5 text-xs text-white shadow">
            <span className="font-medium">{tooltip.name}</span>
            {" — "}
            {tooltip.registered ? "Registered" : "Not registered"}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(StateRegistrationMap);
