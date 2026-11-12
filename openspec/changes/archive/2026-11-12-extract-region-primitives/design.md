# Design

## Context

See [`proposal.md`](./proposal.md) for motivation. The relevant current state:

- `packages/react` already owns `WorkbenchShell`, `ResizablePane`, `TabStrip`
  and `IconButton`. Its declared boundary allows only React, React DOM and
  `@workbench-kit/core`; it may render custom elements but must not import the
  vscode-elements package or the preset/element layers.
- `packages/preset-vscode` owns the store-coupled region components:
  `TitleBar`, `MenuBar` with `VsContextMenu`, `ActivityBar`, `Sidebar`,
  `SecondarySideBar` and `BottomPanel`. These read the preset store and command
  runner, but their markup is otherwise generic.
- `apps/custom-shell` repeats activity rail, sidebar header, panel event wiring,
  status bar and title bar markup because those primitives do not exist.
- `packages/styles-vscode/src/workbench.css` already styles the structural class
  contract (`titlebar`, `menubar`, `activitybar`, `sidebar`, `panel`,
  `statusbar`, view header/body, panel tabs). The extraction must preserve that
  contract rather than introduce a parallel styling model.
- The public facade copies `packages/react/dist` to `./react` and checks every
  public value export against `docs/api.md`, so new exports need documentation
  but no facade-manifest change.
- Bundle budgets are gated at 1% or 1 KiB in CI. This is intended to be a
  neutral extraction; no budget edit is planned unless measurement requires it.

## Goals / Non-Goals

**Goals:**

- Provide controlled, app-free primitives for the six remaining generic region
  surfaces.
- Make the preset region components thin adapters that keep their current
  behavior, labels, class names and command dispatch.
- Prove the primitives at composition level by replacing custom-shell's
  duplicated region chrome with the primitives while its reducer keeps owning
  state.
- Keep the dependency graph and bundle size effectively unchanged.
- Document the new public surface, element requirements and migration path.

**Non-Goals:**

- Moving the preset store, commands, quick open, notifications or view
  resolution into the React layer.
- Adding CSS entries, new dependencies, new packages or new facade subpaths.
- Changing the preset's public props, persistence key or command identifiers.
- Reworking the mock editor, demo views or visual design.
- Making the primitives own visibility, active views, tab collections or
  command execution.

## Decisions

### Primitive API shapes

Each primitive is controlled and reports intent through callbacks. The proposed
public props are:

```ts
// ActivityBar
interface ActivityBarItem {
  id: string
  title: string
  icon: string
  badge?: number
}
interface ActivityBarAction {
  id: string
  title: string
  icon: string
}
interface ActivityBarProps {
  items: ActivityBarItem[]
  activeId?: string | null
  bottomItems?: ActivityBarAction[]
  onActivate?: (id: string) => void
  onAction?: (id: string) => void
  label?: string
  className?: string
}

// Sidebar (one primitive for both regions)
interface SidebarAction {
  id: string
  icon: string
  label: string
}
interface SidebarProps {
  title?: string
  icon?: string
  actions?: SidebarAction[]
  onAction?: (id: string) => void
  onClose?: () => void
  closeLabel?: string
  label?: string
  className?: string
  children?: ReactNode
}

// Panel
interface PanelTab {
  id: string
  title: string
  badge?: number | string
  content: ReactNode
}
interface PanelProps {
  tabs: PanelTab[]
  activeId: string | null
  onSelect: (id: string) => void
  label?: string
  maximized?: boolean
  onToggleMaximized?: () => void
  onClose?: () => void
  className?: string
}

// StatusBar
interface StatusBarProps {
  left?: ReactNode
  right?: ReactNode
  label?: string
  className?: string
}

// TitleBar
interface TitleBarProps {
  left?: ReactNode
  center?: ReactNode
  right?: ReactNode
  onDoubleClick?: () => void
  label?: string
  className?: string
}

// MenuBar
interface MenuBarMenu {
  id: string
  label: string
  entries: MenuBarEntry[]
}
interface MenuBarEntry {
  label?: string
  commandId?: string
  keybinding?: string
  separator?: boolean
}
interface MenuBarProps {
  menus: MenuBarMenu[]
  onCommand: (commandId: string) => void
  overflowItems?: MenuBarEntry[]
  label?: string
  className?: string
}

// ContextMenu
interface ContextMenuItem {
  label?: string
  value?: string
  keybinding?: string
  separator?: boolean
}
interface ContextMenuProps {
  open: boolean
  x: number
  y: number
  items: ContextMenuItem[]
  onSelect: (value: string) => void
  onClose: () => void
  ignoreSelector?: string
}
```

`ActivityBar` takes an active id rather than a `visible` flag. The preset
adapter passes `primaryVisible ? activeView : null`, which preserves the current
"no active highlight when the sidebar is hidden" behavior without teaching the
primitive about visibility.

`Sidebar` is one primitive instead of separate primary and secondary
implementations. The secondary region uses `className="secondary-sidebar"`,
which appends to `.sidebar`; this avoids duplicating header/action/body markup
for a two-class difference.

`Panel` keeps the existing `vscode-tabs` structure because the styles already
target `vscode-tabs.panel-tabs` and `vscode-tab-panel.panel-pane`. It reports
`vsc-tabs-select` by index and calls `onSelect` with the matching tab id. Its
maximize/close controls are optional callbacks because both current consumers
already expose those panel actions; the primitive still does not decide what
they do.

`TitleBar` is slot-based (`left`, `center`, `right`) rather than taking
branding, menus and config flags. Branding is app/preset content, and a
slot-based bar lets the preset and custom-shell reproduce their different title
bars without a lowest-common-denominator config object.

