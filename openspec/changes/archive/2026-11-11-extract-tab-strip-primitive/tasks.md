# Tasks

## 1. TabStrip primitive

- [x] 1.1 Create `src/kit/react/TabStrip.tsx` with the controlled contract from design.md §2 (`tabs`, `activeId`, `onActivate`, `onClose`, `onReorder`, `label`, optional `actions`/`onTabContextMenu`/`onTabDoubleClick`/`className`), render the existing `editor-tabs` DOM shape and class names, keep drag and keyboard navigation state local, and import only React and `kit/core/tabs`; verify `npm run typecheck` and `npm run check:boundaries` pass with no imports outside `kit-react`.
- [x] 1.2 Re-export `TabStrip`, `TabStripItem` and `TabStripProps` from `src/kit/react/index.ts`; verify importing from `src/kit/react` compiles via `npm run typecheck`.
- [x] 1.3 Add `src/kit/react/TabStrip.test.tsx` covering the controlled selection contract (reported id, accepted update, ignored update, external active change), rendering (title/icon, active class, dirty close affordance and label, non-closable tab has no close button) and closing (close button reports without activating, middle click reports, middle click on non-closable does nothing); verify `npm run test -- src/kit/react` passes.
- [x] 1.4 Extend `src/kit/react/TabStrip.test.tsx` with drag reorder (markers set, drop reports source/target once, self-drop reports nothing, markers clear), keyboard navigation (Left/Right wrap and focus, Home/End, Delete/Backspace close and refocus, unrelated key not consumed), host hooks (context menu suppresses native menu and passes id/position, double activation passes id), the `actions` slot and tablist/close-button accessibility attributes; verify `npm run test -- src/kit/react` passes.

## 2. Template adoption

- [x] 2.1 Replace the inline tab markup in `src/layout/components/EditorArea.tsx` with `TabStrip`: map `WorkbenchTab` to `TabStripItem` using the existing icon helpers, pass store actions as `onActivate`/`onClose`/`onReorder`, keep the tab context menu and double-click notification as callbacks, and render the split/more buttons through `actions`; verify `npm run typecheck` and `npm run lint` pass and no `editor-tabs` markup remains inline.
- [x] 2.2 Add `TabStrip.tsx` to the mock `src/kit/react` folder in `src/data/workspace.ts`; verify `npm run typecheck` passes and the mock tree lists the new file next to `ResizablePane.tsx`.
- [x] 2.3 Verify the editor strip by hand with `npm run dev` at 1440×900 and a narrow width: switch tabs, close via the × button, middle-click close, close a dirty tab, drag-reorder with the insertion marker, use Left/Right/Home/End/Delete, open the tab context menu, double-click a tab, and confirm the split/more actions still work with unchanged visuals and no body scroll.

## 3. Integration verification

- [x] 3.1 Run `npm run check` (lint, format, typecheck, boundaries, tests, build) and confirm it passes with zero boundary violations.
- [x] 3.2 Run `npm run size` and confirm the production JS and CSS totals stay within `budgets.json` (1 % / 1024 B JS tolerance; CSS warns only).
- [x] 3.3 Update the Phase 2 status line in `ROADMAP.md` to record `src/kit/react/TabStrip` as the second controlled primitive, naming the controlled selection/close/reorder contract and pointing at the file; verify the wording matches the implemented API.

## Workflow follow-up

- Archive the change after review when the implementation is merged.
