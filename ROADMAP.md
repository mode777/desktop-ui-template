# Workbench Kit Roadmap

**Status:** proposal  
**Working name:** Workbench Kit  
**Scope:** evolve this template into a library-shaped, composable workbench without turning it into a framework  
**Last updated:** 2026-11-11

## 1. Summary

The current repository is a feature-rich VS Code-style template. That is the right product for teams that want to copy a shell and customize it, but it is a poor fit for applications that only need a small part of the surface — for example a single tab plus an options sidebar.

The proposal is to keep the template and add a **library-shaped workbench kit** underneath it, exposed in three adoption levels:

1. **Preset** — `VSCodeWorkbench`, the full composed shell used by the template.
2. **Composition** — individually importable regions (`WorkbenchShell`, `Sidebar`, `TabStrip`, `Panel`, `StatusBar`, …).
3. **Primitives** — headless layout/tab/resize helpers and controlled React components for custom applications.

Tree-shaking is part of the answer, but not the whole answer. Unused functionality must also be **structurally optional**: no all-in-one view registry, no monolithic store, no global command surface and no single CSS bundle in the primitive layer.

The goal is not to become a framework. The goal is to make the shell **copyable, composable and packageable**.

## 2. Why not just a template, why not a framework?

| Approach          | Strength                                                    | Failure mode                                                            |
| ----------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| Copy the template | Maximum control, zero API commitment                        | Fork drift, bug fixes are hard to share, consumers delete a lot         |
| Full framework    | Reusable, versioned, consistent                             | Large support surface, API lock-in, theming/CSS/accessibility contracts |
| **Workbench kit** | Copyable template + composable primitives + optional preset | Requires disciplined boundaries, but no framework runtime               |

The kit should feel like a set of Lego bricks, not an application runtime. Consumers choose how much they want:

- **Small app:** one tab + an options sidebar, using a handful of primitives.
- **Medium app:** composed shell with a custom activity bar and editor.
- **Full IDE-like app:** the preset plus the demo views and command palette.

## 3. Current-state audit

These are the specific things that prevent tree-shaking and selective adoption today.

| Area     | Current shape                                                           | Consequence                                                                       |
| -------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Shell    | `src/layout/Workbench.tsx` statically imports every region              | Importing the shell pulls the whole application                                   |
| Views    | `Sidebar`, `BottomPanel` and `SecondarySideBar` import view registries  | Every view (Explorer, Chat, Terminal, …) is retained                              |
| Commands | `src/commands/commands.ts` and `menus.ts` contain the full surface      | A minimal app that imports menus pulls every action and its data                  |
| State    | one Zustand store with layout, tabs, notifications, output and commands | Features cannot be dropped independently                                          |
| Styles   | one `workbench.css` containing every region and view                    | CSS never shrinks for a minimal consumer                                          |
| Elements | one `src/vscode-elements.ts` registers every used tag                   | A consumer using only tabs still registers trees, context menus, textfields, etc. |
| Data     | `src/data/workspace.ts` mixes tree, documents and app metadata          | Kit modules risk importing demo data                                              |
| Types    | JSX declarations for all elements in one file                           | Acceptable for now; can be split by element later                                 |

Current bundle baseline for the full demo (production build):

- JavaScript: ~417 KB raw, ~117 KB gzip.
- CSS: ~44 KB raw, ~8 KB gzip.
- Codicon font assets are separate.

These numbers are the reference point, not a target. The minimal example's budget must be recorded after the primitive split exists.

## 4. Target model

### 4.1 Adoption levels

```text
┌──────────────────────────────────────────────────────────────┐
│ 4. Preset: VSCodeWorkbench + demo views (the current app)    │
├──────────────────────────────────────────────────────────────┤
│ 3. Composition: WorkbenchShell + regions + optional store    │
├──────────────────────────────────────────────────────────────┤
│ 2. React primitives: controlled components + hooks           │
├──────────────────────────────────────────────────────────────┤
│ 1. Core: layout math, tab model, resize helpers, persistence │
└──────────────────────────────────────────────────────────────┘
```

Consumers can stop at any level.

### 4.2 Target package layout

After validation, move from a single app to npm workspaces:

```text
packages/
  core/                 headless layout/tab/resize/persistence helpers
  react/                controlled React components and hooks
  elements/             optional per-tag vscode-elements registration
  styles-vscode/        tokens, base styles and component CSS
  preset-vscode/        the composed VS Code-style shell
apps/
  template/             current showcase, using the preset
  minimal/              single tab + options sidebar; tree-shaking canary
  custom-shell/         composed shell without the preset
```

