# Spec Delta

## MODIFIED Requirements

### Requirement: Declared layer model

The project SHALL define its permitted source dependencies in a single committed declaration that identifies each layer, the modules it contains and the layers it may import, and SHALL declare the source roots the declaration applies to, including code that lives outside `src/`.

#### Scenario: Rules are editable without touching the checker

- **WHEN** a maintainer adds or tightens a layer rule
- **THEN** the change is made in the declaration file only and no checker source has to be modified

#### Scenario: Current layers are covered

- **WHEN** the declaration is inspected
- **THEN** it covers the kit layers, the template application and demo layers, and the minimal example

#### Scenario: Preset internals have a home

- **WHEN** the declaration is inspected after the preset extraction
- **THEN** the preset's generic regions, components, types and default store are covered by the preset layer instead of appearing as application layers

#### Scenario: Minimal example layer is constrained

- **WHEN** the declaration is inspected
- **THEN** it states that the minimal example may import the kit core and kit React layers, React and the custom-element package, and that it may not import the preset, app or demo layers

#### Scenario: Additional source roots are declared

- **WHEN** a maintainer adds another root such as `examples/`
- **THEN** the declaration names that root and the layers whose include patterns reach it, without changing the checker

#### Scenario: Unclassified code outside the primary root is still checked

- **WHEN** a source file appears under a declared additional root but matches no layer
- **THEN** its imports are evaluated with the declaration's unclassified rule rather than being skipped

### Requirement: Violations are reported with location

The boundary check SHALL examine the import graph of every declared source root and, for each forbidden import, report the importing file, the line of the import, the resolved target and the rule that was violated, then exit with a non-zero status.

#### Scenario: Forbidden import fails the check

- **WHEN** a module imports a layer its declared rule forbids
- **THEN** the check exits non-zero and names the file, line, target and rule in its output

#### Scenario: Allowed imports pass

- **WHEN** every import in every declared source root satisfies the declared rules
- **THEN** the check exits successfully and reports the number of files and imports examined

#### Scenario: Violation output is actionable without the report

- **WHEN** the check fails
- **THEN** the reported location is precise enough for a developer to open the offending file directly at the offending line

#### Scenario: Cross-root relative imports resolve

- **WHEN** a file under `examples/` imports a module under `src/`
- **THEN** the check resolves the target to its actual layer and applies that layer's rule

### Requirement: Unresolved imports are failures, not silence

The boundary check SHALL treat an import that cannot be resolved to a file inside the repository as a violation rather than skipping it, including imports made from any declared additional source root.

#### Scenario: Typo does not disable a rule

- **WHEN** a relative import points at a path that does not exist
- **THEN** the check fails and reports the unresolved specifier with its file and line

#### Scenario: External packages are distinguished

- **WHEN** a module imports a third-party package or a Node built-in
- **THEN** the check classifies it as external and applies the declared external-dependency rule instead of reporting it as unresolved

#### Scenario: Example root cannot hide a broken import

- **WHEN** a file in the minimal example imports a non-existent path
- **THEN** the check reports it as a violation rather than treating the example as out of scope

### Requirement: Zero tolerated violations

The project SHALL record no allowlist of known boundary violations, so the check passes on the current tree and any new violation fails immediately.

#### Scenario: Current tree is clean

- **WHEN** the boundary check runs on the current source roots
- **THEN** it reports zero violations and no exemption entries exist in the declaration

#### Scenario: Suppression requires a rule change

- **WHEN** a contributor wants to permit an import that the declaration forbids
- **THEN** the only way to make the check pass is to change the declared rule in a reviewable diff

#### Scenario: Example violations are not exempt

- **WHEN** the minimal example imports the preset, app or demo layer
- **THEN** the check fails with no allowlist path to silence it
