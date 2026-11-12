# Spec Delta

## Purpose

Makes the single published workbench package adoptable from its documentation
alone: accurate API reference for every public entry, a migration path from the
template, and a staged eject path from the preset to composition and primitives.

## ADDED Requirements

### Requirement: The API reference covers every public entry point

The project SHALL publish an API reference that documents the preset, composition primitives, headless helpers, per-tag element entries and style entries exposed by the public package, including each entry's required and optional inputs, callbacks and public types.

#### Scenario: Preset reference

- **WHEN** a reader opens the preset section of the API reference
- **THEN** `VSCodeWorkbench`'s props, the `WorkbenchConfig` region shape, the view registry, command registry, menus, branding, document renderer, status bar and initial session inputs are documented with requiredness and defaults

#### Scenario: Composition and primitive reference

- **WHEN** a reader opens the composition section
- **THEN** `WorkbenchShell`, `ResizablePane`, `TabStrip` and `IconButton` are documented with their slots, controlled values, callbacks, keyboard and pointer behavior and public prop types

#### Scenario: Headless helper reference

- **WHEN** a reader opens the core section
- **THEN** every public helper for size clamping, pointer and keyboard resizing, tab collection transitions and versioned persistence is documented with its inputs, return value and error or no-op conditions

#### Scenario: Element and style reference

- **WHEN** a reader opens the element and style sections
- **THEN** every element subpath, its registered tag and its side effect are listed, and every stylesheet entry is listed with the order and scope it serves

### Requirement: Documented API names match the packed surface

The API reference SHALL name only exports and subpaths declared by the public package, and every public value export SHALL appear in the reference.

#### Scenario: Undocumented value export

- **WHEN** a public entry gains a value export that the API reference does not mention
- **THEN** the documentation check fails and names the export and its subpath

#### Scenario: Unknown subpath in documentation

- **WHEN** documentation references a `@workbench-kit/workbench` subpath that the export map does not declare
- **THEN** the documentation check fails and names the file and specifier

#### Scenario: Deep generated path is not advertised

- **WHEN** the API reference mentions the package
- **THEN** it directs readers to declared subpaths rather than generated `dist/` files or private module names

### Requirement: Repository and published imports are clearly separated

The documentation SHALL map each repository-internal module name to its published subpath and SHALL make clear which form consumers install and import.

#### Scenario: Import mapping table

- **WHEN** a reader compares repository usage with consumer usage
- **THEN** a table maps preset, React primitives, core helpers, element entries and styles from the internal package names to the published package subpaths

#### Scenario: Consumer examples use published names

- **WHEN** a code example is presented for an external consumer
- **THEN** it imports from `@workbench-kit/workbench` subpaths and does not instruct the reader to install or import a private workspace module

### Requirement: A migration guide moves the template to the published package

The project SHALL publish a migration guide that takes an existing template copy or in-repository application to the single published package without losing its views, data, commands, branding or persistence behavior.

#### Scenario: Installation and peer requirements

- **WHEN** a team starts the migration
- **THEN** the guide states the one package to install, the React and vscode-elements peer requirements and the supported adoption level for their application

#### Scenario: Import replacement

- **WHEN** the team replaces layout, store, command, element and style imports
- **THEN** the guide maps each template or workspace import to its published subpath and lists the files that own views, data, menus and branding

#### Scenario: Preset state is preserved

- **WHEN** the migrated application uses the preset
- **THEN** the guide explains the preset store's persisted key, which fields survive reloads and what changes if the application previously used its own store

#### Scenario: Breaking differences are explicit

- **WHEN** the published package differs from the copied template in imports, file layout, CSS entry points or element registration
- **THEN** the guide lists the difference and the required action instead of leaving it implicit

### Requirement: An eject guide stages preset, composition and primitives

The project SHALL publish an eject guide that explains when and how to move from the preset to composition and from composition to individual primitives, and SHALL keep every level independently usable.

#### Scenario: Levels describe trade-offs

- **WHEN** a reader compares the three levels
- **THEN** each level states what the consumer gains, what preset behavior they give up, who owns layout and tab state, and which reference application demonstrates it

#### Scenario: Preset to composition

- **WHEN** a reader follows the first ejection step
- **THEN** the guide replaces `VSCodeWorkbench` with shell and region composition, moves state and commands into the application and names the preset surfaces that must be reimplemented or omitted

#### Scenario: Composition to primitives

- **WHEN** a reader follows the final ejection step
- **THEN** the guide keeps only the resizing, tab or element behavior needed inside an existing layout and removes the shell, default regions and command registry

#### Scenario: Persistence after ejecting

- **WHEN** a consumer leaves the preset store
- **THEN** the guide shows how to keep persistence through the headless versioned storage helper or replace it with the consumer's own adapter

### Requirement: Documentation is verified by the standard check

The project SHALL provide a documentation check that validates relative links, documented npm scripts, published specifiers and API export coverage, and SHALL run it as part of the standard verification command.

#### Scenario: Broken documentation fails

- **WHEN** a documentation link points to a missing file, a documented npm script does not exist or a published import is outside the export map
- **THEN** the documentation check exits non-zero and names the file, line and failing target

#### Scenario: Export coverage fails

- **WHEN** a public value export has no mention in the API reference
- **THEN** the documentation check exits non-zero and names the missing export

#### Scenario: Standard verification includes documentation

- **WHEN** a developer runs the standard verification command
- **THEN** the documentation check runs and a failure fails verification before the build and pack steps

### Requirement: A minimal quickstart is buildable from documentation alone

The documentation SHALL include a self-contained minimal quickstart that installs the single package, imports documented entries, registers only the elements it renders and produces a successful production build.

#### Scenario: New consumer follows the quickstart

- **WHEN** a reader creates an empty React application, installs the documented package and peers and follows the quickstart imports and styles
- **THEN** the application builds and renders a workbench region without importing repository source or private modules

#### Scenario: Quickstart remains selective

- **WHEN** the quickstart imports primitives and elements
- **THEN** it uses subpath entries and per-tag registration rather than the preset or the aggregate element entry

### Requirement: Documentation is discoverable from the project entry points

The root README, the package README and the architecture document SHALL link the API reference, migration guide, eject guide and release policy so a reader can find the adoption path without browsing the repository.

#### Scenario: Root entry point

- **WHEN** a reader opens the root README
- **THEN** the documentation section links the API reference, migration guide, eject guide and release policy

#### Scenario: Package entry point

- **WHEN** a reader opens the published package README
- **THEN** it links the same reference material and states the package version and `0.x` stability expectation
