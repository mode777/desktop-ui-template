# Workbench Kit API reference

`@workbench-kit/workbench` is the single public package for the workbench kit.
It exposes the full VS Code-style preset, the controlled composition primitives,
the headless helpers, per-tag element registration and the stylesheets through
subpath exports.

Current version: **0.1.0**. The package is **browser-only** and has no SSR
support in the `0.x` line. The npm scope and package name are provisional until
the first publish is approved; see the [changelog](../changelog.md).

- [Install](#install)
  - [Minimal quickstart](#minimal-quickstart)
- [Entry points](#entry-points)
- [Preset](#preset)
- [Composition primitives](#composition-primitives)
- [Core helpers](#core-helpers)
- [Elements](#elements)
- [Styles](#styles)
- [Public type index](#public-type-index)
- [Stability](#stability)

## Install

```bash
npm install @workbench-kit/workbench react react-dom @vscode-elements/elements
```

React 19 and React DOM 19 are peer dependencies, and
`@vscode-elements/elements` must satisfy `>=2.5.1 <3`. The package also has one
runtime dependency, `zustand`, which npm installs with the package.

The package is ESM-only. Use a bundler that understands package `exports`, or a
Node ESM consumer for the non-DOM layers.

### Minimal quickstart

Create a Vite React application, install the package and its peers, and replace
the generated entry with the files below.

```bash
npm create vite@latest my-workbench -- --template react-ts
cd my-workbench
npm install
npm install @workbench-kit/workbench @vscode-elements/elements
```

`vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({ plugins: [react()] })
```

`index.html` keeps the generated `<div id="root"></div>` and loads
`/src/main.tsx`.

`src/main.tsx`:

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
import '@workbench-kit/workbench/styles/workbench.css'

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

Build it with `npm run build` and open the generated `dist/` directory. The
example imports no preset, no repository source and no private module, and it
registers only the two element tags it renders.

## Entry points

Consumers install only `@workbench-kit/workbench` and import the subpaths below.

| Published import                          | Purpose                                            |
| ----------------------------------------- | -------------------------------------------------- |
| `@workbench-kit/workbench`                | Full preset, default store and generic commands.   |
| `@workbench-kit/workbench/react`          | Controlled shell, pane, tab strip and icon button. |
| `@workbench-kit/workbench/core`           | Headless layout, tab and persistence helpers.      |
| `@workbench-kit/workbench/elements/<tag>` | One custom-element registration side effect.       |
| `@workbench-kit/workbench/elements/types` | JSX declarations for the registered elements.      |
| `@workbench-kit/workbench/styles/*.css`   | Tokens, base and component stylesheets.            |
| `@workbench-kit/workbench/styles`         | Aggregate stylesheet in import order.              |

Importing the preset does not load the composition or core entries, and
importing a lower entry does not load the preset, its store or its commands.

```tsx
import { VSCodeWorkbench } from '@workbench-kit/workbench'
import { WorkbenchShell, TabStrip } from '@workbench-kit/workbench/react'
import { clampSize } from '@workbench-kit/workbench/core'
import '@workbench-kit/workbench/elements/icon'
import '@workbench-kit/workbench/styles/tokens.css'
import '@workbench-kit/workbench/styles/global.css'
import '@workbench-kit/workbench/styles/workbench.css'
```

## Preset

The preset is the fastest path to the full shell: title bar, activity bar,
primary and secondary side bars, editor tabs, bottom panel, status bar, quick
open, notifications and a persisted layout store. Views, commands, menus, mock
data and branding stay in the application.

### `VSCodeWorkbench`

```tsx
import { VSCodeWorkbench } from '@workbench-kit/workbench'

export function App() {
  return (
    <VSCodeWorkbench
      config={config}
      views={views}
      commands={commands}
      menus={menus}
      quickOpen={{ files, openFile }}
      renderDocument={(tab) => <DocumentView tab={tab} />}
      statusBar={<StatusBar />}
      branding={{ title: 'My Workbench', icon: 'window' }}
    />
  )
}
```

| Prop                 | Type                               | Required | Description                                                                 |
| -------------------- | ---------------------------------- | -------- | --------------------------------------------------------------------------- |
| `config`             | `WorkbenchConfig`                  | yes      | Region visibility, activity items, view ids and size bounds.                |
| `views`              | `WorkbenchViewRegistry`            | yes      | Primary, secondary and panel view definitions keyed by id.                  |
| `commands`           | `CommandRegistry`                  | yes      | Runs command ids and lists them for the command palette.                    |
| `menus`              | `MenuDefinition[]`                 | yes      | Title-bar menu definitions. Entries reference command ids.                  |
| `overflowMenu`       | `MenuEntryDefinition[]`            | no       | Extra entries for the overflow menu.                                        |
| `quickOpen`          | `QuickOpenProvider`                | no       | Files offered by quick open and the callback that opens one.                |
| `fileIcons`          | `FileIconResolver`                 | no       | Maps a path to a Codicon name and optional CSS class.                       |
| `renderDocument`     | `(tab: WorkbenchTab) => ReactNode` | no       | Renders the editor body for the active tab.                                 |
| `emptyEditor`        | `ReactNode`                        | no       | Rendered when no tab is active.                                             |
| `branding`           | `WorkbenchBranding`                | no       | Title-bar label, app icon and activation callback.                          |
| `commandCenterLabel` | `string`                           | no       | Placeholder for the command center input.                                   |
| `statusBar`          | `ReactNode`                        | no       | Status-bar content supplied by the application.                             |
| `initialSession`     | `InitialWorkbenchSession`          | no       | First-run tabs, active tab and output lines, applied only on a fresh store. |
| `onRevealFile`       | `(path: string) => void`           | no       | Called when the editor reveals a file path.                                 |

### `WorkbenchConfig`

Every region entry is required. Setting `enabled` to `false` removes that region
from the shell; the remaining regions reclaim the space.

```ts
import type { WorkbenchConfig } from '@workbench-kit/workbench'

export const config: WorkbenchConfig = {
  titleBar: {
    enabled: true,
    menuBar: true,
    commandCenter: true,
    layoutControls: true,
    windowControls: true,
  },
  activityBar: {
    enabled: true,
    items: [{ id: 'explorer', title: 'Explorer', icon: 'files' }],
    bottomItems: [],
  },
  primarySideBar: {
    enabled: true,
    initialWidth: 300,
    minWidth: 180,
    maxWidth: 640,
    views: ['explorer'],
  },
  secondarySideBar: {
    enabled: false,
    initialWidth: 330,
    minWidth: 240,
    maxWidth: 640,
    views: [],
  },
  bottomPanel: {
    enabled: true,
    initialHeight: 230,
    minHeight: 100,
    maxHeight: 620,
    views: ['output'],
  },
  statusBar: { enabled: true },
}
```

| Region             | Fields                                                                    | Notes                                                               |
| ------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `titleBar`         | `enabled`, `menuBar`, `commandCenter`, `layoutControls`, `windowControls` | Each sub-control can be removed independently.                      |
| `activityBar`      | `enabled`, `items`, `bottomItems`                                         | `items` are `ActivityItem`; `bottomItems` are `ActivityAction`.     |
| `primarySideBar`   | `enabled`, `initialWidth`, `minWidth`, `maxWidth`, `views`                | `views` lists `WorkbenchViewRegistry.primary` ids in display order. |
| `secondarySideBar` | `enabled`, `initialWidth`, `minWidth`, `maxWidth`, `views`                | `views` lists `WorkbenchViewRegistry.secondary` ids.                |
| `bottomPanel`      | `enabled`, `initialHeight`, `minHeight`, `maxHeight`, `views`             | `views` lists `WorkbenchViewRegistry.panel` ids.                    |
| `statusBar`        | `enabled`                                                                 | Content comes from the `statusBar` prop.                            |

### Views

```ts
import type { WorkbenchViewRegistry } from '@workbench-kit/workbench'

const views: WorkbenchViewRegistry = {
  primary: {
    explorer: {
      id: 'explorer',
      title: 'Explorer',
      icon: 'files',
      component: ExplorerView,
      actions: [{ icon: 'new-file', label: 'New File', commandId: 'file.new' }],
    },
  },
  secondary: {},
  panel: {},
}
```

`WorkbenchViewRegistry` has three records: `primary`, `secondary` and `panel`,
each keyed by view id. A view definition is the same shape in every region.

| Type             | Field       | Description                                       |
| ---------------- | ----------- | ------------------------------------------------- |
| `ViewDefinition` | `id`        | Stable id used by `config.*.views` and the store. |
|                  | `title`     | Label shown in the sidebar or panel tab.          |
|                  | `icon`      | Codicon name for the activity bar and tabs.       |
|                  | `component` | React component rendered for the view.            |
|                  | `actions?`  | Header buttons, each an `ViewAction`.             |
|                  | `badge?`    | Number or string rendered next to a panel tab.    |
| `ViewAction`     | `icon`      | Codicon name.                                     |
|                  | `label`     | Accessible label.                                 |
|                  | `commandId` | Command run when the action is activated.         |

### Commands

```ts
import { createCommandRegistry, defaultCommands } from '@workbench-kit/workbench'

const commands = createCommandRegistry([
  ...defaultCommands,
  {
    id: 'myApp.openSettings',
    title: 'Open Settings',
    category: 'My App',
    run: () => openSettings(),
  },
])
```

| Type                       | Shape                                           | Description                                        |
| -------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| `CommandRunner`            | `run(id: string): boolean`                      | Runs a command and reports whether the id exists.  |
| `CommandListItem`          | `id`, `title`, `category`, `keybinding?`, `run` | Entry listed by the command palette.               |
| `CommandRegistry`          | `run(id)`, `list(): CommandListItem[]`          | The registry the preset consumes.                  |
| `WorkbenchCommand`         | `id`, `title`, `category`, `keybinding?`, `run` | Command shape accepted by `createCommandRegistry`. |
| `WorkbenchCommandRegistry` | `run(id)`, `list(): WorkbenchCommand[]`         | Registry returned by `createCommandRegistry`.      |

`createCommandRegistry(commands)` returns a registry that lists the supplied
commands and runs the first matching id. `defaultCommands` contains only generic
workbench commands and never references app views, files or branding.

| Category | Command ids                                                                                                                                                                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File     | `file.new`, `file.open`, `file.save`, `file.saveAll`, `file.close`, `file.closeAll`, `file.reopen`                                                                                                                                                      |
| View     | `view.commandPalette`, `view.quickOpen`, `view.togglePrimary`, `view.toggleSecondary`, `view.togglePanel`, `view.togglePanelMaximized`, `view.toggleActivityBar`, `view.toggleStatusBar`, `view.toggleTitleBar`, `view.toggleTheme`, `view.resetLayout` |
| Tab      | `tab.close`, `tab.closeOthers`, `tab.closeAll`                                                                                                                                                                                                          |

### Menus and quick open

```ts
import type { MenuDefinition, QuickOpenProvider } from '@workbench-kit/workbench'

const menus: MenuDefinition[] = [
  {
    id: 'file',
    label: 'File',
    entries: [
      { label: 'New File', commandId: 'file.new', keybinding: 'Ctrl+N' },
      { separator: true },
      { label: 'Close Editor', commandId: 'file.close', keybinding: 'Ctrl+W' },
    ],
  },
]

const quickOpen: QuickOpenProvider = {
  files: [{ name: 'App.tsx', path: 'src/App.tsx', language: 'typescriptreact' }],
  openFile: (path) => openFileTab(path),
}
```

| Type                  | Shape                                               | Description                                        |
| --------------------- | --------------------------------------------------- | -------------------------------------------------- |
| `MenuDefinition`      | `id`, `label`, `entries`                            | One title-bar menu.                                |
| `MenuEntryDefinition` | `label?`, `commandId?`, `keybinding?`, `separator?` | A command entry, a labelled entry or a separator.  |
| `QuickOpenProvider`   | `files`, `openFile(path)`                           | Files offered by quick open and the open callback. |
| `QuickOpenFile`       | `name`, `path`, `language?`                         | One quick-open result.                             |
| `FileIconResolver`    | `icon(path)`, `iconClass?(path)`                    | Maps a path to a Codicon and optional class.       |

### Branding, document and status bar

| Type                      | Shape                                                 | Description                                                       |
| ------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| `WorkbenchBranding`       | `title`, `icon?`, `onActivate?`                       | Title-bar label, app mark and optional activation handler.        |
| `WorkbenchTab`            | `id`, `title`, `kind`, `path?`, `language?`, `dirty?` | Serializable editor tab.                                          |
| `InitialWorkbenchSession` | `tabs`, `activeTabId`, `outputLines`                  | First-run state applied only when the store has no saved session. |

`renderDocument(tab)` receives the active `WorkbenchTab`; `emptyEditor` is shown
when there is no active tab. `statusBar` is application-owned content placed in
the shell's status-bar slot.

### Preset store

The preset ships a Zustand store for consumers that want the default behavior.

```ts
import { useWorkbenchStore } from '@workbench-kit/workbench'

const theme = useWorkbenchStore((state) => state.theme)
const toggleTheme = useWorkbenchStore((state) => state.toggleTheme)
```

| Export                             | Type / return      | Description                                                  |
| ---------------------------------- | ------------------ | ------------------------------------------------------------ |
| `useWorkbenchStore`                | Zustand store hook | Layout, tabs, views, quick open, output and notifications.   |
| `createInitialData()`              | `WorkbenchData`    | Fresh serializable state with defaults.                      |
| `createLayoutDefaults()`           | Layout fields only | Visibility, sizes and active views with default values.      |
| `DEFAULT_PRIMARY_SIDE_BAR_WIDTH`   | `300`              | Default primary sidebar width.                               |
| `DEFAULT_SECONDARY_SIDE_BAR_WIDTH` | `330`              | Default secondary sidebar width.                             |
| `DEFAULT_BOTTOM_PANEL_HEIGHT`      | `230`              | Default bottom panel height.                                 |
| `seedInitialSession(session)`      | `boolean`          | Applies first-run tabs/output when no stored session exists. |

`WorkbenchData` contains `theme`, the six visibility flags, `panelMaximized`, the
three sizes, `activePrimaryView`, `activeSecondaryView`, `activePanelView`,
`tabs`, `activeTabId`, `closedTabs`, `quickOpenOpen`, `quickOpenMode`,
`outputLines` and `notifications`.

Store actions are grouped by concern:

| Group   | Actions                                                                                                                                                                                                                                                                                                       |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tabs    | `openTab`, `activateTab`, `closeTab`, `closeOtherTabs`, `closeAllTabs`, `reopenClosedTab`, `reorderTab`, `activateNextTab`, `markTabClean`, `newUntitledTab`                                                                                                                                                  |
| Regions | `togglePrimarySideBar`, `showPrimaryView`, `setPrimarySideBarWidth`, `toggleSecondarySideBar`, `showSecondaryView`, `setSecondarySideBarWidth`, `toggleBottomPanel`, `showPanelView`, `setBottomPanelHeight`, `togglePanelMaximized`, `toggleActivityBar`, `toggleStatusBar`, `toggleTitleBar`, `resetLayout` |
| App     | `setTheme`, `toggleTheme`, `setQuickOpen`, `appendOutput`, `notify`, `dismissNotification`                                                                                                                                                                                                                    |

The store persists to `localStorage` under `desktop-ui-template:v1` with schema
version `1`. The key is fixed in `0.1.0`: two preset workbenches on the same
origin share state. Consumers that need a different key or isolated instances
should own their state through composition; see [`eject.md`](../recipes/eject.md).

## Composition primitives

```tsx
import {
  ActivityBar,
  ContextMenu,
  IconButton,
  MenuBar,
  Panel,
  ResizablePane,
  Sidebar,
  StatusBar,
  TabStrip,
  TitleBar,
  WorkbenchShell,
} from '@workbench-kit/workbench/react'
```

### `WorkbenchShell`

Layout-only root. It owns the root, body and center structure and renders the
regions supplied through slots.

```tsx
<WorkbenchShell
  titleBar={<TitleBar />}
  activityBar={<ActivityBar />}
  primarySideBar={<Sidebar />}
  panel={<Panel />}
  secondarySideBar={<Inspector />}
  statusBar={<StatusBar />}
  overlays={<Notifications />}
  panelMaximized={maximized}
>
  <Editor />
</WorkbenchShell>
```

| Prop               | Type        | Description                                                         |
| ------------------ | ----------- | ------------------------------------------------------------------- |
| `titleBar`         | `ReactNode` | Rendered above the body.                                            |
| `activityBar`      | `ReactNode` | Rendered at the start of the body.                                  |
| `primarySideBar`   | `ReactNode` | Rendered after the activity bar.                                    |
| `secondarySideBar` | `ReactNode` | Rendered at the end of the body.                                    |
| `panel`            | `ReactNode` | Rendered below the center content.                                  |
| `statusBar`        | `ReactNode` | Rendered after the body.                                            |
| `overlays`         | `ReactNode` | Rendered last inside the root.                                      |
| `panelMaximized`   | `boolean`   | Hides the center content and lets the panel occupy the center area. |
| `className`        | `string`    | Appended to the structural root classes.                            |
| `children`         | `ReactNode` | Center content, rendered above the panel.                           |

Visibility is expressed by omitting a slot. The shell keeps no region state and
imports no application modules.

### `ActivityBar`

Controlled navigation rail. The consumer owns the active item and decides what
activation and bottom actions do.

```tsx
<ActivityBar
  items={[
    { id: 'explorer', title: 'Explorer', icon: 'files' },
    { id: 'search', title: 'Search', icon: 'search', badge: 3 },
  ]}
  activeId={activeView}
  bottomItems={[{ id: 'settings', title: 'Manage', icon: 'settings-gear' }]}
  onActivate={setActiveView}
  onAction={(id) => runCommand(id)}
/>
```

| Prop          | Type                   | Required | Description                                                  |
| ------------- | ---------------------- | -------- | ------------------------------------------------------------ |
| `items`       | `ActivityBarItem[]`    | yes      | Top items, rendered in order.                                |
| `activeId`    | `string \| null`       | no       | Item to mark active; omit or pass `null` for no active item. |
| `bottomItems` | `ActivityBarAction[]`  | no       | Actions rendered in the bottom group.                        |
| `onActivate`  | `(id: string) => void` | no       | Activation request for a top item.                           |
| `onAction`    | `(id: string) => void` | no       | Activation request for a bottom action.                      |
| `label`       | `string`               | no       | Accessible navigation label; defaults to `Activity bar`.     |
| `className`   | `string`               | no       | Appended to the structural classes.                          |

`ActivityBarItem` has `id`, `title`, `icon` and optional `badge`.
`ActivityBarAction` has `id`, `title` and `icon`. The primitive renders
`vscode-icon` through `IconButton`, so register
`@workbench-kit/workbench/elements/icon`.

### `Sidebar`

Controlled sidebar container for the primary or secondary region. It renders a
header from the supplied title, icon and actions plus a body slot; it does not
resolve views or own visibility.

```tsx
<Sidebar
  title="Explorer"
  icon="files"
  actions={[{ id: 'refresh', icon: 'refresh', label: 'Refresh' }]}
  onAction={(id) => runCommand(id)}
  onClose={closeSidebar}
  closeLabel="Close Primary Side Bar"
  label="Primary side bar"
  className="secondary-sidebar"
>
  <OptionsPanel />
</Sidebar>
```

| Prop         | Type                   | Required | Description                                        |
| ------------ | ---------------------- | -------- | -------------------------------------------------- |
| `title`      | `string`               | no       | Header title; omit to render no header.            |
| `icon`       | `string`               | no       | Codicon name for the header.                       |
| `actions`    | `SidebarAction[]`      | no       | Header actions, rendered before the close control. |
| `onAction`   | `(id: string) => void` | no       | Activation request for a header action.            |
| `onClose`    | `() => void`           | no       | Close request; omit to hide the close control.     |
| `closeLabel` | `string`               | no       | Accessible close-control label.                    |
| `label`      | `string`               | no       | Accessible sidebar label; defaults to `Side bar`.  |
| `className`  | `string`               | no       | Appended to the structural classes.                |
| `children`   | `ReactNode`            | no       | Body content.                                      |

`SidebarAction` has `id`, `icon` and `label`. The primitive renders
`vscode-icon` through `IconButton`, so register
`@workbench-kit/workbench/elements/icon`.

### `Panel`

Controlled tabbed bottom panel. The consumer owns the tab list and selected id;
the primitive reports selection, maximize and close requests.

```tsx
<Panel
  tabs={[
    { id: 'problems', title: 'Problems', badge: 2, content: <ProblemsView /> },
    { id: 'output', title: 'Output', content: <OutputView /> },
  ]}
  activeId={activePanel}
  onSelect={setActivePanel}
  onToggleMaximized={togglePanelMaximized}
  onClose={closePanel}
  maximized={panelMaximized}
/>
```

| Prop                | Type                   | Required | Description                                         |
| ------------------- | ---------------------- | -------- | --------------------------------------------------- |
| `tabs`              | `PanelTab[]`           | yes      | Tabs, rendered in order.                            |
| `activeId`          | `string \| null`       | yes      | Selected tab id.                                    |
| `onSelect`          | `(id: string) => void` | yes      | Selection request from the tabs element.            |
| `label`             | `string`               | no       | Accessible panel label; defaults to `Panel`.        |
| `maximized`         | `boolean`              | no       | Selects the restore label for the maximize control. |
| `onToggleMaximized` | `() => void`           | no       | Maximize/restore request; omit to hide the control. |
| `onClose`           | `() => void`           | no       | Close request; omit to hide the control.            |
| `className`         | `string`               | no       | Appended to the structural classes.                 |

`PanelTab` has `id`, `title`, optional `badge` and `content`. Panel renders
`vscode-tabs`, `vscode-tab-header`, `vscode-tab-panel`, `vscode-badge` and
`vscode-icon`; register the matching element entries (the `tabs` family entry
covers tabs, headers and panels) before rendering it.

### `StatusBar`

Status bar region with consumer-supplied left and right sides.

```tsx
<StatusBar left={<span>main*</span>} right={<span>Ln 1, Col 1</span>} label="Workspace status" />
```

| Prop        | Type        | Required | Description                                        |
| ----------- | ----------- | -------- | -------------------------------------------------- |
| `left`      | `ReactNode` | no       | Leading-side content.                              |
| `right`     | `ReactNode` | no       | Trailing-side content.                             |
| `label`     | `string`    | no       | Accessible status label; defaults to `Status bar`. |
| `className` | `string`    | no       | Appended to the structural classes.                |

### `TitleBar`

Structural title bar with three consumer-supplied slots. It owns no branding,
menus, commands or window behavior.

```tsx
<TitleBar
  left={
    <>
      <button type="button" aria-label="Acme">
        Acme
      </button>
      <MenuBar menus={menus} onCommand={runCommand} />
    </>
  }
  center={<button type="button">Search files</button>}
  right={<IconButton icon="layout-sidebar-left" label="Toggle sidebar" />}
  onDoubleClick={handleTitleBarDoubleClick}
/>
```

| Prop            | Type         | Required | Description                                            |
| --------------- | ------------ | -------- | ------------------------------------------------------ |
| `left`          | `ReactNode`  | no       | Leading content, rendered inside `.titlebar-left`.     |
| `center`        | `ReactNode`  | no       | Center content; a spacer renders when it is omitted.   |
| `right`         | `ReactNode`  | no       | Trailing content, rendered inside `.titlebar-actions`. |
| `onDoubleClick` | `() => void` | no       | Double activation outside buttons.                     |
| `label`         | `string`     | no       | Accessible title-bar label; defaults to `Title bar`.   |
| `className`     | `string`     | no       | Appended to the structural classes.                    |

### `MenuBar`

Controlled menu bar. It owns transient open/close state and reports command
identifiers; it does not execute commands or hold a registry.

```tsx
<MenuBar
  menus={[
    {
      id: 'file',
      label: 'File',
      entries: [{ label: 'Open file…', commandId: 'file.open', keybinding: 'Ctrl+O' }],
    },
  ]}
  overflowItems={[{ label: 'Command palette', commandId: 'view.commandPalette' }]}
  onCommand={runCommand}
/>
```

| Prop            | Type                          | Required | Description                                                  |
| --------------- | ----------------------------- | -------- | ------------------------------------------------------------ |
| `menus`         | `MenuBarMenu[]`               | yes      | Menus, rendered in order.                                    |
| `onCommand`     | `(commandId: string) => void` | yes      | Receives the command id of a chosen entry.                   |
| `overflowItems` | `MenuBarEntry[]`              | no       | Entries for the overflow trigger; omitted hides the trigger. |
| `label`         | `string`                      | no       | Accessible navigation label; defaults to `Application menu`. |
| `className`     | `string`                      | no       | Appended to the structural classes.                          |

`MenuBarMenu` has `id`, `label` and `entries`. `MenuBarEntry` has optional
`label`, `commandId`, `keybinding` and `separator`. MenuBar renders
`vscode-context-menu` and `vscode-icon`; register
`@workbench-kit/workbench/elements/context-menu` and
`@workbench-kit/workbench/elements/icon` before rendering it.

### `ContextMenu`

Controlled context-menu portal over `vscode-context-menu`. The consumer owns
visibility, position and entries.

```tsx
<ContextMenu
  open={menu !== null}
  x={menu?.x ?? 0}
  y={menu?.y ?? 0}
  items={[
    { label: 'Copy Path', value: 'copy-path' },
    { separator: true },
    { label: 'Close', value: 'close', keybinding: 'Ctrl+W' },
  ]}
  onSelect={(value) => runMenuAction(value)}
  onClose={() => setMenu(null)}
  ignoreSelector=".menubar"
/>
```

| Prop             | Type                      | Required | Description                                           |
| ---------------- | ------------------------- | -------- | ----------------------------------------------------- |
| `open`           | `boolean`                 | yes      | Whether the menu is rendered.                         |
| `x` / `y`        | `number`                  | yes      | Viewport anchor, clamped so the menu stays visible.   |
| `items`          | `ContextMenuItem[]`       | yes      | Entries, including separators.                        |
| `onSelect`       | `(value: string) => void` | yes      | Receives a chosen entry value.                        |
| `onClose`        | `() => void`              | yes      | Close request from a selection or an outside pointer. |
| `ignoreSelector` | `string`                  | no       | Clicks inside this selector do not close the menu.    |

`ContextMenuItem` has optional `label`, `value`, `keybinding` and `separator`.
Register `@workbench-kit/workbench/elements/context-menu` before rendering the
primitive.

### `ResizablePane`

Controlled resizable region. The consumer owns the committed size.

```tsx
<ResizablePane
  side="left"
  size={width}
  min={180}
  max={640}
  onSizeChange={setWidth}
  onReset={() => setWidth(300)}
  label="Resize primary side bar"
>
  <Sidebar />
</ResizablePane>
```

| Prop           | Type                            | Required | Description                                                       |
| -------------- | ------------------------------- | -------- | ----------------------------------------------------------------- |
| `side`         | `'left' \| 'right' \| 'bottom'` | yes      | Which edge the pane sits on and the drag direction.               |
| `size`         | `number`                        | yes      | Committed size in pixels.                                         |
| `min` / `max`  | `number`                        | yes      | Clamp bounds.                                                     |
| `onSizeChange` | `(size: number) => void`        | yes      | Called once per committed resize.                                 |
| `onReset`      | `() => void`                    | no       | Called on sash double-click; the consumer chooses the reset size. |
| `label`        | `string`                        | yes      | Accessible separator label.                                       |
| `maximized`    | `boolean`                       | no       | Fills the center and hides the sash.                              |
| `className`    | `string`                        | no       | Appended to the structural classes.                               |
| `children`     | `ReactNode`                     | yes      | Pane content.                                                     |

Pointer drags preview locally and commit on release. Keyboard resizing uses the
arrow keys in 10px steps, `Shift` for 50px, and `Home`/`End` for the bounds.
The separator exposes `role="separator"`, orientation, min, max and current
value.

`ResizablePaneProps` is the public prop type and `ResizablePaneSide` is the side
union.

### `TabStrip`

Controlled editor tab strip. The consumer owns the tab list and active id.

```tsx
<TabStrip
  tabs={tabs}
  activeId={activeId}
  onActivate={setActiveId}
  onClose={closeTab}
  onReorder={reorderTab}
  label="Open editors"
  actions={<IconButton icon="split-editor" label="Split editor" />}
/>
```

| Prop               | Type                           | Required | Description                                               |
| ------------------ | ------------------------------ | -------- | --------------------------------------------------------- |
| `tabs`             | `TabStripItem[]`               | yes      | Tab list.                                                 |
| `activeId`         | `string \| null`               | yes      | Active tab id.                                            |
| `onActivate`       | `(id: string) => void`         | yes      | Selection request.                                        |
| `onClose`          | `(id: string) => void`         | yes      | Close request from the close button, middle click or key. |
| `onReorder`        | `(sourceId, targetId) => void` | yes      | Drag-and-drop reorder request.                            |
| `label`            | `string`                       | yes      | Accessible tab-list label.                                |
| `actions`          | `ReactNode`                    | no       | Toolbar rendered after the tabs.                          |
| `onTabContextMenu` | `(id, { x, y }) => void`       | no       | Context-menu request with pointer coordinates.            |
| `onTabDoubleClick` | `(id: string) => void`         | no       | Double-click request.                                     |
| `className`        | `string`                       | no       | Appended to the structural classes.                       |

`TabStripItem` has `id`, `title`, optional `icon` (a React node rendered before
the title), optional `dirty` and optional `closable` (defaults to true). The
strip supports drag reorder, middle-click close, `ArrowLeft`/`ArrowRight`
cycling, `Home`/`End`, and `Delete`/`Backspace` close.

### `IconButton`

```tsx
<IconButton icon="files" label="Explorer" variant="activity" active />
```

| Prop       | Type                                   | Default     | Description                        |
| ---------- | -------------------------------------- | ----------- | ---------------------------------- |
| `icon`     | `string`                               | required    | Codicon name.                      |
| `label`    | `string`                               | required    | Accessible label and tooltip.      |
| `active`   | `boolean`                              | `false`     | Pressed state and `aria-pressed`.  |
| `badge`    | `number`                               | none        | Positive badge count.              |
| `iconSize` | `number`                               | `16`        | Icon size passed to `vscode-icon`. |
| `variant`  | `'default' \| 'toolbar' \| 'activity'` | `'default'` | Structural style variant.          |

`IconButtonProps` extends the native button attributes.

## Core helpers

```ts
import {
  clampSize,
  resizeFromKey,
  resizeFromPointer,
  openTabIn,
  activateTabIn,
  closeTabIn,
  closeOthersIn,
  closeAllIn,
  reopenTabIn,
  reorderTabIn,
  cycleTab,
  readVersioned,
  writeVersioned,
} from '@workbench-kit/workbench/core'
```

### Size and resizing

| Function            | Signature                                                               | Returns          | Behavior                                                                                 |
| ------------------- | ----------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------- |
| `clampSize`         | `(value, min, max) => number`                                           | `number`         | `Math.min(max, Math.max(min, value))`.                                                   |
| `resizeFromPointer` | `({ side, startSize, startPosition, position, min, max }) => number`    | `number`         | Left panes grow with the pointer; right and bottom panes shrink.                         |
| `resizeFromKey`     | `({ side, orientation, size, key, shift, min, max }) => number \| null` | `number \| null` | Resize key in 10px or 50px steps; `Home`/`End` jump to bounds; other keys return `null`. |

`PointerResizeInput` and `KeyResizeInput` are the input types; `ResizeSide` is
`'left' | 'right' | 'bottom'` and `ResizeOrientation` is `'vertical' |
'horizontal'`.

### Tab transitions

Every helper reads a `{ tabs, activeTabId }` collection, returns a new object
and never mutates its input or touches a store. `TabLike` requires only `id`;
your own tab type can extend it.

| Function        | Signature                                           | Behavior                                                                                                        |
| --------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `openTabIn`     | `(collection, tab) => TabCollection`                | Adds the tab when its id is unused, then activates it.                                                          |
| `activateTabIn` | `(collection, id) => TabCollection`                 | Activates an existing tab; unknown ids return the collection unchanged.                                         |
| `closeTabIn`    | `(collection, id) => TabCloseResult`                | Removes the tab and activates the nearest survivor to the right, then the left, then nothing.                   |
| `closeOthersIn` | `(collection, id) => TabCloseResult`                | Keeps only the given tab; removed tabs are reported most recently closed first.                                 |
| `closeAllIn`    | `(collection) => TabCloseResult`                    | Removes every tab; removed tabs are reported most recently closed first.                                        |
| `reopenTabIn`   | `(collection, closedTabs) => TabReopenResult`       | Reopens the first history entry, does not duplicate an open tab and returns the remaining history.              |
| `reorderTabIn`  | `(collection, sourceId, targetId) => TabCollection` | Moves the source to the target index; unknown or identical ids are a no-op.                                     |
| `cycleTab`      | `(collection, direction) => TabCollection`          | Activates the adjacent tab with wrap-around; with no active tab, forward picks the first and backward the last. |

### Versioned persistence

| Export                 | Signature / shape                           | Behavior                                                                                           |
| ---------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `StorageAdapter`       | `getItem`, `setItem`, optional `removeItem` | The storage seam; core never touches `localStorage`.                                               |
| `StoredEnvelope`       | `{ version: number, state: unknown }`       | On-disk envelope.                                                                                  |
| `ReadVersionedOptions` | `{ version, fallback, migrate? }`           | Current schema version, fallback and optional migration.                                           |
| `readVersioned`        | `(adapter, key, options) => T`              | Returns the fallback for a missing key, unreadable payload, adapter error or unmigratable version. |
| `writeVersioned`       | `(adapter, key, version, state) => boolean` | Writes an envelope; returns `false` when the adapter throws.                                       |

`TabCollection`, `TabCloseResult`, `TabReopenResult`, `TabCycleDirection`,
`TabLike`, `PointerResizeInput`, `KeyResizeInput`, `ResizeSide`,
`ResizeOrientation`, `StorageAdapter`, `StoredEnvelope` and
`ReadVersionedOptions` are the public core types.

## Elements

Each subpath registers exactly one custom element and is a side effect. Import
only the tags your markup renders.

| Subpath                                          | Registered tag        |
| ------------------------------------------------ | --------------------- |
| `@workbench-kit/workbench/elements/all`          | every tag below       |
| `@workbench-kit/workbench/elements/badge`        | `vscode-badge`        |
| `@workbench-kit/workbench/elements/button`       | `vscode-button`       |
| `@workbench-kit/workbench/elements/collapsible`  | `vscode-collapsible`  |
| `@workbench-kit/workbench/elements/context-menu` | `vscode-context-menu` |
| `@workbench-kit/workbench/elements/icon`         | `vscode-icon`         |
| `@workbench-kit/workbench/elements/tab-header`   | `vscode-tab-header`   |
| `@workbench-kit/workbench/elements/tab-panel`    | `vscode-tab-panel`    |
| `@workbench-kit/workbench/elements/tabs`         | `vscode-tabs`         |
| `@workbench-kit/workbench/elements/textarea`     | `vscode-textarea`     |
| `@workbench-kit/workbench/elements/textfield`    | `vscode-textfield`    |
| `@workbench-kit/workbench/elements/tree`         | `vscode-tree`         |

```ts
import '@workbench-kit/workbench/elements/icon'
import '@workbench-kit/workbench/elements/tab-header'
import '@workbench-kit/workbench/elements/tab-panel'
import '@workbench-kit/workbench/elements/tabs'
```

`@workbench-kit/workbench/elements/types` provides the JSX declarations for the
registered elements; it has no runtime side effect. `elements/all` is a
convenience for demos and template-style applications; selective consumers should
prefer per-tag entries.

The preset registers the tags its regions render. A composition consumer must
register `vscode-icon` for `IconButton`, `vscode-tab-header` for `TabStrip`, and
whatever tags its own markup uses.

## Styles

Stylesheets are explicit imports. There is no implicit CSS side effect from
importing JavaScript.

Import `tokens.css` and `global.css` first, then either the aggregate
`workbench.css` or the component entries the application renders. Component
entries are additive: they do not load tokens, base styles or another
component's rules.

### Aggregate styles

| Entry                                           | Scope                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------ |
| `@workbench-kit/workbench/styles/tokens.css`    | Palette, theme and shared custom properties.                       |
| `@workbench-kit/workbench/styles/global.css`    | Base/reset styles scoped to the workbench.                         |
| `@workbench-kit/workbench/styles/workbench.css` | Aggregate of every component entry below, in the documented order. |
| `@workbench-kit/workbench/styles/index.css`     | Aggregate entry: tokens, global and workbench in that order.       |
| `@workbench-kit/workbench/styles`               | Alias of the aggregate entry.                                      |

### Component styles

| Entry                                                | Scope                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| `@workbench-kit/workbench/styles/shell.css`          | Workbench root, body and center layout.                            |
| `@workbench-kit/workbench/styles/title-bar.css`      | Title bar, app mark, command center, layout and window controls.   |
| `@workbench-kit/workbench/styles/menu-bar.css`       | Menu bar buttons and overflow entries.                             |
| `@workbench-kit/workbench/styles/icon-button.css`    | Icon button variants and badge.                                    |
| `@workbench-kit/workbench/styles/activity-bar.css`   | Activity bar rail, groups and active indicator.                    |
| `@workbench-kit/workbench/styles/resizable-pane.css` | Resizable pane surfaces and resize sashes.                         |
| `@workbench-kit/workbench/styles/sidebar.css`        | Primary/secondary sidebar containers and view header/body.         |
| `@workbench-kit/workbench/styles/tab-strip.css`      | Editor tab strip, tab items, close/dirty states and strip actions. |
| `@workbench-kit/workbench/styles/editor-area.css`    | Editor area shell, breadcrumbs, preview badge and content.         |
| `@workbench-kit/workbench/styles/panel.css`          | Bottom panel and its tab panels.                                   |
| `@workbench-kit/workbench/styles/status-bar.css`     | Status bar sides and items.                                        |
| `@workbench-kit/workbench/styles/quick-open.css`     | Quick open overlay, list, items and footer.                        |
| `@workbench-kit/workbench/styles/context-menu.css`   | Context menu positioner.                                           |
| `@workbench-kit/workbench/styles/notifications.css`  | Notification stack, notification items and their animation.        |

```ts
import '@workbench-kit/workbench/styles/tokens.css'
import '@workbench-kit/workbench/styles/global.css'
import '@workbench-kit/workbench/styles/shell.css'
import '@workbench-kit/workbench/styles/resizable-pane.css'
import '@workbench-kit/workbench/styles/tab-strip.css'
import '@workbench-kit/workbench/styles/status-bar.css'
```

Use `workbench.css` (or the `styles` alias) when the application renders most
regions. Use component entries when it renders only a few; for example, the
minimal example loads the shell, pane, tab strip and status bar entries only.
Application-specific view CSS stays in the application.

## Public type index

All types are exported from the entry shown by their group.

| Entry  | Types                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| preset | `VSCodeWorkbenchProps`, `WorkbenchConfig`, `WorkbenchViewRegistry`, `ViewDefinition`, `ViewAction`, `ActivityItem`, `ActivityAction`, `CommandRunner`, `CommandListItem`, `CommandRegistry`, `WorkbenchCommand`, `WorkbenchCommandRegistry`, `MenuDefinition`, `MenuEntryDefinition`, `QuickOpenProvider`, `QuickOpenFile`, `FileIconResolver`, `WorkbenchBranding`, `WorkbenchTab`, `WorkbenchData`, `WorkbenchNotification`, `NotificationKind`, `QuickOpenMode`, `TabKind`, `Theme`, `InitialWorkbenchSession` |
| react  | `WorkbenchShellProps`, `ActivityBarProps`, `ActivityBarItem`, `ActivityBarAction`, `SidebarProps`, `SidebarAction`, `PanelProps`, `PanelTab`, `StatusBarProps`, `TitleBarProps`, `MenuBarProps`, `MenuBarMenu`, `MenuBarEntry`, `ContextMenuProps`, `ContextMenuItem`, `ResizablePaneProps`, `ResizablePaneSide`, `TabStripProps`, `TabStripItem`, `IconButtonProps`                                                                                                                                              |
| core   | `PointerResizeInput`, `KeyResizeInput`, `ResizeSide`, `ResizeOrientation`, `TabLike`, `TabCollection`, `TabCloseResult`, `TabReopenResult`, `TabCycleDirection`, `StorageAdapter`, `StoredEnvelope`, `ReadVersionedOptions`                                                                                                                                                                                                                                                                                       |

## Stability

- The package is `0.x`: minor releases may include breaking changes, patch
  releases do not.
- The package is browser-only. It assumes `window`, `document` and
  `customElements`; SSR and server rendering are out of scope for `0.x`.
- The npm scope and name `@workbench-kit/workbench` are provisional until the
  first publish is approved. See the [changelog](../changelog.md) for released
  changes.
- The preset persistence key is fixed at `desktop-ui-template:v1` in `0.1.0`.

See [`../guides/coming-from-template.md`](../guides/coming-from-template.md) for
moving from the template, [`../recipes/eject.md`](../recipes/eject.md) for moving
between adoption levels and [`../concepts.md`](../concepts.md) for the adoption
model.
