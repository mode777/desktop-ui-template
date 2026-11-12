# Replace the document surface

The preset owns tabs, active-tab state and the editor frame. You supply the body
through `renderDocument`. This recipe replaces the mock preview with your own
component without giving up tab behavior.

## Prerequisites

- A preset application renders `VSCodeWorkbench`.
- Your tabs carry the information your renderer needs: `path`, `language`,
  `kind` or an application-owned lookup key.

## Files

```text
src/
  App.tsx
  DocumentView.tsx
  document.css
```

## 1. Create the document component

```tsx
// src/DocumentView.tsx
import type { WorkbenchTab } from '@workbench-kit/workbench'

export function DocumentView({ tab }: { tab: WorkbenchTab }) {
  return (
    <article className="app-document">
      <header className="app-document-header">
        <span>{tab.title}</span>
        {tab.dirty ? <span aria-label="Unsaved changes">*</span> : null}
      </header>
      <pre className="app-document-body">
        {tab.path ?? 'Untitled document'} ({tab.language ?? 'plaintext'})
      </pre>
    </article>
  )
}
```

Replace the `<pre>` with your editor, preview, iframe or data view. The component
receives the active serializable tab, not a live editor instance. Keep editor
instances in your own state keyed by tab id.

## 2. Pass the renderer to the preset

```tsx
// src/App.tsx
import { VSCodeWorkbench } from '@workbench-kit/workbench'
import { DocumentView } from './DocumentView'
import { commands } from './commands'
import { menus } from './menus'
import { config } from './workbench.config'
import { views } from './views'
import './document.css'

export function App() {
  return (
    <VSCodeWorkbench
      config={config}
      views={views}
      commands={commands}
      menus={menus}
      renderDocument={(tab) => <DocumentView tab={tab} />}
      emptyEditor={<div className="app-empty">Open a file to begin.</div>}
      initialSession={{
        tabs: [{ id: 'welcome', title: 'Welcome', kind: 'welcome' }],
        activeTabId: 'welcome',
        outputLines: [],
      }}
    />
  )
}
```

`initialSession` is applied only when the store has no saved session. A user who
closes every tab keeps the empty workbench after reload.

## Composition alternative

If you use `WorkbenchShell` directly, keep `TabStrip` for the tabs and pass your
document component as the shell's main content. The shell does not render a
document for you:

```tsx
<WorkbenchShell statusBar={<StatusBar left={<span>Ready</span>} />}>
  <TabStrip tabs={tabs} activeId={activeId} onActivate={setActiveId} />
  <DocumentView tab={tabs.find((tab) => tab.id === activeId)} />
</WorkbenchShell>
```

## Verify

```bash
npm run build
```

Then confirm:

- Opening, closing, reordering and activating tabs still works.
- The document body follows the active tab.
- The empty editor appears when every tab is closed.
- The dirty marker appears when `tab.dirty` is true.
- The build and TypeScript check pass.

## Common failures

| Symptom                               | Cause                                                        | Fix                                          |
| ------------------------------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Document body is blank                | `renderDocument` returns `null` or the active tab is missing | Render a fallback and check the tab id       |
| Tabs stop updating                    | You replaced `TabStrip` as well as the body                  | Keep the preset or the `TabStrip` primitive  |
| Editor state disappears on tab switch | The editor instance is recreated per render                  | Keep instances in app state keyed by tab id  |
| First load shows the wrong tabs       | A stored session already exists                              | Clear `desktop-ui-template:v1` while testing |

See the [API reference](../reference/api.md#branding-document-and-status-bar) for
`WorkbenchTab`, `renderDocument` and `emptyEditor`.
