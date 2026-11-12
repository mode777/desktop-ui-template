# Migrating to vscode-workbench

This guide moves an application from a copied template or from the repository's
private workspace packages to the single published package. The target is always
one install: `vscode-workbench`.

The package is published as `vscode-workbench`; the provisional pre-release name
was never published. See [`release.md`](./release.md).

- [Choose the adoption level](#choose-the-adoption-level)
- [Install](#install)
- [Map imports](#map-imports)
- [Keep application content in the application](#keep-application-content-in-the-application)
- [Preset state and persistence](#preset-state-and-persistence)
- [Elements and styles](#elements-and-styles)
- [Verify the migration](#verify-the-migration)
- [Common migration failures](#common-migration-failures)

## Choose the adoption level

| If you need…                                              | Target      | Reference           |
| --------------------------------------------------------- | ----------- | ------------------- |
| The full shell with the least application code            | Preset      | `apps/template`     |
| A full shell with your own state, commands and regions    | Composition | `apps/custom-shell` |
| One pane, tab strip or resize behavior in your own layout | Primitives  | `apps/minimal`      |

Read the [eject recipe](../packages/workbench/docs/recipes/eject.md) before choosing. Moving down a level later is
supported, but the state and command wiring changes.

## Install

```bash
npm install vscode-workbench react react-dom @vscode-elements/elements
```

React 19 and React DOM 19 are peer dependencies. `@vscode-elements/elements`
must satisfy `>=2.5.1 <3`. The package is ESM-only and browser-only in `0.x`.

Remove the old package dependencies or source imports only after the new imports
resolve. The five `@workbench-kit/core`, `@workbench-kit/react`,
`@workbench-kit/elements`, `@workbench-kit/styles-vscode` and
`@workbench-kit/preset-vscode` workspaces are private and are never installed by
consumers.

## Map imports

### From the current workspace packages

| Old import                                     | New import                                |
| ---------------------------------------------- | ----------------------------------------- |
| `@workbench-kit/preset-vscode`                 | `vscode-workbench`                        |
| `@workbench-kit/react`                         | `vscode-workbench/react`                  |
| `@workbench-kit/core`                          | `vscode-workbench/core`                   |
| `@workbench-kit/elements/all`                  | `vscode-workbench/elements/all`           |
| `@workbench-kit/elements/<tag>`                | `vscode-workbench/elements/<tag>`         |
| `@workbench-kit/elements/types`                | `vscode-workbench/elements/types`         |
| `@workbench-kit/styles-vscode/tokens.css`      | `vscode-workbench/styles/tokens.css`      |
| `@workbench-kit/styles-vscode/global.css`      | `vscode-workbench/styles/global.css`      |
| `@workbench-kit/styles-vscode/workbench.css`   | `vscode-workbench/styles/workbench.css`   |
| `@workbench-kit/styles-vscode/<component>.css` | `vscode-workbench/styles/<component>.css` |
| `@workbench-kit/styles-vscode`                 | `vscode-workbench/styles`                 |

`<component>` is one of `shell`, `title-bar`, `menu-bar`, `icon-button`,
`activity-bar`, `resizable-pane`, `sidebar`, `tab-strip`, `editor-area`,
`panel`, `status-bar`, `quick-open`, `context-menu` or `notifications`.

### From the pre-workspace template

| Old location                                           | New owner                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------------- |
| `src/layout/Workbench.tsx`                             | `VSCodeWorkbench`, or `WorkbenchShell` + regions for composition          |
| `src/layout/components/TitleBar.tsx`                   | `TitleBar` from `vscode-workbench/react`; preset keeps a store adapter    |
| `src/layout/components/ActivityBar.tsx`                | `ActivityBar` from `vscode-workbench/react`; preset maps items            |
| `src/layout/components/Sidebar.tsx`                    | `Sidebar` from `vscode-workbench/react`; preset resolves views            |
| `src/layout/components/SecondarySideBar.tsx`           | `Sidebar` with a secondary modifier; preset resolves views                |
| `src/layout/components/BottomPanel.tsx`                | `Panel` from `vscode-workbench/react`; preset maps view content           |
| `src/layout/components/EditorArea.tsx`                 | Preset editor area; application owns the document renderer                |
| `src/layout/components/StatusBar.tsx`                  | `StatusBar` from `vscode-workbench/react`, or the preset `statusBar` prop |
| `src/layout/components/MenuBar.tsx`                    | `MenuBar` from `vscode-workbench/react`                                   |
| `src/layout/components/VsContextMenu.tsx`              | `ContextMenu` from `vscode-workbench/react`                               |
| `src/layout/components/QuickOpen.tsx`                  | Preset quick open; application supplies files and open callback           |
| `src/layout/components/Notifications.tsx`              | Preset notification surface                                               |
| `src/layout/components/ResizablePane.tsx`              | `ResizablePane` from `vscode-workbench/react`                             |
| `src/components/IconButton.tsx`                        | `IconButton` from `vscode-workbench/react`                                |
| `src/layout/workbench.config.ts`                       | Application config passed as the `config` prop                            |
| `src/layout/types.ts`                                  | Public types from `vscode-workbench`                                      |
| `src/store/workbench-store.ts`                         | `useWorkbenchStore` from the preset, or consumer-owned state              |
| `src/commands/*`                                       | Application commands composed with `defaultCommands`                      |
| `src/views/*` and `src/data/*`                         | Stay in the application                                                   |
| `src/styles/tokens.css`, `global.css`, `workbench.css` | Package style entries                                                     |
| `src/vscode-elements.ts`                               | Per-tag entries, or `elements/all` for a demo                             |

A tab strip extracted from `EditorArea` becomes `TabStrip` from
`vscode-workbench/react`. A pane extracted from `ResizablePane` becomes
the controlled `ResizablePane` with `size` and `onSizeChange`. The region chrome
maps directly as well: `ActivityBar` takes items and an active id, `Sidebar`
takes header data and a body slot, `Panel` takes tab content, `StatusBar` takes
left and right slots, `TitleBar` takes three slots, and `MenuBar`/`ContextMenu`
dispatch command ids and selection values.

## Keep application content in the application

The preset knows about regions, not about your product. Keep these in your app:

- View components and the registry that maps ids to them.
- Mock or real workspace data, documents and file icons.
- Menus and the command implementations that are not generic workbench actions.
- Branding, the document renderer, status-bar content and first-run tabs.
- Application CSS, including view selectors.

Compose generic and application commands explicitly:

```ts
import { createCommandRegistry, defaultCommands } from 'vscode-workbench'

const commands = createCommandRegistry([...defaultCommands, ...appCommands])
```

If you do not want the default commands, pass a registry containing only your
commands. The preset does not reach into an application registry.

## Preset state and persistence

The preset store persists to `localStorage` under `desktop-ui-template:v1` with
schema version `1`. It survives reloads and stores:

- theme and the six region visibility flags;
- panel-maximized state and the three region sizes;
- the active primary, secondary and panel views;
- open tabs, the active tab and the closed-tab history.

Quick-open state, output lines and notifications are not persisted. The
`initialSession` prop is applied only when no stored session exists, so a user
who closes every tab keeps an empty workbench after reload.

If the application used its own store, decide between:

1. **Keep the preset store.** Map your existing state into the preset store or
   start from `createInitialData()` on first run.
2. **Keep your own store.** Use the composition level and pass controlled values
   to the shell and primitives. The preset store is optional.

The key is not configurable in `0.1.0`. If two preset workbenches share an
origin, they share state. Use composition if you need isolated instances or a
different key; see the [eject recipe](../packages/workbench/docs/recipes/eject.md#state-and-persistence).

## Elements and styles

Register only the custom elements your markup renders. The preset registers its
own subset; a composition consumer must register at least:

```ts
import 'vscode-workbench/elements/icon'
import 'vscode-workbench/elements/tab-header'
```

Add `vscode-workbench/elements/types` once in a TypeScript declaration
file or app entry so JSX knows the registered tags. Prefer per-tag entries over
`vscode-workbench/elements/all`.

Import styles explicitly. There are two equivalent paths:

- **Aggregate:** import `tokens.css`, `global.css` and `workbench.css` when the
  application renders most regions.
- **Component entries:** import `tokens.css`, `global.css` and only the
  component stylesheets the application renders.

```ts
import 'vscode-workbench/styles/tokens.css'
import 'vscode-workbench/styles/global.css'
import 'vscode-workbench/styles/shell.css'
import 'vscode-workbench/styles/resizable-pane.css'
import 'vscode-workbench/styles/tab-strip.css'
import 'vscode-workbench/styles/status-bar.css'
import './app.css'
```

`vscode-workbench/styles/workbench.css` is the aggregate of every
component entry. `vscode-workbench/styles` is the aggregate alias that
also loads tokens and global styles in order. Component entries are additive:
they do not load tokens, base styles or another component's rules. Application
view selectors belong in application CSS.

## Verify the migration

1. Build the production bundle and open it.
2. Check the shell regions, resize sashes, tab lifecycle, panel tabs, theme and
   keyboard shortcuts.
3. Reload once and confirm the persisted layout, tabs and active views survive.
4. Confirm only the element tags you render are registered; remove unused
   imports.
5. Search the production output for `@workbench-kit/core`,
   `@workbench-kit/react`, `@workbench-kit/preset-vscode` and
   `@workbench-kit/styles-vscode`; the published bundle should contain none of
   those specifiers.
6. Confirm no application view, mock data or menu module is imported by a kit
   entry.
7. Typecheck the application. If a custom element is unknown, add its per-tag
   import and the `elements/types` declaration.

## Common migration failures

| Failure                        | Symptom                                                                      | Fix                                                                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Aggregate element registration | The bundle contains every tag, or unused elements are registered.            | Import only `vscode-workbench/elements/<tag>` for tags in your markup; keep `elements/all` for demos.                      |
| Missing element tag            | A custom element renders unstyled or does not upgrade.                       | Add the matching per-tag import and the `elements/types` declaration.                                                      |
| Wrong CSS order                | Tokens are missing, colors fall back, or shell spacing collapses.            | Import `tokens.css` and `global.css` first, then `workbench.css` or the component entries. Component entries are additive. |
| Duplicate React                | “Invalid hook call” or two React instances in one bundle.                    | Keep React and React DOM as shared peers; do not install a second copy inside the workbench package or an app dependency.  |
| Shared persistence key         | Two workbenches mirror each other, or stale layout appears after upgrade.    | Use one preset per origin, or move to composition and own the storage key.                                                 |
| Preset commands missing        | The command palette lists no default actions.                                | Compose `createCommandRegistry([...defaultCommands, ...appCommands])` and pass it as `commands`.                           |
| Private module import          | The package cannot resolve `@workbench-kit/react` or another workspace name. | Replace it with the published subpath from the mapping table.                                                              |
| SSR or server rendering        | `window`, `document` or `customElements` is undefined.                       | Render the workbench on the client only; SSR is out of scope for `0.x`.                                                    |

For the complete API surface, see the [consumer API reference](../packages/workbench/docs/reference/api.md). For the move between
adoption levels, see the [eject recipe](../packages/workbench/docs/recipes/eject.md). For the architecture behind the
five private modules, see [`architecture.md`](./architecture.md).
