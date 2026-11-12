# Tasks

## 1. ResizablePane primitive

- [x] 1.1 Create `src/kit/react/ResizablePane.tsx` with the controlled contract from design.md §2 (`side`, `size`, `min`, `max`, `onSizeChange`, optional `onReset`/`maximized`/`className`, `label`, `children`), render `size` when idle and a local preview only while dragging, delegate all math to `kit/core/layout`, and keep the existing DOM shape, class names, body cursor/`is-resizing` side effects and ARIA attributes; verify `npm run typecheck` and `npm run check:boundaries` pass with no imports outside React, `kit-core` and `kit-react`.
- [x] 1.2 Add `src/kit/react/index.ts` re-exporting `ResizablePane` and its props type (a layer entry, not a kit-wide barrel); verify importing from `src/kit/react` compiles via `npm run typecheck`.
- [x] 1.3 Add `src/kit/react/ResizablePane.test.tsx` covering the controlled contract — accepted resize renders the new prop, rejected resize reverts after release, external prop changes apply immediately — and pointer drags: preview during move, one `onSizeChange` on release, clamping at both bounds, body class/cursor set and cleared; verify `npm run test -- src/kit/react` passes.
- [x] 1.4 Extend `src/kit/react/ResizablePane.test.tsx` with keyboard resizing (10/50 steps per side, Home/End, unhandled key not consumed), separator role/label/orientation/min/max/current value, the maximized branch hiding the sash, double-click reset and listener cleanup when unmounting mid-drag; verify `npm run test -- src/kit/react` passes.

## 2. Template adoption

- [x] 2.1 Add `kit-react` to the `layout` layer's `mayImport` in `boundaries.json` and update the matching row in the `README.md` dependency-boundaries table; verify `npm run check:boundaries` reports zero violations.
- [x] 2.2 Switch `src/layout/Workbench.tsx` to import `ResizablePane` from `../../kit/react` and rename the three `onResize` props to `onSizeChange`; verify `npm run typecheck` and `npm run lint` pass.
- [x] 2.3 Delete `src/layout/components/ResizablePane.tsx` and update the mock explorer entry in `src/data/workspace.ts` to `src/kit/react/ResizablePane.tsx`; verify `grep -rn "components/ResizablePane\|onResize" src` finds no stale references and `npm run typecheck` still passes.
- [x] 2.4 Verify the sashes by hand with `npm run dev` at 1440×900 and a narrow width: drag each of the primary sidebar, secondary sidebar and bottom panel past both bounds, use arrows and Shift+arrows, press Home/End, double-click to reset, maximize the panel, and confirm no body scroll and unchanged visuals.

## 3. Integration verification

- [x] 3.1 Run `npm run check` (lint, format, typecheck, boundaries, tests, build) and confirm it passes with zero boundary violations.
- [x] 3.2 Run `npm run size` and confirm the production JS and CSS totals stay within `budgets.json` (1 % / 1024 B JS tolerance; CSS warns only).
- [x] 3.3 Update the Phase 2 status line in `ROADMAP.md` to record that `src/kit/react/ResizablePane` exists as the first controlled primitive; verify the wording names the controlled `size`/`onSizeChange` contract and points at the file.

## Workflow follow-up

- Archive the change after review when the implementation is merged.
