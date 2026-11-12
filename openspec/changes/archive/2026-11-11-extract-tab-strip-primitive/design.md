# Design

## Context

See `proposal.md` — Why. Constraints that shape the approach:

- `src/layout/components/EditorArea.tsx` currently owns the entire editor region: tab markup and interaction, store actions, commands, demo icons, breadcrumbs, the document view, the empty state and two context menus. Only the tab bar itself is a reusable primitive.
- `kit/core/tabs` already covers the collection semantics (open, activate, close, reorder, cycle) and is tested. The strip only needs selection, focus and drag interaction on top.
- `boundaries.json` already allows `layout` to import `kit-react`, and `kit-react` may import only React and `kit-core`, so no declaration change is needed. The strip must stay inside that envelope.
- The tab CSS in `src/styles/workbench.css` targets the existing class names and the `vscode-tab-header`/`vscode-icon` markup. Changing the DOM shape would require a coordinated stylesheet change and break the "renders identically" exit criterion.
- Custom-element registration stays in `src/vscode-elements.ts`; the primitive renders the tags but imports no `@vscode-elements` module, keeping `kit-react`'s allowed externals unchanged.
- Component tests use Vitest + jsdom + Testing Library. jsdom has no `DataTransfer`; drag tests must supply a small stub object.

## Goals / Non-Goals

**Goals:**

- One app-free primitive with a controlled selection contract, generic tab data and no knowledge of the store, config, commands or demo data.
- Identical rendered output and interaction for the template: class names, drag visuals, middle-click close, keyboard navigation, focus behavior and close affordances.
- Component tests that pin the contract and interaction wiring without re-testing core tab transitions.

**Non-Goals:**

- Extracting `WorkbenchShell`, `Sidebar`, `Panel`, `StatusBar` or any other Phase 2 primitive.
- Moving tab CSS into a kit styles entry, renaming classes to `wb-*` or introducing CSS layers.
- Changing the store, persistence, config or preset; no uncontrolled tab state inside the primitive.
- Rendering editor content, breadcrumbs or the empty state in the primitive.

## Decisions

### 1. The primitive owns the tab bar only

`TabStrip` renders `<div class="editor-tabs" role="tablist">` containing `.editor-tabs-scroll` with the tabs and an optional `.editor-tabs-actions` area. `EditorArea` keeps everything below the bar (breadcrumbs, `DocumentView`, empty state), both context menus, the store wiring and the two action buttons.

Alternatives considered:

- **Extract the whole editor region** — moves store and document rendering into the kit, contradicting the Phase 3 boundary.
- **Extract only the tab list and leave the root element in the app** — requires a second wrapper API and makes the header/actions layout the consumer's problem for no benefit.

### 2. Controlled selection plus callbacks; no internal tab state

```tsx
interface TabStripItem {
  id: string
  title: string
  icon?: ReactNode
  dirty?: boolean
  closable?: boolean // default true
}

interface TabStripProps {
  tabs: TabStripItem[]
  activeId: string | null
  onActivate: (id: string) => void
  onClose: (id: string) => void
  onReorder: (sourceId: string, targetId: string) => void
  label: string
  actions?: ReactNode
  onTabContextMenu?: (id: string, position: { x: number; y: number }) => void
  onTabDoubleClick?: (id: string) => void
  className?: string
}
```

The strip never owns the tab list or the active id; it reports intent and re-renders from props. Drag state (`draggingId`, `dragOverId`) stays local because it is transient interaction state that must not survive a reload.

`icon` is a `ReactNode` rendered as the first child of the tab header. The consumer supplies the element with `slot="content-before"` (the template passes its existing `<vscode-icon slot="content-before" … />`), so the primitive stays icon-library-agnostic while the CSS selector and markup stay byte-identical.

Alternatives considered:

- **Generic `<T>` with `getId`/`getTitle` accessors** — type-safe for domain tabs, but every consumer already maps its domain objects to strip items; generics only add API surface.
- **A codicon `{ name, className }` icon prop** — simpler for this template, but ties the primitive to codicons and makes custom icons impossible.
- **Internal active state** — duplicates the store and breaks the controlled convention in `ROADMAP.md` §5.4.

### 3. Keyboard navigation mirrors the current editor behavior

The component keeps a ref to the tablist root and:

- Left/Right computes the adjacent id with `cycleTab` from `kit/core/tabs` (wrapping), calls `onActivate`, then focuses that header in `requestAnimationFrame`.
- Home/End activates and focuses the first/last tab.
- Delete/Backspace calls `onClose` for the active tab, then focuses index `max(0, currentIndex - 1)`.
- Every other key returns without calling `preventDefault`.

Using `cycleTab` keeps wrap semantics identical to the store and hotkeys instead of duplicating modulo logic in the component. Focus is looked up with `querySelectorAll('vscode-tab-header')` exactly as today, so no extra tabIndex or roving-focus attributes are introduced and the visual/focus behavior does not change.

