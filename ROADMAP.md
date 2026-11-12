# Workbench Kit Roadmap

**Status:** active — public facade, packed-tarball validation and all three application examples complete; contributor documentation and release readiness complete; Phase 7 consumer documentation and agent adoption implemented; post-publish acceptance pending; registry publication is tag-triggered through npm trusted publishing after the one-time bootstrap\
**Next startable change:** the first tag-triggered `vscode-workbench` release, followed by the Phase 7 post-publish acceptance path. Later hardening and any other unstarted items wait behind it; the npm bootstrap and trusted-publisher setup are complete.\
**Working name:** Workbench Kit\
**Scope:** evolve this template into a library-shaped, composable workbench without turning it into a framework\
**Distribution:** five private internal modules, one published npm package\
**Last updated:** 2026-11-12

## 1. Summary

The current repository is a feature-rich VS Code-style template. That is the right product for teams that want to copy a shell and customize it, but it is a poor fit for applications that only need a small part of the surface — for example a single tab plus an options sidebar.

The proposal is to keep the template and add a **library-shaped workbench kit** underneath it, exposed in three adoption levels:

1. **Preset** — `VSCodeWorkbench`, the full composed shell used by the template.
2. **Composition** — individually importable regions (`WorkbenchShell`, `Sidebar`, `TabStrip`, `Panel`, `StatusBar`, …).
3. **Primitives** — headless layout/tab/resize helpers and controlled React components for custom applications.

Tree-shaking is part of the answer, but not the whole answer. Unused functionality must also be **structurally optional**: no all-in-one view registry, no monolithic store, no global command surface and no single CSS bundle in the primitive layer.

The goal is not to become a framework. The goal is to make the shell **copyable, composable and packageable**.

The distribution decision is deliberately separate from the source split: the kit keeps **five private internal modules** (`core`, `react`, `elements`, `styles-vscode`, `preset-vscode`) but publishes **one npm package** with subpath exports. The modules make boundaries enforceable and the dependency graph buildable; the single package keeps installation and versioning simple for consumers. See [`docs/architecture.md`](./docs/architecture.md).

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

The original tree-shaking blockers were addressed by Phases 1–4. The current state is:

| Area         | Current state                                                                                                                                  | Remaining consequence                                                                                            |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Modules      | Five private workspaces under `packages/`; `core`, `react`, `elements` and `preset-vscode` build to `dist/`                                    | The generated facade consumes their output                                                                       |
| Template     | `apps/template` consumes `@workbench-kit/*`; demo stays in `apps/template/src/demo`                                                            | The custom-shell example is complete; registry publication remains gated                                         |
| Views        | View registries live only in the app; the preset receives them as props                                                                        | Region chrome is in `react`; the preset keeps thin view/store adapters                                           |
| Commands     | Preset ships generic commands; app composes demo commands                                                                                      | No app or demo command enters the preset                                                                         |
| State        | Preset owns layout/tab state; primitives are controlled                                                                                        | Store slices and broader store-agnostic adoption remain future work                                              |
| Styles       | Tokens, base CSS and demo CSS are separate; every reusable component has its own stylesheet entry and `workbench.css` is the ordered aggregate | The template keeps the aggregate convenience entry by design; CSS modules and a hard CSS gate remain future work |
| Elements     | Per-tag entries exist and the preset registers only its subset                                                                                 | The template still uses an aggregate entry by design                                                             |
| Distribution | One public facade built from the five private modules; one packed tarball validated by `pack:check`                                            | Documentation and release checks complete; registry publication remains gated                                    |

Current bundle baseline for the template, recorded in [`budgets.json`](./budgets.json) and reproduced by `npm run size`:

- JavaScript: 430,535 B raw, 118,736 B gzip.
- CSS: 44,515 B raw, 8,172 B gzip.
- Codicon font assets are separate.

