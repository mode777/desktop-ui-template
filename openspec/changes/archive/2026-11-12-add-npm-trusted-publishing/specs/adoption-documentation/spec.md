# Spec Delta

## MODIFIED Requirements

### Requirement: Documented API names match the packed surface

The API reference SHALL name only exports and subpaths declared by the public package, and every public value export SHALL appear in the reference.

#### Scenario: Undocumented value export

- **WHEN** a public entry gains a value export that the API reference does not mention
- **THEN** the documentation check fails and names the export and its subpath

#### Scenario: Unknown subpath in documentation

- **WHEN** documentation references a `vscode-workbench` subpath that the export map does not declare
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
- **THEN** it imports from `vscode-workbench` subpaths and does not instruct the reader to install or import a private workspace module
