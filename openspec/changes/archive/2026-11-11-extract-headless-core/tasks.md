# Tasks

## 1. Layout helpers

- [x] 1.1 Create `src/kit/core/layout/size.ts` exporting `clampSize(value, min, max)` with a docblock stating it is pure and config-free; verify `npm run check:boundaries` passes with the new `kit-core` file.
- [x] 1.2 Add `src/kit/core/layout/size.test.ts` covering below-minimum, above-maximum and in-range values plus equal bounds; verify `npm run test -- src/kit/core/layout` passes.
- [x] 1.3 Create `src/kit/core/layout/resize.ts` with `resizeFromPointer({ side, startSize, startPosition, position, min, max })` and `resizeFromKey({ side, orientation, size, key, shift, min, max })`, porting the arithmetic from `src/layout/components/ResizablePane.tsx` verbatim (side-aware sign, 10/50 steps, `Home`/`End`, `null` for unhandled keys); verify TypeScript strict mode accepts the signatures via `npm run typecheck`.
- [x] 1.4 Add `src/kit/core/layout/resize.test.ts` covering left/right/bottom pointer drags in both directions, drags clamped at both bounds, arrow steps with and without Shift per side, `Home`/`End`, and an ignored key returning `null`; verify `npm run test -- src/kit/core/layout` passes.
- [x] 1.5 Add `src/kit/core/layout/index.ts` re-exporting the layout helpers; verify importing from the directory compiles and that no file in `src/kit/core/layout` imports React, DOM globals, `src/layout`, `src/store` or `src/data` (read the imports directly; `npm run check:boundaries` also runs in group 6).

## 2. Tab helpers

- [x] 2.1 Create `src/kit/core/tabs/types.ts` with `TabLike = { id: string }` and the collection slice shape used by the helpers; verify `npm run typecheck` passes and the file has no imports.
- [x] 2.2 Create `src/kit/core/tabs/collection.ts` with pure helpers for open, activate, close, close-others, close-all, reopen, reorder and cycle, each returning a new slice and never mutating its input; verify `npm run typecheck`.
- [x] 2.3 Add `src/kit/core/tabs/collection.test.ts` covering: append-and-activate, dedupe, unknown activate; close right neighbour, left fallback, last tab, inactive tab, unknown id; close-others/all reporting in most-recently-closed-first order; reopen; reorder toward start and toward end plus unknown/identical ids; cycle forward and backward with wrap, no active tab, and empty collection. Also assert `WorkbenchTab` satisfies `TabLike` in a type-only check. Verify `npm run test -- src/kit/core/tabs` passes.
- [x] 2.4 Add `src/kit/core/tabs/index.ts` re-exporting the tab helpers and types; verify `npm run build` (or `npm run typecheck`) still succeeds.

## 3. Persistence helpers

- [x] 3.1 Create `src/kit/core/persistence/adapter.ts` with the `StorageAdapter` interface (`getItem`, `setItem`, optional `removeItem`); verify the file imports nothing (`npm run typecheck`).
- [x] 3.2 Create `src/kit/core/persistence/versioned.ts` with `readVersioned(adapter, key, { version, migrate?, fallback })` and `writeVersioned(adapter, key, version, state)` using the `{ version, state }` envelope, swallowing adapter and parse errors into `fallback`; verify `npm run typecheck`.
- [x] 3.3 Add `src/kit/core/persistence/versioned.test.ts` using an in-memory adapter to cover: write/read round trip records the current version; a throwing adapter and malformed JSON both return `fallback`; matching version bypasses migration; mismatched version with a migration uses its result; mismatched version without a migration returns `fallback`; absent key returns `fallback`. Verify `npm run test -- src/kit/core/persistence` passes.
- [x] 3.4 Add `src/kit/core/persistence/index.ts` re-exporting the adapter type and versioned helpers; verify `npm run typecheck` passes and the barrel exports exactly the adapter type and the two helpers.

## 4. Store delegation

- [x] 4.1 Replace the private `clamp` in `src/store/workbench-store.ts` with `clampSize` from core in the three `set*Size` actions; verify `npm run test -- src/store` passes unchanged, including the panel-height clamp test.
- [x] 4.2 Rewire `openTab`, `activateTab`, `closeTab`, `closeOtherTabs`, `closeAllTabs`, `reopenClosedTab`, `reorderTab` and `activateNextTab` to delegate to the tab helpers, keeping action names, signatures, the 20-entry closed-tab cap and `WorkbenchTab` typing; verify `src/store/workbench-store.test.ts` passes with no edits to its expectations (`npm run test -- src/store`).
- [x] 4.3 Leave the `persist` configuration untouched (`name: 'desktop-ui-template:v1'`, `version: 1`, same `partialize`) and confirm it in review; verify by loading the app once, reloading, and seeing theme, sizes, tabs and closed tabs restored.

## 5. ResizablePane adoption

- [x] 5.1 In `src/layout/components/ResizablePane.tsx`, delete the private `clampSize` and pointer-delta branch and call the core `clampSize` / `resizeFromPointer` / `resizeFromKey` helpers while keeping pointer capture, body class/cursor side effects, live preview state, double-click reset and ARIA attributes intact; verify `npm run typecheck` and `npm run lint`.
- [x] 5.2 Verify the sash by hand with `npm run dev` at 1440×900: drag each of the primary sidebar, secondary sidebar and bottom panel past both bounds, use arrows and Shift+arrows, press `Home`/`End`, double-click to reset, and confirm no body scroll and unchanged visuals.

## 6. Integration verification

- [x] 6.1 Run `npm run check` (lint, format, typecheck, boundaries, tests, build) and confirm it passes with zero boundary violations and the existing store tests unmodified.
- [x] 6.2 Run `npm run size` and confirm the production JS and CSS totals stay within `budgets.json` (1 % / 1024 B JS tolerance; CSS warns only).
- [x] 6.3 Update the Phase 1 status line in `ROADMAP.md` (and the roadmap sentence in `README.md` if it still describes Phase 0 as current) to record that `kit/core` exists; verify the wording names layout, tabs and persistence and points at `src/kit/core`.

## Workflow follow-up

- Archive the change after review when the implementation is merged.
