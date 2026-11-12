# Spec Delta

## MODIFIED Requirements

### Requirement: Declared layer model

The project SHALL define its permitted source dependencies in a single committed declaration that identifies each layer, the modules it contains, the workspace package names that resolve to it and the layers it may import, and SHALL declare the source roots the declaration applies to, including code that lives outside `src/`.

#### Scenario: Rules are editable without touching the checker

- **WHEN** a maintainer adds or tightens a layer rule
- **THEN** the change is made in the declaration file only and no checker source has to be modified

#### Scenario: Current layers are covered

- **WHEN** the declaration is inspected
- **THEN** it covers the five workspace packages, the template application and demo layers, and the minimal example

#### Scenario: Package layers are covered

- **WHEN** the declaration is inspected after the workspace extraction
- **THEN** core, React primitives, element registration, styles and the preset each have their own layer with a declared source glob and package name

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

## ADDED Requirements

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
