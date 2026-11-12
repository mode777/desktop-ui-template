# Element entries

The package uses `vscode-elements` custom elements. JavaScript imports are
side-effect registrations, not React components. Register only the tags your
markup or primitives render.

## Per-tag entries

| Entry                                            | Registers                                              |
| ------------------------------------------------ | ------------------------------------------------------ |
| `@workbench-kit/workbench/elements/all`          | Every tag below                                        |
| `@workbench-kit/workbench/elements/badge`        | `vscode-badge`                                         |
| `@workbench-kit/workbench/elements/button`       | `vscode-button`                                        |
| `@workbench-kit/workbench/elements/collapsible`  | `vscode-collapsible`                                   |
| `@workbench-kit/workbench/elements/context-menu` | `vscode-context-menu`                                  |
| `@workbench-kit/workbench/elements/icon`         | `vscode-icon`                                          |
| `@workbench-kit/workbench/elements/tab-header`   | `vscode-tab-header`                                    |
| `@workbench-kit/workbench/elements/tab-panel`    | `vscode-tab-panel`                                     |
| `@workbench-kit/workbench/elements/tabs`         | `vscode-tabs`, `vscode-tab-header`, `vscode-tab-panel` |
| `@workbench-kit/workbench/elements/textarea`     | `vscode-textarea`                                      |
| `@workbench-kit/workbench/elements/textfield`    | `vscode-textfield`                                     |
| `@workbench-kit/workbench/elements/tree`         | `vscode-tree`                                          |

`@workbench-kit/workbench/elements/types` provides the JSX declarations and has
no runtime side effect.

## What the preset registers

The preset registers `badge`, `button`, `context-menu`, `icon`, `tabs` and
`textfield`. Because `tabs` also registers `vscode-tab-header` and
`vscode-tab-panel`, the preset's editor tabs and bottom panel work without
separate imports.

A preset application still must register any extra tag its own views render, such
as `tree`, `collapsible`, `textarea` or a second `textfield` usage if the preset
did not already load it.

## What composition and primitives need

| Component        | Required tag entries                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------- |
| `IconButton`     | `elements/icon`                                                                               |
| `TabStrip`       | `elements/icon`, `elements/tab-header`                                                        |
| `Panel`          | `elements/tabs` (registers tabs, tab-header and tab-panel), `elements/icon`, `elements/badge` |
| `ContextMenu`    | `elements/context-menu`                                                                       |
| `MenuBar`        | `elements/icon`, `elements/context-menu`                                                      |
| `ActivityBar`    | `elements/icon` (through `IconButton`)                                                        |
| `Sidebar`        | `elements/icon`                                                                               |
| `TitleBar`       | `elements/icon`                                                                               |
| `StatusBar`      | No custom element                                                                             |
| `ResizablePane`  | No custom element                                                                             |
| `WorkbenchShell` | No custom element                                                                             |

The mapping is transitive: a region can require a tag through a primitive it
renders. Register the tags for the primitives you actually use.

## Example

```ts
import '@workbench-kit/workbench/elements/icon'
import '@workbench-kit/workbench/elements/tab-header'
import '@workbench-kit/workbench/elements/tabs'
```

Do not import `elements/all` in a selective application unless the bundle size
trade-off is acceptable. It is intended for demos and template-style apps.

## Missing registrations

A missing registration usually produces an empty custom element, not a build
error. If a tab strip, panel or icon area is blank, check the tag table above and
the [common mistakes](../guides/common-mistakes.md#blank-or-empty-custom-elements)
page.
