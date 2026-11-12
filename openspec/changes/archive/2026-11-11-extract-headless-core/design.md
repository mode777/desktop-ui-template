# Design

## Context

See `proposal.md` — Why. The relevant constraints:

- `boundaries.json` already declares `kit-core` (`src/kit/core/**`) with `mayImport: ["kit-core"]` and `allowedExternals: []`. The first file written there is checked immediately, so core cannot import React, the DOM, `zustand`, `@vscode-elements/elements`, `src/layout/*`, `src/store/*` or `src/data/*`.
- The current logic to extract is small and intertwined with two call sites: `src/store/workbench-store.ts` (private `clamp`, eight tab actions, Zustand `persist` config with `name: 'desktop-ui-template:v1'`, `version: 1`) and `src/layout/components/ResizablePane.tsx` (private `clampSize`, pointer delta branch, keyboard step branch).
- `WorkbenchTab` lives in `src/store/workbench-types.ts` and imports `Theme` from `src/layout/types.ts`, so core must not own or import that type.
- `budgets.json` records a 1 % / 1024 B JS tolerance and warnings for CSS; Phase 0 must remain green.
- Store tests in `src/store/workbench-store.test.ts` already pin the behavior we must preserve (close selects the next tab, reorder, cycle, clamping).

## Goals / Non-Goals

**Goals:**

- One place for size math and tab transitions, testable in plain Node.
- Zero behavior change: same persisted key/version, same tab transitions, same resize interaction, same rendered output.
- A public shape that Phase 2 primitives can consume without pulling in the app.

**Non-Goals:**

- Building the React primitives (`ResizablePane`, `TabStrip`, …) or the preset. Those are Phases 2–3.
- Splitting the Zustand store into slices or replacing it with a store-agnostic context.
- Rewiring persistence to the new adapter in this phase; the store keeps `zustand/persist` for now.
- Package extraction, workspaces, exports maps, or a kit-wide barrel file.

## Decisions

### 1. Core is structurally typed, not app-typed

Core exposes minimal structural contracts (`TabLike = { id: string }`) and generic functions typed as `<T extends TabLike>` so the app's `WorkbenchTab` flows through unchanged. Alternative — move `WorkbenchTab`/`Theme` into core — would either force `src/layout/types.ts` to move (out of scope for Phase 1) or make core import app types, which the boundary declaration forbids.

Consequence: a compile-time test asserts `WorkbenchTab` satisfies `TabLike`, so drift is a type error rather than a runtime surprise.

### 2. Bounds and configuration are parameters, never module state

`clampSize(value, min, max)` and the resize helpers take explicit bounds. The store passes `workbenchConfig` values; `ResizablePane` passes its own props. Alternative — have core read `workbenchConfig` — would couple core to the app, break the boundary rule and make the helpers awkward for consumers who bring their own config.

Core stays free of module-level mutable state (no singletons, no counters) so importing it is side-effect free, matching the packaging rules in `ROADMAP.md` §6.

### 3. Tab transitions are pure and return the next collection

Each helper takes a `{ tabs, activeTabId }` slice and returns a new slice (plus reported closed tabs where relevant) without mutating the input or reading the store. The store action wraps it in `set(...)`. Alternative — a reducer with action objects — is more ceremony than six operations need and would obscure the direct correspondence to today's actions.

Existing semantics are preserved exactly:

