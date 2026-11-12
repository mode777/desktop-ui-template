# Tasks

## 1. Split command ownership

- [x] 1.1 Create `src/commands/default-commands.ts` holding the generic workbench commands moved verbatim from `src/commands/commands.ts` (`file.*`, `view.commandPalette/quickOpen/toggle*/toggleTheme/resetLayout`, `tab.*`), plus a `createCommandRegistry(commands)` helper returning `{ list, run }` where `run` returns `false` for an unknown id; add `src/commands/default-commands.test.ts` covering the listed ids, dispatch and the unknown-id result; verify `npm run test -- src/commands/default-commands.test.ts` and `npm run typecheck` pass.
- [x] 1.2 Reduce `src/commands/commands.ts` to the demo commands (`edit.*`, `selection.*`, `view.explorer/search/sourceControl/run/extensions/chat/problems/output/terminal`, `go.*`, `run.*`, `help.*`, `app.*`, `explorer.*`, `search.*`, `scm.*`, `extensions.*`, `chat.*`) and rebuild the exported `commandList`/`commandMap`/`runWorkbenchCommand` from the preset defaults composed with them, keeping every existing id; verify `npm run test` passes and the command palette and menus still list and run both preset and demo commands in `npm run dev`.

## 2. Give the workbench store no demo dependencies

- [x] 2.1 Move `WELCOME_TAB`, `README_TAB`, `CONFIG_TAB`, `createInitialTabs()` and the startup output lines out of `src/store/workbench-store.ts` into a demo module (for example `src/data/initial-session.ts`), updating `src/commands`/`src/views` imports; verify `npm run typecheck` and `npm run test` pass with no store import of demo tab constants.
- [x] 2.2 Remove the store's `workbenchConfig` import: size setters store the reported size unchanged (the `ResizablePane` clamp is already specified and tested), and `createLayoutDefaults()` uses preset constants 300/330/230; update `src/store/workbench-store.test.ts` so the clamp expectation is replaced by a pass-through expectation while the reset test keeps asserting the preset defaults; verify `npm run test -- src/store/workbench-store.test.ts` passes.
- [x] 2.3 Make first-run data explicit: the store starts with no tabs and a generic output line, and exposes a seeding entry point that applies supplied initial tabs/active tab/output only when the persisted key `desktop-ui-template:v1` is absent; call it from `src/app/App.tsx` with the demo values from 2.1; add tests for first run, restoring an existing persisted session, and keeping a closed-all-tabs session empty after reload; verify `npm run test` and `npm run dev` show the same initial tabs and that closing all tabs survives reload.

## 3. Parameterize the regions in place

- [x] 3.1 Change `Sidebar` and `SecondarySideBar` to take the view registry, the region's configured view ids and a command runner as props, resolving the active view with a fallback to the first configured id present in the registry and skipping unknown ids; add a component test for active-view rendering, fallback and unknown-id skipping; verify `npm run test -- src/layout/components` and `npm run typecheck` pass.
- [x] 3.2 Change `BottomPanel` to take its view registry, configured ids and command runner as props, rendering tabs in configuration order and ignoring unknown ids; add a component test for tab order and view switching; verify `npm run test -- src/layout/components` passes.
- [x] 3.3 Change `ActivityBar` to take the command runner for its bottom items; verify the template still toggles the primary side bar and runs the accounts/settings commands in `npm run dev`.
- [x] 3.4 Change `EditorArea` to take `renderDocument`, `fileIcons`, `emptyEditor` and the command runner as props instead of importing `DocumentView` and `src/data/workspace`; add tests for the active document rendering and the empty state; verify `npm run test -- src/layout/components` passes.
- [x] 3.5 Change `QuickOpen` to take the file list, the open-file handler and the command registry as props instead of importing `workspaceFiles`, `openFileTab` and `commandList`; add tests for file filtering and opening, command filtering and dispatch, and the empty result state; verify `npm run test -- src/layout/components` passes.
- [x] 3.6 Change `TitleBar` and `MenuBar` to take branding, menu definitions and the command runner as props instead of importing `menuDefinitions`/`runWorkbenchCommand`; add tests for menu dispatch, branding activation and the no-branding case; verify `npm run test -- src/layout/components` passes.
- [x] 3.7 Make `Workbench` accept the full preset contract (config, view registry, commands, menus, quick-open files/handler, document renderer, file icons, empty editor, branding, status bar node, initial session) and have `src/app/App.tsx` supply every template input and own the hotkey hook call; verify `npm run check` passes and the template's regions, tabs, menus, quick open, notifications, resizing and maximize/restore behave exactly as before in `npm run dev`.

