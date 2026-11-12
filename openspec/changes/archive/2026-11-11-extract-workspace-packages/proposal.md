# Proposal

## Why

The kit has clean source layers, but they are still folders inside the template application: every consumer, test and tool reaches them through relative paths such as `../../src/kit/react`, and there is no package boundary, entry-point map or dependency metadata. Elements and styles are still app-level files (`src/vscode-elements.ts`, `src/styles/*`), so a consumer cannot take a subset without copying files.

Phase 5 of `ROADMAP.md` starts by making the kit a real dependency. This change introduces npm workspaces and extracts the five packages while keeping the template at the repository root, so a follow-up can move the apps into `apps/*`, add the custom-shell example and validate tarballs without first untangling the source layout.

## What Changes

- Turn the repository root into an npm workspace host with `packages/*` and one lockfile. The template stays the root application for this slice.
- Extract five packages, each with a name, version, ESM build, declarations, `exports`, `files`, `sideEffects`, peer/dependency metadata and a colocated test suite:
  - `@workbench-kit/core` — headless layout, tab, resize and persistence helpers moved from `src/kit/core`.
  - `@workbench-kit/react` — controlled primitives moved from `src/kit/react`.
  - `@workbench-kit/elements` — new per-tag vscode-elements registration entries plus the shared JSX typings, replacing the aggregate `src/vscode-elements.ts` and `src/types/vscode-elements.d.ts`.
  - `@workbench-kit/styles-vscode` — `tokens.css`, `global.css`, `workbench.css` and an aggregate entry moved from `src/styles`.
  - `@workbench-kit/preset-vscode` — the composed preset, store and default commands moved from `src/kit/preset-vscode`; it registers the elements its own regions render.
- Use the scope `@workbench-kit/*` provisionally. Packages stay `private: true` at version `0.1.0`; the final public name and publishing remain Phase 6 work.
- Make the template consume only public package entry points: `src/app`, `src/demo`, `src/main.tsx` and the template's element registration import `@workbench-kit/*` instead of relative `src/kit`/`src/styles` paths. Visible behavior, shortcuts, persisted session, class names and the bundle targets stay unchanged.
- Add package-aware tooling: TypeScript project references and package build configs, Vite/Vitest aliases to package source for local development and tests, and package `tsc` builds to `dist/` for later packing.
- Extend the boundary declaration and checker with the package roots, one layer per package, and a workspace-package map so `@workbench-kit/*` imports are checked against the target layer instead of being treated as arbitrary externals.
- Keep `examples/minimal` where it is, but point its workbench, style and element imports at package entry points; update its composition check to recognise `packages/preset-vscode` as forbidden.
- Update `README.md`, `AGENTS.md`, `ROADMAP.md`, the mock explorer tree and script fixtures to the workspace layout.

**BREAKING** (internal, not published): `src/kit/**`, `src/styles/**` and `src/types/vscode-elements.d.ts` no longer exist; kit code and styles are imported from `@workbench-kit/*` package entry points.

Not included: moving `apps/template`, `apps/minimal` or adding `apps/custom-shell`; `npm pack`/tarball-install validation; publishing, changelog or version policy; splitting `workbench.css` per component; new primitives, store slices or API redesign; a CI matrix or per-package artifact rewiring; visual or interaction changes.

## Capabilities

### New Capabilities

- `package-workspaces`: the npm workspace and five-package model — package entry points, metadata, build and typecheck, and the rule that the template consumes the kit only through public package imports.
- `element-registration`: per-tag vscode-elements registration entries, the aggregate entry, preset-owned registration for the tags it renders, and preservation of those side effects and typings for consumers.

### Modified Capabilities

- `dependency-boundaries`: the scan roots and layer model gain the package workspaces, and package-name imports resolve to the target package's layer instead of being accepted as unclassified externals.
- `minimal-example`: the example imports kit and style entry points by package name rather than relative source paths, while keeping its separate build, composition check and budget.
- `bundle-size-budget`: the template and minimal targets and their budgets remain unchanged in this slice, and the extraction is expected to be size-neutral within the recorded tolerance.

## Impact

- New workspaces: `packages/core`, `packages/react`, `packages/elements`, `packages/styles-vscode`, `packages/preset-vscode` with manifests, build configs, tests and `dist/` outputs.
- Moved code: `src/kit/core/**`, `src/kit/react/**`, `src/kit/preset-vscode/**`, `src/styles/**`, `src/types/vscode-elements.d.ts`.
- New code: `packages/elements/src/*.ts` per-tag entries and typings; shared workspace alias/TypeScript base configs.
- Modified code: root `package.json` (workspaces, dependencies, scripts), `package-lock.json`, `tsconfig*.json`, `vite.config.ts`, `src/main.tsx`, `src/vscode-elements.ts`, `src/app/**`, `src/demo/**`, `examples/minimal/**`, `boundaries.json`, `scripts/lib/boundaries.mjs`, `scripts/lib/bundle-composition.mjs`, their tests and fixtures, and `.gitignore` for package build output.
- Unchanged: rendered markup, styles, shortcuts, persistence key `desktop-ui-template:v1`, `budgets.json` and `budgets.minimal.json`, the two production builds and the CI job shape.
- Expected size effect: neutral. The same source reaches each Vite build through aliases; package `dist/` is not measured. Any movement outside the 1 % / 1024 B tolerance must be investigated and, only if intended, recorded in the budget file.
- Risk: two React/Zustand copies or mismatched module resolution across package boundaries; local aliases that drift from package `exports`; tests that still reach into moved source; documentation and the mock tree listing stale paths.
