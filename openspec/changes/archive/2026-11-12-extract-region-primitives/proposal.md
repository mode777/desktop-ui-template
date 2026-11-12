# Proposal

## Why

Phase 2 of the workbench-kit roadmap is still in progress: `WorkbenchShell`,
`ResizablePane`, `TabStrip` and `IconButton` are controlled primitives, but the
activity bar, both sidebar containers, the bottom panel, the status bar, the
title bar and the menu bar still live in the preset with store reads or
preset-only implementations. The custom-shell example therefore repeats region
markup and event wiring that composition-level consumers would also have to
copy.

Finishing the Phase 2 extraction closes that gap. The generic region surfaces
become app-free, controlled primitives; the preset keeps thin adapters that
supply its store state; and the custom-shell example proves the same surfaces
work with consumer-owned state. The public surface gains primitives without
removing or changing existing exports.

## What Changes

- Add controlled React primitives to `packages/react`:
  - `ActivityBar` — items, optional active id, bottom actions and activation
    callbacks.
  - `Sidebar` — header title/icon, optional header actions, optional close
    callback and a content slot; covers primary and secondary sidebars through
    a structural modifier class.
  - `Panel` — controlled tabbed bottom panel with tab badges, optional maximize
    and close actions, and consumer-supplied content per tab.
  - `StatusBar` — left and right item slots with an accessible label.
  - `TitleBar` — left, center and right slots plus an optional double-activation
    callback.
  - `MenuBar` — ordered menu definitions, optional overflow entries and a
    command callback.
  - `ContextMenu` — a controlled portal over `vscode-context-menu` for
    MenuBar, editor tab menus and application-owned context menus.
- Export the new components and their prop/data types from
  `@workbench-kit/react` (and therefore the public `./react` subpath).
- Refactor the preset's region components into adapters over the primitives:
  `ActivityBar`, `Sidebar`, `SecondarySideBar`, `BottomPanel`, `TitleBar` and
  `MenuBar` keep reading the preset store/config and preserve current markup,
  class names, labels, keyboard behavior and command dispatch.
- Refactor the custom-shell example regions to compose the new primitives with
  its local reducer, keeping its current visual and interaction behavior while
  removing duplicated tab, menu and region boilerplate.
- Use the `StatusBar` primitive in the template's own status bar content.
- Add component tests for every new primitive, update preset and custom-shell
  tests where the composition changes, and keep the existing controlled-state
  guarantees at the primitive level.
- Add API reference sections, type-index entries, element-registration notes,
  migration/eject guidance, architecture/README text and a changelog entry.
- Update the roadmap's Phase 2 status and the template's mock file tree to the
  new module layout.

No public export is removed or renamed. The preset props and store behavior stay
compatible. No new runtime dependency is introduced.

## Capabilities

### New Capabilities

None. The region primitives extend the existing controlled-primitive layer.

### Modified Capabilities

- `react-primitives`: adds requirements for the activity bar, sidebar, panel,
  status bar, title bar and menu bar primitives, including their controlled
  callbacks, accessible semantics, styling hooks and app independence.

## Impact

- New components and tests under `packages/react/src/`:
  `ActivityBar.tsx`, `Sidebar.tsx`, `Panel.tsx`, `StatusBar.tsx`,
  `TitleBar.tsx`, `MenuBar.tsx`, `ContextMenu.tsx` and their colocated tests.
- Changed exports in `packages/react/src/index.ts`; the public
  `@workbench-kit/workbench/react` subpath and packed types pick them up
  automatically.
- Changed preset adapters and tests under
  `packages/preset-vscode/src/components/`; `VsContextMenu` moves to the React
  layer. Preset behavior, class names and command wiring stay unchanged.
- Changed custom-shell region files and tests under `apps/custom-shell/src/`.
- Changed template status bar under `apps/template/src/app/components/`.
- Changed documentation: `docs/api.md`, `docs/architecture.md`, `docs/eject.md`,
  `docs/migration.md`, `README.md`, `ROADMAP.md`, `apps/custom-shell/README.md`
  and `CHANGELOG.md`; the template mock workspace tree is updated to match.
- No changes to `packages/core`, `packages/elements`, the facade manifest,
  distribution rules or peer dependencies.
- Bundle budgets are expected to stay within their existing tolerance because
  this is a neutral extraction. If a target's gzipped JavaScript moves beyond
  tolerance, the measured baseline change is recorded and reviewed in the same
  change rather than silently ignored.
