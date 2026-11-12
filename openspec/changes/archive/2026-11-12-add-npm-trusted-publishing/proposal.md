# Proposal

## Why

Publishing the workbench is the last step of the release path, but the current
policy requires a manual `npm publish` and explicitly forbids CI from publishing.
The owner wants a tag to be the release action: creating `v<version>` should
verify the release and publish the facade automatically. npm trusted publishing
makes that possible without storing a long-lived npm token, but the package must
exist before the trust relationship can be configured, so the first step is a
one-time placeholder publish.

The provisional scoped name cannot be published because its scope is
unavailable. The public package will use the available unscoped name
`vscode-workbench` instead. The provisional name was never published, so this is
a pre-release rename, not a consumer migration.

## What Changes

- Rename the public facade to `vscode-workbench` across its manifest, the
  distribution declaration, the boundary map, the root workspace selector, the
  lockfile, consumer documentation, fixtures, mocks, checks and generated
  `llms.txt`. The five internal modules keep their private `@workbench-kit/*`
  names.
- Add a GitHub Actions publish workflow triggered by `v*` tag pushes. It runs on
  a GitHub-hosted runner with `contents: read` and `id-token: write`, verifies the
  release, and publishes only `packages/workbench` using npm trusted publishing
  (OIDC) with provenance.
- Add a release-tag guard that fails before publishing when the pushed tag does
  not equal `v<facade version>`.
- Extend the release check so standard verification fails if the publish workflow
  stops being tag-triggered, loses its OIDC permission, references a long-lived
  npm token, or publishes anything other than the facade.
- Document the one-time bootstrap: publish a `0.0.0-bootstrap.0` placeholder for
  `vscode-workbench` under the `bootstrap` dist-tag, then configure the GitHub
  Actions trusted publisher in the npm package settings. No npm token is created
  or stored.
- Update the release policy, contributor guidance, architecture notes and roadmap
  so the release action is "push a version tag" instead of "run npm publish".
  The owner approval and final-name gate remain before the bootstrap.
- Deprecate the placeholder version and document the post-publish verification
  for the first automated release.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `release-readiness`: fix the public package name before the first publish,
  replace the manual-publish requirements with a one-time owner-approved
  placeholder bootstrap followed by tag-triggered, OIDC-based publishing, and add
  the workflow-integrity and tag/version guard requirements.
- `adoption-documentation`: update the documented public specifier and consumer
  examples from the provisional package name to `vscode-workbench`.
- `style-entries`: update the public style subpath example from the provisional
  package name to `vscode-workbench`.

## Impact

- New `.github/workflows/publish.yml`.
- New release-tag guard script and tests; extended `scripts/lib/release.mjs` and
  its tests.
- Public package identity changes in `packages/workbench/package.json`,
  `distribution.json`, `boundaries.json`, `package.json`, `package-lock.json`,
  scripts, tests, fixtures, docs, mocks and generated `llms.txt`.
- `docs/release.md`, `docs/architecture.md`, `docs/migration.md`, `ROADMAP.md`,
  `AGENTS.md`, `README.md` and `CHANGELOG.md` updated.
- No runtime package behavior, public export shape, dependency or bundle change.
  The five internal modules remain private and keep their existing names.
- External setup: publish the `vscode-workbench` placeholder once, then register
  the GitHub Actions trusted publisher. No npm organization or repository secret
  is needed.
