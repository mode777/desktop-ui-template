# Workbench Kit

Workbench Kit is a configurable VS Code-style workbench for React applications.
It gives you the shell, regions, tabs, resizing, element registrations and
styles. Your application keeps its views, data, commands, branding and document
surface.

The package is published as `vscode-workbench` with subpath entries for
the preset, composition primitives, headless helpers, element registrations and
styles. You can adopt it at three levels.

## Choose your level

| Level       | Start with                                | You own                                                   | The kit owns                                                             |
| ----------- | ----------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------ |
| Preset      | `VSCodeWorkbench`                         | Views, data, commands, menus, branding, document renderer | Shell layout, default regions, tab and layout state, generic commands    |
| Composition | `WorkbenchShell` and region primitives    | Layout, state, commands, views, menus                     | Region chrome, resizing, tab-strip behavior, element and style contracts |
| Primitives  | `ResizablePane`, `TabStrip`, core helpers | Everything around the primitive                           | The controlled interaction and layout math you import                    |

Start with the preset unless you already have a layout or need to own the shell
state. Eject later if the preset becomes too opinionated; you do not have to
choose the final level on day one.

## Start here

- [Quickstart](./quickstart.md) - install the package and render a selective
  workbench with one tab and one resizable sidebar.
- [Concepts](./concepts.md) - adoption levels, state, persistence, elements,
  styles and theming.
- [Add a view](./recipes/add-view.md) - connect a component to a sidebar or panel.
- [Add a command](./recipes/add-command.md) - wire a command, menu entry and
  shortcut.

## Go deeper

- [Replace the document surface](./recipes/replace-document.md)
- [Theme the workbench](./recipes/theme.md)
- [Control persistence](./recipes/persistence.md)
- [Eject from the preset](./recipes/eject.md)
- [API reference](./reference/api.md)
- [Element entries](./reference/elements.md)
- [Style entries](./reference/styles.md)

## For coding agents

If you are an agent building an application with this package, read the
[agent guide](./guides/for-ai-agents.md) first. It tells you which level to
choose, where application code belongs, which imports are public and how to
verify the result. The short version:

1. Read the package README and this documentation.
2. Choose the preset, composition or primitive level.
3. Use only `vscode-workbench` subpaths.
4. Register only the custom-element tags you render.
5. Import tokens and base styles before component styles.
6. Run the application build and typecheck before reporting success.

## Availability

The package is currently in preview and is not yet on the public npm registry.
Use the local-tarball instructions in the [quickstart](./quickstart.md) until the
first owner-approved publish. The package is browser-only and `0.x`; minor
releases may include breaking changes.
