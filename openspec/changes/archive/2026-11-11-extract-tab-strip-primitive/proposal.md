# Proposal

## Why

Phase 2's next step in `ROADMAP.md` §8 is extracting the editor tab strip. Today the tabs — markup, drag reorder, mid-click close, keyboard navigation, focus handling and dirty-close affordances — live inside `src/layout/components/EditorArea.tsx`, which also owns the store, commands, demo icons and document rendering. A consumer at the composition level therefore cannot use the tab strip without pulling the whole editor region, and the forthcoming `WorkbenchShell` has no app-free tab primitive to compose.

Extracting it now keeps the change small: the tab transitions already exist in `kit/core/tabs`, `layout` may already import `kit-react`, and the template is the only consumer, so the visible behavior can stay identical.

## What Changes

- Add `src/kit/react/TabStrip.tsx`, a controlled, app-free primitive:
  - `tabs` + `activeId` in, `onActivate`, `onClose` and `onReorder` callbacks out; no store access.
  - An item shape with `id`, `title`, optional `icon` node, optional `dirty` flag and optional `closable` flag, so icons and unsaved state come from the consumer instead of `src/data`.
  - Optional `actions` slot for region-level buttons, plus `onTabContextMenu` and `onTabDoubleClick` hooks so menus and notifications stay in the application.
  - Owns drag-and-drop reorder state, middle-click close, tablist keyboard navigation (Left/Right with wrap, Home/End, Delete/Backspace), roving focus after activation and the ARIA tablist/close-button labels.
  - Renders the existing DOM shape and class names (`editor-tabs`, `editor-tabs-scroll`, `editor-tab`, `is-active`/`is-dragging`/`is-drag-over`, `tab-title`, `tab-close`, `tab-dirty-dot`) so `src/styles/workbench.css` keeps working unchanged.
- Re-export the primitive and its types from `src/kit/react/index.ts`.
- Replace the inline tab markup in `EditorArea.tsx` with the primitive; keep icons, context menus, commands, breadcrumbs, the document view and the empty state in the app layer.
- Add component tests for the controlled contract, drag reorder, middle-click close, keyboard/focus behavior, dirty/closable rendering and callback hooks.
- Add the new file to the mock explorer tree in `src/data/workspace.ts` and record the primitive in the `ROADMAP.md` Phase 2 status once implemented.

Not included: `WorkbenchShell`, `Sidebar`/`Panel`/`StatusBar` primitives, CSS relocation or class renaming, store/preset changes, and any package/exports work.

## Capabilities

### New Capabilities

- `react-primitives`: the controlled, app-free React building blocks the kit exposes. This change adds the tab strip requirements to the capability introduced by the in-flight `extract-resizable-pane-primitive` change.

### Modified Capabilities

<!-- None: dependency-boundaries already permits layout -> kit-react, and bundle-size-budget already gates the result. -->

## Impact

- New code: `src/kit/react/TabStrip.tsx`, `src/kit/react/TabStrip.test.tsx`.
- Modified code: `src/kit/react/index.ts` (exports), `src/layout/components/EditorArea.tsx` (compose the primitive, keep state and menus), `src/data/workspace.ts` (mock tree entry).
- Unchanged: `src/styles/workbench.css` class contract, `boundaries.json` layer edges, `budgets.json`.
- Expected size effect: neutral or slightly smaller, since markup and interaction move rather than grow; the existing gzip JS gate still applies.
- Docs: `ROADMAP.md` Phase 2 status names the new primitive when the work lands.
