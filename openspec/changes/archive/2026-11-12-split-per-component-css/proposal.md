# Proposal

## Why

The React primitives, preset and public facade are extracted, but the kit still
ships one 879-line `workbench.css`. A composition consumer must load rules for
regions it never renders, and the minimal example cannot shrink its CSS even
though it proves JavaScript tree-shaking. This is the remaining item in the
roadmap's “Later — hardening” list and the CSS work that the minimal-example
change explicitly deferred.

Splitting the stylesheet per component makes style adoption match component
adoption: a consumer imports the shell, pane, tab strip and status bar rules it
uses, while the template keeps the aggregate entry it already relies on.

## What Changes

- Split `packages/styles-vscode/src/workbench.css` into one stylesheet per
  reusable component or region: shell, title bar, menu bar, icon button,
  activity bar, resizable pane, sidebar, tab strip, editor area, panel, status
  bar, quick open, context menu and notifications.
- Keep `workbench.css` as the aggregate that imports every component stylesheet
  in the existing cascade order, and keep `index.css` as the token + base +
  workbench aggregate. Existing style imports keep working.
- Export each component stylesheet from `@workbench-kit/styles-vscode` and
  forward it through `@workbench-kit/workbench/styles/<name>.css`.
- Build the facade from the styles package's declared entries instead of a
  hard-coded four-file list, and fail when a declared entry is missing.
- Keep the template on the aggregate stylesheet because it renders every
  region; change `apps/minimal` and `apps/custom-shell` to import only the
  component stylesheets their compositions render.
- Add a style-surface check: every component stylesheet is declared in both
  manifests, the aggregate imports each one exactly once in order, and the kit
  CSS contains no demo view selectors. Run it as part of `npm run check`.
- Verify the minimal example's production CSS contains no rules for regions it
  does not render, and record the new measured CSS baselines so the saving is
  attributable. CSS size enforcement stays advisory in this change.
- Update the API style table, architecture, migration/eject guidance, package
  and app READMEs, roadmap, changelog, `AGENTS.md` and the template mock
  workspace tree.

Not included: visual redesign, theme changes, CSS modules, SSR, JavaScript
splitting, publishing, or changing the existing aggregate entry points.

## Capabilities

### New Capabilities

- `style-entries`: the per-component stylesheet entry surface, its aggregate
  order, its forwarding through the public facade and the check that keeps the
  declarations in sync.

### Modified Capabilities

- `minimal-example`: the example imports only the styles for the primitives it
  renders, and its production CSS must not contain unused region rules.

## Impact

- `packages/styles-vscode`: new component CSS files, `workbench.css` becomes an
  import manifest, and the manifest exports each entry.
- `packages/workbench`: new `./styles/<component>.css` export keys generated
  from the styles package declarations.
- `scripts/`: facade style copying, a new style-surface check and tests, and
  the example CSS check; root `check` gains the style step.
- `apps/minimal` and `apps/custom-shell`: component stylesheet imports replace
  the aggregate import; the template keeps the aggregate.
- `budgets.json` and `budgets.minimal.json`: new recorded CSS baselines; the
  existing advisory CSS enforcement is unchanged.
- Documentation and repository metadata listed above.
- No public JavaScript export changes, no new runtime dependencies and no
  change to the rendered template output.
