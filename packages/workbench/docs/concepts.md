# Concepts

The kit has three adoption levels. They share the same regions, element
registrations and styles, but differ in who owns layout, state and commands.

## Adoption levels

### Preset

The preset exports `VSCodeWorkbench`. It composes the title bar, activity bar,
primary and secondary sidebars, editor tabs, bottom panel and status bar. It owns
a default layout store and generic tab/layout commands. You supply configuration,
a view registry, commands, menus, quick-open files, a document renderer, branding,
status-bar content and an initial session.

Use the preset when you want the full workbench quickly and are happy to keep
application behavior outside the kit.

A complete preset entry looks like this:

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { VSCodeWorkbench } from 'vscode-workbench'
import { commands } from './commands'
import { menus } from './menus'
import { views } from './views'
import { config } from './workbench.config'
import 'vscode-workbench/styles/tokens.css'
import 'vscode-workbench/styles/global.css'
import 'vscode-workbench/styles/workbench.css'

function App() {
  return (
    <VSCodeWorkbench
      config={config}
      views={views}
      commands={commands}
      menus={menus}
      branding={{ title: 'My Workbench' }}
    />
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

The preset registers the element tags its own regions render. Import extra
per-tag entries only for `vscode-*` markup in your own views. Add the Codicon
stylesheet as described in the [quickstart](./quickstart.md#icons-and-codicons).

### Composition

Composition imports `WorkbenchShell` and individual regions such as
`ActivityBar`, `Sidebar`, `Panel`, `StatusBar`, `TitleBar`, `TabStrip` and
`ResizablePane`. You own the layout state, tab collection, commands and view
selection. The primitives own region chrome, keyboard and pointer behavior, and
the controlled callbacks.

Use composition when you already have a state model, need a custom shell, or want
to decide which regions exist at runtime.

### Primitives

Primitives are the smallest controlled pieces: a resizable pane, a tab strip, an
icon button, and headless helpers from the package core entry. Use them inside an
existing layout when you only need one behavior.

## State ownership

- The preset store owns layout visibility, sizes, open tabs, the active tab, the
  active views, panel selection and theme. It persists those fields.
- Composition state is yours. Keep it in `useState`, a reducer, Zustand or your
  existing store. The primitives are controlled.
- Primitive state is yours. Helpers such as `closeTabIn` and `reorderTabIn`
  return a new collection; they do not mutate your state.

Do not mix the preset store with a second source of truth for the same tab or
layout field. If you eject from the preset, move the state deliberately.

## Persistence

The preset persists to `localStorage` under the key `desktop-ui-template:v1`.
The persisted state includes region visibility, sash sizes, open tabs, active
tabs, active views and theme. It does not persist application data, document
content or commands.

If you leave the preset, you can keep the same shape through the headless
versioned persistence helpers, or replace the adapter with your own. Clearing the
key resets the layout on the next load.

## Element registration

The package uses `vscode-elements` web components. JavaScript imports are
side-effectful registration entries, not React components. Register only the tags
your markup renders:

```ts
import 'vscode-workbench/elements/icon'
import 'vscode-workbench/elements/tab-header'
```

The preset registers its own subset. A composition or primitive consumer must
register the tags behind the components it renders. Missing registrations usually
produce empty or unstyled custom elements rather than a build error.

`elements/all` exists for demos and template-style applications. Selective
consumers should prefer per-tag entries.

## Styles

Styles are explicit imports. There is no implicit CSS side effect from importing
JavaScript.

Import `tokens.css` and `global.css` first, then either the aggregate
`workbench.css` or the component entries your application renders:

```ts
import 'vscode-workbench/styles/tokens.css'
import 'vscode-workbench/styles/global.css'
import 'vscode-workbench/styles/shell.css'
import 'vscode-workbench/styles/resizable-pane.css'
import 'vscode-workbench/styles/tab-strip.css'
import 'vscode-workbench/styles/status-bar.css'
```

Component entries are additive. They do not load tokens, base styles or another
component's rules. The aggregate is convenient when you render most regions.

## Theming

All palette values live in `tokens.css` as `--vscode-*` and `--app-*` custom
properties. The preset writes `data-theme="dark|light"` to the document element
and stores the chosen theme. Add a theme by adding another `[data-theme='...']`
block and selecting it; do not hard-code colors in components.

## App versus kit

Application views, data, commands, menus and branding belong in your application.
The kit owns regions, controlled interactions, element registrations and reusable
styles. Do not edit installed package files to make an application work; wrap the
primitive or add application CSS instead. If the kit needs a change, that is a
separate contribution.
