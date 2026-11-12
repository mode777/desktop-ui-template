# Spec Delta

## MODIFIED Requirements

### Requirement: Declared layer model

The project SHALL define its permitted source dependencies in a single committed declaration that identifies each layer, the modules it contains, the workspace package names that resolve to it and the layers it may import, and SHALL declare the source roots the declaration applies to, including application code that lives under `apps/`.

#### Scenario: Rules are editable without touching the checker

- **WHEN** a maintainer adds or tightens a layer rule
- **THEN** the change is made in the declaration file only and no checker source has to be modified

#### Scenario: Current layers are covered

- **WHEN** the declaration is inspected
- **THEN** it covers the five workspace packages, the template and demo layers under `apps/template/src`, and the minimal application under `apps/minimal/src`

#### Scenario: Package layers are covered

- **WHEN** the declaration is inspected after the workspace extraction
- **THEN** core, React primitives, element registration, styles and the preset each have their own layer with a declared source glob and package name

#### Scenario: Preset internals have a home

- **WHEN** the declaration is inspected after the preset extraction
- **THEN** the preset's generic regions, components, types and default store are covered by the preset layer instead of appearing as application layers

#### Scenario: Minimal example layer is constrained

- **WHEN** the declaration is inspected
- **THEN** it states that the minimal application may import the kit core and kit React layers, React and the custom-element package, and that it may not import the preset, template app or demo layers

#### Scenario: Additional source roots are declared

- **WHEN** a maintainer adds another source root such as `tools/`
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

- **WHEN** a file under `apps/minimal/src` imports a module under `apps/template/src`
- **THEN** the check resolves the target to the template application layer and applies that layer's rule instead of treating the import as external

#### Scenario: Cross-application relative imports are rejected

- **WHEN** the minimal application imports a template application module by relative path
- **THEN** the check exits non-zero because the minimal layer may not import the template application layer
