# Design

## Context

See `proposal.md` — Why. Current state that shapes the approach:

- The template is the repository root package: `src/app`, `src/demo`, `src/main.tsx`, `src/vscode-elements.ts`, `index.html`, `vite.config.ts` and `src/styles`. The kit lives at `src/kit/{core,react,preset-vscode}` and is imported by relative paths from the app, demo, tests and `examples/minimal`.
- `src/types/vscode-elements.d.ts` is an application-level ambient declaration for every tag. `src/vscode-elements.ts` is the template's aggregate registration; `examples/minimal/src/elements.ts` registers two tags directly from `@vscode-elements/elements`.
- TypeScript 7 runs as one `tsc -b` build with `noEmit` project configs; Vite 8 builds the template, and a second Vite config builds `examples/minimal` into `dist-minimal`. Vitest runs from the root config with jsdom and a shared setup file.
- `boundaries.json` declares `src`, `examples/minimal/src`, one layer per kit folder, and an external-package rule. The checker resolves only relative imports to layers; package-name imports are treated as externals.
- The size tooling measures `dist/` and `dist-minimal/`, and CI runs one `verify` job plus two size steps. The previous roadmap phase is archived and the repository has no active change.
- Constraint from this slice: the template stays at the repository root; `apps/*`, `apps/custom-shell` and `npm pack`/tarball validation are deferred.

## Goals / Non-Goals

**Goals:**

- One root `npm install` links five workspace packages, and the template and minimal example consume them through public package names.
- Every package has a real public surface (exports, types, files, side effects, peer/runtime dependencies) and builds to ESM plus declarations without app or demo code.
- Dev, test and production builds keep working without a manual package build, while package `dist/` remains the artifact a future packing step would validate.
- The boundary checker understands package names and rejects relative imports that bypass them.
- All existing verification, budgets, size commands and the current CI job shape stay valid.

**Non-Goals:**

- Moving the template into `apps/template` or the minimal example into `apps/minimal`; adding `apps/custom-shell`.
- `npm pack`, tarball-install tests, publishing, version policy or a changelog.
- Splitting `workbench.css` into per-component files. It is split once into shell/component rules and demo view rules so the styles package contains no demo selectors; per-component CSS remains a later hardening step.
- New primitives, store slices, API changes, visual changes or CI matrix/artifact rewiring.

## Decisions

### 1. Keep the template at the root and add `packages/*` workspaces

```text
package.json                 root template + workspace host
vite.config.ts               template build/test config
vite.workspace.ts            shared Vite aliases to package source
src/                         app, demo, main, aggregate element registration
packages/
  core/                      headless helpers
  react/                     controlled primitives
  elements/                  per-tag registration + JSX typings
  styles-vscode/             tokens, base and component CSS
  preset-vscode/             composed preset, store, commands, regions
examples/minimal/            unchanged location; imports packages
```

The root package declares `"workspaces": ["packages/*"]` and keeps its current name, version and private flag. Packages use `@workbench-kit/*`, version `0.1.0`, `"private": true`, and `"type": "module"`. The scope is provisional until the Phase 6 naming decision.

Alternatives considered:

- **Move apps now** — the selected slice is workspace and packages first; moving apps would add path churn and make the change harder to review.
- **pnpm/turborepo** — npm already ships the repository and workspaces are sufficient; extra tooling adds a second package manager without a requirement.
- **One `@workbench-kit/workbench` package** — a single package cannot expose the adoption levels or per-tag side effects cleanly.

### 2. Package contents and dependency direction

| Package                        | Contents                                                           | Runtime dependencies           | Peers                                      |
| ------------------------------ | ------------------------------------------------------------------ | ------------------------------ | ------------------------------------------ |
| `@workbench-kit/core`          | layout, resize, tabs, persistence helpers                          | none                           | none                                       |
| `@workbench-kit/react`         | `ResizablePane`, `TabStrip`, `WorkbenchShell`, `IconButton`        | `@workbench-kit/core`          | `react` (and `react-dom` for host apps)    |
| `@workbench-kit/elements`      | per-tag registration entries, `all` entry, JSX typings             | none                           | `@vscode-elements/elements`, `react` types |
| `@workbench-kit/styles-vscode` | `tokens.css`, `global.css`, `workbench.css`, aggregate `index.css` | none                           | none                                       |
| `@workbench-kit/preset-vscode` | `VSCodeWorkbench`, regions, store, default commands, `elements.ts` | core, react, elements, zustand | `react`, `react-dom`                       |

