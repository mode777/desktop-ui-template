# @workbench-kit/workbench

The single distributable package for the workbench kit. It exposes the composed
preset, controlled React primitives, headless helpers, per-tag
`vscode-elements` registrations and the VS Code-style stylesheets through
subpath exports.

Version **0.1.0**. The package is `0.x` and browser-only: minor releases may
include breaking changes, patch releases do not, and SSR is out of scope. The
npm scope and name are provisional until the first publish is approved.

The package is generated from the five private workspace modules in this
repository; it is not a second implementation layer. Installing it does not
install `@workbench-kit/core`, `@workbench-kit/react`,
`@workbench-kit/elements`, `@workbench-kit/styles-vscode` or
`@workbench-kit/preset-vscode`.

## Requirements

- React 19 and React DOM 19 (peer dependencies)
- `@vscode-elements/elements` 2.5 or newer (peer dependency)
- A bundler that understands package `exports`, or a Node ESM consumer for the
  non-DOM layers

## Published imports

| What you need        | Published import                                | Repository source                            |
| -------------------- | ----------------------------------------------- | -------------------------------------------- |
| Full preset          | `@workbench-kit/workbench`                      | `@workbench-kit/preset-vscode`               |
| Composition/react    | `@workbench-kit/workbench/react`                | `@workbench-kit/react`                       |
| Headless helpers     | `@workbench-kit/workbench/core`                 | `@workbench-kit/core`                        |
| All element tags     | `@workbench-kit/workbench/elements/all`         | `@workbench-kit/elements/all`                |
| One element tag      | `@workbench-kit/workbench/elements/icon`        | `@workbench-kit/elements/icon`               |
| Element JSX typings  | `@workbench-kit/workbench/elements/types`       | `@workbench-kit/elements/types`              |
| Tokens               | `@workbench-kit/workbench/styles/tokens.css`    | `@workbench-kit/styles-vscode/tokens.css`    |
| Base styles          | `@workbench-kit/workbench/styles/global.css`    | `@workbench-kit/styles-vscode/global.css`    |
| All component styles | `@workbench-kit/workbench/styles/workbench.css` | `@workbench-kit/styles-vscode/workbench.css` |
| All styles in order  | `@workbench-kit/workbench/styles`               | `@workbench-kit/styles-vscode`               |

```tsx
import { VSCodeWorkbench } from '@workbench-kit/workbench'
import { WorkbenchShell, TabStrip } from '@workbench-kit/workbench/react'
import { clampSize } from '@workbench-kit/workbench/core'
import '@workbench-kit/workbench/elements/icon'
import '@workbench-kit/workbench/styles/tokens.css'
import '@workbench-kit/workbench/styles/global.css'
import '@workbench-kit/workbench/styles/workbench.css'
```

### Per-component styles

Import `tokens.css` and `global.css` first, then the component entries the
application actually renders. Component entries are additive and do not load
each other or the aggregate.

| Component      | Published import                                     |
| -------------- | ---------------------------------------------------- |
| Shell          | `@workbench-kit/workbench/styles/shell.css`          |
| Title bar      | `@workbench-kit/workbench/styles/title-bar.css`      |
| Menu bar       | `@workbench-kit/workbench/styles/menu-bar.css`       |
| Icon button    | `@workbench-kit/workbench/styles/icon-button.css`    |
| Activity bar   | `@workbench-kit/workbench/styles/activity-bar.css`   |
| Resizable pane | `@workbench-kit/workbench/styles/resizable-pane.css` |
| Sidebar        | `@workbench-kit/workbench/styles/sidebar.css`        |
| Tab strip      | `@workbench-kit/workbench/styles/tab-strip.css`      |
| Editor area    | `@workbench-kit/workbench/styles/editor-area.css`    |
| Panel          | `@workbench-kit/workbench/styles/panel.css`          |
| Status bar     | `@workbench-kit/workbench/styles/status-bar.css`     |
| Quick open     | `@workbench-kit/workbench/styles/quick-open.css`     |
| Context menu   | `@workbench-kit/workbench/styles/context-menu.css`   |
| Notifications  | `@workbench-kit/workbench/styles/notifications.css`  |

Use the aggregate `workbench.css` when the application renders most regions;
use the component entries when it renders only a few. `styles/index.css` and
`styles` are aliases that also load tokens and base styles.

`zustand` is the only runtime dependency of the preset store. The preset is
optional: importing `./react` or `./core` does not load the preset, its store or
its commands.

## Documentation

- [API reference](../../docs/api.md) — props, primitives, helpers, element entries,
  styles and types.
- [Migration guide](../../docs/migration.md) — moving a template copy or
  workspace app to the package.
- [Eject guide](../../docs/eject.md) — preset → composition → primitives.
- [Release policy](../../docs/release.md) — SemVer, checklist and publish gate.
- [Architecture](../../docs/architecture.md) — the five private modules and the
  single facade.
- [Changelog](../../CHANGELOG.md) — consumer-visible changes.
- [Third-party notices](../../THIRD_PARTY_NOTICES.md) — dependency licenses and
  Codicons attribution.

## Stability and release gate

- The package is `0.x` and browser-only; it assumes `window`, `document` and
  `customElements`.
- The five internal `@workbench-kit/*` modules are private. They are repository
  sources, not install targets.
- The preset persistence key is fixed at `desktop-ui-template:v1` in `0.1.0`.
- Publishing is manual and owner-approved after the final scope/name is
  confirmed. CI holds no publish credentials.
- The tarball ships `LICENSE` and `THIRD_PARTY_NOTICES.md` alongside the
  manifest, README and generated `dist/`.

## Building the package

The package is built from the repository root after the internal modules have
been compiled:

```bash
npm run build:facade   # regenerate packages/workbench/dist
npm run pack:check     # pack, inspect and consume the tarball
npm pack --dry-run     # from this directory, inspect the published files
```

The generated output lives in `packages/workbench/dist/` and is ignored by
version control. The manifest and this README are authored; everything under
`dist/` is generated by `scripts/build-workbench-facade.mjs`. `LICENSE` and
`THIRD_PARTY_NOTICES.md` are copied from the repository root by the same build.
