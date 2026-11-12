# AGENTS.md

> **Scope:** This file is for changing the Workbench Kit repository. If you are
> building an application with the published package, read
> [`packages/workbench/AGENTS.md`](packages/workbench/AGENTS.md) or the
> [hosted consumer documentation](https://mode777.github.io/desktop-ui-template/docs/)
> instead.

This file is the project-specific instruction set for OpenCode (and other coding agents) working in this repository.

## Project

**Desktop UI Template** — a configurable VS Code-style workbench for the browser, built with React 19, TypeScript, Vite and [vscode-elements](https://github.com/vscode-elements/elements).

The product is the **shell**, not an editor. Tabs, panes, menus, panels, the status bar and the mock views are all real interactive UI. The document area, file tree, source control and chat are intentionally mock surfaces.

## Commands

```bash
npm install                # install dependencies and link the workspace packages
npm run dev                # Vite dev server, http://localhost:5173
npm run dev:minimal        # Vite dev server for apps/minimal
npm run dev:custom-shell   # Vite dev server for apps/custom-shell
npm run build              # build packages and facade, then tsc -b and the template app
npm run build:packages     # compile core, react, elements and preset, then generate the facade
npm run build:facade       # regenerate packages/workbench/dist from module builds
npm run pack:check         # pack one tarball, verify contents and consume it
npm run build:minimal      # build apps/minimal into apps/minimal/dist/
npm run build:custom-shell # build apps/custom-shell into apps/custom-shell/dist/
npm run preview            # serve apps/template/dist/
npm run lint               # oxlint
npm run format             # prettier --write .
npm run format:check       # prettier --check .
npm run typecheck          # tsc -b across the apps and packages
npm run test               # vitest run
npm run check              # lint + format + typecheck + boundaries + distribution + docs + release + styles + tests + builds + pack
npm run check:distribution # five private internal modules + one public package
npm run check:docs         # links, documented scripts, public specifiers and API coverage
npm run check:release      # shared versions, npm metadata, changelog and license material
npm run check:styles       # per-component stylesheets, aggregate order and example style subsets
npm run check:minimal      # minimal example bundle composition
npm run check:custom-shell # custom-shell example bundle composition
npm run size               # compare the template bundle against budgets.json
npm run size:minimal       # compare the minimal example against budgets.minimal.json
```

Node 24 is expected (`.nvmrc`). The repository is an npm workspace and the
package is ESM.

## Architecture rules

- The workbench-kit transformation is staged in `ROADMAP.md`. Follow the current phase and its exit criteria. The kit and all three applications are npm workspaces under `packages/` and `apps/`; documentation and release readiness are complete, and the registry publish uses a tag-triggered GitHub Actions workflow with npm trusted publishing after a one-time owner-approved bootstrap.
- The five `packages/*` internal modules are **private**, not five published packages. `packages/core`, `packages/react`, `packages/elements`, `packages/styles-vscode` and `packages/preset-vscode` keep the source boundaries and all declare `"private": true`. Never publish them individually.
- The single publish target is `packages/workbench` (`vscode-workbench`), the generated public facade. It exposes the modules through subpath exports, copies them into one tarball and must not depend on the private workspaces at runtime. `npm run build:facade` regenerates `dist/`; `npm run pack:check` validates the packed artifact. The full model is [`docs/architecture.md`](./docs/architecture.md) and [`distribution.json`](./distribution.json); `npm run check:distribution` enforces package privacy, dependency direction and the public surface.
- Consumer docs live in `packages/workbench/docs/` with the app-level `packages/workbench/AGENTS.md`; contributor docs live in `docs/`, `ROADMAP.md` and this file. `npm run check:docs:consumer` enforces the consumer boundary and API coverage, `npm run check:docs:contributor` checks the repository docs, and `npm run check:release` keeps versions, npm metadata, the changelog heading and license material consistent. The tarball ships `LICENSE`, `THIRD_PARTY_NOTICES.md`, the consumer docs and `llms.txt`; publish from the tag workflow using npm trusted publishing (OIDC), and never add long-lived registry credentials or secrets.
- `packages/preset-vscode` is the composed VS Code-style preset (`VSCodeWorkbench`). It owns the shell composition, thin region adapters over the React primitives, the default store and generic commands. It must never import from `apps/template/src/app` or `apps/template/src/demo`; anything app-specific arrives through props.
- `packages/react` owns the controlled region chrome: `ActivityBar`, `Sidebar`, `Panel`, `StatusBar`, `TitleBar`, `MenuBar`, `ContextMenu`, plus the shell, pane, tab-strip and icon-button primitives. Generic region markup and interactions belong there; store reads, view resolution and command lookup belong in the preset adapters or the app.
- `apps/template/src/app/App.tsx` is the template's composition root. It supplies the preset with the config, view registry, commands, menus, quick-open files, document renderer, icons, branding, status bar and initial session.
- `apps/template/src/app/workbench.config.ts` is the main configuration surface. Region `enabled` flags, activity items, views and default sizes belong there. Do not hard-code layout decisions in `VSCodeWorkbench.tsx` if they can be expressed as config.
- `packages/preset-vscode/src/components/*` are region adapters over the React primitives. Each region must remain independently removable; do not make one region's rendering depend on another's DOM, and take demo content through props. Keep generic chrome in `packages/react` rather than duplicating it in the preset.
- `apps/template/src/demo/views/registry.tsx` maps view IDs to components. New sidebar/panel views are registered there and referenced from config.
- `apps/template/src/demo/commands/registry.ts` composes the preset's generic commands with the template's commands in `apps/template/src/demo/commands/commands.ts`. Menus (`apps/template/src/demo/commands/menus.ts`), the command palette, view action buttons and keyboard shortcuts all call `runWorkbenchCommand`. Add template commands there first.
- `packages/preset-vscode/src/store/workbench-store.ts` owns serializable state and persistence. Keep transient UI state local unless it must survive reloads.
- `apps/custom-shell` is the composition-level reference: a complete shell assembled from `WorkbenchShell`, `ResizablePane`, `TabStrip`, `ActivityBar`, `Sidebar`, `Panel`, `StatusBar`, `TitleBar` and `IconButton` plus app-owned content. It must never import the preset, template app or demo layer; keep its state in its local reducer and its element registration limited to the tags it renders. Its region files are example content, not new kit primitives.
- `packages/styles-vscode/src/tokens.css` is the only place for palette values. Use `--vscode-*` and `--app-*` custom properties in CSS; never hard-code dark/light colors in components. Each reusable component's rules live in its own `<component>.css` (`shell.css`, `title-bar.css`, `tab-strip.css`, …), and `workbench.css` is only the ordered aggregate of those files; update the component file, its exports and the aggregate together because `npm run check:styles` enforces the contract. Demo view selectors live in `apps/template/src/demo/styles/demo-views.css`, and custom-shell selectors live in `apps/custom-shell/src/custom-shell.css`, not in the styles package.
- `apps/template/src/demo/data/workspace.ts` contains the mock tree and documents. Keep new mock entries consistent with the real repository structure where practical.
- `packages/elements/src/global.d.ts` declares the custom elements used in JSX. If you introduce a new vscode-elements tag, add its registration entry, package export and typings.
- Packages import each other by package name (`@workbench-kit/*`); application code does the same. A relative import from outside a package into `packages/*/src` fails the boundary check.

## vscode-elements notes

- Register only the elements a surface renders through `@workbench-kit/elements/<tag>` entries instead of importing the vscode-elements package root. `apps/template/src/vscode-elements.ts` imports `@workbench-kit/elements/all` for the template; the preset registers its own subset from `packages/preset-vscode/src/elements.ts`, and the minimal and custom-shell examples register only their rendered tags. Add a per-tag entry, package export and typing when you introduce a new tag.
- Codicon CSS must be a real `<link>` with `id="vscode-codicon-stylesheet"` in each app's `index.html`. `public/codicons` is generated by `scripts/sync-codicons.mjs` via the app `predev`/`prebuild` scripts and is gitignored.
- React 19 can render custom elements directly. Use `ref` + `addEventListener` for events that React does not expose as props (`vsc-tabs-select`, `vsc-context-menu-select`).
- The tabs component is used for the bottom panel. Editor tabs use standalone `vscode-tab-header` elements because the editor needs drag reorder, middle-click close and per-tab close buttons.

## Code style

- Prettier: no semicolons, single quotes, trailing commas, 100 columns.
- TypeScript strict mode; avoid `any`, prefer explicit types at module boundaries.
- oxlint must stay clean. The project uses the oxlint + Prettier combination from the Vite React template rather than ESLint.
- Use functional React components and hooks. Keep components focused; extract reusable controlled primitives into `packages/react/`.
- Prefer native CSS over utility frameworks. Use class names prefixed by the region or view (`editor-*`, `sidebar-*`, `welcome-*`).
- Keep accessibility: buttons need labels, sashes need `role="separator"` and keyboard handling, dialogs need `aria-modal`, and focus should be restored sensibly.

## Testing

- Vitest + jsdom. Store tests live in `packages/preset-vscode/src/store/*.test.ts`; package and component tests sit next to the code they cover. The shared Vitest setup is `test/setup.ts`.
- Test state transitions (tabs, clamping, toggles, persistence defaults) rather than implementation details.
- For visual changes, run the dev server and verify the shell at 1440×900 and a narrow width. The project should not introduce body scroll at desktop sizes.
- `npm run check:docs` and `npm run check:release` must pass whenever documentation, versions, package metadata or license material changes.
- `npm run check:styles` must pass whenever a stylesheet, style export, aggregate import or example style subset changes.
- `npm run check` must pass before committing.

## Non-goals

- Do not add Monaco/CodeMirror, a real file system, a Git backend, or a real agent runtime as part of the template. Those are replacement points, not dependencies.
- Do not turn the shell into a VS Code clone in name or branding. The layout is inspired by VS Code; the product is its own template.
- Do not commit secrets, tokens or environment-specific credentials.