Dependency direction stays one-way: core ← react ← preset, core/react/elements ← preset, and app/demo → packages. `@workbench-kit/elements` does not import React at runtime; React is a peer only for the typings.

### 3. Package metadata and side effects

Each package manifest declares:

- `"type": "module"`, `"private": true`, `"license": "MIT"`, `"version": "0.1.0"`.
- `"exports"` with a `types` and `default`/`import` condition for each JS entry, or direct CSS files for the styles package.
- `"files": ["dist"]` for built packages; `["src"]` for the styles package; `["dist", "src/global.d.ts"]` for elements.
- `"sideEffects"`:
  - core/react: `false`.
  - elements: `["./src/*.ts", "./dist/*.js"]` because both the workspace source entries and the emitted modules are registrations.
  - preset: `["./src/elements.ts", "./dist/elements.js"]`, the source and built modules that import the registrations.
  - styles: `["**/*.css"]`.
- `"main"`/`"types"` for compatibility with tools that do not read `exports`.
- `"peerDependencies"` for React, React DOM and `@vscode-elements/elements` where used; `"dependencies"` for workspace packages and Zustand.

The root app depends on all five packages with `"*"` so npm links workspaces, plus React, React DOM, `@vscode-elements/elements` and `@vscode/codicons`. `zustand` moves to the preset package; the app does not import it.

Alternative considered: put `@vscode-elements/elements` in every package's dependencies. Rejected — it duplicates a large Lit library and makes version skew likely; a peer dependency keeps one copy in the consumer.

### 4. Source resolution for dev/test; `dist/` for package builds

The built packages' `exports` point at `dist/` because that is what a future packed consumer would load; the styles package is source-only and exports its CSS files directly. To keep local development fast and to avoid a mandatory package build before every test run:

- `vite.workspace.ts` exports explicit aliases from `@workbench-kit/{core,react,elements,preset-vscode}` (and subpaths) to `packages/*/src`. The root `vite.config.ts` and `examples/minimal/vite.config.ts` use them. Vitest inherits the root aliases.
- The styles package is not aliased: its exports point directly at `src/*.css`, so Vite resolves it through the workspace symlink.
- TypeScript typecheck configs use `paths` to package source. Package build configs clear `paths` and resolve workspace packages through their `types` exports in `dist/`, in dependency order.

Build order is explicit: core → react → elements → preset. Styles has no build. `npm run build:packages` runs the four builds; `npm run build` runs it before the template build. The minimal build does not need it because its aliases resolve source.

Alternatives considered:

- **Point `exports` at source** — simple, but a packed package would ship TypeScript and rely on the consumer's bundler; not a real package boundary.
- **Build packages before every dev/test run** — correct but slow and loses source HMR; the alias map keeps the same behavior with a small drift risk.
- **A `development` export condition** — avoids aliases but makes resolution conditional in three tools and is harder to reason about than one explicit map.
- **Bundle each package with Vite library mode** — adds build config and CSS handling for no requirement; `tsc` emits the ESM/declaration shape the packages need.

### 5. TypeScript project layout

- Add `tsconfig.base.json` with the shared compiler options and workspace `paths`.
- The root `tsconfig.json` references `tsconfig.app.json`, `tsconfig.examples.json`, `tsconfig.node.json` and one `tsconfig.json` per built package.
- Package `tsconfig.json` files are typecheck-only (`noEmit`) and include tests. Package `tsconfig.build.json` files extend them, set `noEmit: false`, `declaration: true`, `outDir: "./dist"`, `rootDir: "./src"`, clear `paths`, set `allowImportingTsExtensions: false` (required once emitting), and exclude test files.
- App and example configs include `packages/elements/src/global.d.ts` explicitly so the package's global JSX declarations are loaded; TypeScript's `types` array does not resolve this workspace package, and the included file is the single source of truth.
- `tsconfig.node.json` also includes `vite.workspace.ts` because the Vite configs import it.

The test-time cross-package assertions move to the dependent package: the core tab test's `WorkbenchTab` assignability check moves into the preset tests, so core tests do not import the preset. The preset store test replaces demo fixtures with local tab/output fixtures.

### 6. Elements package and preset-owned registration

