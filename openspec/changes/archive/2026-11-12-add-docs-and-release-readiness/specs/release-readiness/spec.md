# Spec Delta

## Purpose

Makes the single workbench package releasable and auditable: one shared version
across the internal modules and facade, a maintained changelog, complete license
and third-party notices, and a verified release checklist that gates publishing.

## ADDED Requirements

### Requirement: The package set shares one release version

The five internal modules and the public facade SHALL declare the same version, and the release check SHALL fail when their versions diverge.

#### Scenario: Versions agree

- **WHEN** the release check inspects the five internal manifests and the facade manifest
- **THEN** every version matches and the check reports the shared version

#### Scenario: Version drift fails

- **WHEN** one internal module or the facade declares a different version
- **THEN** the release check exits non-zero and names the manifest and the expected version

#### Scenario: Internal modules stay private

- **WHEN** the version is bumped for a release
- **THEN** the five internal modules remain `private: true` and only the facade is publishable

### Requirement: A changelog records consumer-visible changes

The project SHALL maintain a changelog that separates unreleased work from shipped versions, lists added, changed, fixed and removed behavior, and marks breaking changes explicitly.

#### Scenario: Initial release entry

- **WHEN** a reader opens the changelog
- **THEN** the first public `0.1.0` release is described with the package name, its adoption levels and the initial public surface

#### Scenario: Breaking change is visible

- **WHEN** a release changes an import path, prop, callback or persisted behavior
- **THEN** the changelog entry marks it as breaking and states the migration action

#### Scenario: Release check verifies the current version

- **WHEN** the package version changes without a matching changelog heading
- **THEN** the release check exits non-zero and names the missing version

### Requirement: License and third-party notices ship with the package

The root project and the public tarball SHALL contain the MIT license, and the tarball SHALL contain a third-party notices file that identifies the distributed dependencies and their licenses, including Codicons attribution.

#### Scenario: Tarball contains license material

- **WHEN** the packed tarball is inspected
- **THEN** `LICENSE` and `THIRD_PARTY_NOTICES.md` are present alongside the manifest, README and generated output

#### Scenario: Notices cover distributed dependencies

- **WHEN** a reader opens the notices file
- **THEN** React, React DOM, Zustand, vscode-elements and Codicons are listed with their license and the role each plays

#### Scenario: Missing license material fails the pack check

- **WHEN** the license or notices file is absent from the tarball
- **THEN** the pack check exits non-zero and names the missing file

### Requirement: npm release metadata is complete

The public facade SHALL declare its license, repository, homepage, issue tracker and public access level, and SHALL not be marked private.

#### Scenario: Publish metadata is present

- **WHEN** the release check reads the facade manifest
- **THEN** license, repository, homepage, bugs and `publishConfig.access` are present and consistent with the repository URL and distribution declaration

#### Scenario: Private flag is rejected

- **WHEN** the facade is marked private or omits the public access level
- **THEN** the release check exits non-zero with an actionable message

### Requirement: A release policy and checklist are documented

The project SHALL document its versioning policy, release steps, verification commands, tag convention, publish command and post-publish checks, and SHALL make the first publish a manual step gated on an approved package name.

#### Scenario: Versioning policy

- **WHEN** a maintainer plans a change
- **THEN** the policy states SemVer behavior for `0.x`, when a minor or patch release is required and that the internal modules share the facade version

#### Scenario: Release checklist

- **WHEN** a maintainer prepares a release
- **THEN** the checklist covers the clean install, standard verification, size reports, changelog and version bump, facade build, packed-tarball check, tag and manual publish

#### Scenario: Publish gate

- **WHEN** the package name is still provisional or the owner has not approved publishing
- **THEN** the documentation states that no registry publish occurs and that CI does not hold publish credentials

#### Scenario: Post-publish verification

- **WHEN** the package is published
- **THEN** the checklist installs the published version in a clean consumer and verifies the documented subpaths before the release is announced

### Requirement: Release checks run in standard verification

The project SHALL provide a release check for version, changelog and manifest metadata and SHALL run it, together with the documentation check and the packed-tarball check, as part of the standard verification command.

#### Scenario: Standard verification includes release checks

- **WHEN** a developer runs the standard verification command
- **THEN** the documentation check, release check and pack check all run and any failure fails verification

#### Scenario: Actionable failure

- **WHEN** a release check fails
- **THEN** the report names the manifest or file, the rule and the expected value

### Requirement: The 0.x release is validated before publishing

The release documentation SHALL require the template, minimal and custom-shell examples to build and pass their composition checks before the first `0.x` publish, and SHALL state the stability expectations for consumers.

#### Scenario: Examples validate the API

- **WHEN** the first release is prepared
- **THEN** the template, minimal and custom-shell builds and the minimal and custom-shell composition checks have passed on the release commit

#### Scenario: Stability expectation

- **WHEN** a consumer reads the release policy
- **THEN** it states that `0.x` minor releases may include breaking changes, patch releases do not, and the browser-only scope of the package
