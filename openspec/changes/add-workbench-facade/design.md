# Design

## Context

See [`proposal.md`](./proposal.md) — Why. The current state that shapes this design:

- Five private workspace modules already build ESM plus declarations to `packages/*/dist`: `core`, `react`, `elements` and `preset-vscode`; `styles-vscode` is source-only CSS.
- Their emitted relative imports are extensionless (`./layout`, `./size`), so the output works in Vite and TypeScript but not in Node's ESM resolver. Declaration maps point back into `packages/*/src`.
- `packages/preset-vscode` emits `component-test-fixtures.*` because that file is only excluded from tests, not from its build config.
- `packages/elements/src/global.d.ts` provides the JSX typings but is not emitted into `dist`.
- `distribution.json` already declares the public package name, path, required export prefixes and peers. `check:distribution` activates the public-package rules as soon as the manifest exists.
- The boundary checker scans `.ts`/`.tsx` source only; the facade has no source, but the layer declaration should still describe it.
- The root CI runs `npm ci`, `npm run check` and two size steps. There is no registry access assumption for the pack check.

## Goals / Non-Goals

**Goals:**

- Produce one complete, inspectable `npm pack` tarball from `packages/workbench` without adding a bundler dependency.
- Keep the public output modular and tree-shakable: one file per existing entry rather than one large bundle.
- Make the packed ESM load in both a bundler and a Node ESM consumer, and make its declarations resolve for every JavaScript entry.
- Prove the artifact in an offline, throwaway consumer as part of normal verification.
- Keep the five internal modules private and keep the facade free of authored UI source.

**Non-Goals:**

- Moving the template, minimal example or a custom-shell example into `apps/*`.
- Publishing to a registry or deciding the final package name/version policy.
- Changing application, preset, primitive, element or CSS behavior.
- Bundling third-party peers into the tarball.
- Adding per-component CSS or new public APIs.

## Decisions

### 1. Generate the facade by copying module output, then rewriting imports

`packages/workbench` contains an authored manifest and README plus generated `dist/`. A build script cleans `dist/` and copies the four JavaScript module outputs into `dist/core`, `dist/react`, `dist/elements` and `dist/preset`, and the styles package's four stylesheets into `dist/styles`.

The copy step excludes test output (`component-test-fixtures.*`), declaration maps, build metadata and existing source maps. It copies `packages/elements/src/global.d.ts` to `dist/elements/global.d.ts` explicitly.

A rewrite pass then changes module specifiers in every copied `.js` and `.d.ts` file:

- `@workbench-kit/core` → the relative path to `dist/core/index.js`
- `@workbench-kit/react` → `dist/react/index.js`
- `@workbench-kit/elements` → `dist/elements/all.js`
- `@workbench-kit/elements/<entry>` → `dist/elements/<entry>.js`
- extensionless relative paths → the existing file plus `.js`, or the directory's `index.js`
- `@vscode-elements/elements/dist/<tag>` → the tag directory's `index.js`, because the peer has no export map and Node ESM does not do directory imports
- other peers and bare specifiers stay unchanged

Alternatives considered:

- **Bundle with Vite/Rolldown/esbuild** — adds a build dependency and collapses the entry structure, making per-subpath inspection and tree-shaking claims harder to verify.
- **Publish re-exports of the private packages** — forbidden: consumers would install five private packages and `check:distribution` rejects it.
- **Point TypeScript `paths` at module source** — `tsc` does not rewrite emitted specifiers, so the output would still reference private names.
- **Leave extensionless imports and document bundler-only use** — contradicts the pack-check goal and the roadmap's "one tarball can be consumed" exit criterion.

### 2. Authored manifest, validated export map

`packages/workbench/package.json` is authored, not generated. It declares:

- name `@workbench-kit/workbench`, version `0.1.0`, `private: false`, `type: module`, MIT license;
- `"."` → `dist/preset/index.js`, `"./react"`, `"./core"`, `"./elements/all"`, one `"./elements/<tag>"` per current tag, `"./elements/types"` → `dist/elements/global.d.ts`, and `"./styles/index.css"`, `tokens.css`, `global.css`, `workbench.css`;
- a `types` condition for every JavaScript entry;
- peers `react`, `react-dom`, `@vscode-elements/elements`, runtime dependency `zustand`;
- `files: ["dist"]`;
- `sideEffects` limited to `**/*.css`, `./dist/elements/*.js` and `./dist/preset/elements.js`.

The build script checks that every emitted element entry has a manifest export and that every declared export target exists. This keeps the surface reviewable while failing on drift when a tag is added.

Alternative considered: generate the manifest from the module manifests. Rejected because publish metadata, peers and version policy should be reviewable in a diff, and generation hides mistakes until the pack check.

### 3. Make the packed output Node-ESM complete

The rewrite pass adds explicit `.js` extensions to relative imports and declarations, strips `//# sourceMappingURL=` comments and omits `.d.ts.map` files. This is a distribution-layer fix: internal packages keep their current `moduleResolution: bundler` output and build speed.

The packed install succeeds in Node without a loader, which lets the pack check execute the modules instead of only inspecting paths. TypeScript declarations keep working because `./foo.js` resolves to `foo.d.ts` under `bundler`/NodeNext resolution.

