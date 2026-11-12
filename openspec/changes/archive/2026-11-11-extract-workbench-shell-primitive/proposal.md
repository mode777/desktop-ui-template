# Proposal

## Why

Phase 2 has extracted the resize and tab primitives, but there is still no reusable shell. `src/layout/Workbench.tsx` is the composition root and the only implementation of the root flex layout, yet it imports every region, the store, the hotkeys, `QuickOpen` and `Notifications`. A consumer at the composition level cannot get the `workbench` / `workbench-body` / `workbench-center` structure without pulling the whole template application, and the preset extraction in Phase 3 has no shell to build on.

Extracting the shell now is the next step in the `ROADMAP.md` §8 sequence and is cheap: the DOM and CSS already exist, `layout` may already import `kit-react`, and the template is the only consumer, so visible behavior can stay identical.

## What Changes

- Add `src/kit/react/WorkbenchShell.tsx`, a layout-only React primitive:
  - Renders the existing root structure and class names (`workbench`, optional maximized modifier, `workbench-body`, `workbench-center`).
  - Accepts consumer-supplied region slots: title bar, activity bar, primary side bar, center content, bottom panel, secondary side bar, status bar and overlays. An omitted or `null` slot is not rendered, so visibility stays consumer-owned.
  - Accepts a `panelMaximized` layout flag that marks the root and makes the panel occupy the center instead of the main content, matching today's behavior.
  - Imports only React; no store, config, commands, views, data or demo modules.
- Re-export the primitive and its props type from `src/kit/react/index.ts`.
- Turn `src/layout/Workbench.tsx` into a composition root: keep the store, config, hotkeys and visibility calculation there and pass the existing regions into `WorkbenchShell`. Markup, class names and interaction stay the same.
- Add component tests for slot rendering and omission, region nesting, the maximized layout, class merging and the app-free import graph.
- Add the new file to the mock explorer tree in `src/data/workspace.ts` and record the shell in the `ROADMAP.md` Phase 2 status once implemented.

Not included: `Sidebar`, `Panel`, `StatusBar`, `TitleBar`/`MenuBar` primitives, the preset, moving views/data into a demo layer, CSS relocation, class renaming, store or persistence changes, and any package/exports work.

## Capabilities

### New Capabilities

<!-- None: the shell extends the existing react-primitives capability. -->

### Modified Capabilities

- `react-primitives`: adds the layout-only shell requirements — consumer-supplied region slots, omission semantics, region nesting, panel maximization and application independence — while keeping the existing primitive requirements unchanged.

## Impact

- New code: `src/kit/react/WorkbenchShell.tsx`, `src/kit/react/WorkbenchShell.test.tsx`.
- Modified code: `src/kit/react/index.ts` (exports), `src/layout/Workbench.tsx` (compose the shell, keep state/config/hotkeys), `src/data/workspace.ts` (mock tree entry and mock `Workbench.tsx` excerpt if it no longer matches).
- Unchanged: `src/styles/workbench.css` class contract, `boundaries.json` layer edges, `budgets.json`, the store and persisted state.
- Expected size effect: neutral; layout markup moves into a primitive and the application keeps the same elements.
- Docs: `ROADMAP.md` Phase 2 status names the shell when the work lands. No user-facing documentation change is required.
