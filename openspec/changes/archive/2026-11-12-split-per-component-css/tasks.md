# Tasks

## 1. Split the styles package

- [x] 1.1 Create `packages/styles-vscode/src/{shell,title-bar,menu-bar,icon-button,activity-bar,resizable-pane,sidebar,tab-strip,editor-area,panel,status-bar,quick-open,context-menu,notifications}.css` and move the corresponding rules out of `workbench.css` verbatim, including each component's responsive rules. Verify with `rg` that every moved selector appears in exactly one component file and `npx prettier --check packages/styles-vscode/src` passes.
- [x] 1.2 Replace `packages/styles-vscode/src/workbench.css` with the ordered `@import` manifest from `design.md` and keep `index.css` as tokens → global → workbench. Verify `npm run dev` renders the template's title bar, activity bar, sidebars, editor, panel, status bar, quick open and notifications unchanged at 1440×900 and a narrow width, with no body scroll.
- [x] 1.3 Add one `./<component>.css` export per component to `packages/styles-vscode/package.json` while keeping `tokens.css`, `global.css`, `workbench.css`, `index.css` and the root aggregate. Verify a Node script resolves every `.css` export key to an existing file, for example by reading the manifest with `node -e` and checking each target.

## 2. Public style surface

- [x] 2.1 Move the style-entry derivation into `scripts/lib/facade.mjs` so the facade build reads the `@workbench-kit/styles-vscode` export map, copies every declared `.css` target to `packages/workbench/dist/styles/<basename>` and fails on a missing file; add tests to `scripts/lib/facade.test.mjs` for a complete list, a duplicate target and a missing target. Verify `rm -rf packages/workbench/dist && npm run build:facade` copies every entry and `rg "@workbench-kit/" packages/workbench/dist` reports no matches.
- [x] 2.2 Add the matching `./styles/<component>.css` export keys to `packages/workbench/package.json` with `./dist/styles/<component>.css` targets, keeping `./styles`, `./styles/index.css`, `./styles/tokens.css`, `./styles/global.css` and `./styles/workbench.css`. Verify `npm run check:distribution` and a Node manifest check resolve every style key to an existing built file.
- [x] 2.3 Update `docs/api.md` so the style table lists every entry with its scope and token/base prerequisites, update the consumer import table in `packages/workbench/README.md`, and update the styles layer/generated layout in `docs/architecture.md`. Verify `npm run check:docs` passes and every new public specifier is named.
- [x] 2.4 Confirm `npm run pack:check` resolves every declared CSS subpath from the packed tarball, extending its CSS enumeration only if it does not derive the list from the facade manifest. Verify `npm run pack:check` passes and prints the style entries.

## 3. Style check

- [x] 3.1 Add `scripts/lib/styles.mjs` with pure helpers for enumerating component stylesheets, parsing `@import` lists, comparing the styles and facade manifests, detecting demo selectors and reading app style imports; add `scripts/lib/styles.test.mjs` covering a complete surface, a missing export, a duplicate aggregate import, a wrong order, a demo selector and an aggregate import in an app. Verify `npm run test -- scripts/lib/styles.test.mjs` passes.
- [x] 3.2 Add `scripts/check-styles.mjs` with `--repo-root`, readable violations and exit codes; add `check:styles` to the root `package.json` and insert it into `check` before the build steps. Verify `npm run check:styles` exits zero on the repository and `node scripts/check-styles.mjs --repo-root <temp-fixture>` exits non-zero for the failure modes covered by 3.1.
- [x] 3.3 Document the new check in the `README.md` command list, the `docs/architecture.md` enforcement matrix and the `AGENTS.md` commands/style rules; verify `npm run check:docs`, `npm run format:check` and that every documented script exists.

## 4. Example adoption and CSS budgets

- [x] 4.1 Add `apps/minimal/style-subset.json` with the expected entries (`tokens.css`, `global.css`, `shell.css`, `resizable-pane.css`, `tab-strip.css`, `status-bar.css`) and the forbidden region selectors; switch `apps/minimal/src/main.tsx` to those imports and update `apps/minimal/README.md`. Verify `npm run build:minimal && npm run check:minimal` and inspect the emitted CSS for no activity bar, title bar, sidebar, editor area, panel, quick open, context menu or notification rules.
- [x] 4.2 Add `apps/custom-shell/style-subset.json` and switch `apps/custom-shell/src/main.tsx` to its subset (shell, title bar, icon button, activity bar, resizable pane, sidebar, tab strip, editor area, panel, status bar); update `apps/custom-shell/README.md`. Verify `npm run build:custom-shell && npm run check:custom-shell` and a visual smoke check at 1440×900 and a narrow width.
- [x] 4.3 Extend `scripts/check-example-bundle.mjs` to accept the app's `style-subset.json`, read the emitted CSS assets and fail on forbidden selectors; add tests in `scripts/lib/bundle-composition.test.mjs` for a clean CSS asset, a forbidden selector and a missing style config. Verify `npm run check:minimal` and `npm run check:custom-shell` pass, and that a temporary extra style import makes the check fail.
- [x] 4.4 Run `npm run size` and `npm run size:minimal`, record the measured CSS totals in `budgets.json` and `budgets.minimal.json`, and keep the existing advisory CSS enforcement. Verify both size commands exit zero, the minimal CSS is lower than the recorded aggregate baseline, and `npm run test -- scripts/lib/size-report.test.mjs` still covers the advisory CSS path.
- [x] 4.5 Update the bundle-budget section of `README.md` to record the new CSS baselines and keep the advisory CSS policy explicit; verify `npm run check:docs` and `npm run format:check`.

## 5. Repository documentation and metadata

- [x] 5.1 Update `ROADMAP.md` (styles audit row and the “Later — hardening” item), `CHANGELOG.md` Unreleased, `AGENTS.md` CSS/style guidance and `apps/template/src/demo/data/workspace.ts` to list the new styles package files and public entries. Verify `npm run check:docs`, `npm run check:release`, `npm run typecheck` and `npx prettier --check`.
- [x] 5.2 Update `docs/migration.md` and `docs/eject.md` with the aggregate-versus-component style choice and a composition example that imports only the needed entries; verify `npm run check:docs` and all relative links.
- [x] 5.3 Update the root `README.md` package tree and adoption-level style guidance to name the per-component entries and the aggregate convenience path; verify `npm run check:docs` and `npm run format:check`.

## 6. Integration verification

- [x] 6.1 Run `npm run check` and confirm lint, formatting, typecheck, boundaries, distribution, styles, docs, release, tests, all three builds, both example checks and the packed-tarball check pass.
- [x] 6.2 Run `npm run size` and `npm run size:minimal`; confirm the recorded CSS baselines pass, the advisory policy is reported and the minimal CSS saving is attributable in the output.
- [x] 6.3 Start `npm run dev`, `npm run dev:minimal` and `npm run dev:custom-shell`; inspect each at 1440×900 and a narrow width and confirm component styling is unchanged, no body scroll appears and the examples load only their own styles.
- [x] 6.4 Run `openspec validate split-per-component-css --strict` and confirm the change validates before archive.

## Workflow follow-up

- Archive the change only after the user requests it and the project's review requirements are satisfied.
- Verify the archived specs and the final implementation agree.