Alternative considered: change all internal source imports to `.js` first. Correct long-term, but it would touch every package and app source in a distribution-only change.

### 4. One runtime dependency, three peers

The facade declares React, React DOM and `@vscode-elements/elements` as peers, matching the public package contract and keeping one copy in the consumer. `zustand` is the only third-party runtime dependency because the preset store imports it. Core, React, elements, styles and preset code live inside the tarball, not as dependencies.

`check:distribution` enforces the same model: no internal module may become public, and the public package may not depend on an internal module.

### 5. Simulate a consumer offline in the pack check

`npm run pack:check` builds the facade, runs `npm pack --json` into a temp directory, and verifies the reported file list:

- the tarball contains the manifest, README and `dist/` only;
- required entry, declaration, typings and stylesheet files exist;
- no `src/`, test fixtures, declaration maps, build metadata, nested dependencies, private `@workbench-kit/*` specifiers or app/demo markers appear.

It then extracts the tarball and creates a throwaway consumer. Peer and runtime packages are symlinked from the repository's `node_modules`, so the check is offline and deterministic. In that consumer it:

1. resolves every declared JavaScript and CSS export with Node's resolver;
2. imports the preset, React, core and element subpaths in a Node process with a JSDOM window installed, and asserts representative exports and registered tags;
3. typechecks a small consumer that imports every declared JavaScript subpath plus `./elements/types` and the stylesheet entries.

Alternatives considered:

- **`npm install <tarball>` into a temp app** — realistic, but peer installation reaches the registry and makes CI depend on network state.
- **Only inspect the tarball file list** — fast, but does not prove resolution, module evaluation or types.
- **Vite-build a temp consumer** — strongest bundler proof, but slower and duplicates the type/runtime checks; Node resolution plus a consumer typecheck covers the contract with less machinery.

### 6. Verification integration and layer declaration

`build:packages` builds the four internal modules and then the facade. `pack:check` runs the facade build followed by the consumer check. `npm run check` adds `pack:check` after the application builds and before/after the existing minimal check, keeping one CI job. The pack check does not touch `dist/` or `dist-minimal/`, so size targets and budgets are unchanged.

`boundaries.json` gains a `kit-workbench` layer for `packages/workbench/**` mapped from `@workbench-kit/workbench` with no allowed imports. There is no TypeScript source there today; the rule prevents a future facade source from importing the implementation or app layers. The distribution check remains the authority for package privacy and public-surface metadata.

### 7. Documentation and mock workspace

`README.md`, `docs/architecture.md`, `ROADMAP.md` and `AGENTS.md` move the public package from "planned" to "implemented", document `build:facade`/`pack:check`, and keep the repository-versus-published import table explicit. The demo workspace tree adds the `packages/workbench` manifest and README so the Explorer surface reflects the new package.

## Risks / Trade-offs

- **Specifier rewrite misses an import form** → Cover static imports, re-exports and side-effect imports with fixture tests; the pack check evaluates real modules and typechecks the consumer, so an unresolved path fails verification.
- **Extension completion guesses wrong for a directory or file** → Resolve against the copied tree and fail the build with the offending file and specifier instead of emitting a broken import.
- **Test fixtures or declaration maps leak into the tarball** → Exclude them in the copy filter, exclude the preset fixture from its build config, and assert forbidden paths in the pack check.
- **JSDOM is insufficient for some custom-element initialization** → Install the window globals before importing element modules; if a required API is missing, add it to the throwaway runtime shim. The check must not fall back to path-only validation.
- **Export map drifts when an element tag is added** → Build-time assertion that every emitted element entry has an export, plus the distribution check's required `./elements/` prefix.
- **Packed output diverges from internal packages** → The facade is generated on every build and contains no authored UI; a clean build reproduces it from module output.
- **Offline peer symlinks hide a peer packaging mistake** → The pack check also asserts the manifest's peer and dependency declarations and that peers are not present in the tarball.
- **`pack:check` makes the standard verification slower** → Keep one pack, one extraction and one consumer; reuse the built outputs and avoid a second application build.
- **Root lockfile changes when the facade joins the workspace** → Commit the regenerated lockfile and verify with `npm ci` in the normal verification path.
- **Name or version changes before publishing** → Both stay in the manifest and `distribution.json`; Phase 6 can rename or version without changing the export structure.

## Migration Plan

1. Add `packages/workbench` with the authored manifest and README; the workspace pattern already includes it, so update the lockfile with a root install.
2. Add the facade build script and tests, then generate `dist/` and verify `check:distribution` accepts the public package.
3. Add the pack-check script and tests; run it against the generated tarball and fix any resolution or typings gaps.
4. Wire `build:facade` and `pack:check` into the root scripts and `check`, and add the facade layer to `boundaries.json`.
5. Update documentation, roadmap status and the demo workspace tree; run the full `npm run check`, both size commands and a manual template/minimal smoke check.

Rollback is a revert of the change: delete `packages/workbench`, the build/pack scripts and tests, restore the root scripts and boundary/documentation updates. No persisted state, storage key or schema changes, so no data migration is required.

## Open Questions

None. The final public scope name and publish policy remain Phase 6 decisions and do not change this design.
