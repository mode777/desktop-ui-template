# Release policy

The public artifact is one package, `@workbench-kit/workbench`, generated from
five private internal modules. This document defines how it is versioned,
prepared, published and verified.

Current prepared version: **0.1.0**. The package is **not published** by this
repository's automation. The npm scope and name remain provisional until the
owner approves them for the first publish.

- [Versioning](#versioning)
- [Changelog rules](#changelog-rules)
- [Artifact contents](#artifact-contents)
- [Pre-release checklist](#pre-release-checklist)
- [Publish gate](#publish-gate)
- [Post-publish verification](#post-publish-verification)
- [Rollback and deprecation](#rollback-and-deprecation)
- [0.x stability and scope](#0x-stability-and-scope)

## Versioning

The package follows [Semantic Versioning 2.0.0](https://semver.org/). While the
major version is `0`, the minor segment carries breaking changes:

| Release | Use when                                                                                             |
| ------- | ---------------------------------------------------------------------------------------------------- |
| Patch   | Bug fixes, documentation, internal refactors and dependency updates with no consumer-visible change. |
| Minor   | New features, new subpaths or breaking changes to imports, props, callbacks or persisted behavior.   |
| Major   | Breaking changes after `1.0.0`.                                                                      |

The five internal modules (`core`, `react`, `elements`, `styles-vscode`,
`preset-vscode`) and the facade share the facade's version. The internal modules
stay `private: true`; independent versioning is out of scope for `0.x`.

Bump all six manifests in the same commit. `npm run check:release` fails when
they diverge.

## Changelog rules

[`CHANGELOG.md`](../CHANGELOG.md) follows the [Keep a Changelog](https://keepachangelog.com/)
shape:

- `Unreleased` collects changes that are not part of a version yet.
- Each shipped version has a `## [<version>]` heading.
- Entries use `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed` and `Security`.
- Breaking changes start with **BREAKING** and state the migration action.
- The current facade version must have a matching heading before release;
  `npm run check:release` enforces the heading, while review enforces the content.

## Artifact contents

The packed tarball contains only:

- `package.json`, `README.md`, `LICENSE` and `THIRD_PARTY_NOTICES.md`;
- generated `dist/` output for the preset, React primitives, core helpers,
  element registrations, typings and stylesheets.

It contains no source, tests, fixtures, declaration maps, build metadata,
application/demo content, private workspace specifiers or nested dependencies.
React, React DOM and `@vscode-elements/elements` are peers; `zustand` is the only
runtime dependency.

## Pre-release checklist

Run from a clean checkout on the release commit:

1. Confirm the final npm scope and package name with the owner. The current name
   `@workbench-kit/workbench` is provisional.
2. `npm ci`
3. `npm run check`
   This runs lint, formatting, typecheck, boundaries, distribution,
   documentation, release, tests, all three application builds, both example
   checks and `pack:check`.
4. `npm run size` and `npm run size:minimal`
   Confirm both budgets pass and record the numbers in the release notes.
5. Update the version in the five internal manifests and the facade, and add the
   matching changelog section with its breaking-change notes.
6. `npm run build:facade`
7. `npm run pack:check`
8. `npm pack --dry-run` from `packages/workbench` and inspect the file list,
   license material and export targets.
9. Commit the version and changelog, then tag the commit `v<version>` (for
   example `v0.1.0`).

Do not tag or publish while the examples or checks fail.

## Publish gate

The first publish is manual and owner-approved:

```bash
cd packages/workbench
npm publish --access public
```

The facade already declares `publishConfig.access: "public"`. Do not add npm
tokens, registry credentials or a publish step to CI. This repository does not
publish automatically, and a tag alone does not publish.

Publish only after:

- the final scope/name is approved and any rename is reflected in the manifests,
  docs and import mapping;
- `npm run check` passes on the tagged commit;
- the template, minimal and custom-shell examples build and the minimal and
  custom-shell composition checks pass;
- the changelog describes the release and any breaking changes.

## Post-publish verification

In a clean temporary directory:

```bash
npm init -y
npm install @workbench-kit/workbench@0.1.0 react react-dom @vscode-elements/elements
```

Then:

1. Import the preset, `react`, `core`, one element entry and one stylesheet
   subpath from the installed package.
2. Build or run the documented minimal quickstart from [`api.md`](./api.md#install).
3. Confirm `LICENSE` and `THIRD_PARTY_NOTICES.md` are present in the installed
   package.
4. Confirm the package version and export map on the registry.
5. Only then announce the release and publish GitHub release notes.

## Rollback and deprecation

Do not unpublish a version by default. Prefer:

1. `npm deprecate @workbench-kit/workbench@<version> "<reason and replacement>"`
2. Publish a patch with the fix and update the changelog.
3. Keep the broken version's docs and migration note visible.

Unpublishing is reserved for legal or security emergencies and requires owner
approval.

## 0.x stability and scope

- `0.x` minor releases may include breaking changes; patch releases do not.
- The package is browser-only. It assumes `window`, `document` and
  `customElements`; SSR and server rendering are out of scope for `0.x`.
- The preset persistence key `desktop-ui-template:v1` is fixed in `0.1.0`;
  changing it is a breaking change and needs a migration note.
- The first release is validated by the template, minimal and custom-shell
  examples. A release that breaks any of them is not ready.

See [`api.md`](./api.md) for the public surface, [`migration.md`](./migration.md)
for adoption and [`eject.md`](./eject.md) for moving between levels.
