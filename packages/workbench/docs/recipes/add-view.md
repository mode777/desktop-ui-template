# Add a view

This recipe adds a primary sidebar view to a preset application. The same shape
works for a secondary sidebar or a bottom-panel view; only the registry record
and the config list change.

## Prerequisites

- A preset application renders `VSCodeWorkbench` with `config` and `views`.
- You know the view id you want to use. It must be stable and unique inside the
  region.

## Files

```text
src/
  App.tsx
  workbench.config.ts
  views.tsx
  views/
    ExplorerView.tsx
    InspectorView.tsx
```

## 1. Add the view component

```tsx
// src/views/InspectorView.tsx
export function InspectorView() {
  return (
    <div className="app-inspector">
      <p>Select a file or symbol to inspect it.</p>
    </div>
  )
}
```

Keep application markup in the application. The view receives no kit props; read
your own state or context inside it.

## 2. Register the view

```tsx
// src/views.tsx
import type { WorkbenchViewRegistry } from 'vscode-workbench'
import { ExplorerView } from './views/ExplorerView'
import { InspectorView } from './views/InspectorView'

export const views: WorkbenchViewRegistry = {
  primary: {
    explorer: {
      id: 'explorer',
      title: 'Explorer',
      icon: 'files',
      component: ExplorerView,
    },
    inspector: {
      id: 'inspector',
      title: 'Inspector',
      icon: 'symbol-property',
      component: InspectorView,
    },
  },
  secondary: {},
  panel: {},
}
```

The registry key and the `id` should match. The `icon` is a Codicon name.

## 3. Add an activity item and enable the view

```ts
// src/workbench.config.ts
import type { WorkbenchConfig } from 'vscode-workbench'

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
    items: [
      { id: 'explorer', title: 'Explorer', icon: 'files' },
      { id: 'inspector', title: 'Inspector', icon: 'symbol-property' },
    ],
    bottomItems: [],
  },
  primarySideBar: {
    enabled: true,
    initialWidth: 300,
    minWidth: 180,
    maxWidth: 640,
    views: ['explorer', 'inspector'],
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
    views: [],
  },
  statusBar: { enabled: true },
}
```

The activity item id selects the primary view when clicked. A view can also be
listed in `primarySideBar.views` without an activity item; it is then reachable
from the View menu and the command palette.

## 4. Wire the preset

```tsx
// src/App.tsx
import { VSCodeWorkbench } from 'vscode-workbench'
import { commands } from './commands'
import { menus } from './menus'
import { config } from './workbench.config'
import { views } from './views'

export function App() {
  return <VSCodeWorkbench config={config} views={views} commands={commands} menus={menus} />
}
```

## Verify

```bash
npm run build
```

Open the application and confirm:

- The activity bar shows the new icon.
- Clicking it shows the Inspector view in the primary sidebar.
- The view renders without an unknown custom-element warning.
- The build and TypeScript check pass.

## Common failures

| Symptom                                  | Cause                                                              | Fix                                         |
| ---------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------- |
| Icon appears but the sidebar stays empty | The activity id does not match a `views.primary` key               | Make the item id and registry key identical |
| View is never listed                     | The id is missing from `primarySideBar.views`                      | Add it to the array                         |
| Icon renders as a blank square           | The Codicon name is wrong                                          | Use a valid name from the Codicons list     |
| The app fails to build                   | The component is not imported or the record is missing `component` | Add the import and the component field      |

See [Concepts](../concepts.md#views) for the full view registry shape.