- Close: nearest tab to the right, else left, else no active tab.
- Close others/all: removed tabs reported in most-recently-closed-first order (reverse of visual order), matching the current `.reverse()` behavior.
- Reorder: remove source, splice at the target's pre-removal index — toward-start moves land before the target, toward-end moves land after it, which is what the current implementation and `reorderTab('c','a')` test expect.
- Cycle: modulo arithmetic over the collection; with no active tab, forward lands on the first tab and backward on the last. (The old modulo-only expression selected the second-to-last tab when moving backward with no active tab and more than one tab; the spec's explicit no-active-tab scenario wins. Nothing else changes, and the store test for cycling from a known active tab is unaffected.)

Reopen stays expressed as "take the most recent reported tab and open it", so the history cap (20 entries) and the storage field remain store policy, not core policy.

### 4. Resize math is split into two pure functions; the DOM lifecycle stays in the component

- `resizeFromPointer({ side, startSize, startPosition, position, min, max })` → clamped size.
- `resizeFromKey({ side, orientation, size, key, shift, min, max })` → clamped size or `null` when the key is not a resize key.

`ResizablePane` keeps pointer capture, body class/cursor side effects and live preview state, but calls these helpers instead of its private copies. Alternative — extract the whole pointer lifecycle into a hook — belongs to Phase 2 (`ResizablePane` primitive) and would make this change harder to review and roll back.

`clampSize` remains exported separately because the store's three `set*Size` actions only need clamping.

### 5. Persistence is a small adapter + envelope helper, implemented but not wired yet

Core gains:

- `StorageAdapter` — `getItem(key): string | null`, `setItem(key, value): void`, optional `removeItem(key)`.
- A versioned codec: `readVersioned(adapter, key, { version, migrate?, fallback })` and `writeVersioned(adapter, key, version, state)` using the envelope `{ version, state }`.

Behavior: adapter throws or unparseable/invalid payload → return `fallback`; version mismatch with a supplied migration → use its result; mismatch without a migration → `fallback`. No exception escapes the helper.

Not wiring it into `zustand/persist` in Phase 1 is deliberate: the store's persist configuration (`name`, `version`, `partialize`) is the compatibility contract we must not disturb, and the preset extraction in Phase 3 is the natural place to swap the adapter. Because nothing imports this module from the app entry, it does not affect the shipped bundle; its tests still run. This keeps the phase honest: one moving part at a time.

### 6. Module layout and exports

```text
src/kit/core/
  layout/
    size.ts          clampSize
    resize.ts        resizeFromPointer, resizeFromKey
    index.ts         re-exports the layout helpers
  tabs/
    types.ts         TabLike
    collection.ts    openTabIn, activateTabIn, closeTabIn, closeOthersIn, closeAllIn,
                     reopenTabIn, reorderTabIn, cycleTab
    index.ts
  persistence/
    adapter.ts       StorageAdapter
    versioned.ts     readVersioned, writeVersioned
    index.ts
```

Per-module barrels keep imports short without creating the kit-wide barrel that `ROADMAP.md` §6 rule 3 forbids. Tests are colocated (`*.test.ts`) in the same directories; the existing `boundaries.json` `test` layer already lets them import across layers, and their own imports are still checked.

Naming detail: tab helpers take an `In` suffix (`closeTabIn`) to read as pure functions on a collection; the store keeps its existing action names (`closeTab`), so no call sites outside the store change.

## Risks / Trade-offs

- **Store tests and core tests diverge in intent** → Keep store tests as integration coverage of action wiring; core tests cover the matrix (empty, unknown id, wrap-around). Don't inline implementation assertions in the core tests.
- **Bundle grows from added indirection** → The helpers replace code that already exists; expected to be near-neutral. `npm run size` is part of `npm run check`, and the budget gate already tolerates 1 % / 1024 B. If it grows past budget, collapse the per-module index files rather than touching the budget.
- **Type drift between `TabLike` and `WorkbenchTab`** → Compile-time assignment test in `src/kit/core/tabs/collection.test.ts` (or a `types` assertion) plus the store's continued use of `WorkbenchTab` in return types.
- **`ResizablePane` behavior slips during the swap** → Move the current arithmetic verbatim into `resizeFromPointer`/`resizeFromKey`, add unit tests for both sides and for `Home`/`End`/unhandled keys, and verify the sash manually (drag, arrows, Shift+arrows, double-click reset) before finishing.
- **Dead persistence module invites "why is this here"** → Document in the module docblock that it is the Phase 3 adapter seam and intentionally unwired; the spec ties it to the storage-agnostic requirement.
- **Boundary check may flag an accidental import in core** → That is the intended outcome; fix the import rather than editing `boundaries.json`. `store` and `layout` are granted a `kit-core` edge because they are the two call sites that delegate to it; no violation is allowlisted, and core itself still has no outward imports.

## Migration Plan

1. Add core modules and their tests in one PR; nothing imports them yet except tests. `npm run check` passes at this point.
2. Switch the store's size actions and tab actions to the helpers, keeping names and signatures. `src/store/workbench-store.test.ts` must pass unmodified.
3. Switch `ResizablePane` to `clampSize`, `resizeFromPointer` and `resizeFromKey`; keep its lifecycle effects and props.
4. Run `npm run check` (lint, format, typecheck, boundaries, tests, build) and `npm run size`; confirm the budget gate.
5. Update the Phase 1 status note in `ROADMAP.md` (and the README roadmap sentence if it still implies Phase 0).

Rollback: revert the import lines in `workbench-store.ts` and `ResizablePane.tsx`; the core modules are additive and the persisted schema, storage key and version are untouched, so no user data migration or cleanup is needed.

## Open Questions

None. The one deferrable choice — when the persistence adapter replaces `zustand/persist` — is recorded as a decision above (Phase 3), and answering it differently later does not change this phase's specs or tasks.
