# Tasks

## 1. License, notices and package metadata

- [x] 1.1 Add root `THIRD_PARTY_NOTICES.md` listing React, React DOM, Zustand and `@vscode-elements/elements` (MIT), plus the Codicons attribution (`LICENSE` and `LICENSE-CODE`, CC-BY-4.0/MIT) used by the demo; verify every listed name and version range matches the root and facade manifests and `npx prettier --check THIRD_PARTY_NOTICES.md` passes.
- [x] 1.2 Add `repository`, `homepage`, `bugs`, `publishConfig.access` and `files` entries for `LICENSE` and `THIRD_PARTY_NOTICES.md` to `packages/workbench/package.json`; verify the manifest is valid JSON, the package stays non-private and the declared peers/runtime dependency are unchanged.
- [x] 1.3 Update `scripts/build-workbench-facade.mjs` to copy the root `LICENSE` and `THIRD_PARTY_NOTICES.md` into `packages/workbench/` and add both generated paths to `.gitignore`; verify `npm run build:facade` writes both files at the package root and a repeated build overwrites them from the root sources.
- [x] 1.4 Update `scripts/lib/pack-check.mjs` and `scripts/lib/pack-check.test.mjs` so the tarball requires and allows `LICENSE` and `THIRD_PARTY_NOTICES.md`; verify `npm run test -- scripts/lib/pack-check.test.mjs` passes and `npm run pack:check` reports both files in the packed tarball.

## 2. API reference

- [x] 2.1 Write `docs/api.md` with the install and peer requirements, a repository-to-published import map, the preset `VSCodeWorkbench` prop table, `WorkbenchConfig`, view registry, command registry, menus, quick open, branding, document renderer, status bar, initial session and preset store surface; verify every preset value export is named and the page renders with working relative links.
- [x] 2.2 Add the composition and primitive sections to `docs/api.md` covering `WorkbenchShell` slots, `ResizablePane` controlled size and callbacks, `TabStrip` tabs and callbacks, and `IconButton` props, each with published-import examples; verify the code snippets use only `@workbench-kit/workbench/react`.
- [x] 2.3 Add the core helper sections to `docs/api.md` covering size clamping, pointer and keyboard resizing, tab collection transitions and versioned persistence with signatures, return values and no-op conditions; verify every core value export is named and the tab helper descriptions match the actual transition behavior.
- [x] 2.4 Add the element and style sections to `docs/api.md` listing every facade element subpath with its registered tag and side effect, the types entry, and every stylesheet entry with its order and scope; verify every export key in `packages/workbench/package.json` appears in the page.
- [x] 2.5 Add a public type index and the `0.x`/browser-only stability note to `docs/api.md`; verify every type named in the page exists in the package declarations and no private module is presented as a consumer import.

## 3. Migration and eject guides

- [x] 3.1 Write `docs/migration.md` with the target-level choice, single-package install, peer requirements, old-template and workspace import replacement tables, app-owned views/data/menus/branding guidance, preset persistence key behavior and a verification checklist; verify every documented import resolves to a declared public subpath and every command exists in the root manifest.
- [x] 3.2 Write `docs/eject.md` with the preset, composition and primitive levels, what each keeps and gives up, state and persistence ownership, the preset store field mapping, and links to `apps/template`, `apps/custom-shell` and `apps/minimal`; verify every code example uses only public subpaths and every reference file exists.
- [x] 3.3 Add a “common migration failures” section to `docs/migration.md` covering aggregate element registration, CSS entry order, duplicate React, the shared persistence key and SSR; verify each failure has an observable symptom and a concrete fix.

## 4. Release policy and changelog

- [x] 4.1 Write `docs/release.md` with the SemVer `0.x` policy, shared version rule, changelog rules, artifact contents, pre-release checklist, manual publish gate, tag convention, post-publish verification and deprecation-based rollback; verify every command named exists in the root or facade manifest and the publish step is explicitly owner-approved and outside CI.
- [x] 4.2 Add `CHANGELOG.md` with an `Unreleased` section and a `0.1.0` entry describing the published preset, composition, core, element and style surfaces, the three adoption levels and the license/notices addition; verify the current facade version has a matching heading and Prettier passes.
- [x] 4.3 Update `ROADMAP.md` Phase 6 status and the current-state audit so documentation and release readiness are complete while the registry publish remains gated; verify Phase 6's remaining item names the name approval and manual publish.

