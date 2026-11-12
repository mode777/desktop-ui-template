# Tasks

## 1. Navigation primitives

- [x] 1.1 Add `packages/react/src/ActivityBar.tsx` with controlled `items`, `activeId`, `bottomItems`, `onActivate` and `onAction` props; render the existing activity-bar groups, active indicator, badges and `IconButton` variants. Verify the new test covers active/inactive rendering, consumer-accepted and ignored activation, external active changes, badges and bottom actions.
- [x] 1.2 Add `packages/react/src/Sidebar.tsx` with optional header title/icon, header actions, close callback, accessible labels, body slot and appended modifier class. Verify the new test covers header rendering, action and close dispatch, omitted close control, empty body and the secondary modifier class.
- [x] 1.3 Export `ActivityBar`, `Sidebar` and their prop/data types from `packages/react/src/index.ts`, then run `npm run build -w @workbench-kit/react` and confirm the declarations include the new exports.
- [x] 1.4 Add ActivityBar and Sidebar sections plus react type-index entries to `docs/api.md`; verify both value exports and their type names are present and the existing export-coverage check will see them once the remaining primitive docs land.

## 2. Panel and status primitives

- [x] 2.1 Add `packages/react/src/Panel.tsx` with controlled `tabs`, `activeId`, `onSelect`, optional maximize/close callbacks and per-tab content/badges; preserve the `panel`, `panel-tabs` and `panel-pane` structure and dispatch `vsc-tabs-select` by index. Verify the new test covers selection, ignored selection, external selection, badges, content switching, maximize/close callbacks and omitted controls.
- [x] 2.2 Add `packages/react/src/StatusBar.tsx` with left/right slots, accessible label and appended class. Verify the new test covers both sides, one omitted side, empty slots and the label.
- [x] 2.3 Export `Panel`, `StatusBar` and their prop/data types from `packages/react/src/index.ts`; run `npm run build -w @workbench-kit/react` and confirm the new declarations.
- [x] 2.4 Document Panel and StatusBar in `docs/api.md`, including the element tags Panel requires (`vscode-tabs`, `vscode-tab-header`, `vscode-tab-panel`, `vscode-badge`, `vscode-icon`) and the react type-index entries. Verify `npm run test -- packages/react` passes and the documentation mentions every new value export.

## 3. Title and menu primitives

- [x] 3.1 Add `packages/react/src/TitleBar.tsx` with left, center and right slots, an optional accessible label, appended class and double-activation callback that ignores buttons. Verify the new test covers slot placement, center spacer, label/class, double activation and the button exclusion.
- [x] 3.2 Move the context-menu portal into `packages/react/src/VsContextMenu.tsx` using a local structural element type, and add `packages/react/src/MenuBar.tsx` with ordered menus, overflow entries, Escape close and an `onCommand` callback. Verify the new tests cover menu order, command dispatch, overflow dispatch, separators, Escape close and no command-registry dependency.
- [x] 3.3 Export `TitleBar`, `MenuBar` and their prop/data types from `packages/react/src/index.ts`; run `npm run build -w @workbench-kit/react` and confirm the declarations.
- [x] 3.4 Add TitleBar and MenuBar sections plus react type-index entries to `docs/api.md`, including the `elements/context-menu` and `elements/icon` registration requirement. Verify `npm run test -- packages/react` passes and `npm run check:docs` sees all six new primitive value exports.
- [x] 3.5 Export the shared `ContextMenu` primitive and its `ContextMenuItem`/`ContextMenuProps` types from `packages/react/src/index.ts`, add direct tests for open/closed rendering, entry data, viewport clamping, selection, outside close and ignored selectors, document it in `docs/api.md`, and use it from the preset `EditorArea`. Verify `npm run test -- packages/react` and `npm run build -w @workbench-kit/preset-vscode` pass.

## 4. Preset adapters

