# Sample applications

Three complete applications show the kit at each adoption level. Every sample
has a public source tree in the repository and a deployed build on GitHub Pages.

| Sample       | Adoption level                           | Source code                                                                                  | Deployed sample                                                                  |
| ------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Template     | Preset (`VSCodeWorkbench`)               | [apps/template](https://github.com/mode777/vscode-workbench/tree/main/apps/template)         | [Full workbench](https://mode777.github.io/vscode-workbench/)                    |
| Custom shell | Composition (`WorkbenchShell` + regions) | [apps/custom-shell](https://github.com/mode777/vscode-workbench/tree/main/apps/custom-shell) | [Custom-shell example](https://mode777.github.io/vscode-workbench/custom-shell/) |
| Minimal      | Primitives (`ResizablePane`, `TabStrip`) | [apps/minimal](https://github.com/mode777/vscode-workbench/tree/main/apps/minimal)           | [Minimal example](https://mode777.github.io/vscode-workbench/minimal/)           |

## Template

The template is the full preset application. It supplies configuration, views,
commands, menus, quick-open files, a document renderer, branding and the initial
session to `VSCodeWorkbench`; views, data and demo styling stay in the
application layer. Start with
[`apps/template/src/app/App.tsx`](https://github.com/mode777/vscode-workbench/blob/main/apps/template/src/app/App.tsx)
and
[`workbench.config.ts`](https://github.com/mode777/vscode-workbench/blob/main/apps/template/src/app/workbench.config.ts).

Use it when you want the complete shell and intend to replace the mock views.

## Custom shell

The custom-shell sample composes `WorkbenchShell`, `ResizablePane`, `TabStrip`,
`ActivityBar`, `Sidebar`, `Panel`, `StatusBar`, `TitleBar` and `IconButton`
without the preset, store or command registry. Layout state lives in a local
reducer. Start with
[`apps/custom-shell/src/App.tsx`](https://github.com/mode777/vscode-workbench/blob/main/apps/custom-shell/src/App.tsx)
and the region files next to it.

Use it when you need the full shell but own the layout and state.

## Minimal

The minimal sample renders one tab, one resizable options sidebar and a status
bar with the controlled primitives. It registers only the element tags it
renders, imports only the component stylesheets it uses and is built as the
tree-shaking canary. Start with
[`apps/minimal/src/App.tsx`](https://github.com/mode777/vscode-workbench/blob/main/apps/minimal/src/App.tsx).

Use it when the workbench is one part of a larger application.

## Run the samples locally

From a repository checkout:

```bash
npm install
npm run dev                # template, http://localhost:5173
npm run dev:custom-shell   # custom-shell example
npm run dev:minimal        # minimal example
```

Each command starts its own Vite dev server; use the port Vite prints. Build and
check the samples with `npm run build`, `npm run build:custom-shell`,
`npm run build:minimal`, `npm run check:custom-shell` and
`npm run check:minimal`.

The [quickstart](./quickstart.md) builds the minimal composition from the
published package, the [concepts](./concepts.md) explain the three levels, and
the [eject recipe](./recipes/eject.md) moves from the preset toward composition
and primitives.
