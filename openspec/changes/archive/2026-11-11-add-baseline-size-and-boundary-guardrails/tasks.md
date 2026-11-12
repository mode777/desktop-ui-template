# Tasks

## 1. Bundle size report

- [x] 1.1 Add `scripts/lib/size-report.mjs` with pure helpers: filter emitted assets to JavaScript/CSS, compute raw and gzip byte totals, and format the report table. Verify with `scripts/lib/size-report.test.mjs` (node environment) covering asset filtering, gzip totals and empty-input behavior; `npm run test` passes.
- [x] 1.2 Add budget evaluation to the same library: compare measured totals against raw/gzip budgets with percentage tolerance and byte floor, return a verdict per kind (`fail` for JavaScript, `warn` for CSS). Verify with unit tests for within-budget, tolerance-bounded drift, JavaScript overage and CSS-only overage.
- [x] 1.3 Add `scripts/size-report.mjs` CLI: build by default, `--no-build` to reuse `dist/`, `--summary <file>` to append a Markdown table, write `size-report.json`, and exit non-zero only on a fatal verdict. Verify `node scripts/size-report.mjs` on the current tree prints totals matching the recorded baseline and exits 0.
- [x] 1.4 Add `budgets.json` at the repository root recording the baseline (JS 417,839 raw / 115,252 gzip; CSS 44,445 raw / 8,147 gzip), tolerance and the CSS-advisory policy. Verify `npm run size -- --no-build` passes and reports remaining headroom.
- [x] 1.5 Add the `size` npm script and ignore `size-report.json` in `.gitignore`. Verify `npm run size -- --no-build` runs from a clean working tree and leaves no tracked changes.
- [x] 1.6 Document measurement in `README.md`: what is measured, where the baseline lives, how to read headroom, and the manual procedure for updating `budgets.json` with justification. Verify the documented commands run as written.
- [x] 1.7 Replace the hand-copied numbers in `ROADMAP.md` §3 with a pointer to the generated report while keeping the recorded baseline visible. Verify the referenced path and command exist.

## 2. Dependency boundary check

- [x] 2.1 Add `boundaries.json` at the repository root: layers with globs for the current tree (`app`, `layout`, `views`, `commands`, `store`, `data`, `components`, `hooks`, `test`, root files) plus the future kit layers, each with `mayImport`, `allowedExternals`, and a strict default policy for unclassified paths and unresolved relative imports. Verify the rules match the observed current edges (including `store → layout` and `views → layout`).
- [x] 2.2 Add `scripts/lib/import-graph.mjs` with import extraction via `vite.parseAst`, character-offset-to-line mapping, and relative resolution (extension and directory-index candidates, CSS/JSON treated as assets). Verify with node-environment unit tests: mock-document strings containing `import … from '…'` are not reported, `import type`, re-exports and dynamic `import()` are reported, and unresolved specifiers are returned with file and line.
- [x] 2.3 Add layer classification and edge evaluation to the library: longest-glob matching, `test` files exempt, unknown paths failing the default rule, external package classification. Verify with unit tests including a synthetic kit-core file importing React and an unclassified top-level directory.
- [x] 2.4 Add `scripts/check-boundaries.mjs` CLI printing examined file/import counts and each violation as `file:line → target (rule)`, exiting non-zero on any violation. Verify against a temporary fixture with one forbidden and one unresolved import: both are reported and the exit code is 1.
- [x] 2.5 Add `check:boundaries` to `package.json` and include it in `npm run check`; verify the check reports zero violations across the current 43 source files.
- [x] 2.6 Document the layer model and the procedure for adding or tightening a rule in `README.md`. Verify a follow-up rule change needs only a `boundaries.json` edit by walking through the steps.

## 3. Continuous integration

- [x] 3.1 Add a size step to `.github/workflows/ci.yml` after `npm run check`, using `--no-build` and passing `$GITHUB_STEP_SUMMARY`, plus artifact upload of `size-report.json`. Verify the workflow parses (`npx --yes action-validator` or a YAML lint) and that the same commands succeed locally with `GITHUB_STEP_SUMMARY` set to a temp file.
- [x] 3.2 Confirm the boundary check needs no separate CI wiring because `npm run check` now includes it, and note the resulting CI step order in `README.md`. Verify a clean checkout runs `npm ci && npm run check && npm run size -- --no-build` successfully.

## 4. Integration verification

- [x] 4.1 Run `npm run check` and `npm run size` on the finished change; confirm the reported sizes stay within the recorded budget and `git status --short src` shows no application changes.
- [x] 4.2 Create a throwaway branch with one forbidden import (e.g. a view importing `../../layout/Workbench`) and one growth (a large inline module), confirm both checks fail with actionable output, then discard the branch. Confirm `main` still passes.
- [x] 4.3 Start `npm run dev` and confirm the workbench renders unchanged at 1440×900 and narrow width with no new console errors.

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
- Verify the archived change produces the two capabilities under `openspec/specs/`.
