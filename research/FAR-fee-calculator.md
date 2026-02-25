# FAR Fee Calculator Feature Spec

## Vision
A calculator tool that shows users how much they'll pay in fees with a given advisor, with comparison to other firms' fee structures.

## Placement

### 1. Firm Profile Calculator (Inline)
- Input field on every firm profile page
- User enters: investable assets amount ($)
- Shows: estimated annual fee based on firm's fee schedule
- Real-time calculation as user types

### 2. Dedicated Comparison Page (`/calculator`)
- Side-by-side comparison of up to 3 firms
- Input: investable assets amount
- Shows:
  - Annual fee for each firm
  - Total fees paid over 5/10/20 years
  - Fee difference between firms
  - Visual chart/graph

## User Flow

1. User visits firm profile
2. Enters investable assets amount in calculator widget
3. Sees estimated annual fee based on that firm's tiered fee schedule
4. Option to "Compare" → adds firm to comparison page
5. On comparison page, adds 2 more firms
6. Sees total fee impact over time

## Data Needed

- Firm's fee tier schedule (`firmdata_feetiers` table)
  - min_aum, max_aum, fee_pct
- Need to handle:
  - Flat fee advisors
  - Tiered percentage fees
  - Hybrid structures

## Mockups / Wireframes

### Firm Profile Widget
```
┌─────────────────────────────────┐
│  Fee Calculator                 │
│  ┌───────────────────────────┐  │
│  │ $ Enter your assets      │  │
│  └───────────────────────────┘  │
│                                 │
│  Estimated Annual Fee:          │
│  ┌───────────────────────────┐  │
│  │        $12,500           │  │
│  │   (1.00% of $1.25M)     │  │
│  └───────────────────────────┘  │
│                                 │
│  [Compare This Firm]            │
└─────────────────────────────────┘
```

### Comparison Page
```
┌────────────────────────────────────────────────────────────────────┐
│  Fee Comparison Calculator                                          │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ $ Enter your investable assets: [$1,000,000                │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────┬──────────────┬──────────────┐                  │
│  │ Firm A       │ Firm B       │ Firm C       │                  │
│  │ (Selected)   │ (Selected)   │ (Add Firm)   │                  │
│  ├──────────────┼──────────────┼──────────────┤                  │
│  │ 1.00%       │ 0.85%        │ 1.25%        │ ← Fee Rate      │
│  ├──────────────┼──────────────┼──────────────┤                  │
│  │ $10,000     │ $8,500       │ $12,500      │ ← Annual Fee    │
│  ├──────────────┼──────────────┼──────────────┤                  │
│  │ $50,000     │ $42,500      │ $62,500      │ ← 5 Year Total  │
│  ├──────────────┼──────────────┼──────────────┤                  │
│  │ $100,000    │ $85,000      │ $125,000     │ ← 10 Year Total │
│  ├──────────────┼──────────────┼──────────────┤                  │
│  │ $200,000    │ $170,000     │ $250,000     │ ← 20 Year Total │
│  └──────────────┴──────────────┴──────────────┘                  │
│                                                                    │
│  [Add Another Firm]  [Clear All]                                   │
└────────────────────────────────────────────────────────────────────┘
```

## Technical Implementation

### 1. Calculator Component
- Client-side React component
- Takes firm's fee tiers as props
- Calculates fee based on input amount using tiered bracket logic

### 2. Fee Calculation Logic

**Tiered AUM Fees (most common):**
```
Example: 1.00% on first $1M, 0.80% on next $4M, 0.60% on remainder
Input: $3M investable assets
Calculation: (1,000,000 × 1%) + (2,000,000 × 0.80%) = $10,000 + $16,000 = $26,000
```

**Flat Fee Firms:**
- Display flat fee amount prominently
- Note: "Flat fee advisors may charge additional costs"

**Minimum Fees:**
- Check if input amount triggers minimum fee
- Show warning: "This firm's minimum fee is $X — your calculated fee is below minimum"

**No Fee Data:**
- Show: "Fee data not available for this firm"
- Prompt user to request info or try another firm

### 3. Comparison Metrics

| Metric | Description |
|--------|-------------|
| Annual Fee | Estimated yearly cost at given AUM |
| 5-Year Total | Cumulative fees over 5 years (nominal) |
| 10-Year Total | Cumulative fees over 10 years |
| 20-Year Total | Cumulative fees over 20 years |
| Opportunity Cost | What those fees could have earned if invested at 7% return |

**Opportunity Cost Formula:**
```
Future Value = PV × (1 + r)^n
Opportunity Cost = Future Value - Total Fees Paid
```

### 4. Fee Schedule Data
- Already exists in `firmdata_feetiers`
- Need to handle edge cases:
  - No fee data available → show message
  - Flat fee firms → display flat amount
  - Minimum fees → apply minimum

### 5. Comparison State
- Use URL params for state: `/calculator?firms=104942,159198,145323&amount=1000000`
- Allow adding firms from:
  - Firm profile "Compare" button
  - Search results
  - Direct URL

### 6. Negotiation Savings Display (FAR Differentiation)

Show potential savings based on fee benchmarks:
```
Your Fee: 1.00% ($10,000)
Industry Average: 0.95%
After Negotiation (10% reduction): 0.90% ($9,000)
─────────────────────────────────
Potential Annual Savings: $1,000
5-Year Savings: $5,000
```

## User Experience

### On Firm Profile
1. Calculator widget prominently displayed in sidebar
2. Large, clear input field for assets
3. Immediate calculation as user types
4. "Compare" button adds firm to comparison

### On Comparison Page
1. Input field at top (shared across all firms)
2. Side-by-side cards for each firm
3. Highlight "best value" in green
4. Show savings vs. highest-cost option

## Priority
- Medium-High (valuable for user decision-making, differentiates platform)

## Dependencies
- `firmdata_feetiers` table (already exists)
- May need: fee negotiation benchmark data (future feature)
