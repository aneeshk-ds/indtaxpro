# Tests

Pure-logic verification for the tax, forex, and DTAA modules. The suite imports the
modules in `src/logic/` and asserts behaviour against current Indian rules
(FY 2025-26 / AY 2026-27) and hand-computed values.

## Run

```bash
npm test
```

or directly:

```bash
npx esbuild tests/logic.test.mjs --bundle --platform=node --outfile=tests/.build.cjs && node tests/.build.cjs
```

The modules use ES module syntax, so the suite is bundled with esbuild before running.
All assertions should pass. See `docs/ENGINEERING_REVIEW.md` for what each group checks
and for the findings these tests lock in.
