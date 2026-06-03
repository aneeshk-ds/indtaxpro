import { setRSUResult, getRSUResult, clearRSUResult } from '../src/state/rsuStore.js';
import { calculateRSUTax } from '../src/logic/rsuCalculator.js';
import { computeRiskScore } from '../src/logic/riskScorer.js';

let pass=0, fail=0;
const eq=(n,g,w)=>{const ok=JSON.stringify(g)===JSON.stringify(w); ok?pass++:fail++; console.log(`${ok?'PASS':'FAIL'}  ${n}${ok?'':` got ${JSON.stringify(g)} want ${JSON.stringify(w)}`}`);};

clearRSUResult();
eq('store empty initially', getRSUResult(), null);

// RSU lot with a grant-vs-vest high issue (grant>24m, vest<24m) to ensure score contribution
const rsu = calculateRSUTax([{
  id:'L1', ticker:'NVDA', sharesVested:100, grantDate:'2023-01-01', vestDate:'2024-06-01',
  fmvOnVestUSD:100, sbiRateOnVest:83, sharesSold:100, saleDate:'2025-09-01',
  salePriceUSD:150, sbiRateOnSale:84, tdsDeductedINR:300000,
}]);
setRSUResult(rsu);
eq('store returns the result', getRSUResult() !== null, true);

const withRsu = computeRiskScore({ scheduleFA:null, dtaa:null, rsu: getRSUResult() });
const withoutRsu = computeRiskScore({ scheduleFA:null, dtaa:null, rsu: null });
eq('RSU issues now feed the composite score', withRsu.score > withoutRsu.score, true);
eq('RSU actions appear in the report', withRsu.actions.some(a => a.source === 'RSU / ESPP'), true);
console.log(`\nRSU-wire: ${pass} passed, ${fail} failed`);
