# SEC Form ADV Field Mapping

## XML → ADV Form → Supabase

This document maps every field from the SEC's XML feed to:
1. Form ADV question number
2. Supabase table/column (where applicable)

---

## SECTION A: IDENTIFYING INFORMATION

| XML Field | ADV Question | Description | Supabase Column |
|-----------|--------------|-------------|-----------------|
| `FirmCrdNb` | - | CRD Number | `firmdata_current.crd` |
| `SECNb` | - | SEC File Number | `firmdata_current.sec_number` |
| `BusNm` | Item 1.A | Primary Business Name | `firmdata_current.primary_business_name` |
| `LegalNm` | Item 1.B | Legal Name | `firmdata_current.legal_name` |
| `SECRgnCD` | - | SEC Region Code | - |
| `UmbrRgstn` | Item 1.E | Umbrella Registration (Y/N) | - |

### Principal Office Address

| XML Field | ADV Question | Description | Supabase Column |
|-----------|--------------|-------------|-----------------|
| `Strt1` | Item 1.F | Street Address 1 | `firmdata_current.main_office_address` |
| `Strt2` | Item 1.F | Street Address 2 | - |
| `City` | Item 1.F | City | `firmdata_current.main_office_city` |
| `State` | Item 1.F | State | `firmdata_current.main_office_state` |
| `PostlCd` | Item 1.F | ZIP Code | - |
| `Cntry` | Item 1.F | Country | - |
| `PhNb` | Item 1.F | Phone Number | - |
| `FaxNb` | Item 1.F | Fax Number | - |

### Mailing Address

| XML Field | ADV Question | Description |
|-----------|--------------|-------------|
| `MailingAddr/Strt1` | Item 1.G | Mailing Street 1 |
| `MailingAddr/Strt2` | Item 1.G | Mailing Street 2 |
| `MailingAddr/City` | Item 1.G | Mailing City |
| `MailingAddr/State` | Item 1.G | Mailing State |
| `MailingAddr/PostlCd` | Item 1.G | Mailing ZIP |
| `MailingAddr/Cntry` | Item 1.G | Mailing Country |

### Website

| XML Field | ADV Question | Description | Supabase Column |
|-----------|--------------|-------------|-----------------|
| `WebAddr` | Item 1.F | Website Address (from ADV) | ❌ NOT USED - See note below |

> **NOTE:** Website data in Supabase comes from **scraped data** (`firmdata_website` table), NOT from the XML/ADV. This is because many ADV filings contain:
> - Incorrect/outdated website URLs
> - Links to social media profiles (LinkedIn, Facebook, Twitter)
> - Dead links
> 
> The scraper verifies and enriches websites for accuracy.

### Registration Info

| XML Field | ADV Question | Description | Supabase Column |
|-----------|--------------|-------------|-----------------|
| `Rgstn/@St` | Item 2.A | SEC Registration Status | `firmdata_current.sec_current_status` |
| `Rgstn/@Dt` | Item 2.A | Registration Date | - |
| `Rgstn/@FirmType` | - | Firm Type (Registered/Exempt) | - |
| `NoticeFiled/States/@RgltrCd` | Item 2.B | State Notice Filed | `firmdata_current.state_*` (50 columns) |
| `Filing/@Dt` | - | Latest ADV Filing Date | `firmdata_current.latest_adv_filing` |
| `Filing/@FormVrsn` | - | Form Version | - |

---

## SECTION B: ADVISORY BUSINESS

### Item 5A: Advisory Activities

| XML Field | ADV Question | Description | Supabase Column |
|-----------|--------------|-------------|-----------------|
| `TtlEmp` | Item 5.A | Total Employees | `firmdata_current.employee_total` |
| `Q5E1` | Item 5.E.1 | Financial planning | `firmdata_current.services_financial_planning` |
| `Q5E2` | Item 5.E.2 | Portfolio management | `firmdata_current.services_port_management_individuals` |
| `Q5E3` | Item 5.E.3 | Pension consulting | `firmdata_current.services_pension_consulting` |
| `Q5E4` | Item 5.E.4 | Selection of other advisers | `firmdata_current.services_mgr_selection` |
| `Q5E5` | Item 5.E.5 | Publication of reports | - |
| `Q5E6` | Item 5.E.6 | Market timing services | - |
| `Q5E7` | Item 5.E.7 | Other | - |

### Item 5B: Types of Clients

