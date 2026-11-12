# Tasks

## 1. Public package scaffold

- [x] 1.1 Create `packages/workbench/package.json` with name `@workbench-kit/workbench`, version `0.1.0`, `private: false`, `type: module`, the `exports` map for `.`, `./react`, `./core`, `./elements/all`, every element tag, `./elements/types` and `./styles/*`, `types` conditions, peers (`react`, `react-dom`, `@vscode-elements/elements`), one runtime dependency (`zustand`), `files: ["dist"]`, narrow `sideEffects`, and a `build` script pointing at the facade build; verify `npm install` updates the root lockfile and `npm ls @workbench-kit/workbench --depth=0` shows the package, then `npm run check:distribution` accepts the now-present public package.
- [x] 1.2 Add `packages/workbench/README.md` with the published import table (preset, composition, core, element entries, types, styles), peer requirements and build/pack commands; verify `npx prettier --check packages/workbench/README.md` passes.
- [x] 1.3 Exclude `src/components/component-test-fixtures.ts` from `packages/preset-vscode/tsconfig.build.json` so test fixtures are not emitted; verify `rm -rf packages/preset-vscode/dist && npm run build -w @workbench-kit/preset-vscode` produces no `component-test-fixtures` files and the preset tests still pass.

## 2. Facade generation

- [x] 2.1 Add `scripts/lib/facade.mjs` with pure helpers for the copy filter, package/relative specifier rewriting, source-map comment stripping and export-target validation; add `scripts/lib/facade.test.mjs` covering core/react/elements package mappings, extensionless file and directory imports, untouched peers, fixture/map exclusion and a missing export target; verify `npm run test -- scripts/lib/facade.test.mjs` passes.
- [x] 2.2 Add `scripts/build-workbench-facade.mjs` to clean `packages/workbench/dist`, copy the four module builds and the styles CSS, copy `elements/src/global.d.ts`, rewrite imports, strip map references and assert every exported entry and element tag has a generated target; add root `build:facade` and append it to `build:packages`; verify `rm -rf packages/workbench/dist packages/{core,react,elements,preset-vscode}/dist && npm run build:packages` succeeds, `test -f packages/workbench/dist/preset/index.js`, `rg "@workbench-kit/" packages/workbench/dist` reports no matches, and a Node ESM import of `./packages/workbench/dist/core/index.js` resolves every export.
- [x] 2.3 Verify the generated manifest surface against the build: `npm run check:distribution` reports the public package, and every declared `exports` target and `types` condition exists in `packages/workbench/dist`; fix any mismatch before proceeding.
- [x] 2.4 Document the facade build and generated layout in `README.md` (Quick start commands and distribution paragraph) and `docs/architecture.md` (section 3 and current state); verify the documented `npm run build:facade` command runs as written and both files pass Prettier.

## 3. Packed-tarball verification

- [x] 3.1 Add `scripts/lib/pack-check.mjs` with helpers that derive required files from the manifest export map, reject forbidden tarball paths (source, fixtures, declaration maps, build metadata, nested dependencies), detect private `@workbench-kit/*` and app/demo markers, and generate the throwaway consumer runtime and typecheck sources; add `scripts/lib/pack-check.test.mjs` covering a complete surface, a missing entry, a leaked private specifier and a leaked app marker; verify `npm run test -- scripts/lib/pack-check.test.mjs` passes.
- [x] 3.2 Add `scripts/check-workbench-pack.mjs` to build the facade, pack exactly one tarball into a temp directory, inspect `npm pack --json` output, extract it, symlink the declared peers/runtime packages from the root `node_modules`, resolve every declared JavaScript and CSS subpath, evaluate the preset/primitives/core and element entries under JSDOM, and typecheck a consumer importing every JavaScript subpath plus `elements/types`; add root `pack:check` and a `--keep-temp` debug flag; verify `npm run pack:check` passes and prints the tarball, resolved entries and consumer check status.
- [x] 3.3 Add `scripts/check-workbench-pack.test.mjs` using a temp package directory and the CLI's `--package-dir` option to prove a missing export target, an injected `src/demo` marker and a missing declaration each exit non-zero with the offending path; verify `npm run test -- scripts/check-workbench-pack.test.mjs` passes.
- [x] 3.4 Add `pack:check` to the standard `check` script after the application builds, and document the tarball contract and command in `README.md` and the `docs/architecture.md` enforcement matrix; verify `npm run pack:check`, `npm run check:boundaries` and `npm run format:check` pass.

## 4. Boundaries, workspace surfaces and integration

- [x] 4.1 Add the `kit-workbench` layer and `@workbench-kit/workbench` mapping to `boundaries.json` with no implementation/app/demo imports; extend `scripts/lib/boundaries.test.mjs` for an allowed facade subpath and a forbidden facade-to-preset import; verify `npm run check:boundaries` and `npm run test -- scripts/lib/boundaries.test.mjs` pass.
- [x] 4.2 Update the `README.md` dependency-boundary table and `docs/architecture.md` enforcement status to include the facade layer and the implemented public package; verify Prettier and that the documented checks match the scripts.
- [x] 4.3 Update `ROADMAP.md` Phase 5 status/current-state audit and `AGENTS.md` commands/architecture notes to mark the facade and tarball validation as done, leaving `apps/*`, `apps/custom-shell` and publishing as follow-up; verify Prettier and that every command named in `AGENTS.md` exists in `package.json`.
- [x] 4.4 Add `packages/workbench` (`package.json` and `README.md`) to the demo workspace tree in `src/demo/data/workspace.ts`, with contents consistent with the real files; verify `npm run typecheck` and the template build pass.
- [x] 4.5 Run the full integration gate: `npm run check`, `npm run size`, `npm run size:minimal`, `npm pack --dry-run` from `packages/workbench`, and a manual `npm run dev` smoke check at 1440×900 and a narrow width confirming the template still renders with no body scroll.

## Workflow follow-up

- Archive the change after review and the full verification gate pass.
