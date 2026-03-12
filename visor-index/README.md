# Visor Index — React + Vite App

Complete conversion of all HTML wireframes into a React + Vite application.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Pages

| Route | Page | File |
|-------|------|------|
| `/` | Homepage (hero, score ring animation, calculator, use cases) | `src/pages/HomePage.jsx` |
| `/search` | Advisor search with filters + results | `src/pages/SearchPage.jsx` |
| `/firm/:id` | Firm profile with VVS score animation, AUM chart, metrics | `src/pages/FirmProfile.jsx` |
| `/compare` | Side-by-side comparison tool with fee calculator | `src/pages/ComparePage.jsx` |
| `/negotiate` | Fee benchmarking + negotiation playbook | `src/pages/NegotiatePage.jsx` |
| `/directory` | D3 US map + state drill-down | `src/pages/DirectoryPage.jsx` |
| `/pricing` | Pricing tiers + ROI stats | `src/pages/PricingPage.jsx` |
| `/dashboard` | User dashboard (saved firms, alerts, settings) | `src/pages/DashboardPage.jsx` |
| `/blog` | Blog listing | `src/pages/BlogPage.jsx` |

## Design System

- **Colors**: Navy (`#0A1C2A`), Green (`#1A7A4A`, `#2DBD74`), Off-white (`#F6F8F7`)
- **Fonts**: Cormorant Garamond (serif headings), DM Sans (body), DM Mono (data)
- **Animations**: Score ring countdown, scroll reveals, marquee, floating tickers

## Dependencies

- `react`, `react-dom`, `react-router-dom`
- `d3` (US map in Directory page)
- `topojson-client` (map GeoJSON)

## Notes

- Directory page fetches TopoJSON from CDN at runtime (requires internet)
- All animations use native browser APIs (no animation library needed)
- CSS variables are in `src/index.css`