## 4. Move into the preset, app and demo layers

- [x] 4.1 Move the parameterized files to the target layout from design.md §7 (`src/kit/preset-vscode/{VSCodeWorkbench.tsx,types.ts,store,commands,components,index.ts}`, `src/app/{workbench.config.ts,use-workbench-hotkeys.ts,components/StatusBar.tsx}`, `src/demo/{views,commands,components,data}`), rename `Workbench` to `VSCodeWorkbench`, and rewrite every import; verify `npm run typecheck` passes and `rg "src/(layout|store|hooks|views|commands|data|components)" src` reports no stale paths.
- [x] 4.2 Update `boundaries.json` to the new model (kit core/react/preset, `app`, `demo`; remove `layout`, `views`, `commands`, `store`, `data`, `components`, `hooks`; allow `zustand` for `kit-preset`, keep kit/demo isolation) and rewrite the fixtures in `scripts/lib/boundaries.test.mjs` and `scripts/check-boundaries.test.mjs` to the new paths; verify `npm run check:boundaries` passes with zero violations and `npm run test -- scripts` passes.
- [x] 4.3 Define the preset's public surface in `src/kit/preset-vscode/index.ts` (composition root and props, config/view/tab/command/menu types, default store accessor, command registry helpers) and point `src/app` and `src/demo` imports at that surface; verify `npm run typecheck` passes and `rg "preset-vscode/" src/app src/demo` shows only imports of the index or documented subpath.
- [x] 4.4 Add preset tests covering full composition from props, disabled regions, the consumer status bar slot, unknown active view fallback, unknown command no-op, restoring a previously persisted session, keeping a closed-all-tabs session empty, and rendering with a single generic view; verify `npm run test -- src/kit/preset-vscode` passes and no test fixture references a demo view id or brand string.

## 5. Documentation and mock workspace

- [x] 5.1 Update `AGENTS.md` (architecture rules, configuration surface, view/command/store paths) and `README.md` (project structure, customization paths, extension points) to the new `src/app`, `src/demo` and `src/kit` layout; verify no `src/layout`/`src/store`/`src/views`/`src/commands` path remains in either file and the documented commands still run as written.
- [x] 5.2 Update `ROADMAP.md` Phase 3 status to record the extracted preset and demo separation, and update `src/demo/data/workspace.ts` — explorer tree and mock document excerpts (`workbench.config.ts`, `VSCodeWorkbench.tsx`, store, README guidance) — to the new paths; verify `npm run typecheck` passes and the mock tree lists the same files as `find src -type f`.

## 6. Integration verification

- [x] 6.1 Run `npm run check` and confirm lint, formatting, typecheck, boundary check, tests and build all pass with zero boundary violations.
- [x] 6.2 Run `npm run size` and confirm gzipped JavaScript stays within the `budgets.json` tolerance (1 % / 1024 B) and CSS stays at or below baseline, or that any deliberate overage is justified and recorded in the budget file.
- [x] 6.3 Verify the template by hand in `npm run dev` at 1440×900 and a narrow width: toggle every region, resize and reset the side bars and panel, maximize/restore the panel, switch primary/secondary/panel views, use menus, command palette and quick open, trigger a notification, reload to confirm the persisted layout, close all tabs and reload to confirm they stay closed, and confirm no body scroll or console errors.

## Workflow follow-up

- Archive the change after review and merge.
- Verify the archived specs and the updated `ROADMAP.md` status line after archiving.
