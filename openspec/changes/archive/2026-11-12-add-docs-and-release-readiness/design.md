# Design

## Context

See [`proposal.md`](./proposal.md) for motivation and the two delta specs for
required behavior.

The published surface already exists and is enforced:

- `packages/workbench` is the single public facade with a generated `dist/` and
  an authored manifest.
- `scripts/check-workbench-pack.mjs` builds, packs, extracts, imports and
  typechecks one tarball.
- `scripts/check-distribution.mjs` enforces privacy, dependency direction and
  the public export map.
- `pack:check` currently requires only `package.json`, `README.md` and every
  export target in the tarball.

The documentation gap is real: the root README explains the template, the
package README has an import table, and `docs/architecture.md` explains the
module split, but there is no reference for props, callbacks, helpers or types,
no migration path from the template, no eject path, no changelog, no release
policy and no third-party notices. The facade also lacks npm metadata
(`repository`, `homepage`, `bugs`, `publishConfig`) and ships no `LICENSE` in
the tarball.

The preset's persisted key is hardcoded as `desktop-ui-template:v1` in
`packages/preset-vscode/src/store/workbench-store.ts`. That is a 0.1.0
limitation: two preset instances on one origin share state. This change
documents it but does not change runtime behavior.

## Goals / Non-Goals

**Goals:**

- Make the published package understandable without reading the repository.
- Give template users and preset users a staged, reversible adoption path.
- Make release metadata, license material and versioning auditable.
- Add checks that fail when docs, exports, versions or release metadata drift.
- Keep the existing runtime, public API and example applications unchanged.

**Non-Goals:**

- Publishing to npm, deciding the final scope/name, or storing registry
  credentials.
- Changing the preset store, persistence key, component props, command registry
  or export map.
- Adding a docs site, generated API extractor or Storybook.
- Adding a new package, example or bundle budget target.
- Validating Markdown anchors; the documentation check validates file targets,
  scripts, published specifiers and export coverage.

## Decisions

### 1. One authored API reference in `docs/api.md`

`docs/api.md` is a single page with sections for install and peers, the import
map, the preset, composition primitives, core helpers, element entries, style
entries and public types. It uses tables for props, callbacks, helpers and
entries, and short published-import examples.

**Why:** the public surface is still small enough for one page, and the
repository-versus-published mapping is easier to keep consistent when it appears
once. A single file also gives the docs check one target for export coverage.

**Alternative considered:** one page per layer under `docs/api/`. Rejected for
0.x: it multiplies navigation and duplicated import tables before the surface is
large enough to need it. Split later if the page becomes hard to scan.

### 2. Published imports are the default; repository names appear only in the mapping table

Consumer examples import from `@workbench-kit/workbench`, `.../react`,
`.../core`, `.../elements/<tag>` and `.../styles/*.css`. The repository module
names appear in one explicit mapping table and in contributor sections.

**Why:** a reader who installs the package must never be told to install a
private workspace module. Keeping internal names out of examples reduces the
most likely migration mistake.

**Alternative considered:** show both forms side by side in every example.
Rejected: it doubles the noise and encourages copying a private specifier.

### 3. Migration covers both the copied template and the current workspace app

`docs/migration.md` starts with a target-level choice, then covers installation,
peer requirements, import replacement, app-owned content, preset state,
elements, styles and verification. The import table maps the old copy-paste
layout (`src/layout/components/*`, `src/store/*`, `src/views/*`,
`src/styles/tokens.css`, `src/vscode-elements.ts`) and the current workspace
names to the published subpaths.

The guide states the preset persistence key and its consequences:
`desktop-ui-template:v1` is shared per origin, survives reloads, and is not
configurable in 0.1.0. A consumer that needs a different key or multiple
isolated workbenches must move to composition and own persistence.

**Why:** two audiences exist: teams that copied the pre-workspace template and
teams already consuming the workspace packages. One guide with two entry
sections avoids a second document that would drift.

**Alternative considered:** a codemod. Rejected: the import surface is small,
the app-owned files differ per project, and a codemod would need its own tests
and support for the old tree.

### 4. The eject guide is staged and reference-driven

`docs/eject.md` has three levels:

| Level       | Keeps                                                       | Gives up                                                        | Reference           |
| ----------- | ----------------------------------------------------------- | --------------------------------------------------------------- | ------------------- |
| Preset      | Shell, regions, store, generic commands, quick open, toasts | Nothing; least code to own                                      | `apps/template`     |
| Composition | Shell, resizing, tabs, elements, styles                     | Preset store, commands, quick open, notifications, context menu | `apps/custom-shell` |
| Primitives  | Only the behavior used inside an existing layout            | Shell, regions, default tab/panel composition                   | `apps/minimal`      |

