# Proposal

## Why

Phase 0 shipped the guardrails (recorded bundle baseline, dependency-boundary declaration and check in CI), and the declaration already reserves `src/kit/core/**` as a layer that may import nothing but itself and no external packages. Nothing exists in that layer yet: the layout math, tab transitions and persistence configuration all live inside `src/store/workbench-store.ts`, mixed with Zustand, the app's layout config and mock tab data. As a result none of this logic can be reused by the future primitives or tested without the store, which blocks Phase 2 and every later phase.

## What Changes

- Add `src/kit/core/` with three headless modules:
  - `layout` — size clamping and pointer/keyboard resize math (including side-aware pointer deltas and keyboard step/Home/End semantics).
  - `tabs` — pure tab-collection transitions: open, activate, close with next-selection, close others/all, reopen, reorder and cycle.
  - `persistence` — storage-adapter interface plus versioned-schema helpers (version constant, migration hook shape, guarded read/write of a versioned envelope).
- Keep core generic over structural types (`{ id: string }`, numbers, plain records) so it never imports `src/layout`, `src/store`, `src/data`, React or DOM.
- Rewire the existing Zustand store actions to delegate to the core helpers. Application behavior, persistence key/version and rendered output stay exactly as they are today.
- Add unit tests for clamping, resize math, close-then-select-next, close others/all, reopening, reordering, cycling and the persistence envelope.
- No new runtime dependency, no UI change and no expected bundle-budget change.

Not breaking: no public API, no persisted-state format change, no visible behavior change.

## Capabilities

### New Capabilities

- `headless-core`: guarantees for the environment-independent helpers that will back the workbench primitives — pure layout/resize math, pure tab transitions and storage-agnostic persistence plumbing, usable without React, the DOM or application data.

### Modified Capabilities

<!-- None: the existing dependency-boundaries and bundle-size-budget requirements already cover this work. -->

## Impact

- New code: `src/kit/core/layout/*`, `src/kit/core/tabs/*`, `src/kit/core/persistence/*` and their tests.
- Modified code: `src/store/workbench-store.ts` (actions delegate to core; exported initial-state and persistence behavior unchanged), `src/layout/components/ResizablePane.tsx` (uses the shared clamp/resize helpers instead of its private copy).
- Tooling: `boundaries.json` already declares `kit-core` with no allowed externals, so `npm run check:boundaries` starts enforcing the new layer immediately. The declaration gains two reviewable edges — `store` and `layout` may import `kit-core` — because those are the two call sites that delegate to it; no violation is suppressed and no allowlist is added.
- Budget: `budgets.json` is unchanged; the refactor should be size-neutral and must stay inside the existing gzip JS budget and tolerance.
- Docs: no user-facing documentation change required; `ROADMAP.md` Phase 1 status is updated when the work lands.
