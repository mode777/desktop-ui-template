# Design

## Context

See [`proposal.md`](./proposal.md) for motivation and the delta specs for
required behavior.

The repository currently has two application workspaces:

- `apps/template` uses `VSCodeWorkbench` from the preset and supplies views,
  commands, menus, branding and demo data as props.
- `apps/minimal` composes `WorkbenchShell`, `ResizablePane` and `TabStrip` for
  one tab and one options sidebar; it is the tree-shaking canary.

The kit exposes four controlled primitives (`WorkbenchShell`, `ResizablePane`,
`TabStrip`, `IconButton`) and no generic region containers. `ActivityBar`,
`Sidebar`, `BottomPanel`, `SecondarySideBar` and `TitleBar` remain preset
components coupled to the preset store. The shared stylesheet already defines
the structural class contract (`workbench`, `workbench-body`, `workbench-center`,
`titlebar`, `activitybar`, `sidebar`, `editor-area`, `panel`, `statusbar`) and
the element package provides per-tag registration.

The remaining Phase 5 deliverable is `apps/custom-shell`: a composed shell
without the preset. This design adds it without changing the kit, the preset or
either existing application.

## Goals / Non-Goals

**Goals:**

- Add a third private application that composes the full shell surface from
  existing primitives and app-owned regions.
- Prove consumer-owned state and region visibility without a preset store,
  command registry or persistence layer.
- Reuse the existing per-tag element and stylesheet entries, and keep the
  example's own CSS separate from the kit.
- Extend the boundary and bundle-composition checks so a preset or template
  import fails with a precise report.
- Keep one root install, one standard verification command and the existing
  template/minimal size targets; the minimal budget and template gzip baseline
  stay unchanged.

**Non-Goals:**

- Promoting `ActivityBar`, `Sidebar`, `BottomPanel`, `SecondarySideBar`,
  `TitleBar` or `StatusBar` into `packages/react`. That is a separate API
  decision, and the example exists to validate composition first.
- Adding persistence, a command palette, notifications, a context menu or a
  real document editor.
- Adding a third bundle budget, changing `distribution.json`, changing the
  facade export map, or publishing.
- Modifying the preset, template, minimal application or kit behavior.

## Decisions

### 1. A third private workspace application, built like the minimal example

`apps/custom-shell` is the workspace package `@workbench-kit/custom-shell-app`
(`private: true`). It declares only `@workbench-kit/core` (optional, for tab
helpers), `@workbench-kit/react`, `@workbench-kit/elements`,
`@workbench-kit/styles-vscode`, React, React DOM and vscode-elements.

Its `vite.config.ts` follows the minimal example: app root, `base: './'`,
shared root `public/`, workspace aliases, `manifest: true`, app-local
`apps/custom-shell/dist/`, and the build-emitted module inventory used by the
composition check. The module-inventory plugin is extracted from
`apps/minimal/vite.config.ts` into `scripts/vite-module-inventory.mjs` so both
examples emit the same `.vite/modules.json` artifact.

Root commands follow the existing pattern:

- `dev:custom-shell` and `build:custom-shell` delegate to the workspace.
- `build:custom-shell` runs the Codicon sync as a `prebuild` step.
- `check:custom-shell` runs the composition check against
  `apps/custom-shell/dist`.
- `main.js` is a separate HTML entry/output; nothing is written into the
  template or minimal output directories.

**Why:** the application workspace is the existing proof that kit imports
resolve by package name, and reusing the minimal build shape avoids a third
build model.

**Alternative considered:** a plain directory outside the workspace. Rejected:
it would not prove package-name resolution and would repeat the coupling the
relocation change removed.

### 2. Consumer-owned region components, no new kit primitives

The example owns `TitleBar`, `ActivityBar`, `Sidebar`, `EditorArea`,
`BottomPanel`, `SecondarySideBar` and `StatusBar` components under
`apps/custom-shell/src/regions`. They receive data and callbacks through props;
they do not read a store or a command registry.

The primitives stay exactly as published: `WorkbenchShell` for region slots,
`ResizablePane` for sidebar and panel sizing, `TabStrip` for editor tabs and
`IconButton` for the activity rail and toolbar actions.

**Why:** Phase 5 asks for the application, not for a new public region API. A
generic `ActivityBar` or `Panel` would need careful prop design, tests, docs and
an API commitment. The example demonstrates that the current shell is
sufficient for a medium consumer, and it produces the evidence needed before
promoting anything.

**Alternative considered:** extract the preset regions into `packages/react`
first and build custom-shell from them. Rejected for this change: it expands the
public surface and couples the app deliverable to an unrelated API design.

### 3. One local reducer plus core tab helpers

`App.tsx` owns a single `useReducer` state shape:

