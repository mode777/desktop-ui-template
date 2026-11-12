# @workbench-kit/workbench

A configurable VS Code-style workbench for React applications. The package
exposes a full preset, controlled composition primitives, headless helpers,
per-tag `vscode-elements` registrations and the VS Code-style stylesheets through
subpath exports.

Version **0.1.0**. The package is `0.x` and browser-only: minor releases may
include breaking changes, patch releases do not, and SSR is out of scope.

## Install

The package is currently in **preview** and is not yet on the public npm
registry. When the first owner-approved publish lands, install the package and
its peers with:

```bash
npm install @workbench-kit/workbench react react-dom @vscode-elements/elements
```

Until then, build the package in the repository and install the local tarball:

```bash
npm run build:packages
npm pack ./packages/workbench
npm install ./workbench-kit-workbench-0.1.0.tgz react react-dom @vscode-elements/elements
```

React 19 and React DOM 19 are peers. `@vscode-elements/elements` must satisfy
`>=2.5.1 <3`. The package installs `zustand` as its only runtime dependency.

## Quickstart

Import primitives, register only the tags you render, and load tokens, base
styles and the component entries you use:

```tsx
import { useState } from 'react'
import { closeTabIn, reorderTabIn } from '@workbench-kit/workbench/core'
import {
  ResizablePane,
  TabStrip,
  WorkbenchShell,
  type TabStripItem,
} from '@workbench-kit/workbench/react'
import '@workbench-kit/workbench/elements/icon'
import '@workbench-kit/workbench/elements/tab-header'
import '@workbench-kit/workbench/styles/tokens.css'
import '@workbench-kit/workbench/styles/global.css'
import '@workbench-kit/workbench/styles/workbench.css'

const initialTabs: TabStripItem[] = [{ id: 'readme', title: 'README.md' }]

export function App() {
  const [tabs, setTabs] = useState(initialTabs)
  const [activeId, setActiveId] = useState<string | null>('readme')
  const [width, setWidth] = useState(240)
  const collection = { tabs, activeTabId: activeId }

  return (
    <WorkbenchShell
      primarySideBar={
        <ResizablePane
          side="left"
          size={width}
          min={180}
          max={360}
          onSizeChange={setWidth}
          label="Resize options"
        >
          <div style={{ padding: 12 }}>Options</div>
        </ResizablePane>
      }
      statusBar={<div className="statusbar">Ready</div>}
    >
      <TabStrip
        tabs={tabs}
        activeId={activeId}
        onActivate={setActiveId}
        onClose={(id) => {
          const next = closeTabIn(collection, id)
          setTabs(next.tabs)
          setActiveId(next.activeTabId)
        }}
        onReorder={(sourceId, targetId) => {
          const next = reorderTabIn(collection, sourceId, targetId)
          setTabs(next.tabs)
        }}
        label="Open editors"
      />
      <main style={{ padding: 16 }}>Document area</main>
    </WorkbenchShell>
  )
}
```

Build it with your application's build command. The full quickstart, including
the Vite setup, is in the hosted documentation.

## Adoption levels

| Level       | Entry point                               | You own                                                   | The kit owns                                                          |
| ----------- | ----------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------- |
| Preset      | `VSCodeWorkbench`                         | Views, data, commands, menus, branding, document renderer | Shell layout, default regions, tab and layout state, generic commands |
| Composition | `WorkbenchShell` and regions              | Layout, state, commands, views, menus                     | Region chrome, resizing, tab behavior, element and style contracts    |
| Primitives  | `ResizablePane`, `TabStrip`, core helpers | Everything around the primitive                           | The controlled interaction and layout math you import                 |

Start with the preset unless you already have a layout or need to own the shell
state. You can eject later without forking the components.

## Documentation

- [Hosted documentation](https://mode777.github.io/desktop-ui-template/docs/) -
  quickstart, concepts, recipes, reference and eject guide.
- [llms.txt](https://mode777.github.io/desktop-ui-template/llms.txt) - a curated
  index for coding agents.
- [Offline docs](./docs/index.md) - the same Markdown ships inside this package.
- [Agent guide](./AGENTS.md) - app-level rules and the verification checklist.

The hosted site also publishes raw Markdown for clean agent ingestion.

## For AI agents

Read [`AGENTS.md`](./AGENTS.md), then the [consumer docs](./docs/index.md). Use
only public `@workbench-kit/workbench` subpaths, register only rendered
custom-element tags, import `tokens.css` and `global.css` before component
styles, and verify with the application's build and TypeScript check. The
workbench is browser-only; do not evaluate it during a server render.

## Stability and license

- The package is `0.x` and browser-only.
- The preset persistence key is `desktop-ui-template:v1` in `0.1.0`.
- The npm scope and name are provisional until the first publish is approved.
- Publishing is manual and owner-approved; CI holds no publish credentials.
- The tarball ships `LICENSE`, `THIRD_PARTY_NOTICES.md`, the consumer
  documentation, this README and `llms.txt`.

[MIT](./LICENSE). The included `vscode-elements` and Codicons packages retain
their own licenses; see [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).
