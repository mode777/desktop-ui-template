# Common mistakes

Most adoption failures are import, registration or style-order mistakes. The
consumer adoption check reports these as named findings. This page explains each
one.

## Blank or empty custom elements

**Symptom:** A tab strip, panel or icon area renders no visible content, but the
build succeeds.

**Cause:** The JavaScript registration for the custom element was never imported.
React renders the tag, but the browser does not know how to upgrade it.

**Fix:** Import the per-tag entry for every `vscode-*` tag your markup or
primitives render:

```ts
import 'vscode-workbench/elements/icon'
import 'vscode-workbench/elements/tab-header'
```

**Verify:** The browser console has no unknown custom-element warning and the
tag renders its shadow content. See the [element entries](../reference/elements.md).

## Icons render as blank squares

**Symptom:** The shell and labels render, but every Codicon is an empty box.

**Cause:** The Codicon stylesheet is missing, or it is not loaded with the id
`vscode-codicon-stylesheet`. `vscode-elements` reuses that stylesheet inside
shadow roots.

**Fix:** Copy `@vscode/codicons/dist/codicon.css` and `codicon.ttf` into the
application's public directory and add this to `index.html`:

```html
<link rel="stylesheet" href="/codicons/codicon.css" id="vscode-codicon-stylesheet" />
```

**Verify:** The browser network panel loads the stylesheet and a known icon such
as `files` renders. See the [quickstart](../quickstart.md#icons-and-codicons).

## The shell is structurally present but unstyled

**Symptom:** Regions exist in the DOM but look like plain HTML, or spacing and
colors are wrong.

**Cause:** `tokens.css` or `global.css` is missing, or a component stylesheet was
not imported.

**Fix:** Import tokens and base styles first, then the aggregate or the exact
component entries:

```ts
import 'vscode-workbench/styles/tokens.css'
import 'vscode-workbench/styles/global.css'
import 'vscode-workbench/styles/workbench.css'
```

**Verify:** Computed styles show the `--vscode-*` token values. See the
[style entries](../reference/styles.md).

## A private module import remains

**Symptom:** The build fails to resolve a repository-internal package name, or
the app works only inside the repository.

**Cause:** The code still imports a workspace name instead of the published
subpath.

**Fix:** Replace the import with `vscode-workbench`,
`.../react`, `.../core`, `.../elements/<tag>` or `.../styles/<file>`.

**Verify:** Search the application source for `@workbench-kit/` and confirm every
result starts with `vscode-workbench`.

## Server-side rendering crashes

**Symptom:** `window is not defined`, `document is not defined` or
`customElements is not defined` during a server render or build.

**Cause:** The package is browser-only. It assumes `window`, `document` and
`customElements` and must not run during SSR.

**Fix:** Render the workbench in a client-only boundary. With a framework that
supports it, use a dynamic import with SSR disabled, or mount the workbench in an
effect after hydration.

**Verify:** The server render completes, and the workbench appears after
hydration without a module-evaluation error.

## Duplicate element registration

**Symptom:** A custom-element registration warning appears, or two copies of a
component behave differently.

**Cause:** The package registration and an application registration both define
the same tag, or `elements/all` is imported alongside per-tag entries.

**Fix:** Use one registration path. Prefer per-tag entries and remove
`elements/all` from selective consumers.

**Verify:** The console has no duplicate-definition warning and only one module
registers the tag.

## Stale or shared persisted layout

**Symptom:** The app opens with a layout, tabs or theme you did not expect, or
two workbenches share state.

**Cause:** The preset persists under the fixed key `desktop-ui-template:v1`. A
previous session or another app on the same origin may have written it.

**Fix:** Clear the key while testing:

```ts
localStorage.removeItem('desktop-ui-template:v1')
```

If you need a different key or isolated instances, own persistence through
composition and the core versioned helpers.

**Verify:** A fresh load applies `initialSession`; reloading restores only the
state you expect. See the [persistence recipe](../recipes/persistence.md).

## The command is in the palette but the shortcut does nothing

**Symptom:** The command palette runs the command, but the displayed keybinding
has no effect.

**Cause:** `keybinding` is display metadata. The preset does not install global
shortcuts for application commands.

**Fix:** Add an application keydown handler and call the command registry. See the
[add-command recipe](../recipes/add-command.md).

**Verify:** The shortcut runs while focus is outside an editable field and does
not fire while typing.

## The view is registered but never appears

**Symptom:** The activity item exists, but the sidebar is empty or the view is
not listed.

**Cause:** The view id is missing from `config.primarySideBar.views`, or the
activity item id does not match the registry key.

**Fix:** Use the same id in the registry, the activity item and the region's
`views` array. See the [add-view recipe](../recipes/add-view.md).

**Verify:** Clicking the activity item selects the view and the region lists it.

## Build succeeds but the bundle still contains demo content

**Symptom:** A primitives or composition build includes preset store code, demo
markers or unused components.

**Cause:** A barrel import or aggregate entry pulled in more than the app renders.

**Fix:** Import only the subpaths the app uses, register only rendered tags and
use component style entries instead of the aggregate.

**Verify:** The adoption check reports no demo or preset leak for the level you
chose.

## Adoption check findings

The consumer `check-adoption` script reports these rule ids. Use the symptom and
fix below, then rerun the check.

| Finding                   | Symptom                                                             | Fix                                                             | Recipe                                                |
| ------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| `private-import`          | A repository-internal package name is imported                      | Replace it with a `vscode-workbench` subpath                    | [Coming from the template](./coming-from-template.md) |
| `unregistered-element`    | A rendered `vscode-*` tag has no element registration import        | Import the matching per-tag entry                               | [Quickstart](../quickstart.md)                        |
| `missing-base-style`      | The shell renders without tokens or base styles                     | Import `styles/tokens.css` and `styles/global.css`              | [Theme](../recipes/theme.md)                          |
| `missing-component-style` | Regions render with missing component rules                         | Import `styles/workbench.css` or the exact component entries    | [Theme](../recipes/theme.md)                          |
| `preset-leak`             | A composition or primitives app includes preset or demo markers     | Remove the preset import or marker; move the state into the app | [Eject](../recipes/eject.md)                          |
| `aggregate-elements`      | A selective app imports `elements/all`                              | Replace it with per-tag entries                                 | [Quickstart](../quickstart.md)                        |
| `missing-package`         | `package.json` does not declare the workbench package               | Add `vscode-workbench` to dependencies                          | [Quickstart](../quickstart.md)                        |
| `version-mismatch`        | The declared workbench version differs from the installed package   | Match the declared version to the package version               | [Changelog](../changelog.md)                          |
| `missing-peer`            | React, React DOM or vscode-elements is not declared                 | Add the missing peer to dependencies                            | [Quickstart](../quickstart.md)                        |
| `peer-version`            | React, React DOM or vscode-elements is outside the supported range  | Use React 19, React DOM 19 and vscode-elements 2.5 or newer     | [Quickstart](../quickstart.md)                        |
| `ssr-global`              | Top-level `window` or `document` access runs during a server render | Move it into a client-only effect or dynamic import             | [Common mistakes](#server-side-rendering-crashes)     |
