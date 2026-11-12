# Proposal

## Why

Phase 5 of the roadmap is one application short of its target layout. The
template proves the preset and the minimal example proves a one-tab consumer,
but nothing in the repository proves the **composition level**: a complete
multi-region workbench assembled from `WorkbenchShell` and the controlled
primitives, with consumer-owned chrome, state and commands and no preset
dependency. That gap leaves the composition API unvalidated before Phase 6
documents it and publishes the package.

Adding `apps/custom-shell` closes the remaining Phase 5 deliverable and gives
the composition level a runnable, tested reference: title bar, activity bar,
sidebar, editor tabs, bottom panel, secondary sidebar and status bar, all owned
by the example rather than by the preset.

## What Changes

- Add `apps/custom-shell`, a third private workspace application that composes
  `WorkbenchShell`, `ResizablePane`, `TabStrip` and `IconButton` directly from
  `@workbench-kit/react`, registers only the element tags it renders and ships
  its own region chrome.
- Demonstrate a medium-sized consumer: a custom activity rail and primary
  sidebar, a multi-tab editor, a tabbed bottom panel, an optional secondary
  sidebar, panel maximize/restore, and a status bar that reflects local state.
- Keep all state consumer-owned: active activity item, visible regions, sidebar
  widths, panel height, open tabs, active tab, panel tab and maximized state use
  local React state and core tab helpers, never the preset store or command
  registry.
- Add `dev:custom-shell`, `build:custom-shell` and `check:custom-shell` root
  commands, include the build and composition check in the standard
  verification gate, and give the app its own `apps/custom-shell/dist/` output.
- Extend the dependency declaration with an `example-custom-shell` layer and
  `apps/custom-shell/src` root. The layer may import kit core, React primitives,
  element registrations and shared styles, and may not import the preset,
  template app or demo layers.
- Add a custom-shell composition check that fails when a preset, template or
  demo module reaches the production bundle, reusing the existing bundle
  inspection rules with a target-specific label.
- Record the intentional raw JavaScript growth from the template's new mock-tree
  entries in `budgets.json`; the template's gzip baseline and the minimal budget
  stay unchanged.
- Document the example in its own README and update the root README, `AGENTS.md`,
  `ROADMAP.md`, `docs/architecture.md` and the minimal example's "growing into
  the preset" path to place custom-shell between minimal and preset.

Not included: new kit primitives or API changes, changing the preset, template
or minimal behavior, adding a third bundle budget, changing `distribution.json`,
publishing the package, or archiving the completed `relocate-apps-to-apps`
change.

## Capabilities

### New Capabilities

- `custom-shell-example`: a runnable composition-level application that builds a
  complete workbench from kit primitives and consumer-owned regions, proves the
  absence of preset and demo code in its production bundle, and is part of the
  standard build and verification gate.

### Modified Capabilities

- `dependency-boundaries`: the declared source roots and layer model now cover
  the custom-shell example, and its layer is constrained to the kit layers while
  forbidding the preset, template app and demo layers.

## Impact

- New: `apps/custom-shell/{index.html,package.json,tsconfig.json,vite.config.ts,README.md,src/**}`,
  including region components, local state, styles, element registration and
  component tests.
- Changed: root `package.json` scripts and `check` order, `package-lock.json`,
  root `tsconfig.json` references, `boundaries.json`, boundary unit fixtures,
  the generalized `scripts/check-example-bundle.mjs` (renamed from the
  minimal-only checker) and `scripts/lib/bundle-composition.mjs` (target label),
  plus README/AGENTS/ROADMAP/architecture and minimal example documentation.
- Unchanged: all five kit packages, the public facade and its export map,
  `distribution.json`, template and minimal behavior, element registration
  semantics, persisted state, the minimal budget and the template's gzip
  baseline. The template's raw JavaScript baseline is updated only for the
  intentional mock-tree growth.
- Compatibility: repository-internal only; no published API or consumer-facing
  contract changes.
