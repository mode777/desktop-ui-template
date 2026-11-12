# Proposal

## Why

Phase 1 moved the size and resize math into `src/kit/core/layout`, but the only resizable region in the shell is still `src/layout/components/ResizablePane.tsx` — an app-layer component with no kit entry point and no tests. It is therefore not usable by the composition level described in `ROADMAP.md` §5.2, and the next Phase 2 primitives (`TabStrip`, `WorkbenchShell`) have nothing to compose against.

Extracting it now is cheap and low risk: the template is the only consumer, the arithmetic already lives in core, and the visible behavior can stay byte-for-byte identical.

## What Changes

- Add `src/kit/react/ResizablePane.tsx` and a `src/kit/react/index.ts` entry that export a controlled primitive:
  - `size` + `onSizeChange` instead of the current `onResize` callback, matching the controlled convention in `ROADMAP.md` §5.4.
  - Optional `onReset`, `label`, `maximized` and `className`, plus `children`.
  - All size math delegated to the existing `kit/core/layout` helpers; pointer capture, live drag preview, body cursor/`is-resizing` side effects, double-click reset and ARIA separator semantics stay in the component.
- Delete the app copy at `src/layout/components/ResizablePane.tsx` and point `src/layout/Workbench.tsx` at the kit primitive.
- Declare the one new intentional edge in `boundaries.json`: the `layout` layer may import `kit-react`. The `kit-react` layer itself already exists with `react`/`react-dom` as its only externals; no violation is suppressed.
- Add component tests covering the controlled contract, pointer drag commit, keyboard resizing, clamping, maximized behavior and cleanup.
- Keep markup, class names and CSS unchanged so the template looks and behaves exactly as today. Moving `resizable-pane` CSS into a kit styles entry is deliberately deferred.
- Update the mock explorer tree in `src/data/workspace.ts` so its listed path matches the new file location.

Not included: `TabStrip`, `WorkbenchShell`, a `ResizableSidebar` convenience wrapper, CSS relocation, store/preset changes and any package/exports work.

## Capabilities

### New Capabilities

- `react-primitives`: the controlled, app-free React building blocks the kit exposes — starting with a resizable region that owns resize interaction and accessibility but not layout configuration, application state or demo views.

### Modified Capabilities

<!-- None: dependency-boundaries and bundle-size-budget requirements already cover the added layer edge and the size gate. -->

## Impact

- New code: `src/kit/react/ResizablePane.tsx`, `src/kit/react/index.ts`, `src/kit/react/ResizablePane.test.tsx`.
- Modified code: `src/layout/Workbench.tsx` (import path and `onSizeChange` prop), `src/data/workspace.ts` (mock file entry).
- Removed code: `src/layout/components/ResizablePane.tsx` (moved, not rewritten).
- Tooling: `boundaries.json` and the layer table in `README.md` gain the `layout → kit-react` edge.
- Budget: expected to be size-neutral; `budgets.json` is unchanged and the existing gzip JS gate applies.
- Docs: `ROADMAP.md` Phase 2 status is updated when the work lands.