```ts
interface CustomShellState {
  activityId: string
  primaryVisible: boolean
  secondaryVisible: boolean
  panelVisible: boolean
  panelMaximized: boolean
  primaryWidth: number
  secondaryWidth: number
  panelHeight: number
  tabs: CustomShellTab[]
  activeTabId: string | null
  panelTabId: string
}
```

Tab transitions delegate to `activateTabIn`, `closeTabIn` and `reorderTabIn`
from `@workbench-kit/core`; opening a tab reuses `openTabIn` if the example
offers a command for it. Transient drag preview stays inside `TabStrip` and
`ResizablePane`. There is no persistence.

**Why:** a reducer keeps the state transitions testable and prevents the example
from growing a preset-shaped store. The core helpers already encode the active
tab selection and reorder behavior, so the example does not reimplement it.

**Alternative considered:** several `useState` calls in `App.tsx`. Rejected for
the tab/region state because related transitions such as close-active-tab would
be split across setters and harder to test. Simple display values may still use
local state inside a region.

**Alternative considered:** Zustand or the preset store. Rejected: both would
break the composition-level contract and hide preset coupling.

### 4. Region slots express visibility; the shell keeps no region state

The slot mapping is:

| Shell slot         | Example node                                                               |
| ------------------ | -------------------------------------------------------------------------- |
| `titleBar`         | app mark, title, layout toggles and panel maximize control                 |
| `activityBar`      | local activity items; activating one shows/switches the primary sidebar    |
| `primarySideBar`   | `ResizablePane` + app-owned sidebar, only while `primaryVisible`           |
| `children`         | `TabStrip` + document area for the active tab                              |
| `panel`            | `ResizablePane` + `vscode-tabs` panel, only while `panelVisible`           |
| `secondarySideBar` | `ResizablePane` + app-owned inspector, only while `secondaryVisible`       |
| `statusBar`        | active tab, region state, panel tab and width readouts                     |
| `overlays`         | not used; the example has no notification or quick-open surface            |
| `panelMaximized`   | example state; the shell hides the center content and fills with the panel |

Hiding a region passes `null` for that slot. The shell therefore stays
stateless, and a consumer can remove a region without a preset config flag.

**Why:** this is the composition contract the shell already defines. It also
makes the example a direct test of slot omission and panel maximization.

**Alternative considered:** keep region wrappers mounted and hide them with CSS.
Rejected: it would keep focusable hidden content and would not exercise slot
omission.

### 5. Reuse the shared structural CSS; keep app styling app-local

`main.tsx` imports `tokens.css`, `global.css` and `workbench.css`, then a single
`custom-shell.css`. Region components use the existing structural class names
and the shell's pane/sash contract. Example-specific selectors are prefixed
`custom-shell-` and live only in the app. No new kit stylesheet entry is added.

The example uses `vscode-icon`, `vscode-tab-header`, `vscode-tabs` and
`vscode-tab-panel`, registered one tag per entry from `@workbench-kit/elements/*`.
The editor tab strip uses `TabStrip` (which renders `vscode-tab-header`); the
bottom panel uses `vscode-tabs` with `vscode-tab-header` and
`vscode-tab-panel`.

**Why:** the structural class names are the documented styling contract, and
the example must prove that a consumer can get the workbench look without the
preset's component CSS additions. Keeping app CSS local preserves the
"view CSS stays in the app" rule.

**Alternative considered:** a new aggregate CSS entry for examples. Rejected:
it would blur the kit boundary and add a shipped style entry only for examples.

### 6. Generalize the composition check instead of duplicating it

The current CLI already accepts `--dist` and `--entry`, but it prints
"minimal" and points at `build:minimal`. It is renamed to
`scripts/check-example-bundle.mjs` and gains `--label` and `--build-command`
options. `inspectBundle` gains a target label used in violation messages. The
forbidden module prefixes stay `apps/template/src/` and
`packages/preset-vscode/`; the same UI markers stay in force.

Root scripts become:

```json
"check:minimal": "node scripts/check-example-bundle.mjs --dist apps/minimal/dist --label minimal --build-command \"npm run build:minimal\"",
"check:custom-shell": "node scripts/check-example-bundle.mjs --dist apps/custom-shell/dist --label custom-shell --build-command \"npm run build:custom-shell\""
```

The custom-shell app must avoid the template's exact demo markers
(`explorer-view`, `terminal-view`, `chat-view`, `welcome-view`,
`quick-open-overlay`, `Desktop UI Template`). If a marker is intentional in the
example, the marker list is reviewed rather than silently broadened.

**Why:** one checker keeps the rule set identical for both examples and prevents
the custom-shell check from drifting from the minimal check.

**Alternative considered:** a second CLI that calls `inspectBundle`. Rejected:
it duplicates argument handling and error messages, and two checks with the same
rules should not have two entry points.

### 7. Boundaries gain a fourth application root and layer

