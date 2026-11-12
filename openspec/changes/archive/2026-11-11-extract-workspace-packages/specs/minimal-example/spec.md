# Spec Delta

## MODIFIED Requirements

### Requirement: The example composes primitives instead of the preset

The minimal example SHALL import only the kit's headless helpers, controlled primitives, per-tag element registrations and shared styles, and SHALL NOT import the preset package, the template application layer or the demo layer.

#### Scenario: Composition-level imports

- **WHEN** the example's source imports are inspected
- **THEN** every workbench import resolves to the core, React primitive, element registration or styles layer, and no import resolves to the preset, app or demo layer

#### Scenario: Boundary enforcement

- **WHEN** the example adds an import from the preset, app or demo layer
- **THEN** the dependency-boundary check fails and names the file, line and forbidden target

#### Scenario: Consumer-owned state

- **WHEN** the tab or sidebar state changes in the example
- **THEN** the change is driven by the example's own state and callbacks, with no preset store or command registry involved

### Requirement: The production bundle proves the absence of demo and preset code

The project SHALL verify, from the minimal example's production build, that no demo view, demo command, mock workspace data, template application module or preset module contributed code to the bundle, and SHALL fail verification with an actionable report when one does.

#### Scenario: Clean bundle passes

- **WHEN** the minimal production build contains only kit core, kit React, element registration, shared styles, example code, React and the custom elements the example renders
- **THEN** the composition check passes and reports the modules or markers it examined

#### Scenario: Leaked demo module fails

- **WHEN** a demo module, mock workspace file, preset module or template application module is reachable from the example
- **THEN** the composition check exits non-zero and names the offending module or marker

#### Scenario: Leaked UI content fails

- **WHEN** demo-only content such as an Explorer, Terminal, Chat or command palette surface appears in the emitted JavaScript
- **THEN** the composition check fails even if the module path is obscured by bundling

#### Scenario: Check runs with normal verification

- **WHEN** a developer runs the standard verification command
- **THEN** the minimal build and its composition check run as part of it

## ADDED Requirements

### Requirement: The example consumes the kit through package entry points

The minimal example SHALL import the kit's headless helpers, React primitives, element registrations and styles through public `@workbench-kit/*` entry points, and SHALL NOT import another workspace package's source files by relative path.

#### Scenario: Package imports only

- **WHEN** the minimal example's source imports are inspected
- **THEN** core, React, element and stylesheet imports use package entry points and no import reaches into `packages/*/src` by relative path

#### Scenario: Boundary enforcement catches a relative package import

- **WHEN** the example imports a workspace package through a relative path instead of its package name
- **THEN** the dependency-boundary check fails and names the file, line and forbidden package path

#### Scenario: Registration stays selective after packaging

- **WHEN** the minimal example imports its element registrations from the elements package
- **THEN** only the icon and tab header tags it renders are registered

#### Scenario: Build and budget are unchanged

- **WHEN** the minimal example is built and measured after the extraction
- **THEN** it still emits its separate production output, passes the composition check and stays within its recorded budget
