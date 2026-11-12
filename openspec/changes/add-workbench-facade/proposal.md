# Proposal

## Why

The five kit modules are now real workspace packages, but they still stop at the repository boundary: there is no installable artifact, the package names consumers would import (`@workbench-kit/workbench`, `.../react`, `.../core`, `.../elements/*`, `.../styles/*`) do not exist, and nothing proves that one packed tarball is complete. Phase 5 of [`ROADMAP.md`](../../../ROADMAP.md) cannot finish until the private modules are exposed through the single public package and a tarball is validated.

This is the next roadmap step: workspace migration is done, so add `packages/workbench`, validate one `npm pack` tarball, and leave moving the apps to `apps/*` and the custom-shell example to a follow-up change.

## What Changes

- Add `packages/workbench` as the single public distribution package (`@workbench-kit/workbench`, version `0.1.0`, `private: false`). It is a facade, not a sixth implementation layer: it owns the export map and generated output, not UI source.
- Build the facade from the already-built internal modules: copy `core`, `react`, `elements` and `preset-vscode` output plus `styles-vscode` CSS into `packages/workbench/dist/`, rewrite `@workbench-kit/*` specifiers to relative paths, and add explicit `.js` extensions so the packed ESM also loads in Node. Publish declarations, the element JSX typings and every stylesheet entry.
- Expose the adoption levels through subpath exports: `"."` (preset), `"./react"`, `"./core"`, `"./elements/<tag>"`, `"./elements/all"`, `"./elements/types"` and `"./styles/*"`, with types for every JavaScript entry.
- Declare React, React DOM and `@vscode-elements/elements` as peer dependencies, keep `zustand` as the facade's only runtime dependency, and declare `sideEffects` only for CSS and element-registration modules.
- Add `npm run pack:check`: pack exactly one tarball, verify its contents and manifest, extract it into a throwaway consumer, resolve every declared subpath, import the preset/primitives/core entries with the DOM shims they require, and typecheck a consumer that uses the subpaths.
- Add `npm run check:distribution` coverage for the now-present public package (the declaration already describes it) and include `pack:check` in the standard verification command.
- Update `README.md`, `docs/architecture.md`, `ROADMAP.md` and `AGENTS.md` to describe the implemented facade, its source-versus-published names and the tarball check.

Not included: moving the template and minimal example to `apps/*`, adding `apps/custom-shell`, publishing to a registry, choosing the final scope or version policy, and changing any app, demo, preset, primitive or style behavior. The five internal modules stay `private: true` and keep their current names.

## Capabilities

### New Capabilities

- `public-package`: the single installable `@workbench-kit/workbench` facade — its export surface, generated contents, peer/runtime dependency model, tarball shape and packed-consumer verification.

### Modified Capabilities

- `package-workspaces`: the workspace now contains five private internal modules plus one public facade package, and the package build/verification commands include the facade build and tarball check.
- `dependency-boundaries`: the declared layer model covers the facade package and keeps the internal modules unable to depend on it, while the facade source cannot reach app or demo modules.

## Impact

- New: `packages/workbench/` (manifest and README) and generated `packages/workbench/dist/`.
- New tooling: a facade build script, a pack-check script, shared pure helpers with tests, and root `build:facade` / `pack:check` scripts.
- Changed: root `build:packages` and `check` scripts, `distribution.json` (if the required export surface needs the explicit elements/types entries), documentation and roadmap status.
- Unchanged: application source, demo, preset behavior, styles, element registration semantics, budgets, persisted state, the five internal manifests and their privacy.
- Compatibility: first distribution artifact; no consumer exists yet, so no migration is required. The facade version stays `0.1.0` and the scope remains provisional until Phase 6.
