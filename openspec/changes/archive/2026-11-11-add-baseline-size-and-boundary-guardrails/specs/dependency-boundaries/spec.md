# Spec Delta

## Purpose

Keeps the workbench layers from eroding during the kit extraction by declaring which source layers may depend on which, and failing verification the moment an import crosses a boundary.

## ADDED Requirements

### Requirement: Declared layer model

The project SHALL define its permitted source dependencies in a single committed declaration that identifies each layer, the modules it contains and the layers it may import.

#### Scenario: Rules are editable without touching the checker

- **WHEN** a maintainer adds or tightens a layer rule
- **THEN** the change is made in the declaration file only and no checker source has to be modified

#### Scenario: Current layers are covered

- **WHEN** the declaration is inspected
- **THEN** it covers the existing application layers — shell layout, views, commands, store, mock data, shared components — and states which of them may import which

### Requirement: Violations are reported with location

The boundary check SHALL examine the import graph of the source tree and, for each forbidden import, report the importing file, the line of the import, the resolved target and the rule that was violated, then exit with a non-zero status.

#### Scenario: Forbidden import fails the check

- **WHEN** a module imports a layer its declared rule forbids
- **THEN** the check exits non-zero and names the file, line, target and rule in its output

#### Scenario: Allowed imports pass

- **WHEN** every import in the source tree satisfies the declared rules
- **THEN** the check exits successfully and reports the number of files and imports examined

#### Scenario: Violation output is actionable without the report

- **WHEN** the check fails
- **THEN** the reported location is precise enough for a developer to open the offending file directly at the offending line

### Requirement: Unresolved imports are failures, not silence

The boundary check SHALL treat an import that cannot be resolved to a file inside the repository as a violation rather than skipping it.

#### Scenario: Typo does not disable a rule

- **WHEN** a relative import points at a path that does not exist
- **THEN** the check fails and reports the unresolved specifier with its file and line

#### Scenario: External packages are distinguished

- **WHEN** a module imports a third-party package or a Node built-in
- **THEN** the check classifies it as external and applies the declared external-dependency rule instead of reporting it as unresolved

### Requirement: Zero tolerated violations

The project SHALL record no allowlist of known boundary violations, so the check passes on the current tree and any new violation fails immediately.

#### Scenario: Current tree is clean

- **WHEN** the boundary check runs on the current source tree
- **THEN** it reports zero violations and no exemption entries exist in the declaration

#### Scenario: Suppression requires a rule change

- **WHEN** a contributor wants to permit an import that the declaration forbids
- **THEN** the only way to make the check pass is to change the declared rule in a reviewable diff

### Requirement: Future kit rules are enforced before the kit exists

The boundary declaration SHALL include the rules that govern the planned kit layers, so the first file created under a kit path is already constrained.

#### Scenario: First kit module is already checked

- **WHEN** a module is created under the kit core layer and imports React or application data
- **THEN** the boundary check fails without any additional configuration

#### Scenario: Empty kit paths do not break the check

- **WHEN** the kit directories do not exist yet
- **THEN** the check still succeeds and applies the rules as soon as those paths appear

### Requirement: Boundary check runs with normal verification

The boundary check SHALL be part of the project's standard verification command and SHALL run on every push and pull request in continuous integration.

#### Scenario: Local verification catches violations

- **WHEN** a developer runs the standard verification command
- **THEN** the boundary check runs as part of it and its failure fails that command

#### Scenario: CI blocks a violating pull request

- **WHEN** a pull request introduces a forbidden import
- **THEN** the continuous integration workflow fails on the boundary step and the violation is visible in the job log