```text
packages/elements/src/
  badge.ts        button.ts       collapsible.ts   context-menu.ts
  icon.ts         tab-header.ts   tab-panel.ts     tabs.ts (family)
  textarea.ts     textfield.ts    tree.ts (family) all.ts
  global.d.ts
```

- Each per-tag entry imports one upstream deep module. `tabs.ts` imports tabs, tab header and tab panel; `tree.ts` imports tree and tree item; `all.ts` imports every entry.
- `packages/preset-vscode/src/elements.ts` imports badge, button, context-menu, icon, tabs and textfield. `packages/preset-vscode/src/index.ts` imports `./elements` for its side effect, so `import { VSCodeWorkbench } from '@workbench-kit/preset-vscode'` registers the preset's tags without a second consumer step.
- `packages/preset-vscode/src/VSCodeWorkbench.tsx` does not import registrations. Tests that import the component file directly stay free of element registration side effects; the app test exercises the package root and therefore the registration path.
- `src/vscode-elements.ts` remains the template's aggregate entry and imports `@workbench-kit/elements/all`; the demo views keep using tree, tree item, collapsible and textarea. The minimal example imports `@workbench-kit/elements/icon` and `@workbench-kit/elements/tab-header` only.
- The tag typings move from `src/types/vscode-elements.d.ts` into `packages/elements/src/global.d.ts`. The package's `types` field points at that file, and `exports["."]` points at the built `all` module.

Alternative considered: keep registration in the app only. Rejected because the roadmap requires the preset to import what it uses and because a preset consumer should not have to know the tag list.

### 7. Styles package

Move the three stylesheets to `packages/styles-vscode/src/`, but split the demo view selectors — Explorer, document preview, empty editor, Welcome, README, Problems, Output, Terminal, Search, Source Control, Extensions, Run, Chat and their responsive rules — into `src/demo/styles/demo-views.css`. Keep the shell, title bar, activity bar, sidebars, editor tabs, panel, status bar, quick open, context menu, notifications and shell responsive rules in `workbench.css`. Add `index.css` that imports `tokens.css`, `global.css` and `workbench.css` in that order. Exports:

```json
{
  ".": "./src/index.css",
  "./index.css": "./src/index.css",
  "./tokens.css": "./src/tokens.css",
  "./global.css": "./src/global.css",
  "./workbench.css": "./src/workbench.css"
}
```

The template imports the three explicit entries and then the app's demo stylesheet, preserving the current cascade. The minimal example imports the explicit entries and its own CSS; it no longer loads demo view styles, which is the intended selective-adoption result. The CSS overage model and class contract stay intact.

### 8. Boundary model enforces package entry points

`boundaries.json` gains:

- `roots: ["src", "packages", "examples/minimal/src"]`.
- Layers `kit-core`, `kit-react`, `kit-elements`, `kit-styles`, `kit-preset`, `app`, `demo`, `example-minimal`, `test-support`, `test` with the package globs and the same isolation rules as today.
- A `workspacePackages` map:

```json
{
  "@workbench-kit/core": { "layer": "kit-core", "root": "packages/core" },
  "@workbench-kit/react": { "layer": "kit-react", "root": "packages/react" },
  "@workbench-kit/elements": { "layer": "kit-elements", "root": "packages/elements" },
  "@workbench-kit/styles-vscode": { "layer": "kit-styles", "root": "packages/styles-vscode" },
  "@workbench-kit/preset-vscode": { "layer": "kit-preset", "root": "packages/preset-vscode" }
}
```

The checker:

1. Resolves a non-relative specifier's package name through `workspacePackages`; when found, it applies the importing layer's `mayImport` rule to the target layer and never treats it as an unrestricted external.
2. For a relative import whose resolved target lies under a package root, fails with a new `package-relative-import` rule when the importing file is outside that package. Relative imports inside the same package remain allowed.
3. Keeps the existing external, built-in, unresolved, unclassified and asset rules. The package-relative check runs before the CSS/JSON asset skip so a relative stylesheet import cannot bypass it.

The `test` layer keeps its priority exemption for cross-layer assertions, but the package-relative rule still applies, so tests use package names across packages.

### 9. Template and minimal migration

