# Custom shell example

A complete workbench assembled from the kit's composition-level primitives and
application-owned regions. It uses the same shell, resizing, tab and
element-registration contracts as the preset, but it imports no preset store,
command registry or demo code.

## Run it

```bash
npm run dev:custom-shell      # http://localhost:5173
npm run build:custom-shell    # emits apps/custom-shell/dist/
npm run check:custom-shell    # verifies the production bundle composition
npm run test -- apps/custom-shell
```

The build writes its own `apps/custom-shell/dist/` directory and never touches
`apps/template/dist/` or `apps/minimal/dist/`. `check:custom-shell` is part of
`npm run check`.

## What it renders

| Region          | Owner                                  | Notes                                                 |
| --------------- | -------------------------------------- | ----------------------------------------------------- |
| Title bar       | `TitleBar` + `regions/TitleBar`        | app mark, composition label and layout controls       |
| Activity bar    | `ActivityBar` + `regions/ActivityBar`  | Workspace, Outline, Settings and example notes        |
| Primary sidebar | `Sidebar` + `regions/Sidebar`          | file list, active-document outline or region controls |
| Editor          | `regions/EditorArea`                   | `TabStrip`, breadcrumbs and a mock document surface   |
| Bottom panel    | `Panel` + `regions/BottomPanel`        | Console and Details tabs                              |
| Secondary bar   | `Sidebar` + `regions/SecondarySideBar` | inspector for the active tab and region state         |
| Status bar      | `StatusBar` + `regions/StatusBar`      | active tab, tab count, widths and region visibility   |

Every region is supplied through a `WorkbenchShell` slot. Hiding a region
passes `null` for that slot, so the shell keeps no visibility state of its own.
The panel can also be maximized; the shell then hides the editor and lets the
panel occupy the center area.

## Primitives it uses

```tsx
import {
  ActivityBar,
  IconButton,
  Panel,
  ResizablePane,
  Sidebar,
  StatusBar,
  TabStrip,
  TitleBar,
  WorkbenchShell,
} from '@workbench-kit/react'
import { activateTabIn, closeTabIn, reorderTabIn } from '@workbench-kit/core'
```

- `WorkbenchShell` owns the root, body and center structure.
- `ResizablePane` owns pointer and keyboard resizing for the primary sidebar,
  secondary sidebar and bottom panel.
- `ActivityBar` reports activity activation and bottom-action requests.
- `Sidebar` renders the primary and secondary headers, actions, close controls
  and body slots.
- `TitleBar` owns the three title-bar slots; the app supplies the app mark,
  composition label and layout controls.
- `Panel` reports tab selection and panel maximize/close requests, and renders
  the app's Console and Details content.
- `StatusBar` places the app's left and right status content.
- `TabStrip` reports activation, close and reorder requests for the editor tabs.
- `IconButton` drives the layout controls.

Tab transitions delegate to the headless core helpers. The rest of the state is
a single `useReducer` in `src/App.tsx`: active activity, region visibility, the
three sizes, the tab collection and the panel selection. There is no Zustand
store, no persistence adapter and no command registry.

## Element registration

`src/elements.ts` registers only the tags the example renders:

```ts
import '@workbench-kit/elements/icon'
import '@workbench-kit/elements/tab-header'
import '@workbench-kit/elements/tab-panel'
import '@workbench-kit/elements/tabs'
```

It deliberately does **not** import `@workbench-kit/elements/all`, the template's
aggregate registration or any unused tag. `check:custom-shell` inspects the
build-emitted module inventory and fails if a preset module, template module,
demo module or known demo UI marker reached the bundle.

## Styles

`src/main.tsx` imports the shared `tokens.css` and `global.css` entries plus the
component stylesheets this composition renders: `shell.css`, `title-bar.css`,
`icon-button.css`, `activity-bar.css`, `resizable-pane.css`, `sidebar.css`,
`tab-strip.css`, `editor-area.css`, `panel.css` and `status-bar.css`. It does
not import the `workbench.css` aggregate, menu bar, quick open, context menu or
notification styles, so those rules stay out of the production CSS.
`style-subset.json` records the expected entries and the selectors that must
stay out of the bundle; `check:custom-shell` enforces both the JavaScript and
CSS composition. The example reuses the structural class contract (`workbench`,
`titlebar`, `activitybar`, `sidebar`, `editor-tabs`, `panel`, `statusbar`,
`resizable-pane`) and prefixes its own selectors with `custom-shell-`. No
demo-view CSS and no new kit stylesheet are added.

## What it deliberately omits

- `@workbench-kit/preset-vscode`: no `VSCodeWorkbench`, default store, generic
  commands, menus, quick open, notifications or context menu.
- `apps/template/src/app` and `apps/template/src/demo`: no template branding,
  hotkeys, views, mock workspace data or demo styles.
- Persistence: reloading resets the example to its initial state.
- A real editor: the document surface is mock content supplied by the app.

## Growing from minimal to preset

1. Start with [`apps/minimal`](../minimal/README.md) for a single pane or tab.
2. Use this example when you need a full multi-region shell with your own
   chrome and state.
3. Move to [`VSCodeWorkbench`](../../packages/preset-vscode/src/VSCodeWorkbench.tsx)
   when you want the preset's default layout store, generic commands and region
   behavior and can supply views, menus and branding as props.

See [`docs/architecture.md`](../../docs/architecture.md) for the module
boundaries and [`ROADMAP.md`](../../ROADMAP.md) for the adoption levels.
