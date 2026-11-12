# Proposal

## Why

The Workbench Kit roadmap justifies every extraction phase with a size claim ("the minimal app must stay under one-third of the preset") and with a layering claim ("`kit/core` must not import React or app data"), but the repository can measure neither today. `npm run build` prints Vite's table and exits, and CI only runs `npm run check`, so the first refactor that accidentally pulls every view into a primitive layer would pass review unnoticed.

The roadmap's own PR sequence puts baseline and guardrails at step 2, before any code moves. Recording the numbers now — while the app is untouched — gives every later PR a reference point and a gate.

## What Changes

- Add `scripts/size-report.mjs`: builds (or reuses `dist/`), sums JavaScript and CSS from `dist/assets`, reports raw and gzip bytes, writes a machine-readable report, and compares the result against a committed budget file.
- Add `scripts/check-boundaries.mjs`: parses the import graph of `src/` and enforces declarative layer rules, failing with file and line references on violations.
- Add a committed budget file recording the current full-preset baseline plus an explicit tolerance.
- Add `npm run size` and `npm run check:boundaries`, and include the boundary check in `npm run check`.
- Run both checks in GitHub Actions, publish the size table to the job summary, and upload the size report as a build artifact.
- Replace the hand-copied bundle numbers in `ROADMAP.md` §3 with a pointer to the generated report, and document the new scripts in `README.md`.
- No application code, UI, dependency or build output changes. The demo must render exactly as it does today.

## Capabilities

### New Capabilities

- `bundle-size-budget`: reproducible measurement of the built bundle, a committed baseline with tolerance, and a CI gate that fails when the shipped JavaScript grows beyond budget.
- `dependency-boundaries`: a declared layer model for the source tree, an import-graph check that enforces it, and CI enforcement with zero tolerated violations.

### Modified Capabilities

<!-- None. The repository has no specs yet, and no product behavior changes. -->

## Impact

- New files: `scripts/size-report.mjs`, `scripts/check-boundaries.mjs`, `budgets.json` (or `scripts/budgets.json`).
- Modified: `package.json` (scripts), `.github/workflows/ci.yml`, `README.md`, `ROADMAP.md`.
- No changes to `src/`, `index.html`, `vite.config.ts`, dependencies or published output.
- Baseline to record: 417,839 B JS raw / 115,252 B gzip; 44,445 B CSS raw / 8,147 B gzip.
