# Spec Delta

## MODIFIED Requirements

### Requirement: Declared layer model

The project SHALL define its permitted source dependencies in a single committed declaration that identifies each layer, the modules it contains and the layers it may import.

#### Scenario: Rules are editable without touching the checker

- **WHEN** a maintainer adds or tightens a layer rule
- **THEN** the change is made in the declaration file only and no checker source has to be modified

#### Scenario: Current layers are covered

- **WHEN** the declaration is inspected
- **THEN** it covers the kit layers — headless core, controlled React primitives and the composed preset — plus the application and demo layers, and states which of them may import which

#### Scenario: Preset internals have a home

- **WHEN** the declaration is inspected after the preset extraction
- **THEN** the preset's generic regions, components, types and default store are covered by the preset layer instead of appearing as application layers

## ADDED Requirements

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
