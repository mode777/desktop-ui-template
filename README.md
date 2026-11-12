# Desktop UI Template

A configurable, VS Code-style desktop UI shell for the web. Built with **React 19**, **TypeScript**, **Vite 8**, **Zustand** and the [**vscode-elements**](https://github.com/vscode-elements/elements) web components.

[![CI](https://github.com/mode777/desktop-ui-template/actions/workflows/ci.yml/badge.svg)](https://github.com/mode777/desktop-ui-template/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/mode777/desktop-ui-template/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/mode777/desktop-ui-template/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Live:** [full template](https://mode777.github.io/desktop-ui-template/) · [minimal example](https://mode777.github.io/desktop-ui-template/minimal/) · [custom-shell example](https://mode777.github.io/desktop-ui-template/custom-shell/)

![Desktop UI Template screenshot](docs/screenshot.png)

## What this is

A production-minded starting point for tools that need a desktop-class workbench: IDEs, admin consoles, creative tools, data explorers, internal developer platforms, or any application that wants VS Code's layout language without adopting VS Code itself.

The shell is real. The documents are deliberate mock previews.

- A **title bar** with menus, command center, layout controls and window controls.
- An **activity bar** with badge support and runtime view switching.
- A **primary sidebar** with Explorer, Search, Source Control, Run and Extensions views.
- A **secondary sidebar** with a working chat mock, resizable and collapsible.
- An **editor area** with open/close/activate/reorder tabs, drag reorder, middle-click close, a tab context menu and static document previews.
- A **bottom panel** with Problems, Output and an interactive terminal mock.
- A **status bar** with workspace, Git, problems, cursor, encoding and language indicators.
- **Persisted layout**: region visibility, sash sizes, open tabs, active views and theme survive reloads.
- **Keyboard-first navigation**: quick open, command palette, view toggles and region shortcuts.
- **Dark and light themes** driven entirely by CSS custom properties.

## Quick start

```bash
npm install
npm run dev                # start the template (http://localhost:5173)
npm run dev:minimal        # start the minimal example
npm run dev:custom-shell   # start the custom-shell example
```

Open <http://localhost:5173>.

```bash
npm run check              # lint + format + typecheck + boundaries + distribution + docs + release + styles + tests + builds + pack
npm run check:distribution # five private internal modules + one publish target
npm run check:docs         # links, scripts, public specifiers and API coverage
npm run check:release      # versions, npm metadata, changelog and license material
npm run check:styles       # per-component stylesheets, aggregate order and example style subsets
npm run pack:check         # pack one tarball, verify contents and consume it
npm run size               # build and compare the bundle against budgets.json
npm run lint               # oxlint
npm run typecheck          # tsc -b across the applications and workspace packages
npm run test               # vitest
npm run build              # package builds + production build in apps/template/dist/
npm run build:minimal      # production build in apps/minimal/dist/
npm run build:custom-shell # production build in apps/custom-shell/dist/
npm run build:site         # build all three apps and assemble site/ for GitHub Pages
npm run check:minimal      # minimal bundle composition
npm run check:custom-shell # custom-shell bundle composition
npm run build:packages     # compile the four JavaScript modules and generate the public facade
npm run build:facade       # regenerate packages/workbench/dist from the module builds
npm run preview            # serve the production build
```

Requires Node 24 (see `.nvmrc`). The repository is an npm workspace; one root
`npm install` links the five private `@workbench-kit/*` modules and the public
`@workbench-kit/workbench` facade. The five modules remain `private`; the facade
is the single generated package with subpath exports. See
[docs/architecture.md](docs/architecture.md) and the
[package README](packages/workbench/README.md). The template uses Vite 8 and
TypeScript 7.

## Documentation

Consumer documentation lives with the package and is hosted separately from the
repository docs. The repository docs describe how the kit is built and released.

### Using the package

| Document                                                                    | What it covers                                                             |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [Package README](packages/workbench/README.md)                              | Install, quickstart, adoption levels, offline docs and agent entry points. |
| [Hosted documentation](https://mode777.github.io/desktop-ui-template/docs/) | Quickstart, concepts, recipes, reference and the eject guide.              |
| [llms.txt](https://mode777.github.io/desktop-ui-template/llms.txt)          | A curated index for coding agents.                                         |
| [Agent guide](packages/workbench/AGENTS.md)                                 | App-level rules, public imports and the verification checklist.            |
| [Package changelog](packages/workbench/docs/changelog.md)                   | Consumer-visible changes and the prepared `0.1.0` surface.                 |

### Working on the repository

| Document                                         | What it covers                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------- |
| [Contributor migration guide](docs/migration.md) | Moving a template copy or workspace app to `@workbench-kit/workbench`.    |
| [Release policy](docs/release.md)                | SemVer, changelog, release checklist and the owner-approved publish gate. |
| [Architecture](docs/architecture.md)             | Five private modules, one public facade and the enforcement model.        |
| [Roadmap](ROADMAP.md)                            | Staged plan, Phase 7 priority and acceptance criteria.                    |
| [Third-party notices](THIRD_PARTY_NOTICES.md)    | Dependency licenses and the Codicons attribution.                         |

The public package is `0.x` and browser-only; the npm scope is provisional until
the first publish is approved. The repository stays copyable and works without
installing the package.

## Layout architecture

```text
┌──────────────────────────────────────────────────────────────┐
│ title bar: menu · command center · layout + window controls  │
├──────┬──────────────┬──────────────────────────┬─────────────┤
│      │              │ editor tabs              │             │
│activity              ├──────────────────────────┤ secondary   │
│ bar  │ primary      │ editor / document        │ sidebar     │
│      │ sidebar      ├──────────────────────────┤ (chat)      │
│      │              │ bottom panel             │             │
├──────┴──────────────┴──────────────────────────┴─────────────┤
│ status bar                                                   │
└──────────────────────────────────────────────────────────────┘
```

Every region is independently removable. The layout is a small flex composition rather than a rigid grid, so hiding a region lets the remaining surfaces reclaim the space.

The composed VS Code-style shell lives in `packages/preset-vscode` as `VSCodeWorkbench`. It owns the shell structure, thin region adapters over the React primitives, the default layout store and generic tab/layout commands, and receives the template's config, views, commands, menus, quick-open files, document renderer, icons, branding, status bar and initial session as props. `apps/template/src/app/App.tsx` wires the template into it; `apps/template/src/demo` holds the views, commands and mock data that the preset never imports.

The kit is five private internal workspace modules under `packages/` plus the
generated public facade. The template, minimal and custom-shell applications are
private workspace applications under `apps/`; publishing is the remaining
follow-up.

```text
packages/
  core/                         headless layout, tab, resize and persistence helpers
  react/                        controlled primitives (WorkbenchShell, TabStrip,
                                ActivityBar, Sidebar, Panel, StatusBar, TitleBar,
                                MenuBar, ContextMenu, ResizablePane, IconButton)
  elements/                     per-tag vscode-elements registration + JSX typings
  styles-vscode/                tokens, base and per-component CSS;
                                workbench.css is the ordered aggregate
  preset-vscode/
    src/
      VSCodeWorkbench.tsx       composes the shell from consumer props
      types.ts                  config, view, command and menu contracts
      elements.ts               registers the tags the preset renders
      store/                    Zustand store + localStorage persistence
      commands/                 generic tab/layout/quick-open commands
      components/
        TitleBar.tsx            store adapter over TitleBar
        MenuBar.tsx             command adapter over MenuBar
        ActivityBar.tsx         config/store adapter over ActivityBar
        Sidebar.tsx             view adapter over Sidebar
        SecondarySideBar.tsx    view adapter over Sidebar
        EditorArea.tsx          tab strip, breadcrumbs, document host, ContextMenu
        BottomPanel.tsx         view adapter over Panel
        QuickOpen.tsx           Ctrl+P / Ctrl+Shift+P dialog
        Notifications.tsx       toast surface
  workbench/                    public facade: authored manifest + README,
                                generated dist/ with preset, React, core,
                                elements and styles entries
apps/
  template/                     full showcase application
    index.html                  Vite entry
    vite.config.ts              app-local build; shared root public/ assets
    tsconfig.json               app TypeScript project
    src/
      app/
        App.tsx                 composition root: supplies the preset inputs
        workbench.config.ts     ← the main customization surface
        use-workbench-hotkeys.ts
        components/StatusBar.tsx
      demo/
        views/registry.tsx      primary / secondary / panel view registry
        views/ExplorerView.tsx … replaceable view surfaces
        commands/commands.ts    template commands
        commands/registry.ts    preset defaults + template commands
        commands/menus.ts       menu definitions referencing command IDs
        components/FileTree.tsx mock explorer tree
        data/workspace.ts       mock file tree, documents and metadata
        data/initial-session.ts first-run tabs and output lines
        styles/demo-views.css   demo view styling kept out of the kit
      vscode-elements.ts        aggregate registration from @workbench-kit/elements/all
      main.tsx                  application entry
  minimal/                      one tab + options sidebar; the tree-shaking canary
    index.html
    vite.config.ts
    tsconfig.json
    README.md
    style-subset.json           expected component styles + forbidden selectors
    src/
      App.tsx
      App.test.tsx
      elements.ts
      main.tsx
      minimal.css
  custom-shell/                 complete shell composed without the preset
    index.html
    vite.config.ts
    tsconfig.json
    README.md
    style-subset.json           expected component styles + forbidden selectors
    src/
      App.tsx                   local reducer + WorkbenchShell slots
      state.ts                  reducer and core tab transitions
      data.ts                   example tabs, activities and panel content
      elements.ts               per-tag element registration
      main.tsx
      custom-shell.css
      regions/                  title bar, activity bar, sidebars, editor, panel, status bar
test/
  setup.ts                      shared Vitest setup
vitest.config.ts                workspace test configuration
```

## Architecture and distribution

The five `@workbench-kit/*` directories are **internal modules** with a one-way
dependency graph: `core ← react ← preset`, `core/elements ← preset`, and
`styles-vscode` as an independent CSS layer with token, base and per-component
entries. The preset never imports `apps/template/src/app`
or `apps/template/src/demo`; views, data, commands, menus and branding arrive through props.

They are not published individually. The single public artifact is the
`@workbench-kit/workbench` package, generated from the internal module builds
into `packages/workbench/dist/`. It exposes the same adoption levels through
subpath exports:

```tsx
import { VSCodeWorkbench } from '@workbench-kit/workbench' // preset
import { WorkbenchShell, TabStrip } from '@workbench-kit/workbench/react' // composition
import { clampSize } from '@workbench-kit/workbench/core' // primitives
import '@workbench-kit/workbench/elements/icon' // one element tag
import '@workbench-kit/workbench/styles/tokens.css'
```

Inside the repository the modules keep their `@workbench-kit/<module>` names so
the boundaries are enforceable. Published consumers only see the public
subpaths. The facade is a distribution layer, not a sixth implementation: it
copies the module output, rewrites private specifiers to relative paths and adds
the extension completion needed for Node ESM. The full rationale, module
ownership, tree-shaking contract and enforcement matrix are in
[`docs/architecture.md`](docs/architecture.md).

`npm run check:distribution` enforces the mechanical part: the five expected
modules exist, stay `private`, keep the allowed dependency direction, and the
public facade exposes the required subpaths and does not depend on the private
modules at runtime.

`npm run pack:check` closes the gap between metadata and a real artifact. It
builds the facade, runs `npm pack` once, verifies that the tarball contains only
the manifest, README and generated `dist/`, then extracts it into a throwaway
consumer. It resolves every declared JavaScript and CSS subpath, evaluates the
preset, primitives, core and element entries under JSDOM, and typechecks a
consumer that imports the full public surface. The standard `npm run check`
includes it.

## Examples

[`apps/minimal`](./apps/minimal/README.md) is the smallest application built
directly from `@workbench-kit/react` primitives, backed by `@workbench-kit/core`.
It renders one tab, one resizable options sidebar and a status bar, and imports
neither `@workbench-kit/preset-vscode` nor `apps/template/src/app` or
`apps/template/src/demo`. It exists to prove selective adoption and to fail CI if
preset or demo code leaks into a small app. Live: [minimal example](https://mode777.github.io/desktop-ui-template/minimal/).

[`apps/custom-shell`](./apps/custom-shell/README.md) is the composition-level
reference: a complete workbench assembled from `WorkbenchShell`,
`ResizablePane`, `TabStrip` and `IconButton`, with app-owned title bar, activity
bar, primary and secondary sidebars, tabbed editor, bottom panel and status bar.
It uses a local reducer instead of the preset store, registers only
`vscode-icon`, `vscode-tab-header`, `vscode-tabs` and `vscode-tab-panel`, and
passes its own production-bundle composition check. Live: [custom-shell example](https://mode777.github.io/desktop-ui-template/custom-shell/).

The three adoption levels, using these examples as references:

| Level       | Entry point                                                      | Reference           | What it includes                                |
| ----------- | ---------------------------------------------------------------- | ------------------- | ----------------------------------------------- |
| Preset      | `VSCodeWorkbench` from `@workbench-kit/preset-vscode`            | `apps/template`     | Full shell, default store and generic commands. |
| Composition | `WorkbenchShell` + region primitives from `@workbench-kit/react` | `apps/custom-shell` | Consumer-owned layout, regions and state.       |
| Primitives  | `ResizablePane` / `TabStrip` from `@workbench-kit/react`         | `apps/minimal`      | One behavior inside an existing layout.         |

Styles follow the same levels. Import `tokens.css` and `global.css` first. The
preset and the full template use the `workbench.css` aggregate (or the `styles`
alias); composition and primitive consumers import only the
`styles/<component>.css` entries they render, for example `shell.css`,
`resizable-pane.css`, `tab-strip.css` and `status-bar.css`. Component entries
are additive and do not load tokens, base styles or each other.

The minimal example's current production build measures 79,059 B gzip
JavaScript (66.6 % of the full preset's 118,736 B gzip budget baseline) and
4,106 B gzip CSS. The recorded budget and the composition check are described in
the [bundle budget](#bundle-budget); the CSS dropped when the example switched
from the aggregate stylesheet to the four component entries it renders. The
custom-shell example is composition-checked but deliberately has no third budget
target; the template and minimal application remain the measured size targets.

```bash
npm run dev:minimal
npm run build:minimal
npm run size:minimal

npm run dev:custom-shell
npm run build:custom-shell
npm run check:custom-shell
```

## Customize the shell

### Remove or reorder regions

Edit `apps/template/src/app/workbench.config.ts`:

```ts
export const workbenchConfig: WorkbenchConfig = {
  titleBar: { enabled: true, menuBar: true /* … */ },
  activityBar: {
    enabled: true,
    items: [
      { id: 'explorer', title: 'Explorer', icon: 'files' },
      // remove an item to remove it from the rail
    ],
  },
  primarySideBar: {
    enabled: true,
    initialWidth: 300,
    minWidth: 180,
    maxWidth: 640,
    views: ['explorer', 'search', 'source-control', 'run', 'extensions'],
  },
  // secondarySideBar, bottomPanel, statusBar …
}
```

Set `enabled: false` to remove a region completely. Users can also hide regions at runtime with the View menu, the title bar layout controls, or the shortcuts below. Runtime visibility and sash sizes are persisted separately from the config.

### Add a sidebar view

1. Create a component in `apps/template/src/demo/views`, e.g. `InspectorView.tsx`.
2. Register it in `apps/template/src/demo/views/registry.tsx`:

```tsx
export const primaryViews = {
  // …
  inspector: {
    id: 'inspector',
    title: 'Inspector',
    icon: 'symbol-property',
    component: InspectorView,
    actions: [{ icon: 'refresh', label: 'Refresh', commandId: 'inspector.refresh' }],
  },
}
```

3. Add `'inspector'` to `PrimaryViewId`, the activity bar items, and `primarySideBar.views`.
4. Optionally add the matching command in `apps/template/src/demo/commands/commands.ts`.

### Add a command

Append an entry to `demoCommands` in `apps/template/src/demo/commands/commands.ts`. Menus and the command palette read from the composed registry, so one entry is enough:

```ts
{
  id: 'inspector.open',
  title: 'Open Inspector',
  category: 'View',
  keybinding: 'Ctrl+Alt+I',
  run: () => useWorkbenchStore.getState().showPrimaryView('inspector'),
}
```

### Replace the document surface

The editor is intentionally a static preview. Swap `apps/template/src/demo/views/DocumentView.tsx` for Monaco, CodeMirror, an iframe, or your own renderer. Tabs, breadcrumbs, dirty indicators and the status bar are already wired for it.

### Theme

All colors live in `packages/styles-vscode/src/tokens.css` as VS Code-compatible custom properties. `apps/template/src/app/App.tsx` writes `data-theme="dark|light"` to `<html>`, and every component, including the vscode-elements shadow DOM, inherits the tokens. Add a new theme by adding another `[data-theme='…']` block. Demo view styles stay in `apps/template/src/demo/styles/demo-views.css` so the kit's per-component stylesheets only contain shell and reusable component rules.

## Keyboard shortcuts

| Shortcut                       | Action                             |
| ------------------------------ | ---------------------------------- |
| `Ctrl+B` / `Cmd+B`             | Toggle primary sidebar             |
| `Ctrl+Alt+B` / `Cmd+Option+B`  | Toggle secondary sidebar           |
| `Ctrl+J` / `Cmd+J`             | Toggle bottom panel                |
| `Ctrl+P` / `Cmd+P`             | Quick open files                   |
| `Ctrl+Shift+P` / `Cmd+Shift+P` | Command palette                    |
| `Ctrl+Shift+E`                 | Explorer                           |
| `Ctrl+Shift+F`                 | Search                             |
| `Ctrl+Shift+G`                 | Source control                     |
| `Ctrl+Shift+D`                 | Run and Debug                      |
| `Ctrl+Shift+X`                 | Extensions                         |
| `Ctrl+Shift+M`                 | Problems                           |
| `Ctrl+\``                      | Toggle terminal                    |
| `Ctrl+W`                       | Close active editor                |
| `Ctrl+Shift+W`                 | Close all editors                  |
| `Ctrl+Tab`                     | Cycle editors                      |
| `Ctrl+S`                       | Save (clears the mock dirty state) |
| `F5` / `Shift+F5`              | Start / stop mock debugging        |

Sashes are keyboard accessible too: focus a divider and use arrow keys, `Shift` for larger steps, `Home`/`End` for the limits, and double-click to reset.

## Tech stack

| Area          | Choice                                                              |
| ------------- | ------------------------------------------------------------------- |
| UI            | React 19 with the modern JSX transform                              |
| Build         | Vite 8 (Rolldown)                                                   |
| Language      | TypeScript 7, strict + `erasableSyntaxOnly`                         |
| Controls      | [vscode-elements](https://vscode-elements.github.io) 2.5 + Codicons |
| State         | Zustand 5 with `persist` middleware                                 |
| Tests         | Vitest 5 + jsdom + Testing Library                                  |
| Lint / format | oxlint + Prettier                                                   |
| Deploy        | GitHub Actions → GitHub Pages                                       |

vscode-elements is a Lit-based web-component library. React 19 renders the custom
elements directly; the shared JSX typings live in
`packages/elements/src/global.d.ts`, and registration is imported per tag from
`@workbench-kit/elements/*`. The Codicon stylesheet is served from `public/codicons`
and synced from `@vscode/codicons` by `scripts/sync-codicons.mjs` before `dev` and
`build` (the `id="vscode-codicon-stylesheet"` link is required for shadow-DOM font
loading).

## Dependency boundaries

`npm run check:boundaries` parses the import graph of every source root declared
in [`boundaries.json`](./boundaries.json) — currently `apps/template/src`,
`apps/minimal/src`, `apps/custom-shell/src` and `packages/` — and enforces the
layer model. It runs inside `npm run check`, so a forbidden import fails local
verification and CI.

The declaration is data: roots, layers, the globs that contain them, the
`workspacePackages` names that resolve to each layer, the layers they may import
and the external packages they may use. The checker contains no rules of its own.

[`npm run check:distribution`](docs/architecture.md#7-enforcement) validates the
package metadata side of the same model from
[`distribution.json`](./distribution.json): the five internal modules stay
private, their workspace dependency edges follow the module graph, and only the
public facade may be publishable. The two checks run together inside
`npm run check`, followed by the packed-tarball check.

`npm run check:styles` keeps the stylesheet surface aligned: every component
file has a styles package export and a matching public facade entry,
`workbench.css` imports all components once in the documented order, `index.css`
loads tokens → global → workbench, the kit contains no demo view selectors, and
the example applications import only their declared style subsets. It runs
inside `npm run check` before the build steps.

| Layer                  | May import                         | Notes                                                                       |
| ---------------------- | ---------------------------------- | --------------------------------------------------------------------------- |
| `test`                 | anything                           | Test files are exempt from layer checks; cross-package tests use names.     |
| `kit-core`             | `kit-core`                         | No React, no DOM, no app data.                                              |
| `kit-react`            | `kit-core`, `kit-react`            | `react` and `react-dom` only.                                               |
| `kit-elements`         | `kit-elements`                     | `@vscode-elements/elements` and React typings.                              |
| `kit-styles`           | `kit-styles`                       | CSS only; no demo view selectors.                                           |
| `kit-preset`           | kit layers                         | Owns its store, regions and generic commands; never app or demo modules.    |
| `kit-workbench`        | nothing                            | Generated distribution facade; no implementation, app or demo imports.      |
| `app`                  | anything                           | `apps/template/src/main.tsx`, `.../vscode-elements.ts` and `.../app`.       |
| `demo`                 | `demo`, kit layers                 | Uses the preset through its public exports; never imports the template app. |
| `example-minimal`      | `example-minimal`, kit layers      | React and vscode-elements only; never the preset, app or demo layers.       |
| `example-custom-shell` | `example-custom-shell`, kit layers | Complete shell without the preset, store or demo; kit layers only.          |
| `test-support`         | nothing                            | Vitest environment setup.                                                   |

Behaviour that is easy to trip over:

- **Roots are explicit.** `roots` lists the directories that are scanned;
  `root` is still accepted as a single-root fallback for older declarations.
- **Workspace package imports are layer-checked.** `workspacePackages` maps each
  `@workbench-kit/*` name to its layer, so a forbidden package import fails with
  the importing file, line, target package and rule.
- **Package implementation is imported by name.** A relative import from outside
  a package into `packages/*/src` fails with `package-relative-import`; relative
  imports inside the same package are allowed.
- **Unknown paths are unclassified.** A new `apps/template/src/foo/` directory inherits no
  permissions; its first import fails the check until a layer is declared.
- **Relative imports must resolve.** A typo is a violation, not a silently
  skipped rule. CSS and JSON imports count as assets and are allowed everywhere.
- **Node built-ins are rejected** in browser source, and external packages must
  be listed per layer.
- **The example's build config is not application source.**
  `apps/minimal/vite.config.ts` and `apps/custom-shell/vite.config.ts` import
  Node and Vite APIs, so each example root is its `src` directory rather than the
  whole application directory.
- **No exemptions.** There is no allowlist of known violations and no inline
  suppression; the tree currently passes with zero.

### Changing a rule

1. Edit the relevant layer in `boundaries.json`. Tightening a rule never needs a
   checker change.
2. Run `npm run check:boundaries` and confirm the reported counts.
3. If the new rule flags existing code, change the import or — when the edge is
   intentional for this phase — add the target layer to `mayImport` and explain
   why in the pull request.

## Bundle budget

`npm run size` builds the production bundle, measures every emitted script and
stylesheet, and compares the totals with the recorded baseline in
[`budgets.json`](./budgets.json).

- **Measured:** `apps/template/dist/assets/*.js` and `apps/template/dist/assets/*.css`, raw and gzip (gzip
  level 9, computed in-process so no system `gzip` is needed). The build runs
  `build:packages` first so the workspace packages have `dist/` output, but those
  files are never measured.
- **Not a target:** `packages/*/dist` is a package artifact for a later packing
  step, not a shipped application budget.
- **Tracked separately:** Codicon font/CSS and HTML. They are listed in the
  report but never count toward the budget.
- **Fatal:** gzipped JavaScript above the baseline plus tolerance.
- **Advisory:** a CSS overage prints a warning but exits zero. Per-component
  stylesheets now let consumers shrink CSS, but changing CSS to a hard gate is a
  separate budget-policy decision.
- **Report:** `size-report.json` (gitignored) with a timestamp, per-asset sizes
  and totals.

`npm run size -- --no-build` reuses an existing `apps/template/dist/`; CI uses it after
`npm run check` has already built. `npm run size -- --summary "$GITHUB_STEP_SUMMARY"`
appends a Markdown table to a job summary.

The tolerance is a percentage of each recorded value with a byte floor, so
compression drift between machines does not fail the gate. The current baseline
is the full preset: JavaScript 430,535 B raw / 118,736 B gzip, CSS 44,515 B raw
/ 8,172 B gzip. The CSS grew slightly when the aggregate became an import
manifest; the component rules themselves are unchanged. Headroom is printed
after every run.

### Minimal example target

The minimal example is measured as a second, independent target:

- **Command:** `npm run size:minimal` builds `apps/minimal/dist/`, or add
  `-- --no-build` to reuse an existing build.
- **Budget:** [`budgets.minimal.json`](./budgets.minimal.json).
- **Report:** `size-report.minimal.json` (gitignored).
- **Baseline:** JavaScript 254,276 B raw / 79,054 B gzip, CSS 19,261 B raw /
  4,106 B gzip. The CSS baseline dropped from 47,289 B raw / 8,579 B gzip when
  the example stopped importing the aggregate stylesheet.
- **Gate:** the same 1 % / 1024 B tolerance applies; gzipped JavaScript is
  hard-failing and CSS stays advisory.

The current minimal JavaScript is **66.6 %** of the full preset's 118,736 B gzip
budget baseline. That is above the roadmap's suggested one-third target because
React and the two vscode-elements registrations dominate a one-tab application.
The recorded budget baseline remains 79,054 B gzip; the current build measures
79,059 B gzip. The target's job is to prevent regressions and to fail if preset,
app or demo code leaks into the bundle.

Passing runs print the headroom left under the budget. A failing JavaScript run
prints the measured value, the allowed value, the overage and the largest assets
so the growth can be attributed without opening the report.

### Continuous integration

CI runs one `verify` job: `npm ci`, `npm run check` (lint, format check,
typecheck, boundary, distribution, documentation, release and style checks,
tests, the template build, the minimal build and its composition check, and the
custom-shell build and its composition check) and then `npm run size -- --no-build`
and `npm run size:minimal -- --no-build`. Each size step reuses the build `check`
just produced, appends its table to the job summary and fails the job when its
own gzipped JavaScript exceeds its budget. Both `size-report.json` and
`size-report.minimal.json` are uploaded as artifacts. The boundary and
distribution checks need no separate step because they are part of `check`.

### Updating the baseline

Baseline updates are manual and reviewable by design — there is no `--update`
flag.

1. Run `npm run size` and read the table and verdict.
2. Confirm the growth is intended and explain it in the pull request.
3. Edit the `budgets` totals in `budgets.json` to the measured values and
   update `recordedAt`.
4. Re-run `npm run size` and confirm the new baseline passes with headroom.

Increasing a budget without a stated reason is a regression, not a fix.

## Roadmap

The workbench is reusable at three levels — full preset, composed regions and individual primitives — without losing the copyable template. The five internal modules, the single public package, the template, minimal and custom-shell applications, documentation and release readiness are in place; the registry publish remains a manual, owner-approved step gated on the final scope/name. The staged plan, package boundaries, tree-shaking rules and acceptance criteria are in [ROADMAP.md](ROADMAP.md); the distribution model is in [docs/architecture.md](docs/architecture.md), and the adoption path starts at the [hosted consumer documentation](https://mode777.github.io/desktop-ui-template/docs/).

## Working with OpenCode

The repository is initialized for [OpenCode](https://opencode.ai) with `opencode.json` and a project-specific [`AGENTS.md`](AGENTS.md). The agent guide documents the architecture rules, commands, styling conventions and non-goals so automated changes stay consistent with the template.

## Deployment

The `Deploy to GitHub Pages` workflow runs on every push to `main` and on manual dispatch:

1. `npm ci`
2. `npm run build:site` — builds the template, minimal and custom-shell applications and assembles them into `site/`
3. `configure-pages` + `upload-pages-artifact` (`site/`)
4. `deploy-pages`

The artifact hosts the full template at the site root and the examples at `minimal/` and `custom-shell/`. Every Vite build uses `base: './'`, so a build that works at the repository root also works under a subdirectory or inside an iframe. [`scripts/assemble-pages-site.mjs`](./scripts/assemble-pages-site.mjs) validates that all three builds exist, replaces `site/` instead of merging into it, and fails with the missing build command when an application has not been built. Run `npm run build:site` locally and serve `site/` with any static file server to reproduce the deployment.

Enable Pages once under **Settings → Pages → Build and deployment → GitHub Actions** (or with `gh api`).

The CI workflow runs lint, formatting, typecheck, tests and build on every push and pull request.

## Non-goals

- No real code editor or language services. The document area is a preview.
- No real file system, Git backend or agent runtime. The Explorer, Source Control and Chat surfaces are mocks designed to be replaced.
- No dependency on VS Code, Electron or Theia. This is a browser UI template.

## License

[MIT](LICENSE). The included vscode-elements and Codicons packages retain their own licenses (MIT and CC-BY-4.0 respectively).
