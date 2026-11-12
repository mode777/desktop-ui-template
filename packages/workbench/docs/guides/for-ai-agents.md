# For AI agents

This page is for a coding agent building an application with
`vscode-workbench`, and for the human who wants to point an agent at the
right context. It is normal documentation, not a separate machine-only format.

## Read in this order

1. [Quickstart](../quickstart.md) - install the package and render a selective
   workbench.
2. [Concepts](../concepts.md) - choose the preset, composition or primitive
   level and understand state, elements, styles and persistence.
3. The recipe for the task:
   [add a view](../recipes/add-view.md),
   [add a command](../recipes/add-command.md),
   [replace the document surface](../recipes/replace-document.md),
   [theme](../recipes/theme.md),
   [persistence](../recipes/persistence.md) or
   [eject](../recipes/eject.md).
4. [API reference](../reference/api.md) for exact props, callbacks and types.
5. [Common mistakes](./common-mistakes.md) when something renders blank or
   unstyled.

If you installed the package, the same Markdown is in the installed package's
`docs/` directory. The app-level guide is `AGENTS.md` at the package root, and
the generated index is `llms.txt` at the package root.

## The contract

- **Choose one level.** Use the preset for the full shell, composition when you
  need your own layout or state, and primitives inside an existing layout. Do
  not mix the preset store with a second source of truth for the same fields.
- **Use public imports only.** Import from `vscode-workbench` and its
  documented subpaths. Do not import repository-internal workspace names.
- **Register what you render.** Import the per-tag element entry for every
  `vscode-*` tag your markup or primitives render. Prefer per-tag entries over
  `elements/all`.
- **Load styles in order.** `tokens.css`, then `global.css`, then the aggregate
  `workbench.css` or the exact component entries you render.
- **Stay browser-only.** The package assumes `window`, `document` and
  `customElements`. Do not evaluate it during a server render.
- **Keep application code in the application.** Views, data, commands, menus,
  branding and editor instances belong to the app. Do not edit installed package
  files to make the app work.
- **Verify before reporting success.** Run the application build and TypeScript
  check. Then check the public imports, element registrations and style entries.

## Copy-paste prompt

```text
You are building an application with vscode-workbench.

Before changing code:
1. Read the package README and docs/index.md.
2. Read docs/concepts.md and choose the preset, composition or primitive level.
3. Read the recipe for the task.
4. Use only public vscode-workbench subpaths.
5. Register only the custom-element tags you render.
6. Import tokens.css and global.css before component styles.
7. Keep views, data, commands, menus and branding in the application.
8. Remember the package is browser-only.

When done:
- Run the application build and TypeScript check.
- Confirm every rendered custom-element tag is registered.
- Confirm no repository-internal package name is imported.
- Report the commands you ran and their outcomes.

Do not edit node_modules, publish the package or add a real editor, file system,
Git backend or agent runtime. Ask before changing the package, its exports or
its peers.
```

## What to ask the human

Stop and ask before:

- changing the package name, version, exports or peers;
- publishing to npm or adding registry credentials;
- editing the kit source or `node_modules` to work around an application issue;
- adding server rendering to a browser-only surface;
- replacing the preset store with a second source of truth for the same state.

## Where the answers live

- [Quickstart](../quickstart.md)
- [Concepts](../concepts.md)
- [Recipes](../recipes/add-view.md)
- [API reference](../reference/api.md)
- [Element entries](../reference/elements.md)
- [Style entries](../reference/styles.md)
- [Common mistakes](./common-mistakes.md)
- [Changelog](../changelog.md)
