# Tasks

## 1. Application workspace scaffold

- [x] 1.1 Create `apps/custom-shell` with `package.json` (`@workbench-kit/custom-shell-app`, `private: true`, Codicon `predev`/`prebuild`, `dev`/`build`/`preview`), `index.html` (`data-theme="dark"`, Codicon stylesheet link), `tsconfig.json`, `vite.config.ts`, `src/main.tsx` and `src/elements.ts`; verify `npm ls -w @workbench-kit/custom-shell-app --depth=0` resolves the kit packages and the app has no nested lockfile.
- [x] 1.2 Extract the module-inventory Vite plugin from `apps/minimal/vite.config.ts` into `scripts/vite-module-inventory.mjs` and use it in both example apps; verify both builds emit `.vite/modules.json` and `npm run check:minimal` still passes against the unchanged minimal output.
- [x] 1.3 Add `dev:custom-shell` and `build:custom-shell` root scripts, add `apps/custom-shell/tsconfig.json` to the root TypeScript references, and regenerate `package-lock.json`; verify `npx tsc -b` resolves the new project and `npm run build:custom-shell` emits `apps/custom-shell/dist/index.html` with `codicons/codicon.css` without touching the template or minimal output.

## 2. Composition, state and region behavior

- [x] 2.1 Implement `apps/custom-shell/src/state.ts` with the local reducer and tab transitions delegated to `activateTabIn`, `closeTabIn` and `reorderTabIn` from `@workbench-kit/core`; add `state.test.ts` covering activation, closing the active tab, closing a background tab, reorder, region toggles and panel maximize/restore, then verify `npm run test -- apps/custom-shell/src/state.test.ts` passes.
- [x] 2.2 Implement the title bar, activity bar, primary sidebar and status bar regions as props-driven components, and compose them through `WorkbenchShell` slots in `App.tsx`; add an app test proving all regions render, activity selection switches the sidebar and re-activating the active item hides it, and the status bar reflects the active tab and region state.
- [x] 2.3 Implement the editor area with `TabStrip`, a document placeholder for the active tab and several initial tabs; add tests for activation, closing the active tab and reorder, and verify the controlled strip updates from local state without a preset store.
- [x] 2.4 Implement the bottom panel with `vscode-tabs`, `vscode-tab-header` and `vscode-tab-panel`, the secondary sidebar, and panel maximize/restore; add tests that dispatch `vsc-tabs-select` to switch the panel content, toggle the secondary sidebar, and verify the shell hides the editor while the panel is maximized.
- [x] 2.5 Wrap the primary sidebar, secondary sidebar and bottom panel in `ResizablePane` with consumer-owned sizes, bounds and reset values; add tests for keyboard resize and double-click reset on the primary sash and verify the status bar reports the updated width.
- [x] 2.6 Add `custom-shell.css` using the shared structural class contract with `custom-shell-` prefixed example selectors, and verify the app imports only `tokens.css`, `global.css` and `workbench.css` from the styles package plus its own stylesheet; run `npm run build:custom-shell` and confirm the emitted markup/JS registers only `vscode-icon`, `vscode-tab-header`, `vscode-tabs` and `vscode-tab-panel` and contains no aggregate `elements/all` registration.

## 3. Boundaries and bundle composition

- [x] 3.1 Add `apps/custom-shell/src` to `boundaries.json` `roots` and add an `example-custom-shell` layer allowing kit core, kit React, kit elements, kit styles, its own layer, React, React DOM and vscode-elements; update `scripts/lib/boundaries.test.mjs` with layer resolution and a negative custom-shell-to-preset import, then verify `npm run test -- scripts/lib/boundaries.test.mjs` and `npm run check:boundaries` pass.
- [x] 3.2 Rename `scripts/check-minimal-bundle.mjs` to `scripts/check-example-bundle.mjs`, add `--label` and `--build-command` options, and add a target label to `inspectBundle` messages; update `scripts/lib/bundle-composition.test.mjs` for the label and verify `npm run test -- scripts/lib/bundle-composition.test.mjs` passes.
- [x] 3.3 Point `check:minimal` at the generalized checker with its existing label and add `check:custom-shell` with `apps/custom-shell/dist`; add `build:custom-shell` and `check:custom-shell` to the standard `check` sequence after the minimal check, then verify `npm run check:minimal` and `npm run check:custom-shell` both pass.
- [x] 3.4 Verify the custom-shell check is not vacuous: temporarily add a preset import or a template demo marker to the example, confirm the check exits non-zero and names the offending module or marker, then revert the change and confirm both example checks pass again.
- [x] 3.5 Search the current tree for `check-minimal-bundle` and stale "minimal-only" wording in comments and scripts, update them to the generalized checker, and verify `npm run format:check` and `npm run test -- scripts` pass.

## 4. Documentation, roadmap and demo data

- [x] 4.1 Write `apps/custom-shell/README.md` with the regions, composed primitives, local state, element registrations, commands, what it omits from the preset and how to grow it into the preset; verify every command and relative link in it resolves and Prettier passes.
- [x] 4.2 Update the root `README.md` application tree, adoption-level section, commands, dependency-boundary table and verification description with the custom-shell example; update `apps/minimal/README.md` to point at custom-shell as the next composition step; verify Prettier and the documented commands.
- [x] 4.3 Update `AGENTS.md`, `ROADMAP.md` and `docs/architecture.md` so the custom-shell example is in the layout and commands, Phase 5 is marked complete, the enforcement matrix includes `check:custom-shell`, and Phase 6 publishing is the remaining next step; verify every command named in `AGENTS.md` exists in the root or app manifests and Prettier passes.
- [x] 4.4 Add `apps/custom-shell` to the template's mock workspace tree in `apps/template/src/demo/data/workspace.ts`, including its manifest, Vite config, README and source/region files; verify every displayed path exists on disk, `npm run test -- apps/template` passes and `npm run typecheck` succeeds.

## 5. Integration verification

- [x] 5.1 Run a clean install and the full gate: remove `node_modules`, run `npm ci`, then `npm run check`; verify lint, formatting, typecheck, boundaries, distribution, tests, the template and minimal builds, both composition checks, the custom-shell build and `pack:check` all pass.
- [x] 5.2 Run `npm run size` and `npm run size:minimal`; verify the minimal budget is unchanged, the template gzip baseline is unchanged, the template raw baseline matches the measured intentional growth, and neither report includes custom-shell output.
- [x] 5.3 Start `npm run dev:custom-shell` and preview its production build, then smoke-test the template and minimal examples; verify the custom shell renders at 1440×900 and a narrow width with no body scroll, every region toggle and sash works, and Codicon assets load from each app's output.
- [x] 5.4 Review the final diff for unintended kit, preset, facade, template or minimal changes; verify no third budget or `distribution.json` change was introduced, both other applications still build, and `git status` contains only the intended application, script, boundary, test, documentation and mock-data changes.

## Workflow follow-up

- Archive this change after review and the full verification gate pass.
- Confirm the `custom-shell-example` capability is created with its purpose and the `dependency-boundaries` delta merges onto the existing declaration requirement.