| XML Field | ADV Question | Description | Supabase Column |
|-----------|--------------|-------------|-----------------|
| `Q5B1` | Item 5.B.(1) | Individuals | `firmdata_current.client_individuals_number` |
| `Q5B2` | Item 5.B.(2) | High Net Worth Individuals | `firmdata_current.client_hnw_number` |
| `Q5B3` | Item 5.B.(3) | Banks | `firmdata_current.client_banks_number` |
| `Q5B4` | Item 5.B.(4) | Investment Companies | `firmdata_current.client_investment_cos_number` |
| `Q5B5` | Item 5.B.(5) | Pooled Vehicles | `firmdata_current.client_pooled_vehicles_number` |
| `Q5B6` | Item 5.B.(6) | Other | `firmdata_current.client_other_number` |
| `Q5C1` | Item 5.C.1 | Clients (non-discretionary) | - |
| `Q5C2` | Item 5.C.2 | Accounts (non-discretionary) | - |

### Item 5D: Assets Under Management

| XML Field | ADV Question | Description | Supabase Column |
|-----------|--------------|-------------|-----------------|
| `Q5DA1` | Item 5.D.1(a) | Discretionary AUM | `firmdata_current.aum_discretionary` |
| `Q5DA2` | Item 5.D.1(a) | Discretionary # of accounts | - |
| `Q5DA3` | Item 5.D.1(c) | Non-Discretionary AUM | `firmdata_current.aum_non_discretionary` |
| `Q5DB1` | Item 5.D.1(b) | Non-Discretionary # of accounts | - |
| `Q5DB2` | Item 5.D.1(b) | Non-Discretionary accounts | - |
| `Q5DB3` | Item 5.D.1(d) | Non-Discretionary AUM | - |
| `Q5DM1` | Item 5.D.1(m) | Fewest number of clients | - |
| `Q5DM2` | Item 5.D.1(m) | Description | - |
| `Q5DM3` | Item 5.D.1(m) | AUM for fewest clients | - |

> **Note:** Total AUM = Q5DA1 + Q5DA3 → `firmdata_current.aum`

### Item 5F: Performance-Based Fees

| XML Field | ADV Question | Description | Supabase Column |
|-----------|--------------|-------------|-----------------|
| `Q5F1` | Item 5.F.1 | Performance-based fees (Y/N) | - |
| `Q5F2A` | Item 5.F.2 | Performance fee AUM | - |
| `Q5F2B` | Item 5.F.2 | Performance fee clients | - |
| `Q5F2C` | Item 5.F.2 | Performance fee accounts | - |
| `Q5F3` | Item 5.F.3 | Hedge fund/PE AUM | - |

### Item 5G: Methods of Analysis

| XML Field | ADV Question | Description |
|-----------|--------------|-------------|
| `Q5G1` | Item 5.G.1 | Charting |
| `Q5G2` | Item 5.G.2 | Cycle analysis |
| `Q5G3` | Item 5.G.3 | Elliot Wave |
| `Q5G4` | Item 5.G.4 | Fundamental analysis |
| `Q5G5` | Item 5.G.5 | Technical analysis |
| `Q5G6` | Item 5.G.6 | Trend analysis |
| `Q5G7`-`Q5G12` | Item 5.G.7-12 | Other methods |

### Item 5I: Investment Strategies

| XML Field | ADV Question | Description |
|-----------|--------------|-------------|
| `Q5I1` | Item 5.I.1 | Long/short |
| `Q5I2A` | Item 5.I.2 | AUM for long/short |
| `Q5I2B` | Item 5.I.2 | Accounts for long/short |
| `Q5I2C` | Item 5.I.2 | Investors in long/short |

### Item 5K: Disciplinary Disclosure

| XML Field | ADV Question | Description | Supabase Column |
|-----------|--------------|-------------|-----------------|
| `Q5K1` | Item 5.K.1 | Criminal disclosure | `firmdata_current.disclosure_firm_felony_conviction` |
| `Q5K2` | Item 5.K.2 | Regulatory disclosure | `firmdata_current.disclosure_firm_current_regulatory_proceedings` |
| `Q5K3` | Item 5.K.3 | Civil disclosure | `firmdata_current.disclosure_firm_court_ruling_violation` |
| `Q5K4` | Item 5.K.4 | Arbitration disclosure | - |

---

## SECTION C: OTHER BUSINESS ACTIVITIES

### Item 6A: Other Business Activities

| XML Field | ADV Question | Description |
|-----------|--------------|-------------|
| `Q6A1`-`Q6A14` | Item 6.A.1-14 | Other business activities |

### Item 6B: Financial Industry Activities

| XML Field | ADV Question | Description | Supabase Column |
|-----------|--------------|-------------|-----------------|
| `Q6B1` | Item 6.B.1 | Broker-dealer | - |
| `Q6B2` | Item 6.B.2 | Futures/commodities | - |
| `Q6B3` | Item 6.B.3 | Bank/insurance | - |

---

## SECTION D: FINANCIAL INDUSTRY AFFILIATIONS

### Item 7A: Affiliates

| XML Field | ADV Question | Description |
|-----------|--------------|-------------|
| `Q7A1`-`Q7A16` | Item 7.A.1-16 | Financial industry affiliates |

