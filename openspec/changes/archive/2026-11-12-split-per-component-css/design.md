# Design

## Context

See `proposal.md` for motivation. The current state that shapes the approach:

- `packages/styles-vscode/src/workbench.css` is one 879-line file with clear
  section boundaries (shell, title bar, icon buttons, activity bar, panes,
  sidebars, editor/tabs, panel, status bar, quick open, context menu,
  notifications and responsive rules).
- `index.css` already composes `tokens.css`, `global.css` and `workbench.css`
  with CSS `@import`, and Vite inlines those imports in application builds.
- The facade build copies a hard-coded list of four stylesheets into
  `packages/workbench/dist/styles/`; the facade manifest lists the matching
  `./styles/*.css` entries.
- The template imports the aggregate; the minimal and custom-shell examples
  also import the aggregate even though they render fewer regions.
- `scripts/size-report.mjs` already supports per-kind enforcement, and both
  budget files record CSS with `"warn"`.
- `npm run check:docs` requires every facade export key to appear in
  `docs/api.md`, so each new style subpath must be documented.

## Goals / Non-Goals

**Goals:**

- Make each reusable component's CSS independently importable while keeping the
  aggregate entries source-compatible.
- Prove the granularity with the minimal example's production CSS.
- Make the style surface self-checking and the CSS saving attributable.

**Non-Goals:**

- Reorganizing selectors, renaming classes or changing the cascade output.
- Introducing a CSS build pipeline, CSS modules, CSS-in-JS or a new bundler.
- Splitting demo view CSS out of the template; it already lives in the app.
- Changing JavaScript exports, element registration, package peers or the
  publish process.

## Decisions

### One stylesheet per component, flat in the styles package

Add these files to `packages/styles-vscode/src/`:

| Entry                | Rules it owns                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| `shell.css`          | `.workbench`, `.workbench-body`, `.workbench-center`                                               |
| `title-bar.css`      | `.titlebar*`, `.app-mark`, `.command-center*`, `.layout-controls`, `.window-control*`              |
| `menu-bar.css`       | `.menubar*`                                                                                        |
| `icon-button.css`    | `.icon-button*`                                                                                    |
| `activity-bar.css`   | `.activitybar*`                                                                                    |
| `resizable-pane.css` | `.resizable-pane*`, `.resize-handle*`, `.is-resizing`                                              |
| `sidebar.css`        | `.sidebar`, `.secondary-sidebar`, `.view-header*`, `.view-body`                                    |
| `tab-strip.css`      | `.editor-tabs*`, `.editor-tab*`, `.tab-*`                                                          |
| `editor-area.css`    | `.editor-area`, `.editor-breadcrumbs`, `.breadcrumb-*`, `.editor-preview-badge`, `.editor-content` |
| `panel.css`          | `.panel*`                                                                                          |
| `status-bar.css`     | `.statusbar*`, `.status-item*`                                                                     |
| `quick-open.css`     | `.quick-open*`                                                                                     |
| `context-menu.css`   | `.context-menu-positioner`                                                                         |
| `notifications.css`  | `.notifications`, `.notification*` and its keyframes                                               |

The files stay flat because every other kit package uses a flat `src/` and the
facade can copy each declared target to `dist/styles/<name>.css` without path
rewriting. Responsive rules move into the component file they modify
(`title-bar.css` for the command center and window controls, `menu-bar.css` for
the menu buttons) so importing one component never loses its media query.

`workbench.css` becomes an `@import` manifest in the current section order:

```css
@import './shell.css';
@import './title-bar.css';
@import './menu-bar.css';
@import './icon-button.css';
@import './activity-bar.css';
@import './resizable-pane.css';
@import './sidebar.css';
@import './tab-strip.css';
@import './editor-area.css';
@import './panel.css';
@import './status-bar.css';
@import './quick-open.css';
@import './context-menu.css';
@import './notifications.css';
```

`index.css` keeps `tokens.css`, `global.css`, `workbench.css` in that order.
Every existing aggregate import therefore loads the same rules.

Alternative considered: copy the rules into both a component file and the
aggregate. Rejected because two sources of truth drift and double the
maintenance.

Alternative considered: put the files under `src/components/`. Rejected because
it forces the facade either to preserve that folder or rewrite `@import`
paths; flat files keep the generated layout identical to the public subpaths.

### Component entries are explicit in both manifests

`packages/styles-vscode/package.json` gains one export per component, for
example:

```json
"./shell.css": "./src/shell.css",
"./title-bar.css": "./src/title-bar.css"
```

The public facade gains the matching `./styles/<name>.css` keys pointing at
`./dist/styles/<name>.css`. The aggregate `./styles/workbench.css` and
`./styles` entries stay.

Alternative considered: a wildcard export such as
`"./styles/*.css": "./dist/styles/*.css"`. Rejected because the packed
surface should stay explicit and the documentation check enumerates declared
keys; a wildcard would hide missing files and weaken `pack:check`.

### The facade build derives its style copy list from the styles manifest

