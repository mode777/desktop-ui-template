# Design

## Context

See `proposal.md` — Why. Constraints that shape the approach:

- `src/layout/Workbench.tsx` is today's only implementation of the root layout. It reads six store flags plus `panelMaximized`, resolves them against `workbenchConfig`, and renders `titlebar`, `activitybar`, primary `ResizablePane` + `Sidebar`, `workbench-center` with `EditorArea` and the panel `ResizablePane` + `BottomPanel`, secondary `ResizablePane` + `SecondarySideBar`, `StatusBar`, then `QuickOpen` and `Notifications`.
- The CSS contract in `src/styles/workbench.css` is only three shell rules: `.workbench` (column, `100dvh`, hidden overflow), `.workbench-body` (row, flex), `.workbench-center` (column, flex). Everything below those roots is region-owned. The visual result depends on preserving this exact nesting.
- `boundaries.json` already allows `layout` to import `kit-react`, and `kit-react` may import only React/`react-dom` and `kit-core`. The shell needs none of `kit-core`, so no declaration change is required.
- Region visibility is application policy: config `enabled` flags combined with runtime store toggles. The shell must not learn about either.
- The panel-maximization behavior is split today: the root gets `panel-is-maximized`, `EditorArea` is not rendered, and the bottom `ResizablePane` receives `maximized`, which fills the available space and hides its sash.
- Component tests use Vitest + jsdom + Testing Library; the existing primitive tests render with plain DOM assertions.

## Goals / Non-Goals

**Goals:**

- One layout-only primitive that can reproduce the current shell from props alone.
- Identical DOM order, nesting, class names and rendered appearance for the template.
- A composition API that reads naturally for both the full template and a consumer with fewer regions.

**Non-Goals:**

- Extracting `Sidebar`, `Panel`, `StatusBar`, `TitleBar`, `MenuBar` or `ActivityBar`.
- Owning visibility, sizing, persistence or keyboard shortcuts.
- Adding landmark roles or ARIA in the shell; the region components own their semantics.
- Moving CSS, renaming classes to `wb-*`, or introducing CSS layers.

## Decisions

### 1. Named region slots, with children as the center content

```tsx
interface WorkbenchShellProps {
  titleBar?: ReactNode
  activityBar?: ReactNode
  primarySideBar?: ReactNode
  secondarySideBar?: ReactNode
  panel?: ReactNode
  statusBar?: ReactNode
  overlays?: ReactNode
  panelMaximized?: boolean
  className?: string
  children?: ReactNode // center content
}
```

The names mirror the regions in `workbench.config.ts`, so mapping is unambiguous and the shell can keep two distinct side bars. The center content is `children` because it is the primary slot and the only one with no config counterpart.

Alternatives considered:

- **Roadmap sketch names (`sidebar`, `main`)** — too coarse for this shell: there are two side bars and a panel that lives inside the center column. A consumer would have to nest wrappers itself.
- **A `regions` object prop** — same information with more ceremony and worse JSX ergonomics.
- **Render-prop slots** — unnecessary; regions are already composed before they reach the shell.

### 2. Visibility is the absence of a slot

The shell renders a slot only when it is neither `undefined` nor `null`. There is no `visibleRegions` prop and no internal visibility state.

This keeps the config/store policy in `Workbench.tsx`, which already computes `showTitleBar`, `showPrimary`, etc. A consumer with a single tab and one sidebar simply passes two nodes. Conditional rendering is also what the template does today, so the DOM stays the same.

Alternatives considered: a `visible` map would duplicate React's own conditional rendering and make every region a separate boolean prop.

### 3. Panel maximization is a layout flag on the shell

`panelMaximized` controls three layout facts that belong together:

- the root gains `panel-is-maximized`;
- the center content (`children`) is not rendered;
- the panel slot still renders inside `workbench-center`.

The panel's own `maximized` prop (fill vs. fixed size, sash visibility) stays with the consumer's `ResizablePane` wrapper, because sizing is already a primitive concern.

Alternatives considered: pushing the conditional into the consumer (`children={maximized ? null : <EditorArea/>}` plus a raw root class) would leave the shell unable to express its documented maximized layout and scatter one behavior across two layers. The current app already unmounts `EditorArea` when maximized, so the remount on restore is unchanged behavior.

