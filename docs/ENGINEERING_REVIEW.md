# IndTaxPro: Engineering and Tax-Logic Review

Date: 3 June 2026
Reviewer scope: code correctness, calculation accuracy, forex handling, secret hygiene, and a UX benchmark.

> Disclaimer: This is an engineering review, not legal or tax sign-off. The author is not a chartered accountant. Tax rules below are checked against current published sources and cited, but any real filing decision should be confirmed with a qualified professional.

---

## 1. Method

The tax and forex logic lives in `src/logic/` as pure JavaScript functions with no UI or I/O, which makes it directly testable. A Node test harness (`tests/`) imports each module through an esbuild bundle and asserts behaviour against hand-computed values and against current Indian rules for FY 2025-26 / AY 2026-27.

Two suites were run:

- A baseline suite of 26 assertions that pins the existing engine behaviour and demonstrates each defect.
- A post-fix suite of 24 assertions that verifies the corrected behaviour.

All assertions in the post-fix suite pass, and the full module set compiles.

---

## 2. What is correct

The arithmetic engine is sound. Verified directly:

- New-regime slab tax (FY 2025-26): 12,00,000 to 50,00,000 computed to the rupee.
- Old-regime slab tax (below 60): 10,00,000 verified at 1,12,500.
- Surcharge tiers and 4% health-and-education cess.
- SBI TT forex conversion and the preceding-month rule (income in March uses the February month-end rate).
- Exchange-rate deviation validation (flags any rate more than 1% off the SBI TT rate).
- Schedule FA validation (calendar-year vs fiscal-year, peak balance, signing authority) and the composite risk scorer.

## 3. Security and secret hygiene

A full scan found no hardcoded API keys, tokens, passwords, or credential files, no `.env`, and no outbound network calls anywhere in the source. The app is genuinely on-device: there is no backend, no account system, and nothing to leak. The `.expo/` cache (which can hold device identifiers) is excluded by `.gitignore`. Nothing sensitive is committed.

---

## 4. Findings

Eight issues were found. Five are tax-rule accuracy issues and three are code-level edge cases. Per the project decision, the high-impact items were fixed in code and the rest are documented here.

| ID | Area | Severity | Finding | Status |
|----|------|----------|---------|--------|
| F1 | Foreign-share capital gains | High | US shares were modelled as Indian listed equity (12-month holding, 1.25L exemption, 20% STCG) | Fixed |
| F2 | Surcharge | High | New-regime surcharge hard-coded up to 37% | Fixed |
| F3 | DTAA dividend | Medium | Treaty dividend cap set to 15% for all users | Fixed |
| F4 | Holding period | Medium | Whole-month counting misclassifies near-boundary holds | Fixed |
| F5 | Forex date parsing | Low | `new Date("YYYY-MM-DD")` can pick the wrong month in some timezones | Fixed |
| F6 | 87A rebate | Low | No marginal relief near the 12L cap (tax cliff) | Documented |
| F7 | Form 67 timing | Low | "Must be before the ITR" is stricter than current rule | Documented |
| F8 | Black Money Act penalty | Low | Flat 10L applied to any omission, including small accounts | Documented |

### F1. Foreign shares are not Indian listed equity (Fixed)

This is the most important finding because RSU and ESPP sales are the anchor feature. The original code applied Section 112A / 111A treatment to US shares. US shares are not listed on a recognised Indian exchange, so they are taxed under Section 112 instead.

Corrected treatment, now implemented:

- Long-term holding period is more than 24 months, not 12.
- The 1.25 lakh LTCG exemption does not apply to foreign shares.
- Short-term gains are added to total income and taxed at the slab rate, not a flat 20%.

