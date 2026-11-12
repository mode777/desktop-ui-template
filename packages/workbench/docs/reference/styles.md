# Style entries

Styles are explicit imports. Importing JavaScript does not load CSS.

## Order

1. `tokens.css` defines palette, theme and shared custom properties.
2. `global.css` provides base and reset styles scoped to the workbench.
3. Load either the aggregate `workbench.css` or the component entries your
   application renders.
4. Load application CSS last.

## Aggregate entries

| Entry                                           | Scope                                                |
| ----------------------------------------------- | ---------------------------------------------------- |
| `@workbench-kit/workbench/styles/tokens.css`    | Palette, theme and shared custom properties          |
| `@workbench-kit/workbench/styles/global.css`    | Base/reset styles scoped to the workbench            |
| `@workbench-kit/workbench/styles/workbench.css` | Every component entry below, in the documented order |
| `@workbench-kit/workbench/styles/index.css`     | Tokens, global and workbench in that order           |
| `@workbench-kit/workbench/styles`               | Alias of the aggregate entry                         |

## Component entries

| Entry                       | Scope                                                             |
| --------------------------- | ----------------------------------------------------------------- |
| `styles/shell.css`          | Workbench root, body and center layout                            |
| `styles/title-bar.css`      | Title bar, app mark, command center, layout and window controls   |
| `styles/menu-bar.css`       | Menu bar buttons and overflow entries                             |
| `styles/icon-button.css`    | Icon button variants and badge                                    |
| `styles/activity-bar.css`   | Activity bar rail, groups and active indicator                    |
| `styles/resizable-pane.css` | Resizable pane surfaces and resize sashes                         |
| `styles/sidebar.css`        | Primary and secondary sidebar containers and view header/body     |
| `styles/tab-strip.css`      | Editor tab strip, tab items, close/dirty states and strip actions |
| `styles/editor-area.css`    | Editor area shell, breadcrumbs, preview badge and content         |
| `styles/panel.css`          | Bottom panel and its tab panels                                   |
| `styles/status-bar.css`     | Status bar sides and items                                        |
| `styles/quick-open.css`     | Quick open overlay, list, items and footer                        |
| `styles/context-menu.css`   | Context menu positioner                                           |
| `styles/notifications.css`  | Notification stack, notification items and their animation        |

Component entries are additive. They do not load tokens, base styles or another
component's rules.

## Example

```ts
import '@workbench-kit/workbench/styles/tokens.css'
import '@workbench-kit/workbench/styles/global.css'
import '@workbench-kit/workbench/styles/shell.css'
import '@workbench-kit/workbench/styles/resizable-pane.css'
import '@workbench-kit/workbench/styles/tab-strip.css'
import '@workbench-kit/workbench/styles/status-bar.css'
```

Use `workbench.css` or the `styles` alias when the application renders most
regions. Use component entries when it renders only a few.

## Theming

Override `--vscode-*` and `--app-*` custom properties in a CSS file imported after
`tokens.css`. Do not hard-code palette values in components. The preset writes
`data-theme="dark"` or `"light"` to the document element and persists the choice.
See the [theme recipe](../recipes/theme.md).

## Codicon stylesheet

The component styles do not load the Codicon font. Add a real stylesheet link
with `id="vscode-codicon-stylesheet"` to `index.html` and copy the Codicon assets
into the application's public directory. The quickstart shows the exact steps.
Without it, icon names still compile but render as blank squares.