- `src/app`, `src/demo` and `src/main.tsx` remain in place. Their kit imports become `@workbench-kit/preset-vscode`, `@workbench-kit/react`, `@workbench-kit/core` and `@workbench-kit/styles-vscode/*`.
- `src/vscode-elements.ts` becomes an import of `@workbench-kit/elements/all`.
- `src/types/vscode-elements.d.ts` and `src/styles/` are deleted after their content moves.
- `examples/minimal` keeps its location, HTML, Vite config, composition check and budget. Its imports become `@workbench-kit/react`, `@workbench-kit/core` (if needed), `@workbench-kit/elements/icon`, `@workbench-kit/elements/tab-header` and the styles package; its Vite config adds the shared aliases.
- The minimal composition check's forbidden prefixes become `src/demo/`, `src/app/` and `packages/preset-vscode/`; its clean fixtures use package paths.

### 10. Tooling, size and CI stay in their current shape

- Root scripts gain `build:packages`; `build` runs it before `tsc -b` and `vite build`. `typecheck`, `test`, `lint`, `format:check`, `check:boundaries`, `build:minimal`, `check:minimal`, `size` and `size:minimal` keep their names and behavior.
- The size tools still measure only `dist/` and `dist-minimal/`. Package `dist/` folders are not targets and are already covered by the `dist` ignore pattern; `.oxlintrc.json` gains explicit ignores for generated output.
- CI keeps one verify job, `npm ci`, `npm run check` and the two size steps. No workflow matrix, new artifact or publish step.
- `.prettierignore`/`.gitignore` stay effective for `dist` at any depth; add only what the package build actually leaves behind.

### 11. Deferred work stays explicit

This change does not create `apps/*`, does not add `custom-shell`, and does not run `npm pack`, install a tarball or publish. The package `dist/` build exists so those steps can be added without moving source again. The final public scope and version policy remain Phase 6 decisions.

## Risks / Trade-offs

- **Vite aliases drift from package `exports`** → The template and minimal example import every JS entry point in normal use; package `tsc` builds catch broken declaration graphs. A tarball validation is the follow-up that closes the remaining gap.
- **Two React or Zustand copies** → Declare React/React DOM as peers, keep Zustand only in the preset dependency tree, and verify with `npm ls react react-dom zustand` after install.
- **Element registration breaks jsdom tests** → Registration code is imported only through package entry points; component tests import implementation files directly. If a missing browser API appears, add it to the shared test setup rather than removing the preset's registration.
- **Emitted package ESM has extensionless relative imports** → `moduleResolution: bundler` matches the Vite/browser target. Document that packages target bundlers; Node-native ESM can be a later hardening change.
- **CSS package type resolution** → CSS imports rely on Vite's ambient `*.css` declarations and the package's direct file exports. If TypeScript objects, add a narrow module declaration rather than pulling CSS into the TypeScript build.
- **Boundary false positives from the new package-relative rule** → Apply it only to declared package roots and keep the in-package exception; cover both allowed and forbidden cases in the checker tests.
- **Bundle size drift** → The same source reaches each app through aliases, so the extraction should be neutral. Measure both targets; do not touch a budget unless the growth is intended and reviewed.
- **Docs and mock tree drift** → Update `README.md`, `AGENTS.md`, `ROADMAP.md` and `src/demo/data/workspace.ts` in the same change, and verify the mock tree has no `src/kit`, `src/styles` or `src/types` path.
- **Workspace install changes the lockfile shape** → Commit the regenerated root lockfile and run `npm ci` in a clean state before calling the change complete.

## Migration Plan

1. Add the workspace declaration, package manifests, `tsconfig.base.json`, `vite.workspace.ts` and the root script changes; run `npm install` and verify the workspace links.
2. Move `core`, then `react`, then `elements` (new registration/typings), then `styles-vscode`, then `preset-vscode`, rewriting internal imports to package names as each package lands. Run the relevant package tests and `npm run typecheck` after each move.
3. Add package build configs and `build:packages`; verify every `dist/` has ESM output and declarations, including in a clean build.
4. Point the template and `examples/minimal` at package entry points and the shared Vite aliases; delete `src/kit`, `src/styles` and `src/types`.
5. Update `boundaries.json`, the checker, the checker tests and the bundle-composition markers/tests; run `npm run check:boundaries` and the script tests.
6. Update the mock tree and documentation, then run `npm run check`, both size commands and the manual template/minimal checks.

Rollback is a revert of the change. The persisted session key and version do not change, so no user data migration is required.

## Open Questions

None. The public scope name, Node-native ESM and tarball validation are explicitly deferred to the follow-up packaging change rather than blocking this slice.
