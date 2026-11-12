# style-entries Specification

## Purpose

Makes the kit's stylesheet surface adoptable at the same granularity as its
components, so consumers load only the visual rules for the regions they render
while the aggregate entry remains available for full compositions.

## Requirements

### Requirement: Reusable components have individual stylesheet entries

The styles package SHALL expose one stylesheet entry per reusable workbench
component or region in addition to the token, base and aggregate entries, and
each component entry SHALL contain only the rules owned by that component or
region.

#### Scenario: Component entry loads only its rules

- **WHEN** a consumer imports a declared component stylesheet entry
- **THEN** only that component's rules are loaded and rules for unrelated
  components are not

#### Scenario: Component rules are owned by one entry

- **WHEN** the component stylesheets are inspected
- **THEN** each component's structural selectors appear in its own entry and not
  in another component's entry

#### Scenario: Token and base styles remain explicit imports

- **WHEN** a consumer imports a component entry without importing the token and
  base entries
- **THEN** the component entry does not silently load them, and the
  documentation names them as prerequisites

### Requirement: The aggregate stylesheet stays complete and ordered

The `workbench.css` aggregate SHALL import every component stylesheet exactly
once in a documented order, and the root aggregate SHALL load tokens, base
styles and the component aggregate in that order.

#### Scenario: New component is added to the aggregate

- **WHEN** a component stylesheet is added or removed
- **THEN** the aggregate import list changes with it and the style check fails
  when the two disagree

#### Scenario: Aggregate loads every component once

- **WHEN** the aggregate is imported
- **THEN** every component stylesheet is loaded exactly once and in the
  documented order

#### Scenario: Existing aggregate imports keep working

- **WHEN** a consumer keeps importing `workbench.css`, `index.css` or the
  package root
- **THEN** the same complete stylesheet loads as before

### Requirement: The public facade forwards every component entry

The public package SHALL expose each component stylesheet under its `styles/`
subpath, and a packed installation SHALL contain the file for every declared
style entry.

#### Scenario: Public style subpath resolves from the tarball

- **WHEN** a consumer imports a declared
  `@workbench-kit/workbench/styles/<component>.css` entry from an installed
  tarball
- **THEN** the stylesheet resolves and loads

#### Scenario: Missing style target fails the build

- **WHEN** a declared style export has no corresponding built file
- **THEN** the facade build or packed-tarball check exits non-zero and names the
  missing target

#### Scenario: Internal and public entries agree

- **WHEN** the styles package and the public facade manifests are compared
- **THEN** every component entry appears in both, and the style check fails when
  one is missing

### Requirement: The style surface is verified

The project SHALL provide a style check that validates component entry
declarations, aggregate completeness and order, facade forwarding and the
absence of demo view selectors, and SHALL run it as part of the standard
verification command.

#### Scenario: Out-of-sync declaration fails

- **WHEN** a component stylesheet is undeclared, duplicated in the aggregate or
  missing from the public facade
- **THEN** the check exits non-zero and names the stylesheet and the failing
  declaration

#### Scenario: Demo selector fails

- **WHEN** the kit CSS contains a demo view selector
- **THEN** the check exits non-zero and names the selector and file

#### Scenario: Standard verification includes the style check

- **WHEN** a developer runs the standard verification command
- **THEN** the style check runs and its failure fails verification

#### Scenario: Completed tree passes

- **WHEN** the style check runs on the completed change
- **THEN** it reports zero violations
