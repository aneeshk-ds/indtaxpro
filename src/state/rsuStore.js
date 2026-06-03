/**
 * rsuStore.js
 * Minimal in-memory holder for the latest RSU/ESPP result so the Risk Report
 * can fold it into the composite score. Resets on app reload (no persistence yet).
 */
let latest = null;
export function setRSUResult(result) { latest = result; }
export function getRSUResult() { return latest; }
export function clearRSUResult() { latest = null; }