The long-term rate of 12.5% (flat, no indexation) was already correct. Verified against [ClearTax on LTCG of foreign shares](https://cleartax.in/s/ltcg-sale-stocks) and [Winvesta on US-stock capital gains for Indians](https://www.winvesta.in/blog/investors/capital-gains-tax-on-us-stocks-short-term-vs-long-term-for-indians).

### F2. New-regime surcharge cap (Fixed)

The single surcharge table topped out at 37% above 5 crore. Under the new regime the highest surcharge band was removed and surcharge is capped at 25%. The old table over-stated tax for new-regime filers above 2 crore. A separate `SURCHARGE_NEW_REGIME` table (25% cap) is now used, and `calcFinalTax` takes a `regime` argument. The regime comparator passes `'old'` and `'new'` respectively. Marginal relief on surcharge is still not modelled and is noted as a limitation.

### F3. DTAA dividend rate for individuals (Fixed)

The treaty cap was set to 15%. Under India-US DTAA Article 10(2), 15% applies only where the beneficial owner is a company holding at least 10% of the voting stock; all individuals fall under 25% regardless of shareholding. Since the app's users are individuals, the cap is now 25%, with the 15% corporate rate retained as a separate constant. Verified against the [India-US treaty Article 10 explanation](https://www.casahuja.com/2025/11/indiaus-tax-treaty-article-10-on.html) and [Winvesta DTAA guide](https://www.winvesta.in/blog/investors/dtaa-india-us-how-to-claim-tax-treaty-benefits-on-us-stocks).

### F4. Holding-period day accuracy (Fixed)

`monthsBetween` counted calendar-month differences and ignored the day of month, so a 364-day hold was counted as 12 months. Classification now uses a date-accurate test (`isHeldLongerThanMonths`) that respects the day of month and the "more than" rule, so a sale exactly 24 months after vesting is short-term and one day later is long-term.

### F5. Forex date parsing (Fixed)

`new Date("YYYY-MM-DD")` parses as UTC, which can roll back a day on a machine in a UTC-negative timezone and pick the wrong preceding month for the SBI TT rate. Both `sbiRates.js` and `rsuCalculator.js` now parse the date by explicit components as a local date.

### F6 to F8 (Documented, not changed)

- F6: The 87A rebate zeroes tax up to 12,00,000 taxable income, then returns full tax above it, producing a cliff. The real ITR applies marginal relief so the amount payable just above 12L is small. Modelling marginal relief is a known next step.
- F7: Since the 2022 amendment to Rule 128 ([CBDT Notification 100/2022](https://www.taxmann.com/post/blog/cbdt-extends-time-limit-for-furnishing-of-form-67-ftc/)), Form 67 can be filed up to the end of the assessment year, not strictly before the ITR. The app's "filed after ITR" warning is conservative rather than wrong, and is left as a prompt to file early.
- F8: Since 1 October 2024, foreign movable assets under 20 lakh aggregate are exempt from the Black Money Act penalty ([Finance Act 2024 amendment](https://taxguru.in/income-tax/cbdt-amends-black-money-act-rs-20-lakh-asset-exemption.html)). The app still surfaces the 10 lakh flat figure for any omission, which over-states exposure for small accounts.

---

## 5. UX benchmark

The interface direction is consistent with the better Indian consumer-finance apps. Patterns worth naming:

- Dark, card-based layout with a single accent colour, close to CRED's visual language. This suits a trust-sensitive tax context.
- Progressive disclosure: the DTAA screen reveals the CA-signature question only when the credit crosses 5 lakh, similar to how Groww hides advanced fields until they are relevant.
- A risk score with a penalty figure in rupees and a ranked action list mirrors the "credit report" framing CRED uses to turn a dense topic into one headline number and a short to-do list.

Two improvements would close the gap with those apps: persistence so a half-finished assessment survives an app restart, and inline number formatting in the Indian lakh-crore grouping on every input, not only on result screens.

---

## 6. Running the tests

The suites are in `tests/`. From the project root:

```bash
npm test
```

The repo ships `tests/logic.test.mjs`, which asserts the corrected behaviour. During review a separate baseline suite was used to pin the original behaviour and demonstrate each defect before fixing.
