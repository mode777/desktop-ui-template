# Workbench Kit application guide

You are working in an application that depends on `@workbench-kit/workbench`.
This guide is for application work. It is not a guide for changing the package
itself.

If the repository contains the package source, that is the kit's own repository,
not your application. Application changes belong in the application's source.

## Read in this order

1. `README.md` - install, availability and the shortest quickstart.
2. `docs/index.md` - choose the preset, composition or primitive level.
3. `docs/concepts.md` - state, persistence, elements, styles and theming.
4. The recipe for your task in `docs/recipes/`.
5. `docs/reference/api.md` for exact props, callbacks and types.

If you only have the installed package, the same files are in
`node_modules/@workbench-kit/workbench/`.

## Choose one level

| Level                                             | Use when                                             | You own                                                   |
| ------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| Preset (`VSCodeWorkbench`)                        | You want the full shell and default behavior quickly | Views, data, commands, menus, branding, document renderer |
| Composition (`WorkbenchShell` + regions)          | You need your own layout, state or region set        | Layout, tabs, commands, views, menus, persistence         |
| Primitives (`ResizablePane`, `TabStrip`, helpers) | You already have a layout and need one behavior      | Everything around the primitive                           |

Start with the preset unless the task requires otherwise. Do not mix the preset
store with a second source of truth for the same layout or tab fields.

## Public imports only

Use the single package and its subpaths:

```ts
import { VSCodeWorkbench, useWorkbenchStore } from '@workbench-kit/workbench'
import { WorkbenchShell, TabStrip } from '@workbench-kit/workbench/react'
import { closeTabIn, readVersioned } from '@workbench-kit/workbench/core'
import '@workbench-kit/workbench/elements/icon'
import '@workbench-kit/workbench/styles/tokens.css'
```

Do not import any package name other than `@workbench-kit/workbench`. The
repository-internal workspace names are not install targets.

Do not edit files under `node_modules`. If the kit needs a change, that is a
separate contribution to the package.

## Recommended application layout

```text
src/
  main.tsx              entry; style and element imports
  App.tsx               composition root
  workbench.config.ts   region config
  views.tsx             view registry
  views/                application view components
  commands.ts           command registry
  menus.ts              menu definitions
  data.ts               application data or API client
  persistence.ts        application persistence, if not using the preset store
  theme.css             token overrides
```

These names are a convention, not a package requirement. Keep application code
out of the kit's source tree.

## Commands

Use the application's own scripts. The usual verification is:

```bash
npm run build
npx tsc --noEmit
```

If the project has a lint or test script, run it too. Do not assume the package's
repository scripts exist in an application.

## Browser-only

The package assumes `window`, `document` and `customElements`. It does not
support server rendering in `0.x`.

- Render the workbench in a client-only boundary.
- Do not evaluate package modules during a server render.
- In a framework with SSR, use a dynamic import with SSR disabled or mount the
  workbench after hydration.

## Element registration

Custom elements are side-effect registrations. Register only the tags the
application renders:

```ts
import '@workbench-kit/workbench/elements/icon'
import '@workbench-kit/workbench/elements/tab-header'
```

The preset registers its own subset. Composition and primitive consumers must
register the tags behind the components they use. A missing registration usually
shows up as a blank custom element, not a build error.

Prefer per-tag entries over `elements/all`. Add
`@workbench-kit/workbench/elements/types` once if the application needs the JSX
declarations.

## Styles

Import tokens and base styles first, then the aggregate or the exact component
entries:

```ts
import '@workbench-kit/workbench/styles/tokens.css'
import '@workbench-kit/workbench/styles/global.css'
import '@workbench-kit/workbench/styles/workbench.css'
```

Component entries are additive; they do not load tokens, base styles or another
component's rules. Use the aggregate when the app renders most regions. Keep
application view CSS in the application.

Do not hard-code palette values. Override `--vscode-*` and `--app-*` custom
properties in a theme file imported after `tokens.css`.

## State and persistence

- The preset store owns layout visibility, sizes, tabs, active views, panel
  selection and theme. It persists to `localStorage` under
  `desktop-ui-template:v1`.
- Composition and primitive state is application-owned.
- If you need a different persistence key or isolated workbench instances,
  compose the shell and use `readVersioned`/`writeVersioned` from the core
  subpath.
- Do not read or write the preset's internal envelope by hand.

## Non-goals

Do not add a real code editor, file system, Git backend, terminal backend, agent
runtime, routing framework, authentication layer or data-fetching stack as part
of the workbench integration. The package provides the shell and primitives.
Those capabilities are application replacement points.

## Stop and ask

Stop and ask the user before:

- changing the package name, version, exports or peer requirements;
- publishing to npm or adding registry credentials;
- editing the kit source or `node_modules` to work around an application issue;
- adding a server-rendering requirement to a browser-only surface;
- replacing the preset store with a second source of truth for the same state.

## Verify before reporting success

1. The build passes.
2. The TypeScript check passes.
3. The app imports only public `@workbench-kit/workbench` subpaths.
4. Every rendered custom-element tag has a registration import.
5. Tokens, global styles and the needed component styles are loaded.
6. The app renders in the browser without unknown custom-element or SSR errors.
7. The relevant recipe's verification steps pass.

Report the commands you ran and their outcomes. Do not claim success from a
successful install alone.