Transitional in-repo layout, before packaging:

```text
src/
  kit/
    core/
    react/
    elements/
    styles/
    preset-vscode/
  app/                  the template application
  demo/                 mock views, tree data, commands and menus
```

This lets the team validate boundaries without the cost of a monorepo migration.

### 4.3 What belongs where

| Layer           | May contain                                                       | Must not contain                             |
| --------------- | ----------------------------------------------------------------- | -------------------------------------------- |
| `core`          | layout model, tab model, clamp/resize math, persistence adapters  | React, DOM, app data, vscode-elements        |
| `react`         | controlled components, hooks, context providers                   | demo views, workspace data, command registry |
| `elements`      | per-tag registration side effects, element typings                | app UI, data                                 |
| `styles-vscode` | tokens, base styles, per-component CSS                            | selectors for demo views                     |
| `preset-vscode` | shell composition, default menus/commands, optional default store | hard dependency on demo views                |
| `apps/*`        | views, mock data, app commands, branding, routes                  | shared primitives that belong in the kit     |

The rule of thumb: **the kit knows about regions, not about Explorer, Chat or Terminal.**

## 5. API direction

These are candidates, not frozen APIs. The intent is to make composition the default and a giant config object the convenience layer.

### 5.1 Full preset

```tsx
import { VSCodeWorkbench } from '@scope/workbench/preset-vscode'

export function App() {
  return (
    <VSCodeWorkbench views={appViews} commands={appCommands} initialLayout={layout} theme="dark" />
  )
}
```

### 5.2 Composition

```tsx
import {
  WorkbenchShell,
  ActivityBar,
  ResizableSidebar,
  TabStrip,
  StatusBar,
} from '@scope/workbench/react'

export function App() {
  return (
    <WorkbenchShell
      activityBar={<ActivityBar items={items} />}
      sidebar={
        <ResizableSidebar min={180} max={480} initialWidth={280}>
          <OptionsPanel />
        </ResizableSidebar>
      }
      main={<TabStrip tabs={tabs} activeId={activeId} onChange={setActiveId} />}
      statusBar={<StatusBar left={...} right={...} />}
    />
  )
}
```

`WorkbenchShell` should only own layout and optional region slots. It should not import views, commands, menus or app state.

### 5.3 Primitives

```tsx
import { ResizablePane, useControllableState } from '@scope/workbench/react'
import { clampSize } from '@scope/workbench/core'
```

These are useful when a consumer already has a layout (dockview, CSS grid, their own shell) and only wants the tab or sash behavior.

### 5.4 State

Recommended direction:

- Primitives are **controlled** (`value` + `onChange`) or **uncontrolled** with sensible defaults.
- The optional store is a preset convenience, not a requirement.
- Split the store into slices: layout, tabs, panel, notifications, output.
- Keep persistence adapters injectable (`localStorage`, memory, server) so consumers are not forced into one storage model.

## 6. Packaging and tree-shaking rules

These rules are non-negotiable if the kit is published.

1. **No all-in-one views registry in the kit.** Views are passed in by the app.
2. **No all-in-one commands registry in primitives.** Preset can ship a default registry; composition must not require it.
3. **No top-level barrel that re-exports the world.** Prefer subpath exports or explicit entry points.
4. **Per-entry element registration.** Consumers import `@scope/workbench/elements/icon`, `.../tabs`, `.../tree`, etc. The preset imports what it uses; a minimal app imports a subset.
5. **Per-component CSS.** Token and base CSS are separate entries; view CSS lives in the app. The preset may offer an aggregate CSS entry for convenience.
6. **`sideEffects` metadata** must list CSS and element-registration modules, and nothing else.
7. **No hidden runtime singletons.** Avoid module-level global stores, command registries or portals that initialize on import.
8. **Boundary checks in CI.** A script or dependency-cruiser rule must fail if `kit/core` imports React/DOM or if `kit/react` imports app/demo views.
9. **Bundle canary.** The minimal app is built in CI and checked against a recorded budget.

Example package metadata:

```json
{
  "sideEffects": ["**/*.css", "./dist/elements/register-*.js"],
  "exports": {
    ".": "./dist/preset-vscode/index.js",
    "./react": "./dist/react/index.js",
    "./core": "./dist/core/index.js",
    "./elements/icon": "./dist/elements/icon.js",
    "./styles/tokens.css": "./dist/styles/tokens.css"
  }
}
```

## 7. Phased roadmap

Effort labels are relative, not calendar commitments.

### Phase 0 — Baseline and guardrails (S)

**Goal:** make the current state measurable and prevent boundary regressions during the refactor.

Deliverables:

