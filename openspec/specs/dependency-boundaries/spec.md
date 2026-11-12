# dependency-boundaries Specification

## Purpose

Keeps the workbench layers from eroding during the kit extraction by declaring which source layers may depend on which, and failing verification the moment an import crosses a boundary.

## Requirements

### Requirement: Declared layer model

The project SHALL define its permitted source dependencies in a single committed declaration that identifies each layer, the modules it contains, the workspace package names that resolve to it and the layers it may import, and SHALL declare the source roots the declaration applies to, including application code that lives under `apps/`. The declaration SHALL cover every runnable example application, including the custom-shell example.

#### Scenario: Rules are editable without touching the checker

- **WHEN** a maintainer adds or tightens a layer rule
- **THEN** the change is made in the declaration file only and no checker source has to be modified

#### Scenario: Current layers are covered

- **WHEN** the declaration is inspected
- **THEN** it covers the five workspace packages, the template application and demo layers under `apps/template/src`, the minimal application under `apps/minimal/src` and the custom-shell example under `apps/custom-shell/src`

#### Scenario: Package layers are covered

- **WHEN** the declaration is inspected after the workspace extraction
- **THEN** core, React primitives, element registration, styles and the preset each have their own layer with a declared source glob and package name

#### Scenario: Preset internals have a home

- **WHEN** the declaration is inspected after the preset extraction
- **THEN** the preset's generic regions, components, types and default store are covered by the preset layer instead of appearing as application layers

#### Scenario: Minimal example layer is constrained

- **WHEN** the declaration is inspected
- **THEN** it states that the minimal application may import the kit core and kit React layers, React and the custom-element package, and that it may not import the preset, template app or demo layers

#### Scenario: Custom-shell example layer is constrained

- **WHEN** the declaration is inspected
- **THEN** it states that the custom-shell example may import the kit core, kit React, kit elements and kit styles layers plus React and the custom-element package, and that it may not import the preset, template app or demo layers

#### Scenario: Additional source roots are declared

- **WHEN** a maintainer adds another source root such as `tools/`
- **THEN** the declaration names that root and the layers whose include patterns reach it, without changing the checker

#### Scenario: Unclassified code outside the primary root is still checked

- **WHEN** a source file appears under a declared additional root but matches no layer
- **THEN** its imports are evaluated with the declaration's unclassified rule rather than being skipped

### Requirement: Workspace package imports resolve to declared layers

The boundary check SHALL resolve an import of a declared workspace package or one of its subpaths to that package's layer, and SHALL apply the layer's import rules instead of accepting the specifier as an unrestricted external dependency.

#### Scenario: Allowed package import passes

- **WHEN** the demo layer imports a documented preset or React primitive entry point by package name
- **THEN** the check resolves the target package layer, finds the import allowed and reports no violation

#### Scenario: Forbidden package import fails

- **WHEN** the preset package imports the template application or demo layer by package-relative or package-name path
- **THEN** the check exits non-zero and reports the importing file, line, target package and violated rule

#### Scenario: Subpath maps to the package layer

- **WHEN** a module imports an element registration subpath such as `@workbench-kit/elements/icon`
- **THEN** the check treats the import as targeting the elements layer rather than an unknown external package

#### Scenario: Undeclared package stays external

- **WHEN** a module imports a third-party package that is not a declared workspace package
- **THEN** the check classifies it as external and applies the declared external-dependency rule

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

- **WHEN** a file under `apps/minimal/src` imports a module under `apps/template/src`
- **THEN** the check resolves the target to the template application layer and applies that layer's rule instead of treating the import as external

#### Scenario: Cross-application relative imports are rejected

- **WHEN** the minimal application imports a template application module by relative path
- **THEN** the check exits non-zero because the minimal layer may not import the template application layer

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

### Requirement: Preset and demo layers are isolated

The declaration SHALL state that the preset layer may depend on kit layers and its own modules — including its default store — but never on application or demo modules, and that application and demo modules may use the preset only through its documented exports.

#### Scenario: Preset importing a demo module fails

- **WHEN** a preset module imports a demo view, mock data, app menu, app command or app configuration module
- **THEN** the boundary check fails and reports the importing file, line, target and violated rule

#### Scenario: Demo using a preset export passes

- **WHEN** a demo view or demo command imports a documented preset export such as the store accessor or tab types
- **THEN** the boundary check passes

#### Scenario: Store location does not weaken the rule

- **WHEN** the default store lives under the preset layer and imports only its declared externals
- **THEN** the check treats it as a preset module and still rejects any import of application or demo modules from it
