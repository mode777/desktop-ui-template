# Design

## Context

See `proposal.md` — Why. Constraints that shape the approach:

- `src/layout/components/ResizablePane.tsx` already delegates all arithmetic to `kit/core/layout`; what remains is the interaction lifecycle: live preview state, pointer listeners, body cursor/class side effects, keyboard handling, ARIA attributes and the `maximized` branch.
- `boundaries.json` already declares `kit-react` (`src/kit/react/**`) with `mayImport: ["kit-core", "kit-react"]` and `allowedExternals: ["react", "react-dom"]`. The `layout` layer currently allows only `kit-core`, so the consumer edge is the one declaration change needed.
- The pane's CSS lives in `src/styles/workbench.css` and uses app tokens. There is no kit styles layer yet.
- `src/data/workspace.ts` mirrors the real repository in the mock explorer tree, so the moved file's listed path must be updated.
- Component tests use Vitest + jsdom + Testing Library. jsdom 31 provides `PointerEvent`, so drags can be simulated without a polyfill.

## Goals / Non-Goals

**Goals:**

- One app-free primitive with a controlled size contract and no knowledge of the store, config, views or demo data.
- Identical rendered output and interaction for the template, including class names, cursor behavior and ARIA.
- Component tests that pin the contract without duplicating the full core math matrix.

**Non-Goals:**

- Relocating the pane CSS into a kit styles entry, adding CSS layers or renaming classes.
- An uncontrolled `initialSize` mode or a `ResizableSidebar` wrapper; both can be layered on later.
- Extracting `TabStrip`, `WorkbenchShell` or any other Phase 2 primitive.
- Changing the store, config, persistence or preset.

## Decisions

### 1. The committed size comes from the prop; only the drag preview is local

The primitive renders `size` when idle and a local `liveSize` only while a drag is in progress (`isDragging ? liveSize : size`). On release it calls `onSizeChange` with the clamped final value and ends the drag; the consumer's next `size` prop becomes the rendered size.

The current component instead keeps `liveSize` as its own committed size and copies the prop into it in an effect. That is not actually controlled: if a consumer ignores `onSizeChange`, the region stays at the rejected size until the prop happens to change again. The new derivation makes rejection revert on the next render and lets the size-sync effect be deleted.

Alternatives considered:

- **Keep the internal committed size** — preserves a one-line move but contradicts the controlled contract and leaves the primitive unable to serve consumers that validate sizes before committing.
- **Uncontrolled `initialSize`** — convenient for the roadmap's composition sketch, but adds a second state model to design and test now. The preset or a wrapper can own that later.

Behavior for the template is unchanged because its consumers always accept the reported value.

### 2. Props: rename `onResize` to `onSizeChange` and keep the rest

```tsx
interface ResizablePaneProps {
  side: 'left' | 'right' | 'bottom'
  size: number
  min: number
  max: number
  onSizeChange: (size: number) => void
  onReset?: () => void
  label: string
  maximized?: boolean
  className?: string
  children: ReactNode
}
```

`onSizeChange` matches the controlled convention in `ROADMAP.md` §5.4 and distinguishes a committed size from a continuous event. `onReset` becomes optional because a consumer that does not offer reset should not have to pass a no-op. `className` is added so consumers can style the root without a wrapper element; it is appended to the structural classes and never replaces them.

Alternatives considered: keeping `onResize` (rejected: reads like a raw event and hides the commit semantics); making `label` optional (rejected: an unnamed separator is an accessibility regression).

### 3. DOM shape, class names and CSS stay where they are

The primitive renders the same tree and class names: `resizable-pane resizable-pane--<side> [is-maximized]`, plus `resize-handle resize-handle--<orientation>` with `role="separator"`. The CSS remains in `src/styles/workbench.css` for this change.

Alternatives considered:

- **Co-locate `ResizablePane.css` in `kit-react`** — makes the primitive more self-contained, but the styles depend on app tokens and moving them changes import order relative to `workbench.css` (the pane rules currently load after tokens and global styles). Per-component CSS belongs to the styles/packaging phase, where cascade and layers can be designed together.
- **Rename classes to a `wb-` prefix now** — would force a coordinated stylesheet rewrite and break the "renders identically" exit criterion.

Consequence: the class names are documented as the styling contract. Consumers using the primitive without the template must supply equivalent rules, which is acceptable until the styles entry exists.

### 4. Move the file and delete the app copy; no re-export shim

`src/kit/react/ResizablePane.tsx` becomes the only implementation. `Workbench.tsx` imports it from `../../kit/react`, and the old file is deleted.

Alternatives considered: keeping `src/layout/components/ResizablePane.tsx` as a re-export — avoids touching `Workbench.tsx`, but leaves two names for one component and a file that will be deleted in the next phase anyway.

### 5. Declare the one new layer edge

`boundaries.json` gains `kit-react` in `layout.mayImport`, and the README layer table is updated to match. No other app layer gets the edge; `kit-react` remains restricted to React and `kit-core`, so the primitive cannot reach back into the app.

Alternative considered: importing the primitive from the `app` layer only and passing it down — would invert composition and put a UI primitive into the composition root for no benefit.

### 6. Component tests pin wiring; core tests keep the math matrix

`src/kit/react/ResizablePane.test.tsx` covers:

- controlled acceptance, rejection and external size changes;
- drag preview before release, one committed value on release, clamping at both bounds;
- body `is-resizing`/cursor set and cleared, and listener cleanup on unmount mid-drag;
- arrow steps with and without Shift per side, Home/End, and an unhandled key not calling the callback;
- separator role, label, orientation, min/max/current values and the maximized branch;
- double-click reset.

The arithmetic itself stays covered by `src/kit/core/layout/resize.test.ts`; the component tests assert that the right helper inputs are wired, not every side/direction combination.

## Risks / Trade-offs

- **Visual regression from the move** → No markup or CSS changes; verify the three sashes by hand at 1440×900 and a narrow width (drag both bounds, arrows, Shift+arrows, Home/End, double-click, maximize).
- **Prop rename misses a call site** → `tsc -b` fails on the old `onResize` prop; grep for `ResizablePane` and `onResize` before finishing.
- **Controlled derivation regresses drag feel** → Preview still renders from `liveSize` during the drag, so pointer tracking is unchanged; only the post-release fallback differs when a consumer rejects.
- **jsdom pointer simulation is incomplete** → jsdom 31 supports `PointerEvent` with coordinates; if a test needs `setPointerCapture` it is not used by the component (listeners are on `window`), so no polyfill is expected.
- **Boundary declaration drifts from README** → Update both in the same task; `npm run check:boundaries` fails if the code and declaration disagree.
- **Bundle budget** → Code moves rather than grows; `npm run size` is part of `npm run check`, and `budgets.json` is untouched. If gzip grows unexpectedly, inspect the report instead of raising the budget.

## Migration Plan

1. Add `src/kit/react/ResizablePane.tsx` and `src/kit/react/index.ts` with the controlled contract; nothing imports them yet.
2. Add the component tests and confirm they pass in isolation.
3. Add `kit-react` to `layout.mayImport`, update the README table, and switch `Workbench.tsx` to the primitive (`onResize` → `onSizeChange`).
4. Delete `src/layout/components/ResizablePane.tsx` and update the mock explorer entry.
5. Run `npm run check` and `npm run size`; verify the sashes manually.
6. Update the Phase 2 status note in `ROADMAP.md`.

Rollback: restore the deleted file and the old import/prop; the primitive is additive and no state, storage or data format changes.