The minimal example is recorded independently in [`budgets.minimal.json`](./budgets.minimal.json): 254,276 B raw / 79,054 B gzip JavaScript and 19,261 B raw / 4,106 B gzip CSS. The CSS baseline dropped from 47,289 B raw / 8,579 B gzip when the example switched from the aggregate stylesheet to the shell, pane, tab-strip and status-bar entries. `npm run size` and `npm run size:minimal` regenerate the numbers and write per-asset details to their reports; see the bundle budget section in the [README](README.md#bundle-budget).

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

The target has five private internal modules and one public distribution package:

```text
packages/
  core/                 internal: headless layout/tab/resize/persistence helpers
  react/                internal: controlled React components and hooks
  elements/             internal: optional per-tag vscode-elements registration
  styles-vscode/        internal: tokens, base styles and component CSS
  preset-vscode/        internal: the composed VS Code-style shell
  workbench/            PUBLIC: subpath facade over the five modules; the only pack/publish target
apps/
  template/             current showcase, using the preset
  minimal/              single tab + options sidebar; tree-shaking canary
  custom-shell/         composed shell without the preset
```

Current in-repo layout after the first workspace migration:

```text
package.json            npm workspace host and verification orchestration
apps/
  template/             full showcase application
  minimal/              one tab + options sidebar; the tree-shaking canary
  custom-shell/         complete shell composed without the preset
packages/
  core/                 private internal module
  react/                private internal module
  elements/             private internal module
  styles-vscode/        private internal module
  preset-vscode/        private internal module
  workbench/            public facade with generated dist/
test/                   shared Vitest setup
```

The template stays copyable while the internal boundaries are validated. The
template, minimal and custom-shell applications are workspace consumers under
`apps/*`, and the facade is the only package that may leave `private`.

### 4.3 What belongs where

| Layer                | May contain                                                      | Must not contain                                                       |
| -------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `core`               | layout model, tab model, clamp/resize math, persistence adapters | React, DOM, app data, vscode-elements                                  |
| `react`              | controlled components, hooks, context providers                  | demo views, workspace data, command registry                           |
| `elements`           | per-tag registration side effects, element typings               | app UI, data                                                           |
| `styles-vscode`      | tokens, base styles, per-component CSS                           | selectors for demo views                                               |
| `preset-vscode`      | shell composition, default commands, optional default store      | hard dependency on demo views, menus, data or branding                 |
| `workbench` (public) | export map, build output, re-exports and bundling metadata       | authored UI, app/demo content, runtime dependencies on private modules |
| `apps/*`             | views, mock data, app commands, branding, routes                 | shared primitives that belong in the kit                               |

The rule of thumb: **the kit knows about regions, not about Explorer, Chat or Terminal.** The public package is a distribution artifact, not a sixth implementation layer.

## 5. API direction

These are candidates, not frozen APIs. The intent is to make composition the default and a giant config object the convenience layer.

### 5.1 Full preset

```tsx
import { VSCodeWorkbench } from '@scope/workbench'

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

1. **Five private internal modules, one published package.** `packages/*` keep the source boundaries and stay `private: true`. `packages/workbench` is the only publish target and bundles their public entries.
2. **No all-in-one views registry in the kit.** Views are passed in by the app.
3. **No all-in-one commands registry in primitives.** Preset can ship a default registry; composition must not require it.
4. **No top-level barrel that re-exports the world.** The public package uses subpath exports or explicit entry points.
5. **Per-entry element registration.** Consumers import `@scope/workbench/elements/icon`, `.../tabs`, `.../tree`, etc. The preset imports what it uses; a minimal app imports a subset.
6. **Per-component CSS.** Token and base CSS are separate entries; view CSS lives in the app. The preset may offer an aggregate CSS entry for convenience.
7. **`sideEffects` metadata** must list CSS and element-registration modules, and nothing else.
8. **No hidden runtime singletons.** Avoid module-level global stores, command registries or portals that initialize on import.
9. **Boundary checks in CI.** The source check fails if `core` imports React/DOM or `react` imports app/demo views; the distribution check fails if an internal module becomes public or the publish surface grows.
10. **Bundle canary.** The minimal app is built in CI and checked against a recorded budget.

Example public package metadata:

```json
{
  "name": "@scope/workbench",
  "private": false,
  "sideEffects": ["**/*.css", "./dist/elements/*.js"],
  "exports": {
    ".": "./dist/preset/index.js",
    "./react": "./dist/react/index.js",
    "./core": "./dist/core/index.js",
    "./elements/icon": "./dist/elements/icon.js",
    "./styles/tokens.css": "./dist/styles/tokens.css"
  }
}
```

The five internal manifests stay `private`, are not published as dependencies of
the facade and are never installed by consumers.

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

**Status:** done — [`packages/core`](./packages/core) provides the layout, tabs and persistence helpers with colocated unit tests; the store and `ResizablePane` delegate to them.

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

**Status:** done — [`packages/react`](./packages/react) provides the controlled shell, pane, tab-strip and icon-button primitives plus `ActivityBar`, `Sidebar`, `Panel`, `StatusBar`, `TitleBar`, `MenuBar` and `ContextMenu`. The preset keeps thin store/config/view adapters over them, and the custom-shell example composes the full shell without the preset. Component tests cover the controlled interactions.

**Goal:** extract presentational and controlled components with no app knowledge.

Initial components:

- `WorkbenchShell` — root flex layout with optional region slots.
- `ResizablePane` / `ResizableSidebar` — controlled size + keyboard and pointer resizing.
- `TabStrip` — tabs, active state, close, reorder callbacks and keyboard navigation.
- `ActivityBar` — controlled navigation rail: items, active id, activation and action callbacks.
- `Sidebar` — generic container with header, actions, content and close callbacks; the secondary region uses a modifier class.
- `Panel` — controlled tabbed bottom panel with optional maximize/close callbacks.
- `StatusBar` — left/right item slots.
- `TitleBar` — three structural slots and an optional double-activation callback.
- `MenuBar` and `ContextMenu` — command-id dispatch and a controlled context-menu portal.
- `QuickOpen` — optional; remains preset-only while it stays domain-specific.

Exit criteria:

- The current template can be rebuilt from these primitives without importing app views into the kit.
- Primitives have no imports from `apps/template/src/app` or `apps/template/src/demo`, and no dependency on the preset store.
- Component tests cover the main controlled interactions.

### Phase 3 — Preset and demo separation (M)

**Status:** done — [`packages/preset-vscode`](./packages/preset-vscode) provides `VSCodeWorkbench` (shell composition from consumer props, generic regions, the default store and generic tab/layout commands); the template is wired in [`apps/template/src/app/App.tsx`](./apps/template/src/app/App.tsx) and its views, commands, menus and mock data live in [`apps/template/src/demo`](./apps/template/src/demo), which the preset never imports.

**Goal:** make the current application a preset consumer and move app-specific pieces out of the kit.

Deliverables:

- `kit/preset-vscode/VSCodeWorkbench` composes the shell and optional default store.
- Move Explorer, Search, Source Control, Run, Extensions, Chat, Panel and Welcome into `apps/template/src/demo`.
- Move menus and demo commands into the app; the preset receives them as props.
- Keep the mock workspace data in the app.

Exit criteria:

- The live template behaves exactly as today, but imports the preset.
- The kit has no dependency on mock workspace data or demo view components.
- A consumer can use the preset without receiving the demo views.

### Phase 4 — Minimal example and tree-shaking proof (M)

**Status:** done — [`apps/minimal`](./apps/minimal) composes `WorkbenchShell`, `ResizablePane` and `TabStrip` into one tab, one options sidebar and a status bar; it imports no preset, app or demo modules and registers only `vscode-tab-header` and `vscode-icon`. Its baseline is recorded in [`budgets.minimal.json`](./budgets.minimal.json) at 254,276 B raw / 79,054 B gzip JavaScript (66.6 % of the full preset) and 47,289 B raw / 8,579 B gzip CSS; `npm run check:minimal` verifies the bundle composition and CI gates both targets.

**Goal:** prove that a small app is actually small.

Deliverables:

- `apps/minimal`: one tab, one options sidebar, optional status bar.
- A build script and bundle budget for that app.
- A check that the minimal bundle does not include terminal, chat, explorer, command-palette or demo data modules.
- Document the three adoption levels using that example.

Exit criteria:

- Minimal app builds and passes the budget.
- The full preset still builds.
- The difference is explainable, not just “the bundler removed it”.

Suggested initial budget: record the baseline, then aim for **one-third of the full preset's gzipped JS** or less for the minimal app. Adjust after the first measured build rather than guessing.

### Phase 5 — Internal modules and one distribution package (M/L)

**Status:** done — npm workspaces, the template, minimal and custom-shell applications under `apps/*`, the five private `@workbench-kit/*` modules, the `packages/workbench` public facade and `npm run pack:check` exist. `npm run check:distribution` validates the public surface, `npm run check` builds and consumes one tarball, and `check:minimal`/`check:custom-shell` verify both example bundles. Publishing is Phase 6.

**Goal:** make the kit a real dependency without losing the copyable template and without exposing the internal module split as five installs.

Deliverables:

- Keep `packages/core`, `packages/react`, `packages/elements`, `packages/styles-vscode` and `packages/preset-vscode` as private internal modules.
- Add `packages/workbench` as the single publish facade with subpath exports for preset, primitives, core, elements and styles.
- Bundle or emit the five modules into the facade's `dist/`; do not add runtime dependencies on the private workspaces.
- Applications live at `apps/template`, `apps/minimal` and `apps/custom-shell`.
- Keep `exports`, `sideEffects`, peer dependencies (`react`, `react-dom`, `@vscode-elements/elements`) and the `check:distribution` guard aligned with the public surface.
- Root scripts for `build`, `test`, `lint`, `format`, `size`, `boundaries`, `distribution` and `pack:check`.

Exit criteria:

- `npm run check` runs the full workspace verification.
- `npm pack` produces **one** installable tarball from `packages/workbench`.
- A consumer app can import preset, composition, primitives, element entries and styles through that package without relative paths into the repo.
- All five internal modules remain `private: true` and absent from the published runtime dependency graph.

### Phase 6 — Contributor documentation and release readiness (M)

**Status:** contributor documentation and release readiness done — the API
reference, migration and eject guides, release policy, changelog,
license/third-party notices, `check:docs` and `check:release` are in the
repository. These documents describe the repository and assume a checkout.
Consumer-facing documentation is Phase 7. The public name is `vscode-workbench`;
release publishing is tag-triggered after the one-time npm bootstrap.

**Goal:** make the repository and release process safe and predictable for
contributors and maintainers.

Deliverables:

- API docs for preset, composition, primitives and public subpath entries.
- A migration guide from the current template to the published package.
- An “eject” guide: start with the preset, move to composition, then primitives.
- Changelog and versioning policy for the single package; internal modules share its version.
- License and third-party notices.
- **Pending:** publish the first `0.x` release by pushing its version tag; the owner approved the final name `vscode-workbench` and the package has been bootstrapped.

Exit criteria:

- Contributor docs cover the API, migration and eject paths.
- Breaking changes are listed in the changelog.
- The template remains copyable and works without installing the package.
- The published tarball contains no app/demo content and no private module dependencies.
- `npm run check:docs` and `npm run check:release` pass, and the tarball contains its license and notices.
- The publish step is documented as tag-triggered and uses short-lived OIDC credentials; CI holds no long-lived publish token.

### Phase 7 — Consumer documentation and agent adoption (M)

**Status:** 7A, 7B and 7C implemented — the package ships its consumer docs,
agent guide and `llms.txt`; the docs site and raw Markdown are built under
`/docs/`; the quickstart and adoption checks pass against the packed tarball.
The registry install and the `published` availability flip remain after the
first tag-triggered release.

**Goal:** make the published package adoptable from the package alone, without
repository access, by both humans and coding agents, while keeping consumer docs
completely separate from contributor docs.

**7A — Package-local consumer docs and separation (S/M)**

**Status:** done — consumer docs, the app-level `AGENTS.md`, the package README,
the tarball contract and the boundary checks are in place.

- Move consumer-only docs into `packages/workbench/docs/`: index, quickstart,
  concepts, recipes, reference, eject and changelog.
- Add `packages/workbench/AGENTS.md` for app builders. Keep root `AGENTS.md` and
  root `docs/` contributor-only, with a one-way pointer.
- Restructure the package README as the npm landing page with absolute docs
  links and an offline-docs note.
- Ship `docs/`, `AGENTS.md` and `llms.txt` in the tarball; extend the pack-check
  allowlist.
- Add a docs boundary check: consumer docs may not link to contributor docs,
  repository paths or private module names; the tarball contains only consumer
  docs.
- Scrub private package names from consumer docs; use published specifiers only.

Exit criteria:

- An empty project can install the packed tarball and build the quickstart with
  no repository access.
- The consumer boundary check and `check:docs:consumer` pass.
- The tarball contains consumer docs and no contributor docs.

**7B — Hosted docs site, raw Markdown and `llms.txt` (M)**

**Status:** done — the VitePress site builds under `/docs/`, raw Markdown and
`llms.txt`/`llms-full.txt` are published with the demos, and the Pages workflow
builds them.

- Build a consumer-only docs site from `packages/workbench/docs/` under `/docs/`
  on the existing GitHub Pages site.
- Publish raw Markdown under `/docs/raw/` for clean agent ingestion.
- Generate `/llms.txt` and optional `/llms-full.txt` from the docs manifest.
- Add a human-readable “For AI agents” page with the app-level contract and a
  copy-paste prompt.
- Add the docs build to `build:site` and CI; check internal links and
  `llms.txt` links.

Exit criteria:

- The docs site builds and deploys with the demos.
- Every `llms.txt` link resolves to a consumer page or raw Markdown.
- A human can navigate from the landing page to any guide without repository
  access.

**7C — Agent verification, recipes and blind-agent evaluation (S/M)**

**Status:** done for the packed tarball — recipes, the adoption checker, the
quickstart build and the blind-agent run pass; the registry rerun follows
publication.

- Add complete recipes for add view, add command, replace document surface,
  theme, persistence and eject.
- Add a consumer-side `check-adoption` script (human and `--json`) for imports,
  element registration, style order, SSR guard and bundle leaks.
- Build the documented quickstart in CI, not just the tarball consumer fixture.
- Run a blind-agent task from the packed tarball with no repository access; turn
  failures into recipes or checks.

Exit criteria:

- A blind agent can add a view and a command to a fresh app and pass
  build/typecheck.
- The quickstart builds from documentation alone.
- Copyable code blocks contain no `...` elisions.

**Priority and dependencies:**

- 7A is the foundation; 7B renders 7A; 7C validates both.
- npm publication is not a blocker for 7A/7B. Until publication, acceptance uses
  `npm pack` plus a local tarball install. 7C reruns against
  `npm install vscode-workbench` after publish.

### Later — hardening (not required for 0.x)

- SSR support or explicit “browser-only” documentation.
- Playwright visual regression for the demo.
- Additional presets (compact shell, inspector shell, single-column shell).
- Optional adapters for other layout/state libraries.
- A hard CSS size gate and optional CSS modules once a consumer needs finer control.

## 8. First pull requests

A pragmatic sequence that keeps `main` shippable. Items 1-10 are implemented;
the post-publish acceptance path is the remaining follow-up.

1. **This roadmap + README link.**
2. **Baseline script:** build size report and boundary check in CI.
3. **`kit/core`:** move clamp/resize and tab helpers, add tests.
4. **`kit/react/ResizablePane`:** extract as a controlled primitive; update the current template to use it.
5. **`kit/react/TabStrip`:** extract editor tabs; keep the existing visual output.
6. **`kit/react/WorkbenchShell`:** compose the existing regions without importing views.
7. **Preset + demo separation:** move views/data/menus into the app layer.
8. **Minimal example:** single tab + options sidebar + budget check.
9. **Internal modules and distribution:** workspace migration, all three `apps/*` applications, `packages/workbench`, the packed-tarball check, documentation and release readiness are done; the first tag-triggered trusted-publishing release of `vscode-workbench` remains.
10. **Consumer documentation and agent adoption:** Phase 7A package-local consumer docs and boundary; 7B hosted docs site, raw Markdown and `llms.txt`; 7C quickstart and adoption verification plus blind-agent evaluation. Implemented and verified against the packed tarball; the post-publish acceptance path remains after publication.

Each step should be a separate PR with a visible demo change or a bundle report. Avoid one giant refactor.

## 9. Verification and CI

Current checks:

```bash
npm run check              # lint, format, typecheck, boundaries, distribution, docs, release, tests, builds, pack:check
npm run check:boundaries   # source layers must not import app/demo modules or package internals
npm run check:distribution # five internal modules stay private; one public surface
npm run check:docs         # links, documented scripts, public specifiers and API export coverage
npm run check:release      # shared versions, npm metadata, changelog and license material
npm run pack:check         # one tarball: contents, exports, runtime, types, no private deps
npm run build:minimal      # minimal example build
npm run check:minimal      # minimal bundle composition
npm run build:custom-shell # custom-shell example build
npm run check:custom-shell # custom-shell bundle composition
npm run size               # template bundle budget / report
npm run size:minimal       # minimal bundle budget / report
```

Testing layers:

- Unit tests for `core` helpers.
- Component tests for controlled primitives.
- Integration tests for the preset.
- Bundle canary for the minimal app.
- Manifest/distribution check for privacy, dependency direction and the public surface.
- Manual or Playwright visual smoke for the full template.

## 10. Metrics

Track these explicitly instead of relying on intuition:

- Full preset JS/CSS gzip size.
- Minimal app JS/CSS gzip size.
- Number of registered custom elements in each example.
- Build time for the template and the minimal app.
- Boundary violations (must be zero).
- Distribution violations (must be zero).
- Internal modules (must be five) and published packages (must be one).
- Number of public subpath entries and exported components.

## 11. Risks and mitigations

| Risk                                      | Mitigation                                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Premature abstraction creates a bad API   | Keep the kit internal until the minimal and custom examples are stable; ship 0.x                                    |
| Tree-shaking claims are not real          | Build the minimal app in CI and inspect the output; no registry maps in primitives                                  |
| CSS leakage or conflicting global styles  | Prefix classes (`wb-`), use CSS layers, ship per-component CSS, avoid resets outside the kit root                   |
| Custom elements are side-effectful        | Per-tag registration entries; preset imports only what it uses                                                      |
| Global store couples features             | Controlled primitives first; optional store only at preset level; store slices                                      |
| Documentation drifts from code            | Examples are executable; add API checks and link examples from docs                                                 |
| Five modules drift into five publications | `check:distribution` keeps internal modules private and permits one public facade                                   |
| One package locks internal versions       | Accept for 0.x; modules remain source boundaries, and independent versioning is revisited only with a real consumer |
| Public facade becomes a second UI layer   | The facade owns only exports/bundling; `check:distribution` rejects runtime deps on private modules                 |
| Scope creep into a framework              | Re-read the non-goals; no plugin runtime, no server, no editor implementation                                       |
| Breaking the showcase during refactor     | Refactor in small PRs; keep the demo visually identical at each step                                                |

## 12. Open decisions

These should be resolved before publishing, not necessarily before the internal split.

- **Controlled vs uncontrolled:** recommend controlled for primitives, uncontrolled convenience at the preset.
- **Store:** keep Zustand internally, or expose a store-agnostic context? Recommendation: primitives controlled; Zustand only in the optional preset.
- **vscode-elements:** peer dependency or optional adapter? Recommendation: peer for `elements` and `preset-vscode`; core stays framework-agnostic.
- **CSS:** plain prefixed CSS with layers vs CSS modules. Recommendation: prefixed CSS + layers for overrideability and simpler library builds.
- **Preset contents:** shell only, or shell + demo views? Recommendation: shell + generic commands, with demo views in the template.
- **Public package scope/name:** resolved — `vscode-workbench` (unscoped). The provisional pre-release name was never published.
- **Public facade build:** resolved for Phase 5 — copy the module output and styles into the facade, rewrite specifiers and complete extensions; no bundler. The contract remains one tarball with stable subpaths.
- **Internal versioning:** all five modules share the facade's version for 0.x; independent versioning is out of scope unless a real consumer requires it.
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
- A custom-shell example composes the full workbench without the preset and is verified for bundle leaks.
- Primitives contain no app views, demo data or global command registry.
- The full preset contains no hidden dependency on the demo.
- Five internal modules remain private and one public package exposes their subpaths.
- CI checks boundaries, distribution, documentation, release metadata, sizes and the existing lint/test/build suite.
- One tarball can be packed and consumed without relative imports into the repo.
- The tarball carries its license and third-party notices.
- Consumer docs are package-local, shipped in the tarball and hosted without requiring repository access.
- An agent can build a documented app from the packed package alone; `llms.txt` and raw Markdown link only to consumer pages.
- Contributor and consumer documentation are physically separate, with a one-way link boundary enforced by checks.
- A 0.x release is possible without breaking the template's showcase, via the documented tag-triggered trusted-publishing workflow.