- Record the current full-preset bundle size in this document or a generated report.
- Add a dependency-boundary check (small script or `dependency-cruiser`).
- Add a bundle-size report script to CI, even before the minimal app exists.
- Add this roadmap and link it from the README.

Exit criteria:

- `npm run check` still passes.
- Baseline numbers are reproducible.
- CI reports bundle size on every push.

### Phase 1 — Headless core (M)

**Goal:** extract logic that does not need React or the DOM.

Deliverables:

- `kit/core/layout`: region sizes, clamp helpers, resize math.
- `kit/core/tabs`: tab model, reorder, close-next-selection, cycle helpers.
- `kit/core/persistence`: storage adapter interface and versioned schema helpers.
- Unit tests for all pure helpers.

Exit criteria:

- `kit/core` imports no React, DOM globals or app data.
- Existing store actions delegate to core helpers where practical.
- Tests cover clamping, tab close selection, reorder and cycling.

### Phase 2 — React primitives (L)

**Goal:** extract presentational and controlled components with no app knowledge.

Initial components:

- `WorkbenchShell` — root flex layout with optional region slots.
- `ResizablePane` / `ResizableSidebar` — controlled size + keyboard and pointer resizing.
- `TabStrip` — tabs, active state, close, reorder callbacks and keyboard navigation.
- `Sidebar` — generic container with header/actions/content slots.
- `Panel` — generic tabbed bottom panel.
- `StatusBar` — left/right item slots.
- `TitleBar` and `MenuBar` — optional, generic and command-callback based.
- `QuickOpen` — optional; keep it in the preset or move it to a separate entry if it remains generic.

Exit criteria:

- The current template can be rebuilt from these primitives without importing app views into the kit.
- Primitives have no imports from `src/views`, `src/data`, `src/commands` or `src/store`.
- Component tests cover the main controlled interactions.

### Phase 3 — Preset and demo separation (M)

**Goal:** make the current application a preset consumer and move app-specific pieces out of the kit.

Deliverables:

- `kit/preset-vscode/VSCodeWorkbench` composes the shell and optional default store.
- Move Explorer, Search, Source Control, Run, Extensions, Chat, Panel and Welcome into `src/demo` or `src/app/views`.
- Move menus and demo commands into the app; the preset receives them as props.
- Keep the mock workspace data in the app.

Exit criteria:

- The live template behaves exactly as today, but imports the preset.
- The kit has no dependency on mock workspace data or demo view components.
- A consumer can use the preset without receiving the demo views.

### Phase 4 — Minimal example and tree-shaking proof (M)

**Goal:** prove that a small app is actually small.

Deliverables:

- `apps/minimal` (or `examples/minimal` transitionally): one tab, one options sidebar, optional status bar.
- A build script and bundle budget for that app.
- A check that the minimal bundle does not include terminal, chat, explorer, command-palette or demo data modules.
- Document the three adoption levels using that example.

Exit criteria:

- Minimal app builds and passes the budget.
- The full preset still builds.
- The difference is explainable, not just “the bundler removed it”.

Suggested initial budget: record the baseline, then aim for **one-third of the full preset's gzipped JS** or less for the minimal app. Adjust after the first measured build rather than guessing.

### Phase 5 — Workspaces and packages (M/L)

**Goal:** make the kit a real dependency without losing the copyable template.

Deliverables:

- npm workspaces (or pnpm workspaces, decide explicitly).
- `packages/core`, `packages/react`, `packages/elements`, `packages/styles-vscode`, `packages/preset-vscode`.
- `apps/template`, `apps/minimal`, `apps/custom-shell`.
- `exports`, `sideEffects`, peer dependencies (`react`, `react-dom`, optionally `@vscode-elements/elements`).
- Root scripts for `build`, `test`, `lint`, `format`, `size`, `boundaries`.

Exit criteria:

- `npm run check` runs the full workspace verification.
- `npm pack` produces installable packages.
- A consumer app can import preset, composition or primitives without relative paths into the repo.

### Phase 6 — Documentation, migration and 0.x release (M)

**Goal:** make adoption safe and predictable.

Deliverables:

- API docs for preset, composition and primitives.
- A migration guide from the current template to the kit.
- An “eject” guide: start with the preset, move to composition, then primitives.
- Changelog, versioning policy, license/third-party notices.
- Publish `0.x` only after at least two real consumers or examples validate the API.

Exit criteria:

- A new user can build the minimal app from docs alone.
- Breaking changes are listed in the changelog.
- The template remains copyable and works without installing the packages.

### Later — hardening (not required for 0.x)

