# Proposal

## Why

Phase 5 is complete: the five private modules, the single public facade, the
packed-tarball check and all three application examples exist. The remaining
Phase 6 gap is adoption: the package has an import table and architecture notes,
but no API reference, no migration or eject path, no changelog or versioning
policy, and no license/third-party notices in the artifact. A consumer can pack
the tarball but cannot learn how to adopt it safely.

This change closes that gap. It documents the published surface, gives template
users a migration path and gives preset users a staged way to move to
composition or primitives. It also makes release metadata auditable, so the
first `0.x` publish is a deliberate release rather than an undocumented pack.

## What Changes

- Add a single published API reference covering the preset, composition
  primitives, headless core helpers, element registration entries and style
  entries, including props, callbacks, types and the repository-versus-published
  import map.
- Add a migration guide from the current template and its pre-workspace layout
  to `@workbench-kit/workbench`, including the internal-name-to-published-subpath
  mapping, app-view/data ownership and the preset persistence key.
- Add an eject guide with three explicit levels: keep the preset, move to
  composition, or use individual primitives. Each level states what is gained,
  what is given up, who owns state and which entries remain.
- Add a release policy and checklist: SemVer for `0.x`, one shared version for
  the five internal modules and the facade, changelog rules, release commands,
  post-publish verification and the name/publish approval gate.
- Add `CHANGELOG.md` with the initial `0.1.0` entry and `THIRD_PARTY_NOTICES.md`
  covering the runtime and peer dependencies, including the Codicons CC-BY-4.0
  attribution used by the demo.
- Ship `LICENSE` and `THIRD_PARTY_NOTICES.md` in the public tarball, and add the
  missing npm release metadata (`repository`, `homepage`, `bugs`,
  `publishConfig.access`) to the facade manifest.
- Add `check:docs` and `check:release` verification: documented relative links,
  npm scripts and published specifiers must resolve, public value exports must
  be covered by the API reference, versions must agree, and release metadata
  must be complete. Both run inside `npm run check`.
- Update the root README, package README, architecture/roadmap and agent guide
  to present the documentation set and the release gate.

Not included: changing runtime behavior, public exports or component props;
changing the template, minimal or custom-shell UI; adding a second package;
running `npm publish`; deciding the final package scope/name; or publishing from
CI. The actual first publish remains a manual owner-approved step after this
change, because the name is still provisional and registry credentials are
outside the repository.

## Capabilities

### New Capabilities

- `adoption-documentation`: accurate API, migration and eject documentation for
  the single published package, plus documentation checks that keep those docs
  aligned with the export map and standard commands.
- `release-readiness`: consistent versioning, changelog, license and
  third-party notices, complete npm metadata, and a documented, verified release
  checklist that gates the first `0.x` publish.

### Modified Capabilities

None. No existing capability's required behavior changes; this is a
documentation and release-metadata addition on top of the implemented package.

## Impact

- New: `docs/api.md`, `docs/migration.md`, `docs/eject.md`, `docs/release.md`,
  `CHANGELOG.md`, `THIRD_PARTY_NOTICES.md`, `packages/workbench/LICENSE`,
  `packages/workbench/THIRD_PARTY_NOTICES.md`, `scripts/check-docs.mjs`,
  `scripts/check-release.mjs` and their unit tests.
- Changed: `packages/workbench/package.json` (metadata and shipped files),
  `packages/workbench/README.md`, `scripts/lib/pack-check.mjs` and its tests
  (allow and require the packaged license/notices), root `package.json`
  (`check:docs`, `check:release` and the `check` sequence), `README.md`,
  `docs/architecture.md`, `ROADMAP.md`, `AGENTS.md` and the template's mock
  workspace content where it describes the package manifest.
- Unchanged: all component, store, command, style, element and example
  behavior; the public export map; bundle budgets; the distribution declaration;
  and the tarball's runtime dependency graph.
- Compatibility: repository-internal and documentation-facing only. No
  consumer import breaks, no persisted key changes and no new runtime
  dependency is added.
