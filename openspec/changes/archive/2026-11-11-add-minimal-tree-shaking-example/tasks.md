# Tasks

## 1. Scaffold the minimal example build target

- [x] 1.1 Create `examples/minimal/{index.html,vite.config.ts,src/main.tsx,src/App.tsx,src/minimal.css}` and `tsconfig.examples.json`; reference the new project from `tsconfig.json` and add `examples/minimal/vite.config.ts` to `tsconfig.node.json`; verify `npm run typecheck` completes and `npx prettier --check examples/minimal tsconfig.examples.json` passes.
- [x] 1.2 Configure `examples/minimal/vite.config.ts` with the example as `root`, repo `public` as `publicDir`, repo-root `dist-minimal` as `outDir` with `emptyOutDir` and `manifest: true`; add `dev:minimal`, `prebuild:minimal` and `build:minimal` scripts; add `dist-minimal` and `size-report.minimal.json` to `.gitignore` and `dist-minimal` to `.prettierignore`; verify `npm run build:minimal` emits `dist-minimal/index.html`, JS/CSS assets, `.vite/manifest.json` and `codicons/codicon.css`, and that `dist/` is unchanged.

## 2. Build the composition-level application

- [x] 2.1 Add `examples/minimal/src/elements.ts` importing only `vscode-tab-header` and `vscode-icon`, and import it plus `tokens.css`, `global.css`, `workbench.css` and `minimal.css` from `main.tsx`; verify `rg "dist/vscode-" examples/minimal/src` lists only those two tags and `npm run dev:minimal` renders a themed empty shell.
- [x] 2.2 Implement `App.tsx` with local state for a single non-closable tab, the active tab id and the sidebar width; compose `WorkbenchShell`, `ResizablePane side="left"` and `TabStrip`, plus a plain `statusbar` footer; verify `npm run dev:minimal` shows one tab, resizes the sidebar by pointer and keyboard, and has no body scroll at 1440×900 or a narrow width.
- [x] 2.3 Add `examples/minimal/src/App.test.tsx` covering the initial tab and options panel, option state changes, tab activation and a sidebar resize callback; verify `npm run test -- examples/minimal` passes.
- [x] 2.4 Write `examples/minimal/README.md` describing what renders, the exact imports that prove the composition level, the deliberately absent preset/app/demo imports and elements, and how to grow the example into the preset; verify every command in it runs as written.

## 3. Make bundle measurement target-aware

- [x] 3.1 Extend `scripts/size-report.mjs` with `--target`, `--dist` and `--build` while keeping the current defaults (`full-preset`, `dist`, `build`) byte-identical; include the target in the report and table/summary heading; verify an existing-style `npm run size` still passes and `size-report.json` gains the target field.
- [x] 3.2 Add focused tests in `scripts/lib/size-report.test.mjs` for target-aware formatting and report metadata while keeping the budget evaluation assertions unchanged; verify `npm run test -- scripts/lib/size-report.test.mjs` passes.
- [x] 3.3 Run the first minimal production build and record its measured totals, tolerance and baseline label in `budgets.minimal.json`; add the `size:minimal` script and verify `npm run size:minimal` builds, measures `dist-minimal`, writes `size-report.minimal.json` and exits zero.
- [x] 3.4 Add the minimal target to the bundle-budget section of `README.md` with its command, output, budget file, report and measured gzip ratio against the full preset; if the ratio is above one-third, state the dominant cost and why the recorded baseline is kept; verify the documented commands run as written.

## 4. Verify bundle composition

- [x] 4.1 Add `scripts/lib/bundle-composition.mjs` with a pure inspector over the manifest and emitted JavaScript, checking forbidden `src/demo/`, `src/app/` and `src/kit/preset-vscode/` modules plus the demo/preset markers from design.md §8 and a missing-manifest failure; add tests in `scripts/lib/bundle-composition.test.mjs` for clean, module-leak, marker-leak and missing-manifest cases; verify `npm run test -- scripts/lib/bundle-composition.test.mjs` passes.
- [x] 4.2 Add `scripts/check-minimal-bundle.mjs` and the `check:minimal` script; verify it passes against the real `dist-minimal`, and fails with a named module or marker when a forbidden import is temporarily added to `examples/minimal/src/App.tsx` (then revert it).
- [x] 4.3 Confirm the clean run reports the manifest entry and the number of modules/assets examined, so a vacuous pass is visible; verify the output includes those counts.

## 5. Extend the boundary model to the example

- [x] 5.1 Add `roots: ["src", "examples/minimal/src"]` and the `example-minimal` layer to `boundaries.json`, and update `scripts/check-boundaries.mjs` to collect every declared root while keeping `root` as a fallback; verify `npm run check:boundaries` reports zero violations and includes the example's files in the file count.
- [x] 5.2 Add fixtures in `scripts/lib/boundaries.test.mjs` for a cross-root import from the example to `kit-react` (allowed) and to `kit-preset`/`app`/`demo` (rejected), plus a file outside `examples/minimal/src` that is not scanned; verify `npm run test -- scripts/lib/boundaries.test.mjs` passes.
- [x] 5.3 Update the dependency-boundaries section of `README.md` with the additional root, the `example-minimal` rule and why `vite.config.ts` is outside the checked source root; verify the documented rule matches `boundaries.json`.

## 6. Wire verification and continuous integration

- [x] 6.1 Add `build:minimal` and `check:minimal` to `npm run check` after the template build; verify `npm run check` builds both apps, runs both checks and fails when `check:minimal` fails.
- [x] 6.2 Add the minimal size step (`npm run size:minimal -- --no-build --summary "$GITHUB_STEP_SUMMARY"`) and `size-report.minimal.json` to `.github/workflows/ci.yml` next to the existing size step, keeping both reports as artifacts; verify the workflow YAML formats and the sequence matches a local `npm run check` followed by both `--no-build` size commands.
- [x] 6.3 Add the "Minimal example" adoption-level section to the root `README.md` linking `examples/minimal/README.md`, and mark Phase 4 done in `ROADMAP.md` with the measured result; verify every linked path exists and every documented command runs as written.

## 7. Integration verification

- [x] 7.1 Run `npm run check` and confirm lint, formatting, typecheck, both boundary checks, tests, the template build, the minimal build and the composition check pass.
- [x] 7.2 Run `npm run size -- --no-build` and `npm run size:minimal -- --no-build`; confirm both are within their own budgets, the full preset baseline is unchanged and the minimal report states the gzip ratio.
- [x] 7.3 In `npm run dev:minimal` at 1440×900 and a narrow width, activate the tab, change each option, resize and reset the sidebar, tab through the separator, and confirm the status bar renders, there is no body scroll and the console is clean.
- [x] 7.4 Confirm the minimal bundle contains no demo/preset modules or markers from the check output, and that the example's CSS is the documented shared aggregate stylesheet rather than an unexplained omission.

## Workflow follow-up

- Archive the change after review and merge.
- Verify the archived specs and the updated `ROADMAP.md` Phase 4 status line after archiving.