- SSR support or explicit “browser-only” documentation.
- Playwright visual regression for the demo.
- Additional presets (compact shell, inspector shell, single-column shell).
- Optional adapters for other layout/state libraries.
- More granular element registration and CSS subpath exports.

## 8. First pull requests

A pragmatic sequence that keeps `main` shippable:

1. **This roadmap + README link.**
2. **Baseline script:** build size report and boundary check in CI.
3. **`kit/core`:** move clamp/resize and tab helpers, add tests.
4. **`kit/react/ResizablePane`:** extract as a controlled primitive; update the current template to use it.
5. **`kit/react/TabStrip`:** extract editor tabs; keep the existing visual output.
6. **`kit/react/WorkbenchShell`:** compose the existing regions without importing views.
7. **Preset + demo separation:** move views/data/menus into the app layer.
8. **Minimal example:** single tab + options sidebar + budget check.
9. **Workspace migration:** only after the minimal example is stable.

Each step should be a separate PR with a visible demo change or a bundle report. Avoid one giant refactor.

## 9. Verification and CI

Current checks:

```bash
npm run check   # lint, format, typecheck, tests, build
```

Add for the kit:

```bash
npm run check:boundaries   # kit must not import app/demo modules
npm run build:minimal      # minimal example build
npm run size:minimal       # bundle budget / report
npm run pack:check         # npm pack inspection (later)
```

Testing layers:

- Unit tests for `core` helpers.
- Component tests for controlled primitives.
- Integration tests for the preset.
- Bundle canary for the minimal app.
- Manual or Playwright visual smoke for the full template.

## 10. Metrics

Track these explicitly instead of relying on intuition:

- Full preset JS/CSS gzip size.
- Minimal app JS/CSS gzip size.
- Number of registered custom elements in each example.
- Build time for the template and the minimal app.
- Boundary violations (must be zero).
- Number of public entry points and exported components.

## 11. Risks and mitigations

| Risk                                     | Mitigation                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Premature abstraction creates a bad API  | Keep the kit internal until the minimal and custom examples are stable; ship 0.x                  |
| Tree-shaking claims are not real         | Build the minimal app in CI and inspect the output; no registry maps in primitives                |
| CSS leakage or conflicting global styles | Prefix classes (`wb-`), use CSS layers, ship per-component CSS, avoid resets outside the kit root |
| Custom elements are side-effectful       | Per-tag registration entries; preset imports only what it uses                                    |
| Global store couples features            | Controlled primitives first; optional store only at preset level; store slices                    |
| Documentation drifts from code           | Examples are executable; add API checks and link examples from docs                               |
| Scope creep into a framework             | Re-read the non-goals; no plugin runtime, no server, no editor implementation                     |
| Breaking the showcase during refactor    | Refactor in small PRs; keep the demo visually identical at each step                              |

## 12. Open decisions

These should be resolved before publishing, not necessarily before the internal split.

- **Controlled vs uncontrolled:** recommend controlled for primitives, uncontrolled convenience at the preset.
- **Store:** keep Zustand internally, or expose a store-agnostic context? Recommendation: primitives controlled; Zustand only in the optional preset.
- **vscode-elements:** peer dependency or optional adapter? Recommendation: peer for `elements` and `preset-vscode`; core stays framework-agnostic.
- **CSS:** plain prefixed CSS with layers vs CSS modules. Recommendation: prefixed CSS + layers for overrideability and simpler library builds.
- **Preset contents:** shell only, or shell + demo views? Recommendation: shell + generic commands, with demo views in the template.
- **Package scope/name:** placeholder `@scope/workbench`; decide before first publish.
- **Monorepo tool:** npm workspaces is sufficient unless release tooling requires pnpm/turborepo.
- **SSR:** explicitly out of scope for 0.x unless a consumer needs it.
- **Naming:** “Workbench Kit” is the working name; avoid “framework” in the public description.

## 13. Non-goals

- Replacing VS Code, Theia or a docking library.
- Shipping a real code editor, terminal backend, file system or Git backend.
- A plugin runtime or extension marketplace.
- A universal application framework with routing, auth or data fetching.
- A stable public API before the kit has been validated by real applications.

## 14. Definition of done

The transformation is complete when:

- The template still works and remains copyable.
- The preset, composition and primitive layers are documented and importable.
- A single-tab + options-sidebar example builds with a recorded, enforced bundle budget.
- Primitives contain no app views, demo data or global command registry.
- The full preset contains no hidden dependency on the demo.
- CI checks boundaries, sizes and the existing lint/test/build suite.
- Packages can be packed and consumed without relative imports into the repo.
- A 0.x release is possible without breaking the template's showcase.