### Item 7B: Private Fund Advisor

| XML Field | ADV Question | Description | Supabase Column |
|-----------|--------------|-------------|-----------------|
| `Q7B` | Item 7.B | Private fund advisor | `firmdata_current.private_fund_advisor` |

---

## SECTION E: PARTICIPATION IN CLIENT TRANSACTIONS

### Item 8A-C: Use of broker-dealer

| XML Field | ADV Question | Description |
|-----------|--------------|-------------|
| `Q8A1`-`Q8A3` | Item 8.A-C | Broker-dealer practices |
| `Q8B1`-`Q8B3` | Item 8.B-C | Soft dollar arrangements |
| `Q8C1`-`Q8C4` | Item 8.C | Client commissions |
| `Q8D` | Item 8.D | Directed brokerage |
| `Q8E` | Item 8.E | Aggregated trades |
| `Q8F` | Item 8.F | Privately offered securities |

---

## SECTION F: CUSTODY

### Item 9A-B: Custody

| XML Field | ADV Question | Description | Supabase Column |
|-----------|--------------|-------------|-----------------|
| `Q9A1A` | Item 9.A.1 | Custody (Y/N) | - |
| `Q9A1B` | Item 9.A.1 | Related party custody | - |
| `Q9A2A` | Item 9.A.2 | Custody AUM | - |
| `Q9A2B` | Item 9.A.2 | Custody accounts | - |
| `Q9B1A` | Item 9.B.1 | Qualified custodian (Y/N) | - |
| `Q9B1B` | Item 9.B.1 | Qualified custodian name | - |

---

## SECTION G: INVESTMENT DISCRETION

### Item 10A: Discretion

| XML Field | ADV Question | Description | Supabase Column |
|-----------|--------------|-------------|-----------------|
| `Q10A` | Item 10.A | Discretionary authority | - |

---

## SECTION H: DISCLOSURE INFORMATION

### Item 11: Disclosure Questions

| XML Field | ADV Question | Description | Supabase Column |
|-----------|--------------|-------------|-----------------|
| `Q11` | Item 11 | Any disciplinary event | `firmdata_current.disclosure_firm_*` (multiple) |
| `Q11A1` | Item 11.A.1 | Felony conviction | `disclosure_firm_felony_conviction` |
| `Q11A2` | Item 11.A.2 | Felony charge | `disclosure_firm_felony_charge` |
| `Q11B1` | Item 11.B.1 | Misdemeanor conviction | `disclosure_firm_misdemenor_conviction` |
| `Q11B2` | Item 11.B.2 | Misdemeanor charge | `disclosure_firm_misdemenor_charge` |
| `Q11C1` | Item 11.C.1 | SEC/federal violations | `disclosure_firm_federal_violations` |
| `Q11C2` | Item 11.C.2 | SEC/federal revocation | `disclosure_firm_federal_revoke` |
| `Q11C3` | Item 11.C.3 | SEC/federal suspension | `disclosure_firm_federal_suspension_restrictions` |
| `Q11C4` | Item 11.C.4 | SEC/federal false statement | `disclosure_firm_federal_false_statement` |
| `Q11C5` | Item 11.C.5 | SEC/federal investment order | `disclosure_firm_federal_investment_order_10_years` |
| `Q11D1` | Item 11.D.1 | SRO violations | `disclosure_firm_self_regulatory_violation` |
| `Q11D2` | Item 11.D.2 | SRO discipline | `disclosure_firm_self_regulatory_discipline` |
| `Q11D3` | Item 11.D.3 | SRO suspension | `disclosure_firm_self_regulatory_suspension_restrictions` |
| `Q11D4` | Item 11.D.4 | SRO false statement | `disclosure_firm_self_regulatory_false_statement` |
| `Q11E1` | Item 11.E.1 | SEC/CFTC violations | `disclosure_firm_sec_cftc_violations` |
| `Q11E2` | Item 11.E.2 | SEC/CFTC monetary penalty | `disclosure_firm_sec_cftc_monetary_penalty` |
| `Q11E3` | Item 11.E.3 | SEC/CFTC suspension | `disclosure_firm_sec_cftc_suspension_restrictions` |
| `Q11E4` | Item 11.E.4 | SEC/CFTC false statement | `disclosure_firm_sec_cftc_false_statement` |
| `Q11F` | Item 11.F | Other regulatory proceedings | - |
| `Q11G` | Item 11.G | Other legal proceedings | - |
| `Q11H1A` | Item 11.H.1(a) | Court ruling - violation | `disclosure_firm_court_ruling_violation` |
| `Q11H1B` | Item 11.H.1(b) | Court ruling - investment | `disclosure_firm_court_ruling_investment` |
| `Q11H1C` | Item 11.H.1(c) | Court ruling - ongoing | `disclosure_firm_court_ruling_ongoing_litigation` |
| `Q11H2` | Item 11.H.2 | Court ruling - dismissal | `disclosure_firm_court_ruling_dismissal` |