`scripts/build-workbench-facade.mjs` reads the `exports` map of
`@workbench-kit/styles-vscode`, selects keys ending in `.css`, resolves each
target relative to the package, and copies the file to
`packages/workbench/dist/styles/<basename>`. Duplicate targets are copied once.
The existing final validation still checks every facade export target, so a
declared-but-missing file fails the build.

This replaces the hard-coded `['tokens.css', 'global.css', 'workbench.css',
'index.css']` list and removes the class of bug where a new component file is
added but the facade build silently omits it.

### App adoption follows the rendered surface

- `apps/template` keeps `tokens.css`, `global.css` and `workbench.css`; it
  renders every region, so the aggregate is the right entry.
- `apps/minimal` imports `tokens.css`, `global.css`, `shell.css`,
  `resizable-pane.css`, `tab-strip.css` and `status-bar.css`. It has no title
  bar, menu bar, activity bar, sidebar, editor area, panel or overlays.
- `apps/custom-shell` imports `tokens.css`, `global.css`, `shell.css`,
  `title-bar.css`, `icon-button.css`, `activity-bar.css`,
  `resizable-pane.css`, `sidebar.css`, `tab-strip.css`, `editor-area.css`,
  `panel.css` and `status-bar.css`; it has no menu bar, quick open, context
  menu or notifications.

Each app's import list is the source of truth for its style check. A small
`style-subset.json` next to the app records the expected entries and the
component selectors that must stay out of its production CSS. The style check
compares the imports against that file and fails when an app imports the
aggregate or an entry outside its subset; the example bundle check compares the
emitted CSS selectors against the same file.

### A dedicated style check owns the surface invariants

Add `scripts/check-styles.mjs` plus pure helpers and unit tests under
`scripts/lib/styles.mjs` / `styles.test.mjs`. The check verifies:

1. Every component CSS file in `packages/styles-vscode/src/` (everything except
   `tokens.css`, `global.css`, `workbench.css` and `index.css`) has an export in
   the styles package and a matching `./styles/<name>.css` key in the facade.
2. Every declared component export target exists.
3. `workbench.css` imports every component file exactly once, in the declared
   order, and imports nothing else.
4. `index.css` imports tokens, global and workbench in order.
5. No kit stylesheet contains a selector from the demo-view prefix list.
6. The minimal and custom-shell source files import their declared style
   subsets and not the aggregate entry.

The check reads manifests and source only, so it can run before the build and
does not depend on `dist/`. `npm run check` runs it after `check:release` and
before `typecheck` (order is not semantically significant; it just needs to be
in the chain). The facade build and `pack:check` remain responsible for built
files and tarball resolution.

Alternative considered: extend `check:distribution` with a style list. Rejected
because distribution owns privacy and dependency direction, while this check
also owns aggregate order, app imports and demo-selector leakage.

### Record the new CSS baselines without changing enforcement

After the split, measure both production builds and update `budgets.json` and
`budgets.minimal.json` with the new CSS totals. Keep the existing 1 % / 1024 B
tolerance and the advisory CSS enforcement, because making CSS a hard gate is a
separate budget-policy change. The size report still shows the saving and warns
on growth.

The template's aggregate output should be nearly identical because Vite inlines
the imports. If the byte total shifts because of file boundaries or comment
placement, record the measured value rather than trying to match the old number.
The minimal example's CSS must drop because it no longer loads title bar,
activity bar, sidebar, editor area, panel, quick open, context menu or
notification rules.

## Risks / Trade-offs

- **Cascade order changes during the split** → keep the import order identical
  to the current section order and verify the template and both examples at
  1440×900 and a narrow width before recording budgets.
- **A component file is added but not exported or aggregated** → the style
  check fails with the filename and the missing declaration; the facade build
  derives from the manifest instead of a hard-coded list.
- **A component's rules leak into another file** → the style check reports the
  selector and file; the component table above is the ownership boundary.
- **A consumer imports a component entry without tokens/base** → the docs list
  `tokens.css` and `global.css` as prerequisites; the entries stay additive
  rather than silently importing shared styles.
- **CSS size drift is not gated** → the style check catches unused component
  imports, the size report still warns on CSS growth, and a hard CSS gate can be
  decided separately.
- **More public export keys raise documentation cost** → `check:docs` already
  fails on an undocumented key, so the API reference cannot drift.
- **The minimal example's CSS check is too strict as components evolve** → the
  forbidden-selector list lives with the check and is updated when a component
  is intentionally added to the example; the failure names the new selector.

## Migration Plan

1. Add the component files and the aggregate manifest; keep the old aggregate
   entries and confirm the template output is visually unchanged.
2. Add the package and facade exports, update the facade build, and run
   `pack:check`.
3. Switch the minimal and custom-shell imports, add the style check, and wire it
   into `npm run check`.
4. Measure both builds, record the CSS baselines, and run the full verification
   gate.
5. Roll back by restoring the single `workbench.css` and the aggregate imports;
   because the new entries are additive, no consumer-facing removal is needed.