`boundaries.json` adds `apps/custom-shell/src` to `roots` and an
`example-custom-shell` layer with the same permissions as `example-minimal`:
kit core, kit React, kit elements, kit styles, its own layer, React, React DOM
and vscode-elements. It may not import the preset, template app or demo layers.

The boundary unit fixtures add custom-shell layer resolution and a negative case
where a custom-shell module imports the preset. No checker code changes are
needed; the declaration is data.

**Why:** without the root, the example's imports are unchecked, and a preset
import could slip in. Reusing the minimal layer's permissions keeps the two
examples' contracts aligned.

**Alternative considered:** share the `example-minimal` layer. Rejected: it
would make the layer name misleading and would let a future permission change
for one example affect the other silently.

### 8. No third bundle budget

The custom-shell example is built and composition-checked, but not added to
`size` / `budgets.json`. The existing budget model measures the full preset and
the minimal canary; custom-shell is a composition reference, not a size gate.
Its value is the module-inventory proof that preset, template and demo code did
not leak.

Adding the custom-shell subtree to the template's mock workspace data grows the
template's raw JavaScript because the demo explorer embeds those paths. The raw
baseline is therefore recorded at the measured value (428,750 B); the gzip
baseline (117,056 B) and the minimal budget stay unchanged. This follows the
documented “update the baseline deliberately” procedure and is limited to the
intentional mock-tree growth.

**Why:** a third budget adds a maintenance surface without a tree-shaking
question to answer, and the alternative — dropping the new mock entries — would
leave the demo explorer inconsistent with the repository. The roadmap's size
targets remain the template and minimal application.

**Alternative considered:** record a third baseline. Rejected for this phase;
revisit if custom-shell becomes the primary composition reference and needs
regression tracking.

### 9. Documentation and demo data move with the example

The example gets its own README covering regions, state, imports, element
registration, commands and what it deliberately omits. The root `README.md`,
`AGENTS.md`, `ROADMAP.md`, `docs/architecture.md` and `apps/minimal/README.md`
add the example to the application layout, adoption-level explanation, commands,
verification matrix and Phase 5 status. The template's mock workspace tree adds
`apps/custom-shell` so the demo explorer stays consistent with the repository.

**Why:** the example is only useful if a reader can find it and understand which
level it represents. The mock tree is visible product content and would
otherwise show an outdated repository.

## Risks / Trade-offs

- **The example drifts into a preset clone** → keep region components small and
  props-driven; do not add a command registry, notifications, quick open or
  menus; review against the "regions, not views" rule; tests assert local state.
- **A preset or template import sneaks in through copied chrome** → add the
  boundary layer and bundle check together; the composition check forbids both
  `apps/template/src/` and `packages/preset-vscode/`.
- **Reusing structural class names couples the example to kit CSS** → that is
  the intended styling contract; keep only example-specific selectors in
  `custom-shell.css` and do not modify the shared stylesheet.
- **`vscode-tabs` selection is a custom event React does not expose as a prop** →
  attach `vsc-tabs-select` via a ref in the panel region, as the preset does;
  test by dispatching the event with a selected index.
- **jsdom does not implement custom elements** → render the elements as unknown
  tags in tests and assert region/state behavior through accessible roles,
  labels and dispatched events; do not add a test-only aggregate registration.
- **The extra build increases local and CI time** → reuse the existing Vite
  config shape and plugin; add no new CI job; run the build after the minimal
  build in the existing `check` sequence.
- **Root scripts, TypeScript references and the lockfile drift** → update them
  together, run a clean `npm ci`, `npm ls -w @workbench-kit/custom-shell-app`,
  and `npx tsc -b`; verify no nested lockfile appears.
- **The composition check reports a false positive on legitimate example text**
  → avoid the template's exact demo markers and keep the marker list shared and
  reviewed.

## Migration Plan

1. Scaffold `apps/custom-shell` with manifest, HTML entry, Vite config, TypeScript
   project, element registration and root scripts; extract the module-inventory
   plugin for reuse.
2. Implement the reducer, region components, primitives composition, styles and
   panel tab selection.
3. Add component tests for rendering, region toggles, tab lifecycle, panel
   switching, status readouts and resizing.
4. Add the `example-custom-shell` boundary layer and root, update fixtures, and
   run the boundary check.
5. Generalize the composition check, add `check:custom-shell`, wire both the
   build and the check into `npm run check`, and verify the minimal check still
   passes.
6. Update the READMEs, architecture/roadmap/AGENTS docs, CI description and the
   template's mock workspace tree.
7. Run a clean `npm ci`, the full `npm run check`, the two existing size
   commands, and a manual dev/preview smoke check at 1440×900 and a narrow
   width.

Rollback is a normal revert: remove the application and its scripts, boundary
layer, composition-check generalization and documentation changes. No persisted
state, public API or data migration is involved.

## Open Questions

None.
