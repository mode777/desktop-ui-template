# Release policy

The public artifact is one package, `vscode-workbench`, generated from five
private internal modules. This document defines how it is versioned, prepared,
published and verified.

Current prepared version: **0.1.0**. The package has a one-time npm bootstrap
version, `0.0.0-bootstrap.0`; the first real release is published by the Git tag
workflow. The package name is final.

- [Versioning](#versioning)
- [Changelog rules](#changelog-rules)
- [Artifact contents](#artifact-contents)
- [Trusted publishing](#trusted-publishing)
- [One-time bootstrap](#one-time-bootstrap)
- [Pre-release checklist](#pre-release-checklist)
- [Automatic tag releases](#automatic-tag-releases)
- [Post-publish verification](#post-publish-verification)
- [Troubleshooting](#troubleshooting)
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
stay `private: true`; independent versioning is out of scope for `0.x`. They keep
their `@workbench-kit/*` names, which are repository-only and never appear in a
consumer install.

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

- `package.json`, `README.md`, `AGENTS.md`, `llms.txt`, `LICENSE` and
  `THIRD_PARTY_NOTICES.md`;
- consumer documentation under `docs/`;
- generated `dist/` output for the preset, React primitives, core helpers,
  element registrations, typings and stylesheets.

It contains no source, tests, fixtures, declaration maps, build metadata,
contributor documentation, application/demo content, private workspace
specifiers or nested dependencies.
React, React DOM and `@vscode-elements/elements` are peers; `zustand` is the only
runtime dependency.

## Trusted publishing

The package is published with [npm trusted publishing](https://docs.npmjs.com/trusted-publishers).
The workflow authenticates with a short-lived GitHub OIDC token; no `NPM_TOKEN`
secret or long-lived registry credential exists in the repository.

The trusted publisher is configured once in the npm package settings:

| Setting           | Value                                             |
| ----------------- | ------------------------------------------------- |
| Package           | `vscode-workbench`                                |
| Provider          | GitHub Actions                                    |
| Organization/user | `mode777`                                         |
| Repository        | `desktop-ui-template`                             |
| Workflow filename | `publish.yml`                                     |
| Environment       | leave empty; the workflow declares no environment |

The trust is pinned to `.github/workflows/publish.yml`. Renaming that file,
transferring the repository or adding a required environment requires updating
the npm setting in the same release cycle. Renaming the workflow is a release
blocker, not a cosmetic change.

## One-time bootstrap

npm only exposes trusted-publisher settings for a package that already exists.
The package was bootstrapped once with a placeholder version under the
`bootstrap` dist-tag:

```bash
tmp="$(mktemp -d)"
cd "$tmp"

cat > package.json <<'JSON'
{
  "name": "vscode-workbench",
  "version": "0.0.0-bootstrap.0",
  "description": "Bootstrap placeholder for vscode-workbench; superseded by 0.1.x.",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/mode777/desktop-ui-template.git",
    "directory": "packages/workbench"
  }
}
JSON

npm login
npm whoami
npm publish --access public --tag bootstrap
```

Do not rerun the bootstrap for a normal release. If the package must be
recreated under a new name, run the procedure once for the new name, configure
the trusted publisher, and deprecate the old placeholder.

## Pre-release checklist

Run from a clean checkout on the release commit:

1. Confirm the facade version and the changelog section. The public name is
   `vscode-workbench`; do not reintroduce the provisional name.
2. `npm ci`
3. `npm run check`
   This runs lint, formatting, typecheck, boundaries, distribution,
   documentation, release, tests, all three application builds, the quickstart
   and adoption checks, both example checks and `pack:check`.
4. `npm run build:site`
   Confirm `site/docs/`, `site/docs/raw/`, `site/llms.txt` and
   `site/docs/llms-full.txt` are present.
5. `npm run size` and `npm run size:minimal`
   Confirm both budgets pass and record the numbers in the release notes.
6. Update the version in the five internal manifests and the facade, and add the
   matching changelog section with its breaking-change notes.
7. `npm run build:facade`
8. `npm run pack:check`
9. `npm pack --dry-run` from `packages/workbench` and inspect the file list,
   license material, consumer docs, `AGENTS.md`, `llms.txt` and export targets.
   The tarball is named `vscode-workbench-<version>.tgz`.
10. Confirm `availability` is `preview` in
    `packages/workbench/docs/manifest.json` until the publish succeeds.
11. Confirm the npm trusted publisher lists `publish.yml` for this repository.
12. Commit the version and changelog, then tag the commit `v<version>` (for
    example `v0.1.0`) and push the tag. Do not run `npm publish` manually for a
    normal release.

Do not tag while the examples or checks fail.

## Automatic tag releases

Pushing a `v<version>` tag starts `.github/workflows/publish.yml`. The workflow:

1. checks out the tagged commit, installs with `npm ci`, runs `npm run check`
   and enforces both bundle-size budgets;
2. fails unless the tag is exactly `v<facade version>`;
3. publishes only `packages/workbench` with public access and provenance using
   the short-lived OIDC credential.

The published version becomes the `latest` dist-tag. No maintainer machine needs
an npm credential, and no manual publish step follows the tag.

## Post-publish verification

In a clean temporary directory:

```bash
npm init -y
npm install vscode-workbench@0.1.0 react react-dom @vscode-elements/elements
```

Then:

1. Import the preset, `react`, `core`, one element entry and one stylesheet
   subpath from the installed package.
2. Build or run the documented quickstart from [`packages/workbench/docs/quickstart.md`](../packages/workbench/docs/quickstart.md).
3. Confirm `docs/`, `AGENTS.md` and `llms.txt` are present in the installed
   package.
4. Confirm `LICENSE` and `THIRD_PARTY_NOTICES.md` are present in the installed
   package.
5. Confirm the package version and export map on the registry, and confirm the
   release has a provenance attestation:
   `npm view vscode-workbench@0.1.0 dist.attestations --json`.
6. Deprecate the bootstrap placeholder and retire its dist-tag:
   `npm deprecate vscode-workbench@0.0.0-bootstrap.0 "Bootstrap placeholder; use the current release."`
   followed by `npm dist-tag rm vscode-workbench bootstrap`.
7. Confirm `npm view vscode-workbench dist-tags --json` points `latest` at the
   new release.
8. Set `availability` to `published` in
   `packages/workbench/docs/manifest.json`, run `npm run generate:llms`, and
   rebuild and republish the documentation site so the banner and `llms.txt`
   reflect the published status.
9. Only then announce the release and publish GitHub release notes.

## Troubleshooting

- **`E404` on a first publish of an unscoped name** — the name is unavailable or
  the account cannot publish it. Check `npm view vscode-workbench version`; if it
  is taken, stop and choose another approved name. Do not create a token.
- **Trusted publisher `404`, `401` or `ENEEDAUTH`** — the repository, workflow
  filename or environment does not match the npm setting. The workflow must be
  `publish.yml` in `mode777/desktop-ui-template` with no environment, and the job
  must grant `id-token: write`.
- **npm authentication fails with an older CLI** — trusted publishing requires
  npm 11.5.1 or later. Node 24 from `.nvmrc` supplies a compatible npm.
- **The workflow does not run** — confirm the pushed tag matches `v*` and GitHub
  Actions is enabled for the repository.
- **Tag/version mismatch** — `npm run check:release-tag -- --tag "v<version>"`
  reports the tag and the facade version. Fix the tag or the manifest before
  pushing again.
- **A version already exists** — npm does not allow republishing a version. Bump
  the patch version, update the changelog and tag the new commit.

## Rollback and deprecation

Do not unpublish a version by default. Prefer:

1. `npm deprecate vscode-workbench@<version> "<reason and replacement>"`
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

See the [consumer API reference](../packages/workbench/docs/reference/api.md) for the public surface, [`migration.md`](./migration.md)
for adoption and the [eject recipe](../packages/workbench/docs/recipes/eject.md) for moving between levels.