`MenuBar` moves to React with `onCommand`, not `CommandRunner`, so it has no
knowledge of the preset command type. The preset adapter supplies
`onCommand={run.run}`.

### Keep preset adapters

The preset region files remain, but become adapters:

- `ActivityBar` maps config items, passes `activeId`, and maps bottom item ids
  back to their `commandId`s.
- `Sidebar` and `SecondarySideBar` resolve the active view definition and map
  view actions to the primitive's `SidebarAction`.
- `BottomPanel` resolves configured panel views and maps each definition to a
  `PanelTab` whose content is the view component.
- `TitleBar` keeps the store toggles, layout controls, window controls and
  notification behavior, then passes them into the primitive's slots.
- `MenuBar` stays a tiny preset adapter so existing preset tests and internal
  imports keep their `run` contract.

Alternative considered: delete the preset region components and compose the
primitives directly inside `VSCodeWorkbench`. That would shrink the preset file
count but move view resolution and store selectors into the composition root and
make the existing per-region tests harder to keep. Adapters preserve the current
layer split: the preset knows about views/store/commands, the primitive knows
about UI.

### Share the context-menu portal through React

`MenuBar` and the preset's `EditorArea` both depend on `VsContextMenu`, which
uses `@vscode-elements/elements` only as a type import and renders
`<vscode-context-menu>` through a portal. The React package cannot import the
vscode-elements package under the declared boundary. The portal moves to
`packages/react/src/ContextMenu.tsx` as a shared, controlled primitive with a
local structural type:

```ts
type ContextMenuElement = HTMLElement & {
  show: boolean
  data: ContextMenuItem[]
}
```

`MenuBar` uses it for its menus and `EditorArea` uses it for tab and editor
actions. It continues to use `createPortal` from `react-dom` (already allowed)
and the existing viewport and outside-click logic. The preset no longer owns a
context menu component. Consumers must register `elements/context-menu` when
they render `MenuBar` or `ContextMenu`, just as they register `tab-header` for
`TabStrip`; the preset already registers it.

Alternative considered: keep `ContextMenu` internal to React and keep a
preset-local copy for `EditorArea`. That would avoid a new public export but
duplicate the portal and let the two copies drift. Another alternative was a
plain-DOM menu, but that would change the current visual and event contract for
no gain.

### Panel and element registration

The `Panel` primitive uses `vscode-tabs`, `vscode-tab-header`,
`vscode-tab-panel`, `vscode-badge` and `vscode-icon` when those parts are
rendered. Like `TabStrip`, it renders custom elements without importing the
registration package. The preset already registers the required tags; the
custom-shell already registers tabs, tab-header, tab-panel and icon and needs no
badge because its tabs have no badges. Documentation will state the requirement
per primitive instead of adding automatic registration side effects to React.

### Custom-shell and template adoption

Custom-shell's region files become small compositions over the primitives. Its
local reducer remains the only state owner. It maps its activity items so the
accessible labels keep their current Show/Hide phrasing, and it maps panel tabs
to per-tab content (Console and Details), fixing the current panel markup where
the tab count and the number of tab panels could diverge.

The template's `StatusBar` content switches to the `StatusBar` primitive. The
preset continues to accept a `statusBar` React node, so no preset prop changes
are needed.

### Verification and bundle neutrality

The extraction is checked by:

- new colocated primitive tests in `packages/react/src`;
- adapted preset tests for the store adapters and title/menu integration;
- the existing custom-shell integration tests, which exercise the primitive
  composition through the app;
- `npm run check`, plus `npm run size` and `npm run size:minimal`;
- `npm run check:docs`, which requires every new public value export and its
  specifier to appear in `docs/api.md`.

The bundle should be neutral because code moves between packages rather than
being added. If gzipped JavaScript moves beyond the recorded 1% tolerance, the
measured value is recorded in the target's budget file and the size report is
reviewed as part of this change.

## Risks / Trade-offs

- **MenuBar context-menu registration is easier to miss** → document the
  `elements/context-menu` requirement, keep the preset's registration, and
  cover the menu in React tests.
- **Panel's `vsc-tabs-select` event is untyped** → use a structural
  `HTMLElement` ref and a narrow custom-event cast, matching the existing
  preset implementation; test selection through a dispatched event.
- **Preset behavior drifts while swapping implementations** → keep existing
  preset tests, preserve labels and class names, and compare rendered markup in
  the affected tests.
- **Custom-shell accessible labels change** → map item titles to the existing
  Show/Hide labels in the example adapter.
- **New exports enlarge `@workbench-kit/react` and could leak into the minimal
  bundle** → no module-level side effects, named exports only, and run
  `npm run size:minimal`; the minimal app imports none of the new primitives.
- **Public API surface grows ahead of real consumers** → keep the primitives
  prop-driven and close to the existing markup, document them as `0.x`, and
  avoid convenience state or command abstractions.

## Migration Plan

1. Add the React primitives and their tests; export them from
   `packages/react/src/index.ts`.
2. Move `MenuBar`/`VsContextMenu` support into React and reduce the preset to an
   adapter.
3. Convert the preset region adapters to the primitives and keep the existing
   preset tests green.
4. Convert the custom-shell regions and template status bar; update their tests.
5. Update API, architecture, migration, eject, README, roadmap, changelog and
   mock-tree documentation.
6. Run the full verification, both size checks and the packed-tarball check.

Rollback is a normal revert: there is no persisted-state or public-removal
migration, and the preset store, persistence key and export names remain
unchanged.
