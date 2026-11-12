# Spec Delta

## MODIFIED Requirements

### Requirement: A release policy and checklist are documented

The project SHALL document versioning, release steps, verification commands, the tag convention, the one-time bootstrap, trusted-publisher configuration, post-publish checks and rollback. The first publish SHALL be the owner-approved placeholder bootstrap; later releases SHALL publish by pushing a version tag.

#### Scenario: Versioning policy

- **WHEN** a maintainer plans a change
- **THEN** the policy states SemVer behavior for `0.x`, when a minor or patch release is required and that the internal modules share the facade version

#### Scenario: Release checklist

- **WHEN** a maintainer prepares a release
- **THEN** the checklist covers the clean install, standard verification, size reports, changelog and version bump, facade build, packed-tarball check and pushing the version tag, and states that no manual publish follows a normal tag

#### Scenario: Publish gate

- **WHEN** the package name is still provisional or the owner has not approved publishing
- **THEN** the documentation states that no bootstrap or release publish occurs, and that CI uses short-lived OIDC credentials rather than a stored npm token

#### Scenario: Bootstrap instructions

- **WHEN** the owner approves the final package name and scope
- **THEN** the documentation gives a copy-paste placeholder publish under a non-`latest` dist-tag, followed by the exact repository and workflow values to register as the npm trusted publisher

#### Scenario: Post-publish verification

- **WHEN** the package is published
- **THEN** the checklist installs the published version in a clean consumer, verifies the documented subpaths and provenance, deprecates the bootstrap placeholder and flips the documentation availability only after those checks pass

### Requirement: Release checks run in standard verification

The project SHALL provide a release check for version, changelog, manifest metadata and publish-workflow integrity and SHALL run it, together with the documentation check and the packed-tarball check, as part of the standard verification command.

#### Scenario: Standard verification includes release checks

- **WHEN** a developer runs the standard verification command
- **THEN** the documentation check, release check and pack check all run and any failure fails verification

#### Scenario: Actionable failure

- **WHEN** a release check fails
- **THEN** the report names the manifest or file, the rule and the expected value

#### Scenario: Publish workflow drift fails

- **WHEN** the publish workflow stops triggering on version tags, loses its OIDC permission, references a long-lived npm token or targets anything other than the public facade
- **THEN** the release check exits non-zero and names the workflow and the violated rule

## ADDED Requirements

### Requirement: The public package is named vscode-workbench before the first publish

The public facade SHALL be published as `vscode-workbench`. The facade manifest, distribution declaration, boundary map, consumer documentation, fixtures and publish bootstrap SHALL use that name consistently, while the five internal modules SHALL remain private `@workbench-kit/*` packages.

#### Scenario: Manifest and distribution agree

- **WHEN** the release check reads the facade manifest and `distribution.json`
- **THEN** both name the public package `vscode-workbench` and the distribution check accepts the public surface

#### Scenario: Consumer surfaces use the public name

- **WHEN** the consumer documentation, examples, adoption fixture and packed-consumer checks run
- **THEN** they import `vscode-workbench` subpaths and contain no active reference to the provisional public package name

#### Scenario: Internal modules keep their private names

- **WHEN** the package set is inspected after the rename
- **THEN** the five internal modules remain `@workbench-kit/*`, `private: true` and absent from the published runtime dependency graph

### Requirement: A one-time bootstrap creates the package before trusted publishing

The release process SHALL define a one-time, owner-approved bootstrap that publishes a placeholder version of the final package name under a non-`latest` dist-tag, then configures the npm trusted publisher for this repository's publish workflow. The bootstrap SHALL NOT create or store a long-lived npm token.

#### Scenario: Placeholder establishes the package

- **WHEN** the owner runs the bootstrap for the approved package name
- **THEN** npm contains `vscode-workbench@0.0.0-bootstrap.0` published under the `bootstrap` dist-tag and no version on `latest`

#### Scenario: Unavailable scope blocks the bootstrap

- **WHEN** the approved npm scope does not exist or the signed-in account cannot publish to it
- **THEN** the bootstrap is deferred, npm returns no created version, and the owner creates or joins the organization or changes the approved package name before retrying

#### Scenario: Trust is bound to this repository

- **WHEN** the owner configures the trusted publisher
- **THEN** npm records the GitHub repository and the exact publish workflow filename, and no `NPM_TOKEN` or other publish secret is added to the repository

#### Scenario: Bootstrap placeholder is retired

- **WHEN** the first automated release is verified
- **THEN** the placeholder version is deprecated with a pointer to the current release, and the `bootstrap` dist-tag no longer selects a version consumers should install

### Requirement: Version tags publish the facade automatically

A push of a `v<version>` tag SHALL run the publish workflow, verify the repository, rebuild the facade and publish only the public facade with public access after every required check passes. The workflow SHALL fail before publishing when the tag does not equal `v<facade version>`.

#### Scenario: Matching tag publishes

- **WHEN** a maintainer pushes `v0.1.0` and the facade declares `0.1.0`
- **THEN** verification passes and the registry receives the facade's `0.1.0` tarball

#### Scenario: Mismatched tag blocks publishing

- **WHEN** a maintainer pushes a tag whose version differs from the facade manifest
- **THEN** the workflow exits non-zero before publishing and reports both versions

#### Scenario: Failed verification blocks publishing

- **WHEN** the standard verification command fails on the tagged commit
- **THEN** the workflow stops and no version is published

#### Scenario: Non-release tags do not publish

- **WHEN** a tag that does not match the `v<version>` convention is pushed
- **THEN** the publish workflow does not publish a version

#### Scenario: Only the facade is published

- **WHEN** the publish workflow completes
- **THEN** the registry contains the facade package and no internal module has been published

### Requirement: Publishing uses OIDC trusted publishing without stored credentials

The publish workflow SHALL authenticate with a short-lived GitHub OIDC token, request only the permissions it needs, and let npm generate a provenance attestation. It SHALL NOT read a long-lived npm token from repository secrets or an `.npmrc` auth entry.

#### Scenario: OIDC permission is present

- **WHEN** the publish job runs
- **THEN** the workflow grants `id-token: write` and `contents: read`, and npm publishes without a token secret

#### Scenario: Missing OIDC permission fails

- **WHEN** `id-token: write` is removed from the publish workflow
- **THEN** npm authentication fails and the release check reports the missing permission

#### Scenario: Published version has provenance

- **WHEN** the automated release completes
- **THEN** the registry exposes a provenance attestation for the published version

#### Scenario: Long-lived credentials are rejected

- **WHEN** the publish workflow references `NPM_TOKEN` or writes an auth token to `.npmrc`
- **THEN** the release check exits non-zero before a release can be published
