# Tasks

## 1. WorkbenchShell primitive

- [x] 1.1 Create `src/kit/react/WorkbenchShell.tsx` with the props from design.md §1 (`titleBar`, `activityBar`, `primarySideBar`, `secondarySideBar`, `panel`, `statusBar`, `overlays`, `panelMaximized`, `className`, `children`), render the fixed root/body/center structure from design.md §4, render only non-null slots and merge `className` into the structural root classes; verify `npm run typecheck` and `npm run check:boundaries` pass and the file imports only `react`.
- [x] 1.2 Re-export `WorkbenchShell` and `WorkbenchShellProps` from `src/kit/react/index.ts`; verify importing from `src/kit/react` compiles via `npm run typecheck`.
- [x] 1.3 Add `src/kit/react/WorkbenchShell.test.tsx` covering full slot composition, region order/nesting (activity and primary before center, panel below content, secondary after center, status after body, overlays last), omission of null/undefined slots, and additive custom class names; verify `npm run test -- src/kit/react/WorkbenchShell.test.tsx` passes.
- [x] 1.4 Extend the test with maximized behavior (root marker present, `children` absent, panel still rendered, surrounding regions unchanged) and its restored state, plus a sparse composition with only center content; verify `npm run test -- src/kit/react/WorkbenchShell.test.tsx` passes.

## 2. Template adoption

- [x] 2.1 Rewrite `src/layout/Workbench.tsx` to keep `useWorkbenchHotkeys`, the store selectors, `workbenchConfig` resolution and `ResizablePane` wrappers, and pass the existing regions to `WorkbenchShell` as slots (`overlays` composes `QuickOpen` and `Notifications`); verify `npm run typecheck` and `npm run lint` pass and no `className="workbench"` / `workbench-body` tree remains inline.
- [x] 2.2 Add `WorkbenchShell.tsx` to the `src/kit/react` folder in `src/data/workspace.ts` and update the mock `Workbench.tsx` excerpt so it shows the shell composition rather than the old inline tree; verify `npm run typecheck` passes and the mock tree lists the file next to `ResizablePane.tsx` and `TabStrip.tsx`.
- [x] 2.3 Verify the shell by hand with `npm run dev` at 1440×900 and a narrow width: toggle the title bar, activity bar, primary side bar, secondary side bar, panel and status bar; maximize and restore the panel; open Quick Open and trigger a notification; confirm unchanged visuals, no body scroll, drag/keyboard resize still works, and no new console errors.

## 3. Integration verification

- [x] 3.1 Run `npm run check` (lint, format, typecheck, boundaries, tests, build) and confirm it passes with zero boundary violations.
- [x] 3.2 Run `npm run size` and confirm the production JS and CSS totals stay within `budgets.json` (1 % / 1024 B JS tolerance; CSS warns only).
- [x] 3.3 Update the Phase 2 status line in `ROADMAP.md` to record `src/kit/react/WorkbenchShell` as the layout-only shell primitive, naming the region-slot and `panelMaximized` contract and pointing at the file.

## Workflow follow-up

- Archive the change after review when the implementation is merged.
