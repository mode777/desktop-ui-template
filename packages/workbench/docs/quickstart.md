# Quickstart

This quickstart builds a selective workbench with one tab and one resizable
sidebar. It uses the composition primitives, not the preset, so you can see the
element and style contracts directly.

## Requirements

- React 19 and React DOM 19.
- `@vscode-elements/elements` 2.5 or newer.
- A bundler that understands package `exports`, such as Vite.
- Node 24 for the build tooling.

## Install

When the package is available on the registry:

```bash
npm install @workbench-kit/workbench react react-dom @vscode-elements/elements
```

The package is currently in preview. Until the first publish, build the package
in the repository and install the packed tarball:

```bash
npm run build:packages
npm pack ./packages/workbench
npm install ./workbench-kit-workbench-0.1.0.tgz react react-dom @vscode-elements/elements
```

## Create the application

```bash
npm create vite@latest my-workbench -- --template react-ts
cd my-workbench
npm install
```

Add the package and peers using one of the install paths above.

## Files

Create or replace the following files. Each block is complete; do not keep the
Vite starter content.

<!-- quickstart-file: vite.config.ts -->

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({ plugins: [react()] })
```

<!-- quickstart-file: index.html -->

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Workbench</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

<!-- quickstart-file: src/main.tsx -->

```tsx
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { closeTabIn, reorderTabIn } from '@workbench-kit/workbench/core'
import {
  IconButton,
  ResizablePane,
  TabStrip,
  WorkbenchShell,
  type TabStripItem,
} from '@workbench-kit/workbench/react'
import '@workbench-kit/workbench/elements/icon'
import '@workbench-kit/workbench/elements/tab-header'
import '@workbench-kit/workbench/styles/tokens.css'
import '@workbench-kit/workbench/styles/global.css'
import '@workbench-kit/workbench/styles/shell.css'
import '@workbench-kit/workbench/styles/resizable-pane.css'
import '@workbench-kit/workbench/styles/tab-strip.css'
import '@workbench-kit/workbench/styles/status-bar.css'

const initialTabs: TabStripItem[] = [{ id: 'readme', title: 'README.md' }]

function App() {
  const [tabs, setTabs] = useState(initialTabs)
  const [activeId, setActiveId] = useState<string | null>('readme')
  const [sidebarWidth, setSidebarWidth] = useState(240)
  const collection = { tabs, activeTabId: activeId }

  return (
    <WorkbenchShell
      primarySideBar={
        <ResizablePane
          side="left"
          size={sidebarWidth}
          min={180}
          max={360}
          onSizeChange={setSidebarWidth}
          onReset={() => setSidebarWidth(240)}
          label="Resize options"
        >
          <div style={{ padding: 12 }}>Options</div>
        </ResizablePane>
      }
      statusBar={<div className="statusbar">Quickstart</div>}
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
        actions={<IconButton icon="add" label="New file" />}
      />
      <main style={{ padding: 16 }}>Document area</main>
    </WorkbenchShell>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

## Icons and Codicons

The component styles do not load the Codicon font. `vscode-elements` expects a
real stylesheet link with the id `vscode-codicon-stylesheet` so icon components
can reuse it inside their shadow roots.

`@vscode/codicons` is a peer of `@vscode-elements/elements`. If it is not already
installed:

```bash
npm install @vscode/codicons
```

Copy the stylesheet and font into the application's public directory:

```bash
mkdir -p public/codicons
cp node_modules/@vscode/codicons/dist/codicon.css public/codicons/codicon.css
cp node_modules/@vscode/codicons/dist/codicon.ttf public/codicons/codicon.ttf
```

Add the link to `index.html`:

```html
<link rel="stylesheet" href="/codicons/codicon.css" id="vscode-codicon-stylesheet" />
```

Without this link, names such as `files`, `symbol-property` and `add` still
compile but render as blank squares.

## Build

```bash
npm run build
```

Open the generated `dist/` directory with any static file server, or run
`npm run dev` while developing.

## Verify

- The shell renders with a tab strip, a resizable sidebar and a status bar.
- The sidebar resizes with the pointer and keyboard and resets on double-click.
- The browser console has no unknown custom-element warnings.
- The build completes without TypeScript errors.

## What this demonstrates

This example imports only the primitives and core helpers it uses. It registers
only `vscode-icon` and `vscode-tab-header`. It imports `tokens.css` and
`global.css` first, then only the component stylesheets it renders. It does not
import the preset, `elements/all` or the aggregate `workbench.css`.

When you need more regions, move to [composition](./concepts.md) or the
[preset](./concepts.md), or start from the [eject guide](./recipes/eject.md) in
reverse.
