// Verifies the corrected behaviour after the high-impact fixes.
import { calcFinalTax, NEW_REGIME_SLABS, OLD_REGIME_SLABS, DTAA_USA }
  from '../src/logic/taxRates.js';
import { calculateRSUTax } from '../src/logic/rsuCalculator.js';
import { checkDTAA } from '../src/logic/dtaaChecker.js';
import { getSBIRateForDate } from '../src/logic/sbiRates.js';

let pass = 0, fail = 0; const fails = [];
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? (pass++, console.log(`  PASS  ${name}`))
     : (fail++, fails.push(name), console.log(`  FAIL  ${name}\n        got : ${JSON.stringify(got)}\n        want: ${JSON.stringify(want)}`));
}
function hdr(s){ console.log(`\n=== ${s} ===`); }

const lot = (over) => ({
  id: 'L', ticker: 'NVDA', sharesVested: 100, vestDate: '2024-01-15',
  fmvOnVestUSD: 100, sbiRateOnVest: 83, sharesSold: 100,
  salePriceUSD: 150, sbiRateOnSale: 84, tdsDeductedINR: 300000, ...over,
});

hdr('FIX 1+4: foreign-share LTCG = 24-month, day-accurate');
eq('sale 2026-02-01 (>24m) -> LTCG', calculateRSUTax([lot({ saleDate: '2026-02-01' })]).lotBreakdowns[0].sale.cgType, 'LTCG');
eq('sale 2026-01-15 (exactly 24m) -> STCG (not "more than")', calculateRSUTax([lot({ saleDate: '2026-01-15' })]).lotBreakdowns[0].sale.cgType, 'STCG');
eq('sale 2026-01-16 (24m + 1d) -> LTCG', calculateRSUTax([lot({ saleDate: '2026-01-16' })]).lotBreakdowns[0].sale.cgType, 'LTCG');
eq('sale 2025-01-14 (~12m) -> STCG (was wrongly LTCG before)', calculateRSUTax([lot({ saleDate: '2025-01-14' })]).lotBreakdowns[0].sale.cgType, 'STCG');

hdr('FIX 1: no 1.25L 112A exemption on foreign LTCG');
const lt = calculateRSUTax([lot({ saleDate: '2026-02-01' })]); // gain = (150*84 - 100*83)*100 = 430000
eq('LTCG gain = 4,30,000', lt.summary.totalLTCG, 430000);
eq('taxable LTCG = full gain (no 1.25L exemption)', lt.summary.taxableLTCG, 430000);
eq('exemption used = 0', lt.summary.ltcgExemptionUsed, 0);
eq('LTCG tax = 12.5% of gain = 53,750', lt.summary.ltcgTax, 53750);
eq('total CG tax = LTCG tax only', lt.summary.totalCGTax, 53750);

hdr('FIX 1: STCG taxed at slab (no flat 20%)');
const st = calculateRSUTax([lot({ saleDate: '2025-01-14' })]);
eq('STCG gain = 4,30,000', st.summary.totalSTCG, 430000);
eq('STCG tax is null (slab-rated, not a fixed number)', st.summary.stcgTax, null);
eq('stcgTaxedAtSlab flag present', st.summary.stcgTaxedAtSlab, true);
eq('total CG tax excludes a wrong flat STCG figure', st.summary.totalCGTax, 0);
eq('STCG_AT_SLAB issue raised', st.issues.some(i => i.code === 'STCG_AT_SLAB'), true);

hdr('FIX 2: surcharge cap (new regime 25%, old regime 37%)');
const new6cr = calcFinalTax(60000000, NEW_REGIME_SLABS, 'new');
const old6cr = calcFinalTax(60000000, OLD_REGIME_SLABS, 'old');
eq('new regime @6Cr surcharge = 25% of base', Math.round(new6cr.surcharge / new6cr.base * 100), 25);
eq('old regime @6Cr surcharge = 37% of base', Math.round(old6cr.surcharge / old6cr.base * 100), 37);
eq('new regime @60L surcharge = 10% of base', Math.round(calcFinalTax(6000000, NEW_REGIME_SLABS, 'new').surcharge / calcFinalTax(6000000, NEW_REGIME_SLABS, 'new').base * 100), 10);

hdr('FIX 3: DTAA individual dividend rate = 25%');
eq('DTAA_USA.dividendDTAA = 0.25', DTAA_USA.dividendDTAA, 0.25);
eq('corporate >=10% rate still 15% recorded', DTAA_USA.dividendCorporate10pc, 0.15);
const dtaa25 = checkDTAA({ form67Filed:true, form67BeforeITR:true, usDividendIncome_INR:85000, usWithheldTax_INR:21250, usDividendIncome_USD:1000, usWithheldTax_USD:250, caSignatureObtained:false, exchangeRateSource:'SBI_TT' });
eq('25% withholding is within treaty limit (no exceeds-max issue)', dtaa25.issues.some(i=>i.code==='WITHHOLDING_EXCEEDS_MAX'), false);
eq('clean DTAA at 25% -> low risk', dtaa25.riskLevel, 'low');
const dtaa30 = checkDTAA({ form67Filed:true, form67BeforeITR:true, usDividendIncome_INR:85000, usWithheldTax_INR:25500, usDividendIncome_USD:1000, usWithheldTax_USD:300, caSignatureObtained:false, exchangeRateSource:'SBI_TT' });
eq('30% withholding exceeds 25% treaty cap -> flagged', dtaa30.issues.some(i=>i.code==='WITHHOLDING_EXCEEDS_MAX'), true);

hdr('FIX (forex): date parsed by components at month boundary');
eq("'2025-03-01' uses preceding month 2025-02", getSBIRateForDate('2025-03-01').rateMonth, '2025-02');
eq("'2025-03-01' rate = 87.12", getSBIRateForDate('2025-03-01').rate, 87.12);

console.log(`\n========================================`);
console.log(`AFTER-FIX RESULT: ${pass} passed, ${fail} failed`);
if (fails.length) console.log(`Failing: ${fails.join(' | ')}`);
