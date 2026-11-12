# Ejecting from the preset

Ejecting means moving down one adoption level without leaving the kit:

```text
Preset  →  Composition  →  Primitives
```

You can stop at any level. Each level remains supported by the same package,
element entries and stylesheets. Ejecting is a change in who owns layout state
and application policy, not a fork of the components.

- [When to eject](#when-to-eject)
- [Compare the levels](#compare-the-levels)
- [Level 1: keep the preset](#level-1-keep-the-preset)
- [Level 2: preset to composition](#level-2-preset-to-composition)
- [Level 3: composition to primitives](#level-3-composition-to-primitives)
- [State and persistence](#state-and-persistence)
- [Elements and styles at each level](#elements-and-styles-at-each-level)
- [Verify the ejection](#verify-the-ejection)

## When to eject

Stay on the preset when you want the full shell and are happy with the default
store and generic commands. Eject to composition when you need:

- your own layout, tab or panel state;
- a different persistence key or isolated workbench instances;
- custom region chrome or a different command surface;
- to remove quick open, notifications or the context menu.

Eject further to primitives when you already have a layout — a docking library,
a CSS grid or your own shell — and only want resizing, tabs or an icon button.

## Compare the levels

| Level       | Keeps                                                             | Gives up                                                               | State owner | Reference           |
| ----------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------- | ------------------- |
| Preset      | Full shell, regions, store, generic commands, quick open, toasts  | Nothing; least code to own                                             | Preset      | `apps/template`     |
| Composition | Shell, region primitives, resizing, tabs, menus, elements, styles | Preset store, commands, quick open, notifications, default menu wiring | Application | `apps/custom-shell` |
| Primitives  | Resizing, tab strip, icon button and headless helpers             | Shell, default regions, default tab/panel composition                  | Application | `apps/minimal`      |

[`apps/template`](../apps/template) uses the preset,
[`apps/custom-shell`](../apps/custom-shell) composes the full shell without it,
and [`apps/minimal`](../apps/minimal) uses only the primitives.

## Level 1: keep the preset

```tsx
import { VSCodeWorkbench, createCommandRegistry, defaultCommands } from '@workbench-kit/workbench'

;<VSCodeWorkbench
  config={config}
  views={views}
  commands={createCommandRegistry([...defaultCommands, ...appCommands])}
  menus={menus}
  quickOpen={{ files, openFile }}
  renderDocument={(tab) => <DocumentView tab={tab} />}
  statusBar={<StatusBar />}
  branding={{ title: 'My Workbench' }}
/>
```

The preset owns the store, region visibility, sizes, active views, tab
collection, quick open, notifications and the context menu. You own the views,
data, commands, menus, branding, document renderer and status bar.

No ejection is needed if this matches your application.

## Level 2: preset to composition

Replace `VSCodeWorkbench` with `WorkbenchShell`, the region primitives and your
own content.

```tsx
import { useState } from 'react'
import {
  ActivityBar,
  IconButton,
  ResizablePane,
  Sidebar,
  StatusBar,
  TabStrip,
  TitleBar,
  WorkbenchShell,
} from '@workbench-kit/workbench/react'
import { closeTabIn } from '@workbench-kit/workbench/core'

const items = [
  { id: 'options', title: 'Options', icon: 'settings-gear' },
  { id: 'files', title: 'Files', icon: 'files' },
]

export function App() {
  const [tabs, setTabs] = useState([{ id: 'readme', title: 'README.md' }])
  const [activeTabId, setActiveTabId] = useState<string | null>('readme')
  const [activeView, setActiveView] = useState('options')
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const active = items.find((item) => item.id === activeView) ?? items[0]

  return (
    <WorkbenchShell
      titleBar={
        <TitleBar
          left={<span>My Workbench</span>}
          right={
            <IconButton
              icon="layout-sidebar-left"
              label="Toggle sidebar"
              active={sidebarVisible}
              onClick={() => setSidebarVisible((visible) => !visible)}
            />
          }
        />
      }
      activityBar={
        <ActivityBar
          items={items}
          activeId={sidebarVisible ? activeView : null}
          onActivate={(id) => {
            setActiveView(id)
            setSidebarVisible(true)
          }}
        />
      }
      primarySideBar={
        sidebarVisible ? (
          <ResizablePane
            side="left"
            size={sidebarWidth}
            min={180}
            max={520}
            onSizeChange={setSidebarWidth}
            label="Resize sidebar"
          >
            <Sidebar
              title={active.title}
              icon={active.icon}
              label="Primary side bar"
              closeLabel="Close side bar"
              onClose={() => setSidebarVisible(false)}
            >
              <OptionsPanel />
            </Sidebar>
          </ResizablePane>
        ) : null
      }
      statusBar={<StatusBar left={<span>Ready</span>} right={<span>Ln 1, Col 1</span>} />}
    >
      <TabStrip
        tabs={tabs}
        activeId={activeTabId}
        onActivate={setActiveTabId}
        onClose={(id) => {
          const next = closeTabIn({ tabs, activeTabId }, id)
          setTabs(next.tabs)
          setActiveTabId(next.activeTabId)
        }}
        onReorder={(sourceId, targetId) => {
          /* update your own tab order */
        }}
        label="Open editors"
      />
      <Document tab={tabs.find((tab) => tab.id === activeTabId)} />
    </WorkbenchShell>
  )
}
```

### What you must provide

| Preset surface       | Composition replacement                                                     |
| -------------------- | --------------------------------------------------------------------------- |
| Region visibility    | Omit a slot, or keep a visible flag in your own state.                      |
| Region sizes         | Controlled `ResizablePane` sizes and `onSizeChange`.                        |
| Active sidebar views | Your own view registry; pass ids and callbacks to `ActivityBar`/`Sidebar`.  |
| Tab collection       | Your own tabs plus `openTabIn`, `closeTabIn`, `reorderTabIn`, `cycleTab`.   |
| Quick open           | Your own dialog, or omit it.                                                |
| Notifications        | Your own toast surface, or omit it.                                         |
| Context menu         | `ContextMenu` with your own open state and items, or omit it.               |
| Generic commands     | Your own command functions; `defaultCommands` is not required.              |
| Persistence          | Your own storage adapter, optionally with `readVersioned`/`writeVersioned`. |
| Document rendering   | Your own editor body; the shell does not render documents.                  |
| Status bar           | `StatusBar` with your own left/right content.                               |

Keep the shared structural class names (`workbench`, `titlebar`, `sidebar`,
`editor-tabs`, `panel`, `statusbar`, `resizable-pane`) and put app-only selectors
in app CSS. The full reference is [`apps/custom-shell`](../apps/custom-shell).

### Preset store field mapping

If you are moving from the preset, map each persisted field to your own state:

| Preset field                                                             | Composition owner                                  |
| ------------------------------------------------------------------------ | -------------------------------------------------- |
| `theme`                                                                  | App state or a theme provider.                     |
| `primarySideBarVisible`, `secondarySideBarVisible`, `bottomPanelVisible` | Local visibility flags.                            |
| `activityBarVisible`, `statusBarVisible`, `titleBarVisible`              | Local visibility flags.                            |
| `panelMaximized`                                                         | Local `panelMaximized` passed to `WorkbenchShell`. |
| `primarySideBarWidth`, `secondarySideBarWidth`, `bottomPanelHeight`      | Local sizes for `ResizablePane`.                   |
| `activePrimaryView`, `activeSecondaryView`, `activePanelView`            | Local active view ids.                             |
| `tabs`, `activeTabId`                                                    | Local tab collection.                              |
| `closedTabs`                                                             | Local reopen history, capped by your app.          |
| `quickOpenOpen`, `quickOpenMode`                                         | Optional local dialog state.                       |
| `outputLines`                                                            | Optional local output state.                       |
| `notifications`                                                          | Optional local notification state.                 |

The preset's actions become callbacks in your reducer or state setters. The core
tab helpers already encode the default close, reopen, reorder and cycle behavior,
so you do not need to reimplement those transitions.

## Level 3: composition to primitives

Keep only the behavior you need inside an existing layout:

```tsx
import { ResizablePane, TabStrip } from '@workbench-kit/workbench/react'
import { clampSize } from '@workbench-kit/workbench/core'

export function Inspector({ children }) {
  const [width, setWidth] = useState(320)

  return (
    <aside style={{ display: 'flex' }}>
      <div style={{ flex: 1 }}>{children}</div>
      <ResizablePane
        side="right"
        size={width}
        min={240}
        max={480}
        onSizeChange={(next) => setWidth(clampSize(next, 240, 480))}
        onReset={() => setWidth(320)}
        label="Resize inspector"
      >
        <InspectorContent />
      </ResizablePane>
    </aside>
  )
}
```

At this level:

- `WorkbenchShell` is gone; your layout owns the root and regions.
- No default title bar, activity bar, sidebar, panel or status bar.
- No preset store or command registry.
- `ResizablePane`, `TabStrip` and `IconButton` remain controlled and app-free.
- Core helpers remain available for tab transitions and persistence.

The reference is [`apps/minimal`](../apps/minimal). It uses one tab, one
`ResizablePane` sidebar and a plain status bar.

## State and persistence

The preset uses Zustand for convenience. Composition and primitive consumers can
use any state model — `useReducer`, another store or a server-backed state.

For persistence without the preset, use the injected storage seam:

```ts
import { readVersioned, writeVersioned, type StorageAdapter } from '@workbench-kit/workbench/core'

const storage: StorageAdapter = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key),
}

interface AppLayout {
  sidebarWidth: number
  activeView: string
}

const fallback: AppLayout = { sidebarWidth: 280, activeView: 'explorer' }

const layout = readVersioned(storage, 'my-app:layout', {
  version: 1,
  fallback,
  migrate: (stored) => ({ ...fallback, ...(stored.state as Partial<AppLayout>) }),
})

writeVersioned(storage, 'my-app:layout', 1, layout)
```

`readVersioned` returns the fallback for a missing key, an unreadable payload,
an adapter error or a version it cannot migrate. `writeVersioned` returns `false`
when the adapter throws. The preset's `desktop-ui-template:v1` key is not used
by these helpers unless you pass it explicitly.

## Elements and styles at each level

| Level       | Element registration                                                                                         | Styles                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Preset      | The preset registers its own tags; import extra tags your views render.                                      | Import `tokens.css`, `global.css` and `workbench.css` (or `styles`), plus app CSS.              |
| Composition | Register `vscode-icon`, `vscode-tab-header`, plus every tag your regions render.                             | Import tokens, global and the component entries your regions render, plus app/region CSS.       |
| Primitives  | Register only the tags your markup uses; `vscode-icon` for `IconButton`, `vscode-tab-header` for `TabStrip`. | Import tokens, global and only the component entries you use, or scope your own structural CSS. |

```ts
import '@workbench-kit/workbench/elements/icon'
import '@workbench-kit/workbench/elements/tab-header'
import '@workbench-kit/workbench/styles/tokens.css'
import '@workbench-kit/workbench/styles/global.css'
import '@workbench-kit/workbench/styles/shell.css'
import '@workbench-kit/workbench/styles/resizable-pane.css'
import '@workbench-kit/workbench/styles/tab-strip.css'
import '@workbench-kit/workbench/styles/status-bar.css'
```

That subset is what the minimal example uses: a shell, one resizable pane, a tab
strip and a status bar. Use `workbench.css` or the `styles` alias when you keep
most regions; component entries are additive and do not load tokens, base styles
or each other.

Prefer per-tag entries over `@workbench-kit/workbench/elements/all`. Add
`@workbench-kit/workbench/elements/types` once for JSX declarations.

## Verify the ejection

1. Build and open the production bundle.
2. Confirm the regions you kept render and the ones you removed leave no
   focusable or hidden content.
3. Exercise pointer, keyboard and double-click resizing; confirm sizes are
   clamped and committed.
4. Activate, close, reopen and reorder tabs; confirm the next tab is chosen when
   the active one closes.
5. Reload and confirm your own persistence behavior, not the preset key.
6. Search the bundle for the preset store, command registry, quick open,
   notifications and context menu; none should remain at composition or
   primitive level.
7. Compare against the matching reference application and run its check command:
   `npm run check:custom-shell` for composition or `npm run check:minimal` for
   primitives.

Ejection is reversible: moving back to the preset means passing the same config,
views, commands and menus to `VSCodeWorkbench` and removing the app-owned region
state.

See [`api.md`](./api.md) for the full surface, [`migration.md`](./migration.md)
for the initial move to the package and [`architecture.md`](./architecture.md)
for the module boundaries.