Alternative considered: a `useTabKeyboardNav` hook in `kit/core` — the logic is presentation-specific (DOM focus), so it belongs with the component.

### 4. Drag reorder uses native HTML5 drag events and reports a pair

`draggable` is set on each tab wrapper. `dragStart` writes the tab id to `dataTransfer` under `text/plain` and sets `draggingId`; `dragOver` prevents default and sets `dragOverId`; `drop` reads the id, calls `onReorder(sourceId, targetId)` when the ids differ, and clears both markers. `dragEnd` and `dragLeave` clear the markers. The consumer remains responsible for actually moving the tab via `kit/core/tabs`.

Alternatives considered: pointer-based sorting (more control, much more code and no current need) and a sortable library (new dependency, out of scope).

### 5. Close, dirty and middle-click behavior stay app-compatible

Each tab renders the title, an optional icon, and — unless `closable === false` — a close affordance with `role="button"`, `aria-label={'Close ' + title}`, a `title` of `Unsaved changes — close` or `Close`, and the existing `is-dirty` class plus dirty dot markup. Clicking it stops propagation and calls `onClose`. Middle click (`onAuxClick` with button 1) calls `onClose` without activating when the tab is closable.

Alternatives considered: a single generic "suffix" slot — would move the dirty styling contract into every consumer and risk visual drift.

### 6. Host interactions are callbacks, not imports

Context menu, double activation and the header action buttons remain in the app:

- `onTabContextMenu(id, {x, y})` lets `EditorArea` keep its `VsContextMenu` and command handling.
- `onTabDoubleClick(id)` keeps the demo notification.
- `actions` renders the split/more `IconButton`s inside `.editor-tabs-actions`.

Alternatives considered: passing menu item arrays into the primitive — would pull command semantics and localization into the kit.

### 7. Move markup, keep CSS and boundaries untouched

`src/styles/workbench.css` and `boundaries.json` do not change. `EditorArea` imports `TabStrip` from `../../kit/react`, which is already an allowed edge. The new file is added to the mock explorer tree next to `ResizablePane.tsx`.

Alternatives considered: co-locating `TabStrip.css` — deferred to the styles/packaging phase together with the rest of the per-component CSS.

### 8. Tests pin wiring; core tests keep the transition matrix

`src/kit/react/TabStrip.test.tsx` covers:

- controlled selection: reported id, accepted update, ignored update, external active change;
- rendering: title/icon order, active class, dirty close affordance and label, non-closable tab without a close button;
- close: close button reports id without activating, middle click reports id, middle click on a non-closable tab does nothing;
- drag: `dragStart`/`dragOver` set the marker classes, drop reports source/target once, self-drop reports nothing, `dragEnd` clears markers;
- keyboard: Left/Right wrap and focus the new tab, Home/End, Delete/Backspace closes and refocuses, unrelated key does not call callbacks;
- host hooks: context menu suppresses the native menu and passes id/position, double activation passes the id, `actions` renders in the actions area;
- no store/view/data import in the module graph (the boundary check covers this too).

`kit/core/tabs` tests remain the source of truth for reorder and close-neighbour semantics.

## Risks / Trade-offs

- **Visual regression from the move** → Keep the DOM shape and class names identical; verify at 1440×900 and a narrow width: active states, dirty dot on hover, drag opacity/insertion marker, middle click, keyboard focus ring.
- **Focus timing after activation/close** → `requestAnimationFrame` runs after the consumer's state update, matching the current implementation. If a consumer updates asynchronously, focus may land on the previous index; the fallback index is clamped and never throws.
- **jsdom drag support** → `DataTransfer` is not implemented; tests pass a minimal `{ getData, setData, effectAllowed, dropEffect }` stub to `fireEvent.dragStart`/`drop`.
- **Custom element registration in tests** → `vscode-tab-header` and `vscode-icon` are unknown tags in jsdom and render inert; the tests assert React wiring and class names, not shadow-DOM internals.
- **Icon slot contract leaks to consumers** → Document in the prop comment that icon nodes are placed directly and should carry `slot="content-before"`; the template already does so.
- **Bundle budget** → Markup and handlers move rather than grow; `npm run size` runs in `npm run check`, and `budgets.json` stays untouched. If gzip grows, inspect the report rather than raising the budget.

## Migration Plan

1. Add `src/kit/react/TabStrip.tsx` and export it from `src/kit/react/index.ts`; nothing imports it yet.
2. Add `src/kit/react/TabStrip.test.tsx` and confirm it passes in isolation.
3. Replace the inline tab markup in `EditorArea.tsx` with `TabStrip`, mapping `WorkbenchTab` to `TabStripItem` (icons stay in the app) and passing activation, close, reorder and context-menu callbacks.
4. Add the mock explorer entry and run `npm run check` plus `npm run size`.
5. Verify the editor strip by hand at 1440×900 and a narrow width.
6. Update the Phase 2 status line in `ROADMAP.md`.

Rollback: restore the inline markup in `EditorArea.tsx`; the primitive is additive and no state, storage or data format changes.
