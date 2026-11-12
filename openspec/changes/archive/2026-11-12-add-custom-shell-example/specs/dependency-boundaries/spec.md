# Spec Delta

## MODIFIED Requirements

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