## 5. Documentation and release checks

- [x] 5.1 Add `scripts/lib/docs.mjs` with helpers for Markdown link extraction and resolution, `npm run` script extraction, published specifier mapping, placeholder skipping and public value-export collection; add `scripts/lib/docs.test.mjs` covering each helper and verify `npm run test -- scripts/lib/docs.test.mjs` passes.
- [x] 5.2 Add `scripts/check-docs.mjs` that scans the authored documentation set, validates relative links, root scripts, published subpaths and `docs/api.md` export coverage, and exits non-zero with file and line details; verify `node scripts/check-docs.mjs` passes on the completed docs.
- [x] 5.3 Add `scripts/lib/release.mjs` with version-parity, facade-metadata, changelog-heading and license/notices checks; add `scripts/lib/release.test.mjs` covering version drift, missing metadata, a missing changelog heading and a missing license, then verify `npm run test -- scripts/lib/release.test.mjs` passes.
- [x] 5.4 Add `scripts/check-release.mjs` that reads the six manifests, `distribution.json`, `CHANGELOG.md`, `LICENSE` and `THIRD_PARTY_NOTICES.md` and reports actionable failures; verify `node scripts/check-release.mjs` passes and the report names the shared version.
- [x] 5.5 Add `check:docs` and `check:release` root scripts and insert both into the standard `check` sequence after `check:distribution`; verify `npm run check:docs` and `npm run check:release` pass and the `check` script string places both before `test` and `build`.
- [x] 5.6 Prove the new checks are not vacuous: temporarily break a relative link and remove one documented export name from `docs/api.md`, confirm `check:docs` fails with the file and missing name; temporarily change one internal version, confirm `check:release` fails with the manifest; revert and confirm both pass again.

## 6. Documentation integration

- [x] 6.1 Add a Documentation section to `README.md` linking `docs/api.md`, `docs/migration.md`, `docs/eject.md` and `docs/release.md`, and update its roadmap paragraph to say documentation and release readiness are complete while publishing is gated; verify all links resolve and the documented commands exist.
- [x] 6.2 Update `packages/workbench/README.md` with links to the same guides, the `0.x`/browser-only expectation, the license/notices files and the release gate; verify every link resolves from the package directory and no private workspace module is presented as an install target.
- [x] 6.3 Update `docs/architecture.md` and `AGENTS.md` with the documentation set, the two new checks and the release metadata boundary; verify every command named in `AGENTS.md` exists and Prettier passes.
- [x] 6.4 Update the template's mock `packages/workbench/package.json` and README content to reflect the new metadata, license/notices files and guide links; verify the mock content stays valid JSON/Markdown and `npm run test -- apps/template` passes.

## 7. Integration verification

- [x] 7.1 Run a clean install and the full gate: remove `node_modules`, run `npm ci`, then `npm run check`; verify lint, formatting, typecheck, boundaries, distribution, documentation, release, tests, all three builds, both example checks and `pack:check` pass.
- [x] 7.2 Run `npm run size` and `npm run size:minimal`; verify both budgets pass, the recorded baselines are unchanged and no documentation or release file enters either application bundle.
- [x] 7.3 Build the documented minimal quickstart in a throwaway consumer using the packed tarball and only the documented install, imports, element registration and styles; verify the production build succeeds without repository source or private modules.
- [x] 7.4 Inspect `npm pack --dry-run --json` from `packages/workbench`; verify the tarball contains `package.json`, `README.md`, `LICENSE`, `THIRD_PARTY_NOTICES.md` and generated `dist/`, and contains no source, tests, maps, app/demo content or private workspace specifiers.
- [x] 7.5 Review the final diff for unintended runtime, component, store, command, style, export-map or example changes; verify no `npm publish` ran, no secrets or registry tokens were added and `git status` contains only the intended documentation, metadata, check, test and documentation-link changes.

## Workflow follow-up

- Archive this change after review and the full verification gate pass.
- Confirm `adoption-documentation` and `release-readiness` are created with their purposes and no main spec is overwritten.
