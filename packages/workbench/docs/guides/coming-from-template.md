# Coming from the template

If you copied the template application, you already have a working shell, views,
commands, menus and mock data. Moving to the published package is mostly an
import and file-location change. Your application code stays yours.

## What stays the same

- Your views, mock data, commands, menus and branding stay in your application.
- The preset still receives them as props.
- The persisted key remains `desktop-ui-template:v1`, so an existing local
  session continues to load.
- The three adoption levels and the component behavior are unchanged.

## What moves

The package publishes one install target. Replace the repository workspace
imports with these subpaths:

| Repository import                     | Published import                  |
| ------------------------------------- | --------------------------------- |
| `@workbench-kit/preset-vscode`        | `vscode-workbench`                |
| `@workbench-kit/react`                | `vscode-workbench/react`          |
| `@workbench-kit/core`                 | `vscode-workbench/core`           |
| `@workbench-kit/elements/<tag>`       | `vscode-workbench/elements/<tag>` |
| `@workbench-kit/styles-vscode/<file>` | `vscode-workbench/styles/<file>`  |
| `@workbench-kit/styles-vscode`        | `vscode-workbench/styles`         |

The package also has one dependency, `zustand`, which the preset uses for its
default store. React, React DOM and `@vscode-elements/elements` are peers.

## Steps

1. Install the package and peers:

   ```bash
   npm install vscode-workbench react react-dom @vscode-elements/elements
   ```

2. Replace the imports in your composition root. Before:

   ```tsx
   import { VSCodeWorkbench } from '@workbench-kit/preset-vscode'
   import { useWorkbenchStore } from '@workbench-kit/preset-vscode'
   ```

   After:

   ```tsx
   import { VSCodeWorkbench, useWorkbenchStore } from 'vscode-workbench'
   ```

3. Replace style imports. Before:

   ```ts
   import '@workbench-kit/styles-vscode/tokens.css'
   import '@workbench-kit/styles-vscode/global.css'
   import '@workbench-kit/styles-vscode/workbench.css'
   ```

   After:

   ```ts
   import 'vscode-workbench/styles/tokens.css'
   import 'vscode-workbench/styles/global.css'
   import 'vscode-workbench/styles/workbench.css'
   ```

4. Replace element registrations. Before:

   ```ts
   import '@workbench-kit/elements/icon'
   import '@workbench-kit/elements/tab-header'
   ```

   After:

   ```ts
   import 'vscode-workbench/elements/icon'
   import 'vscode-workbench/elements/tab-header'
   ```

5. Keep your application files where they are. A typical copied application has
   a composition root that renders `VSCodeWorkbench`, a configuration module, a
   view registry, command and menu modules, and a data module. The package does
   not care what you call those files; it only needs the props.

6. Replace links to repository documentation with the consumer docs. The package
   ships `docs/` and an app-level `AGENTS.md`; the hosted site publishes the same
   pages. Do not keep repository-relative documentation links in your application.

## Verify

```bash
npm run build
```

Then confirm:

- The composition root imports only `vscode-workbench` subpaths.
- The app renders the same regions and restores the existing session.
- Views, commands, menus and branding still work.
- The build has no unresolved `@workbench-kit/preset-vscode`,
  `@workbench-kit/react`, `@workbench-kit/core`, `@workbench-kit/elements` or
  `@workbench-kit/styles-vscode` imports.

## Common failures

| Symptom                        | Cause                                        | Fix                                                   |
| ------------------------------ | -------------------------------------------- | ----------------------------------------------------- |
| Build cannot resolve a package | An old workspace import remains              | Replace it with the published subpath                 |
| App renders but is unstyled    | Style imports still point at the old package | Use `vscode-workbench/styles/*`                       |
| Custom elements are empty      | Element registrations were dropped           | Import the per-tag entries                            |
| Tabs or layout reset           | The copied app used a different storage key  | Keep `desktop-ui-template:v1` or migrate deliberately |
| Type errors on props           | The published types are the only source now  | Import types from `vscode-workbench`                  |

If you want to leave the preset behind instead of adopting it, start with the
[eject recipe](../recipes/eject.md).