### 4. DOM structure is fixed and mirrors today

```tsx
<div className={rootClassName}>
  {titleBar}
  <div className="workbench-body">
    {activityBar}
    {primarySideBar}
    <div className="workbench-center">
      {panelMaximized ? null : children}
      {panel}
    </div>
    {secondarySideBar}
  </div>
  {statusBar}
  {overlays}
</div>
```

The body and center wrappers are always rendered, even when every slot is empty. That keeps the CSS contract stable and avoids a special case that would change flex behavior for a sparse composition.

`className` is appended to `workbench` (and `panel-is-maximized` when set); it never replaces structural classes.

### 5. No store, config, hotkeys or app imports

`WorkbenchShell` imports only `ReactNode` from `react`. `src/layout/Workbench.tsx` keeps `useWorkbenchHotkeys`, the store selectors, `workbenchConfig` resolution and region imports, and becomes a declarative mapping:

```tsx
<WorkbenchShell
  titleBar={showTitleBar ? <TitleBar config={config} /> : null}
  activityBar={showActivityBar ? <ActivityBar config={config} /> : null}
  primarySideBar={
    showPrimary ? (
      <ResizablePane ...><Sidebar config={config} /></ResizablePane>
    ) : null
  }
  panel={showPanel ? <ResizablePane ... maximized={panelMaximized}><BottomPanel config={config} /></ResizablePane> : null}
  secondarySideBar={showSecondary ? <ResizablePane ...><SecondarySideBar config={config} /></ResizablePane> : null}
  statusBar={showStatusBar ? <StatusBar /> : null}
  overlays={<><QuickOpen /><Notifications /></>}
  panelMaximized={panelMaximized}
>
  <EditorArea />
</WorkbenchShell>
```

Keeping the `ResizablePane` wrappers in the app preserves the sizing contract, store wiring and reset values; a shell that wrapped regions itself would need to know their min/max/initial sizes, which is application configuration.

### 6. Exports and tests

`src/kit/react/index.ts` re-exports `WorkbenchShell` and `WorkbenchShellProps` next to the existing primitives.

`src/kit/react/WorkbenchShell.test.tsx` covers:

- every supplied slot renders once, in the documented order and nesting;
- a null/omitted slot renders nothing while the others stay;
- center content above panel; activity/primary before center and secondary after it;
- maximized mode adds the root marker, drops `children`, keeps the panel and surrounding regions; restoring reverses it;
- a custom class is appended alongside `workbench`;
- overlays render last;
- no store/config/view/data/command imports (the boundary check is the enforcement, the test documents the contract).

Tests assert structure and class names only; they do not re-test region behavior owned by other components.

## Risks / Trade-offs

- **Visual regression from re-nesting** → The JSX above is a literal transcription of today's tree; verify at 1440×900 and a narrow width, including maximized panel, region toggles and the overlays.
- **Slot prop drift from the config vocabulary** → Use the config region names exactly; `tsc` catches typos in `Workbench.tsx`, and tests pin the structure.
- **Maximized remount surprise** → `EditorArea` already unmounts when the panel is maximized, so no new behavior. Document it in the prop comment.
- **Overlays as a fragment** → `QuickOpen` and `Notifications` are conditionally empty, so a fragment is enough; no wrapper element is introduced and the CSS position context stays the root.
- **Future preset needs a different structure** → The shell stays deliberately plain; a preset can add commands/store around it without changing the primitive.
- **Bundle budget** → Markup moves rather than grows; `budgets.json` stays untouched and `npm run size` runs in `npm run check`.

## Migration Plan

1. Add `src/kit/react/WorkbenchShell.tsx` and export it; nothing imports it yet.
2. Add `src/kit/react/WorkbenchShell.test.tsx` and confirm it passes in isolation.
3. Rewrite `src/layout/Workbench.tsx` to compute visibility as today and pass region slots.
4. Update the mock explorer entry and the mock `Workbench.tsx` excerpt in `src/data/workspace.ts`.
5. Run `npm run check` and `npm run size`; verify the shell manually at 1440×900 and a narrow width.
6. Update the Phase 2 status line in `ROADMAP.md`.

Rollback: restore the inline tree in `Workbench.tsx` and delete the primitive; no state, storage or data format changes.

## Open Questions

None.