Each level lists the imports that remain, the state the consumer must own, the
preset surfaces that disappear and the verification command. The composition
section maps preset store fields to local state and shows the headless
`readVersioned`/`writeVersioned` path for consumers who want persistence
without the preset.

**Why:** the three examples already prove the levels. Turning them into a guide
makes the trade-off explicit and avoids presenting ejection as all-or-nothing.
Readers can stop at any level.

**Alternative considered:** promote generic region components into `react` so
ejection is easier. Rejected: that is an API change with its own design and
versioning cost, not a documentation change.

### 5. One root license and notices source, copied into the package build

`LICENSE` remains at the repository root. `THIRD_PARTY_NOTICES.md` is added at
the root and covers the distributed dependencies (React, React DOM, Zustand,
`@vscode-elements/elements`) and the Codicons CC-BY-4.0 attribution used by the
demo.

`scripts/build-workbench-facade.mjs` copies both files into
`packages/workbench/` so `npm pack` includes them at the package root. The
facade manifest's `files` list includes both, `.gitignore` ignores the generated
copies, and `pack:check` requires them and allows them in the tarball allowlist.

**Why:** one canonical notices file avoids a root copy and a package copy
drifting. The facade build already owns generated package content.

**Alternative considered:** commit a second copy under `packages/workbench/`.
Rejected: duplicated legal text is exactly the kind of file that goes stale.
**Alternative considered:** ship notices only in the repository. Rejected: the
tarball is the consumer artifact and should carry its license material.

### 6. `check:docs` validates links, scripts, specifiers and export coverage

Add `scripts/check-docs.mjs` with reusable helpers in `scripts/lib/docs.mjs`:

1. Walk the authored documentation set (`README.md`, `ROADMAP.md`, `AGENTS.md`,
   `CHANGELOG.md`, `THIRD_PARTY_NOTICES.md`, `docs/**/*.md`,
   `packages/*/README.md`, `apps/*/README.md`). Skip `node_modules`, `dist`,
   `openspec/` and generated reports.
2. Resolve every relative Markdown link target; external URLs, `mailto:` and
   anchor-only links are ignored.
3. Extract `npm run <script>` references and require the script in the root
   `package.json`.
4. Extract `@workbench-kit/workbench[/subpath]` specifiers and require the
   matching key in the facade export map. Pattern placeholders containing
   `<`, `{` or `*` are skipped.
5. Collect public value exports from the core, React and preset entry points by
   walking the source re-export graph, and require each name in `docs/api.md`.
   A small source scanner is used instead of the classic TypeScript compiler API
   because the repository's TypeScript 7 package no longer exposes that API at
   its root entry.
6. Require every facade export key (preset, React, core, each element tag,
   types, each style entry) to appear in `docs/api.md`.

The CLI prints checked counts and exits non-zero with file, line and target
details. `scripts/lib/docs.test.mjs` covers link resolution, script extraction,
specifier mapping, placeholder skipping and value-export filtering.

**Why:** link rot, a renamed script, an undocumented export and an invented
subpath are the four failure modes that make adoption docs wrong. All four are
mechanically detectable without a docs site or a Markdown parser dependency.

**Alternative considered:** validate anchors too. Rejected for now: heading
slug rules differ across renderers and add false failures; file targets catch
the costly breakage.

### 7. `check:release` validates version and metadata consistency

Add `scripts/check-release.mjs` with helpers in `scripts/lib/release.mjs`:

- the five internal manifests and the facade share one version;
- the facade name matches `distribution.json`;
- the facade is not private and declares `license`, `repository.url`,
  `homepage`, `bugs.url` and `publishConfig.access: "public"`;
- root `LICENSE` and `THIRD_PARTY_NOTICES.md` exist;
- `CHANGELOG.md` contains a heading for the current version;
- the facade `files` list includes `LICENSE` and `THIRD_PARTY_NOTICES.md`.

`scripts/lib/release.test.mjs` covers version drift, missing metadata, a
missing changelog heading and a missing license. Both `check:docs` and
`check:release` run after `check:distribution` in the standard `check`
sequence, before tests and builds.

**Why:** these are the release mistakes that are cheap to catch and expensive to
discover after publishing: six versions drifting apart, a scoped package
defaulting to restricted access, or a tarball without a license.

