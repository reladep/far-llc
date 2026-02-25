# FAR Data Integrity Issues

## Priority Audits Needed

### 1. Schwab Wealth Advisory (CRD: 159035)
- **Issue:** AUM falls off a cliff in 2012, data only goes to 2020
- **Concern:** Weird reporting or data anomaly
- **Action:** Consider excluding from platform if anomalous

### 2. First Trust Advisors (CRD: 107027)
- **Issue:** AUM likely includes First Trust Asset Management (different business)
- **Concern:** Skews avg client size higher than reality
- **Action:** Verify if this is consolidated reporting

### 3. Corient (CRD: 319448)
- **Issue:** AUM history only starts in 2022
- **Expected:** Should have longer history based on firm age
- **Action:** Verify data source, may need to flag as incomplete

### 4. Cambridge Associates (CRD: 104942)
- **Issue:** Client growth declined materially in 2018 (900 → 394)
- **Contradiction:** AUM went up during same period
- **Action:** Investigate if this is a reporting methodology change

### 5. Chevy Chase (search for CRD)
- **Issue:** 2015 client growth dropped (3200 → 1300) while AUM grew
- **Action:** Check for reporting anomaly

### 6. Focus Wealth / Focus Partners (CRD: 159289)
- **Issue:** Asset allocation shows 50% in "derivatives" - seems high
- **Action:** Verify data is pulling correctly, may need to validate against source

### 7. Creative Planning (search for CRD)
- **Issue:** Client count dropped from ~11,000 to 56 in 2017
- **Concern:** Massive cliff — likely reporting change, restructuring, or data error
- **Action:** Investigate cause — check if clients moved to a different CRD or reporting methodology changed

### 8. Alight Financial Advisors, LLC (search for CRD)
- **Issue:** Very low fee structure relative to a small client base
- **Concern:** Fees may be understated or loss-leader pricing — could skew industry averages
- **Action:** Verify fee data against ADV filing

### 9. Evensky & Katz (CRD: 109698)
- **Issue:** Fee schedule ends at $20mm AUM threshold
- **Concern:** Artificially lowers the firm's fee data — average fees across brackets incomplete
- **Action:** Flag for exclusion from industry averages, or note as incomplete data
- **Issue 2:** Investment professionals shows 2, should be ~26
- **Action:** Verify employee count data against ADV filing

### 10. HFR WEALTH MANAGEMENT, LLC (CRD: 106913)
- **Issue:** Summary incorrectly shows "HFRI" instead of firm name
- **Concern:** No website / public info, data import may have pulled incorrect field
- **Action:** Verify data source, may need to flag as no-public-data firm

### 11. Littman Gregory — Acquired by Beacon Pointe
- **Issue:** Firm was acquired by Beacon Pointe (beaconpointe.com)
- **Action:** Add as alt_name/alias for Beacon Pointe family, or note acquisition in firm relationship

### 12. News Search — Duplicate Articles
- **Issue:** Multiple news items pulling through for the same firm
- **Concern:** Fuzzy matching on firm name may be too loose, causing false positives (e.g., generic CRD 158369 matching 30+ articles)
- **Action:** Verify news search results don't show duplicate articles for the same firm; tighten fuzzy matching thresholds

## Firm Tags / Categorization

### Cain Watters (CRD: 111521)
- **Tag:** Dentists — firm specializes in dental practice clients

## Firms to Remove

### QUANTUM FINANCIAL (CRD: 113563)
- **Reason:** Algo traders, not traditional wealth management
- **Action:** Remove from dataset

### ADVISOR NET WEALTH PARTNERS
- **Reason:** Flagged for removal
- **Action:** Remove from dataset

### 10. Wyoming — Missing State Column & Firms
- **Issue:** No `state_wy` column exists in `firmdata_current`, and no firms show as headquartered in WY
- **Concern:** Wyoming is a popular state for LLC registrations and trust companies — likely should have some RIAs
- **Action:** Check if WY was excluded from the data import, or if the column was dropped. Verify against SEC IAPD data whether any firms list WY as main office state or state registration.

## Future Enhancements

### ADV2 Material Changes
- **Feature:** Add ADV Part 2 "Material Changes" section to News Filter
- **Note:** Firms must disclose material changes in their ADV amendments — valuable signal for alerts
- Need full audit of outliers before launch
- Consider flagging firms with incomplete data
- Build automated anomaly detection (e.g., AUM drops >50% year-over-year)

### Bank Channel Data
- Do I need to manually add the banks? JPMorgan, Goldman Sachs, UBS, Citigroup, WellsFargo, 