---

## SECTION: ORGANIZATIONAL FORM

### Item 3A: Form of Organization

| XML Field | ADV Question | Description | Supabase Column |
|-----------|--------------|-------------|-----------------|
| `OrgFormNm` | Item 3.A | Legal structure | `firmdata_current.legal_structure` |
| `OrgFormOthNm` | Item 3.A | Other (specify) | - |

### Item 3B: Fiscal Year End

| XML Field | ADV Question | Description |
|-----------|--------------|-------------|
| `Q3B` | Item 3.B | Fiscal year end month |

### Item 3C: Jurisdiction

| XML Field | ADV Question | Description |
|-----------|--------------|-------------|
| `StateCD` | Item 3.C | State of organization |
| `CntryNm` | Item 3.C | Country of organization |

---

## SUPPLEMENTAL DATA (Not in Form ADV)

| XML Field | Description | Supabase Column |
|-----------|-------------|-----------------|
| `GenOn` | Report generation date | - |
| `version` | XML version | - |
| `encoding` | XML encoding | - |
| `SECNb` | SEC Number | - |

---

## EXACT FORM ADV QUESTIONS

Below is the actual question text from Form ADV (for reference):

### Item 1: Identifying Information
- **1.A** - State the name of your firm
- **1.B** - List your legal name (if different from your firm name)
- **1.F** - Address of your principal office
- **1.F** - What is your website address?

### Item 5B: Types of Clients
- **5.B.(1)** - Approximately how many clients do you have?
- **5.B.(1)** - Individuals (other than high net worth individuals)
- **5.B.(2)** - High net worth individuals
- **5.B.(3)** - Banks
- **5.B.(4)** - Investment companies
- **5.B.(5)** - Pooled investment vehicles
- **5.B.(6)** - Other

### Item 5D: Assets Under Management
- **5.D.1(a)** - DISCRETIONARY: Total assets under management
- **5.D.1(a)** - DISCRETIONARY: Number of accounts
- **5.D.1(c)** - NON-DISCRETIONARY: Total assets under management
- **5.D.1(c)** - NON-DISCRETIONARY: Number of accounts

### Item 11: Disclosure Information
- **11.A.1** - Has your firm or any associated person been convicted of a felony?
- **11.A.2** - Has your firm or any associated person been charged with a felony?
- **11.B.1** - Has your firm or any associated person been convicted of a misdemeanor?
- **11.B.2** - Has your firm or any associated person been charged with a misdemeanor?
- **11.C.1** - Has your firm or any associated person been found to have violated any federal or state securities laws?
- **11.C.2** - Has your firm or any associated person been expelled from any self-regulatory organization (SRO)?
- **11.C.3** - Has your firm or any associated person been suspended from any SRO?
- **11.E.1** - Has the SEC or the Commodity Futures Trading Commission (CFTC) ever found your firm or any associated person to have violated any rule or regulation?
- **11.E.2** - Has the SEC or CFTC ever imposed a monetary penalty on your firm or any associated person?
- **11.H.1(a)** - Has your firm or any associated person been found liable in any federal or state civil or administrative proceeding?
- **11.H.1(b)** - Has your firm or any associated person entered into a settlement agreement in any federal or state civil or administrative proceeding?

---

## MAPPING NOTES

### Key Transformations Needed

1. **AUM Calculation**: Total AUM = `Q5DA1` + `Q5DA3` (discretionary + non-discretionary)
2. **Client Types**: 
   - Wealth Management = `Q5B1` + `Q5B2` > 0
   - Institutional Only = `Q5B1` + `Q5B2` = 0 AND `Q5B3`-`Q5B6` > 0
3. **Boolean Fields**: Y/N values need to be converted to true/false for Supabase
4. **State Flags**: `NoticeFiled/States/@RgltrCd` maps to 50 state columns in Supabase (state_al, state_ak, etc.)

### Missing from XML (Not Available)

- **Website URLs** - Scraped separately (ADV entries often wrong or social links)
- **Logo URLs** - Scraped separately from firm websites
- Fee schedules by AUM tier (currently scraped separately)
- Growth rate data (calculated from historical)
- Composite scores (calculated locally)

---

## TO DO FOR SYNC

1. [ ] Parse complete XML for all 23,183 firms
2. [ ] Map each field to Supabase columns
3. [ ] Handle type conversions (strings → numbers, Y/N → boolean)
4. [ ] Upsert into `firmdata_current` by CRD
5. [ ] Update state notice flags (50 columns)
6. [ ] Calculate derived fields (total AUM, client totals)