**Alternative considered:** fold release checks into `check:distribution`.
Rejected: distribution validates the architecture surface, release validates
the publishable artifact; keeping the reports separate makes failures clearer.

### 8. Release policy is manual, gated and documented in `docs/release.md`

`docs/release.md` defines:

- SemVer for `0.x`: minor releases may break, patches do not; the five internal
  modules and the facade share one version; independent versioning is out of
  scope.
- Changelog rules (Keep a Changelog sections, breaking-change markers, current
  version heading).
- Pre-release checklist: clean `npm ci`, `npm run check`, `npm run size` and
  `npm run size:minimal`, changelog/version bump, facade build, `pack:check`,
  `npm pack --dry-run` inspection, tag `v<version>`.
- Manual publish from `packages/workbench` only after the owner approves the
  final scope/name; no npm token in the repository and no publish step in CI.
- Post-publish verification in a clean consumer, then GitHub release notes.
- Rollback by deprecation and a patch release rather than unpublishing.

`CHANGELOG.md` records the prepared `0.1.0` public surface. The actual publish
date and final scope are confirmed at release time.

**Why:** the package name is still provisional, and a release is an external
side effect. Encoding the gate in the repository prevents an accidental publish
while still giving the maintainer a complete, tested checklist.

**Alternative considered:** automate publish in a tag-triggered workflow.
Rejected for the first release: it requires registry credentials, a confirmed
name and a trusted provenance setup that are not part of this change.

### 9. Documentation discoverability follows the existing README shape

The root README gains a **Documentation** section next to Quick start, linking
the API reference, migration, eject and release policy. The package README links
the same documents and states the `0.x`/browser-only expectation.
`docs/architecture.md` points to the adoption docs from its current-state
section. `ROADMAP.md` marks Phase 6 documentation and release readiness
complete while leaving registry publication gated. `AGENTS.md` gains the docs
map and the two new checks.

**Why:** readers currently enter through the root README, the package README or
the architecture doc. All three should lead to the same adoption path.

**Alternative considered:** a standalone docs site. Rejected: it adds a build,
deployment and versioning surface that Phase 6 does not require.

## Risks / Trade-offs

- **Documentation drifts from the export map or scripts** → `check:docs` fails
  on links, scripts, subpaths and value exports; keep examples importable.
- **The API reference grows too large for one page** → split it by layer when
  scanning becomes hard; the check can keep `docs/api.md` as the index and
  validate subpages.
- **The docs check over-fits current text** → skip placeholder specifiers and
  validate names, not prose; unit-test the extraction rules.
- **Release check gives false confidence about changelog quality** → it only
  enforces a version heading; the release review still reads the entries and
  marks breaking changes.
- **Generated license/notices are missing from a manual pack** → `files` lists
  them, `pack:check` requires them, and the release checklist builds the facade
  before packing.
- **Legal notices go stale when dependencies change** → the notices file lists
  the direct distributed dependencies by range; review it when peers or runtime
  dependencies change.
- **The preset persistence key is shared per origin** → document the 0.1.0
  limitation and the composition escape hatch; changing it is a later runtime
  API decision.
- **The provisional package name leaks into docs** → use the current name
  consistently, state that it is provisional in the release policy, and keep the
  publish gate explicit.
- **The standard check gets slower** → both checks are file- and
  compiler-based, run before builds, and add no bundling step.

## Migration Plan

1. Add the canonical root `LICENSE` material, `THIRD_PARTY_NOTICES.md`, package
   metadata and the facade build/pack allowlist changes for the generated
   license and notices.
2. Write `docs/api.md`, `docs/migration.md`, `docs/eject.md` and
   `docs/release.md`, then `CHANGELOG.md`.
3. Add `scripts/lib/docs.mjs`, `scripts/check-docs.mjs`,
   `scripts/lib/release.mjs`, `scripts/check-release.mjs` and their tests.
4. Wire `check:docs` and `check:release` into the root scripts and the standard
   `check` sequence; update `pack:check` helpers and tests for the new tarball
   files.
5. Update the root README, package README, architecture, roadmap, agent guide
   and the mock package content.
6. Run a clean install, the full `npm run check`, both size commands, and the
   documented minimal quickstart in a throwaway consumer. Confirm no runtime or
   UI diff and no publish step.

Rollback is a normal revert of documentation, metadata, build-copy and check
changes. No runtime behavior, persisted state, public export or dependency
graph changes, so no data migration is involved.

## Open Questions

None blocking. The final package scope/name and the publish date remain owner
decisions recorded by the release gate; they do not change the documentation
structure or the checks in this change.
