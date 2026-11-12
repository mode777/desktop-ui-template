# Minimal workbench example

A one-tab, one-sidebar application built directly from the workbench kit. It is the
tree-shaking canary for the template: if the primitives or the shared styles start
depending on the preset, this build gets bigger and its composition check fails.

## Run it

```bash
npm run dev:minimal      # http://localhost:5173
npm run build:minimal    # emits apps/minimal/dist/
npm run size:minimal     # measures apps/minimal/dist/ against budgets.minimal.json
npm run test -- apps/minimal
```

The build writes its own `apps/minimal/dist/` directory and never touches the
template's `apps/template/dist/`. `size:minimal` is described in the root
[README](../../README.md#bundle-budget).

## What it renders

- One non-closable tab with consumer-owned active state (`TabStrip`).
- One resizable options sidebar (`ResizablePane`) with pointer, keyboard and
  double-click reset.
- A document area whose options come from local `useState`.
- A plain status bar passed through the shell's `statusBar` slot.

## What proves the adoption level

The example imports only:

```tsx
import { ResizablePane, TabStrip, WorkbenchShell } from '@workbench-kit/react'
import type { TabStripItem } from '@workbench-kit/react'
```

and registers only the elements it renders:

```ts
import '@workbench-kit/elements/icon'
import '@workbench-kit/elements/tab-header'
```

It deliberately does **not** import:

- `@workbench-kit/preset-vscode` — no `VSCodeWorkbench`, preset store, command
  registry, menus or generic regions.
- `apps/template/src/app` — no template composition root, branding, hotkeys or status bar.
- `apps/template/src/demo` — no views, commands, mock workspace data, file tree or demo CSS.
- `apps/template/src/vscode-elements.ts` — no aggregate element registration.

The dependency-boundary check enforces the first three, and `check:minimal` verifies
that no demo or preset module reached the production bundle.

These are repository module names. The same entries are available from the single
public package as `vscode-workbench/react`, `.../elements/icon` and
`.../styles/*.css`; see [`docs/architecture.md`](../../docs/architecture.md#3-one-published-package).

## Styles

The example imports the shared `tokens.css` and `global.css` entries plus only
the component stylesheets its composition renders: `shell.css`,
`resizable-pane.css`, `tab-strip.css` and `status-bar.css`. It does not import
the `workbench.css` aggregate, so the production CSS omits the activity bar,
title bar, menu bar, sidebars, editor area, panel, quick open, context menu and
notification rules. `minimal.css` adds only the options panel and document
placeholder. `style-subset.json` records the expected entries and the region
selectors that must stay out of the bundle; `check:minimal` enforces both the
JavaScript and CSS composition.

## Growing beyond the minimal example

1. For a complete multi-region shell without the preset, read
   [`apps/custom-shell`](../custom-shell/README.md): it composes the title bar,
   activity bar, both sidebars, editor tabs, bottom panel and status bar from the
   same primitives and keeps all state in a local reducer.
2. Replace the local tab/sidebar state with a store (or keep it controlled).
3. Import `VSCodeWorkbench` from the preset instead of composing the shell.
4. Supply configuration, a view registry, menus, commands, quick-open files and a
   document renderer as props.
5. Keep the app's views and data in an app/demo layer; the preset never imports them.

See [ROADMAP.md](../../ROADMAP.md) §4 for the preset, composition and primitive
adoption levels.
