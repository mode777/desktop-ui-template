# Spec Delta

## MODIFIED Requirements

### Requirement: One workspace installs and resolves all packages

The repository SHALL define a single npm workspace containing the five private internal kit packages, the public facade package and the root template application, and a clean root install SHALL link every package so each package name and published subpath resolves from the template, the minimal example, the test runner and the pack check.

#### Scenario: Fresh install links the workspace

- **WHEN** a developer removes `node_modules` and runs the root install command in a clean checkout
- **THEN** every `@workbench-kit/*` package resolves from the root application without a package-local install

#### Scenario: One lockfile

- **WHEN** the repository is inspected after installation
- **THEN** a single root lockfile records the workspace and no package directory carries its own lockfile or required nested install

#### Scenario: Package names resolve in every runner

- **WHEN** the template, the minimal example, a test or the pack check imports a declared `@workbench-kit/*` entry point
- **THEN** Vite, Vitest, TypeScript and Node resolve that import to the workspace package rather than to a copied source folder

#### Scenario: Public facade is a workspace member

- **WHEN** the workspace is installed and listed
- **THEN** the public facade package is linked alongside the five private modules, and the root application still depends only on the internal module names it uses

### Requirement: JavaScript packages build independently with declarations

The workspace SHALL provide a package build command that compiles each of the four JavaScript internal modules to its own output directory as ESM JavaScript with type declarations, then generates the public facade from those outputs, in dependency order, without importing application or demo code.

#### Scenario: Build all JavaScript packages

- **WHEN** a developer runs the package build command
- **THEN** each of the four JavaScript internal modules produces its declared output and type declarations, and the facade produces its complete distributable output

#### Scenario: Clean package build

- **WHEN** every JavaScript package output directory, including the facade output, is removed and the package build runs again
- **THEN** the build succeeds without a prior application build

#### Scenario: Built output is app-free

- **WHEN** the emitted package JavaScript and declarations are inspected
- **THEN** they reference package dependencies and platform modules only, never the template application or demo layers

#### Scenario: Facade follows module output

- **WHEN** the facade build runs
- **THEN** it consumes the freshly built internal module output and produces the public subpaths without a separate authored copy of the implementation

### Requirement: Existing verification remains the gate

The workspace SHALL keep the existing verification command, tests, template build, minimal build, composition check and bundle-size commands working from the repository root, and SHALL add the facade build and pack check to the standard verification command without changing a recorded budget to pass this change.

#### Scenario: Standard verification passes

- **WHEN** a developer runs the standard verification command after a clean install
- **THEN** lint, formatting, typecheck across the workspace, boundary check, distribution check, tests, template build, minimal build and pack check all pass

#### Scenario: Pack check fails verification

- **WHEN** the packed facade is missing an entry, leaks private or app content or fails consumer type resolution
- **THEN** the standard verification command fails through the pack-check step

#### Scenario: Size targets remain

- **WHEN** the bundle-size commands run
- **THEN** the full template and the minimal example are measured against their existing budget files and pass within tolerance

#### Scenario: Existing CI still applies

- **WHEN** the current continuous-integration workflow runs on a pull request
- **THEN** it installs the workspace and runs the same verification and size steps without needing a new job or a package-specific pipeline