- [x] 4.1 Refactor `packages/preset-vscode/src/components/ActivityBar.tsx` to compose the React `ActivityBar`; map config items, pass `activeId` only while the primary sidebar is visible, and resolve bottom action ids back to command ids. Verify the existing ActivityBar tests still cover the toggle and command dispatch behavior.
- [x] 4.2 Refactor `packages/preset-vscode/src/components/Sidebar.tsx` and `SecondarySideBar.tsx` to compose the React `Sidebar`; keep view resolution, action command mapping, close labels and the secondary modifier class. Verify the existing sidebar tests still cover active-view fallback, unknown ids, action dispatch and both close labels.
- [x] 4.3 Refactor `packages/preset-vscode/src/components/BottomPanel.tsx` to map configured view definitions to `PanelTab` content and pass the store's active view, maximize and close handlers to the React `Panel`. Verify the existing BottomPanel tests still cover tab order, selection events and both panel commands.
- [x] 4.4 Refactor `packages/preset-vscode/src/components/TitleBar.tsx` to compose the React `TitleBar` slots and the React `MenuBar`; keep branding, command center, layout controls, window controls, store toggles and the double-click notification. Reduce the preset `MenuBar` to a `run` adapter, switch `EditorArea` to the shared `ContextMenu`, and delete the preset `VsContextMenu.tsx`. Verify `npm run test -- packages/preset-vscode` and `npm run build -w @workbench-kit/preset-vscode` pass.
- [x] 4.5 Run `npm run test -- packages/preset-vscode` and confirm the title bar, menu, activity bar, sidebar and panel tests still assert the existing labels, roles and command dispatch.

## 5. Custom-shell and template adoption

- [x] 5.1 Replace the custom-shell activity bar, primary sidebar and secondary sidebar region markup with the new React primitives, keeping the reducer as the only state owner and preserving the existing Show/Hide labels and close labels. Verify `npm run test -- apps/custom-shell` covers activity switching, sidebar hiding and secondary toggling.
- [x] 5.2 Replace the custom-shell bottom panel, status bar and title bar region markup with the React primitives, mapping its local panel tabs to per-tab content. Verify the custom-shell tests still cover panel selection, panel maximize/restore, status values, title bar controls and tab lifecycle.
- [x] 5.3 Update `apps/template/src/app/components/StatusBar.tsx` to use the React `StatusBar` primitive while keeping all existing status items and commands. Verify the template tests and `npm run build` pass.
- [x] 5.4 Update `apps/custom-shell/README.md` to list the primitive-owned region chrome and the app-owned content/state; verify the documented commands and links resolve with `npm run check:docs`.
- [x] 5.5 Run `npm run build:custom-shell && npm run check:custom-shell` and confirm the composition check reports no preset, template or demo module in the custom-shell bundle.

## 6. Repository documentation and release material

- [x] 6.1 Update `docs/architecture.md`: move ActivityBar and the sidebar containers out of the "next candidates" paragraph, describe the adapter split between React primitives and preset store adapters, and note Panel/MenuBar element requirements. Verify the module descriptions match the final file layout.
- [x] 6.2 Update `docs/migration.md` and `docs/eject.md` so the old region locations map to the new React primitives (with preset adapters as the store-aware path) and the composition examples use the real primitive props. Verify all relative links and documented commands with `npm run check:docs`.
- [x] 6.3 Update `README.md`, the root package tree, `ROADMAP.md` Phase 2 status/audit and `CHANGELOG.md` Unreleased entries to describe the completed primitive layer and the new public exports. Verify the roadmap no longer calls ActivityBar or the sidebars store-coupled preset-only components.
- [x] 6.4 Update the template's mock workspace tree in `apps/template/src/demo/data/workspace.ts` to list the new React primitive files and remove the moved preset files. Verify the template tests still render the mock tree without missing-file entries.
- [x] 6.5 Update `AGENTS.md` architecture guidance if the final ownership split changes how contributors should place region components; verify `npm run check:docs` and `npm run check:release` pass.

## 7. Integration verification

- [x] 7.1 Run `npm run check` and confirm lint, formatting, typecheck, boundaries, distribution, docs, release, tests, all three builds, both example composition checks and the packed-tarball check pass.
- [x] 7.2 Run `npm run size` and `npm run size:minimal`; confirm the extraction stays within the recorded budgets. If gzipped JavaScript moves beyond tolerance, record the measured value in the relevant budget file, update the baseline note, and rerun both size commands successfully.
- [x] 7.3 Start `npm run dev` and inspect the shell at 1440×900 and a narrow width; confirm the title bar, activity bar, both sidebars, panel, status bar and menus render and interact as before with no body scroll.
- [x] 7.4 Run `openspec validate extract-region-primitives --strict` and confirm the change validates before archive.

## Workflow follow-up

- Archive the change only after the user requests it and the project's review requirements are satisfied.
- Verify the archived specs and the final implementation agree.
