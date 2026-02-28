# Visor Value Score

_Last updated: 2026-02-27_

## Overview

This is an essential, key feature of Visor Index. This is proprietary data that does not exist elsewhere and materially differentiates Visor Index's value proposition versus competitors.

Visor Value Scores will be prominently referenced as a key feature on the Homepage, and displayed on Firm Profiles, Search, Compare, and Match Results.

**Note:** Save this logic to reference in the future. Develop a process so these scores are automatically updated if any values change. Scores are saved in the Supabase table `firm_scores`.

---

## Score Breakdown and Calculation

**Total Possible Points: 100** (10 components × 10 points each)

### 1. `disclosure_score`: 10 points

Using disclosure fields from `firmdata_current` (all fields starting with `disclosure_firm_`):
- Clean regulatory record (all N or NULL): **10 points**
- Any disclosures flagged (any "Y"): **0 points**

### 2. `fee_transparency_score`: 10 points

Based on `fee_structure_type` in `firmdata_feesandmins`:
- `tiered`: **10 points**
- `flat_percentage`: **10 points**
- `range`: **6 points**
- `not_disclosed` or NULL: **0 points**

### 3. `fee_competitiveness_score`: 10 points

Calculate the annual fee for a **$10M portfolio** using the tiered bracket calculation logic (same as the FeeCalculator component on firm profiles). Use fee tiers from `firmdata_feetiers`.

Rank all firms by their calculated fee (lowest to highest = best to worst):
- Top 25% (lowest fees): **10 points**
- 25-50%: **7 points**
- 50-75%: **3 points**
- Bottom 25% (highest fees): **0 points**
- No fee data available: **0 points**

### 4. `conflict_free_score`: 10 points

Based on `employee_insurance` and `employee_broker_dealer` from `firmdata_current`:
- Both = 0 (or NULL): **10 points**
- `employee_broker_dealer` > 0 but `employee_insurance` = 0: **5 points**
- `employee_broker_dealer` > 0 AND `employee_insurance` > 0: **0 points**

### 5. `aum_growth_score`: 10 points

Based on `aum_5y_growth_annualized` from `firmdata_growth_rate_rankings`:
- Top 25% percentile: **10 points**
- 25-50% percentile: **5 points**
- Bottom 50%: **0 points**
- If `aum_5y_growth_annualized` is NULL, fallback to `aum_1y_growth_annualized` with same breakdowns.
- If both are NULL: **0 points**

### 6. `client_growth_score`: 10 points

Based on `clients_5y_growth_annualized` from `firmdata_growth_rate_rankings`:
- Top 25% percentile: **10 points**
- 25-50% percentile: **5 points**
- Bottom 50%: **0 points**
- If `clients_5y_growth_annualized` is NULL, fallback to `clients_1y_growth_annualized` with same breakdowns.
- If both are NULL: **0 points**

### 7. `advisor_bandwidth_score`: 10 points

For each firm, calculate total clients (sum all `client_*` fields in `firmdata_current`), then divide by `employee_investment` to get clients-per-advisor ratio.

Rank firms by this ratio (lowest to highest, lowest = best):
- Top 25% (lowest ratio): **10 points**
- 25-50%: **7 points**
- 50-75%: **3 points**
- Bottom 25% (highest ratio): **0 points**
- If `employee_investment` is 0 or NULL: **0 points**

### 8. `derivatives_score`: 10 points

Based on `asset_allocation_derivatives` from `firmdata_current`:
- \> 30%: **10 points**
- 20-30%: **8 points**
- 10-20%: **6 points**
- < 10% or NULL: **0 points**

### 9. `upmarket_score`: 10 points

Calculate total clients (sum all `client_*` fields), then compute `client_non_hnw_number / total_clients`:
- Non-HNW ratio < 10%: **10 points**
- 10-25%: **4 points**
- 25-50%: **2 points**
- \> 50%: **0 points**

### 10. `viability_score`: 10 points

Based on `aum` from `firmdata_current`:
- \> $10B: **10 points**
- \> $5B: **8 points**
- \> $1B: **4 points**
- \> $500M: **2 points**
- ≤ $500M: **0 points**

---

## Final Score

`final_score` = sum of all 10 component scores (max 100, no penalties).

No `broker_penalty` or `insurance_penalty` — conflicts of interest are already captured in `conflict_free_score`.

---

## Additional Fields Stored

For context and debugging, also store in `firm_scores`:
- `aum` — current AUM
- `client_count` — total clients
- `derivatives_pct` — derivatives allocation percentage
- `non_hnw_pct` — non-HNW client percentage
- `fee_disclosed` — boolean, whether fee structure is disclosed
- `has_insurance` — boolean, has insurance employees
- `has_broker_dealer` — boolean, has broker-dealer employees
- `fee_competitiveness_pct` — percentile rank for fee competitiveness
- `aum_growth_pct` — percentile rank for AUM growth
- `client_growth_pct` — percentile rank for client growth
- `advisor_bandwidth_pct` — percentile rank for advisor bandwidth
- `calculated_at` — timestamp of calculation

---

## Star Rating System

Convert numeric score to star rating for display:

| Score Range | Stars | Display |
|-------------|-------|---------|
| 80-100 | ⭐⭐⭐⭐⭐ | 5 stars |
| 70-79 | ⭐⭐⭐⭐½ | 4.5 stars |
| 60-69 | ⭐⭐⭐⭐ | 4 stars |
| 50-59 | ⭐⭐⭐ | 3 stars |
| 40-49 | ⭐⭐½ | 2.5 stars |
| 30-39 | ⭐⭐ | 2 stars |
| 0-29 | ⭐ | 1 star |

The `stars` field is calculated in the worker and stored in the `firm_scores` table.

---

## Display Locations

- **Homepage** — Referenced as key feature
- **Firm Profiles** — Star rating display
- **Search Results** — Stars shown per firm
- **Compare Page** — Side-by-side star comparison
- **Match Results** — Stars as ranking factor
