# Spec Delta

## Purpose

Defines the repository's application workspace layout: every runnable application is a private workspace member under `apps/`, owns its entry, build configuration and output, and is orchestrated by the root workspace without the root itself being an application.

## ADDED Requirements

### Requirement: Applications are workspace members under apps

The workspace SHALL include the template application and the minimal application as private workspace members under `apps/`, alongside the kit packages under `packages/`, and a single root install SHALL resolve the kit packages from both applications.

#### Scenario: Fresh install links the applications

- **WHEN** a developer removes `node_modules` and runs the root install command in a clean checkout
- **THEN** both application manifests are linked as workspace members and their `@workbench-kit/*` imports resolve without a package-local install

#### Scenario: One lockfile remains

- **WHEN** the repository is inspected after installation
- **THEN** the root lockfile records the applications and neither application directory carries its own lockfile

#### Scenario: Applications stay private

- **WHEN** the distribution declaration and workspace manifests are inspected
- **THEN** both applications are marked private and the public facade remains the only publishable package

### Requirement: Each application owns its entry, configuration and output

Each application SHALL own its HTML entry, Vite configuration, TypeScript project and production output under its own `apps/<name>/` directory, and building one application SHALL NOT write into the other application's output directory.

#### Scenario: Template build output

- **WHEN** the template production build runs
- **THEN** it emits `apps/template/dist/` with that application's HTML and assets

#### Scenario: Minimal build output

- **WHEN** the minimal application is built
- **THEN** it emits `apps/minimal/dist/` and leaves `apps/template/dist/` untouched

#### Scenario: Application-local development

- **WHEN** a developer starts either application through its workspace command
- **THEN** Vite serves that application from its own configuration and entry instead of a repository-root entry

#### Scenario: Shared generated static assets

- **WHEN** either application is built
- **THEN** the shared generated Codicon assets are copied into its output without requiring a second committed copy of the generated files

### Requirement: Root commands orchestrate the applications

The root workspace SHALL keep one install and one standard verification command, and its development, build, preview and size commands SHALL delegate to the application workspaces or app-local configurations rather than assuming the repository root is an application.

#### Scenario: Standard verification still applies

- **WHEN** a developer runs the standard verification command from the repository root
- **THEN** lint, formatting, typecheck, boundary check, distribution check, tests, both application builds and the packed-tarball check all run and pass

#### Scenario: Size commands target application output

- **WHEN** the full or minimal size command runs from the repository root
- **THEN** it measures the corresponding `apps/*/dist/` output against that application's existing budget file

#### Scenario: Continuous integration consumes app output

- **WHEN** the CI or Pages workflow runs
- **THEN** it reuses or uploads the build from the application workspace that produced it instead of a root-level build directory

#### Scenario: Root is not an application

- **WHEN** the repository root is inspected
- **THEN** it contains no application HTML entry, application source tree or application Vite entry

### Requirement: Relocation preserves application behavior and budgets

Moving the applications SHALL preserve the template's rendered regions, shortcuts, menus, persisted session and production behavior, and SHALL preserve the minimal application's primitive-only composition, selective element registration and composition check.

#### Scenario: Template behavior is unchanged

- **WHEN** the relocated template is started or its production build is opened
- **THEN** the same regions, tabs, menus, overlays, shortcuts and persisted layout appear as before the move

#### Scenario: Minimal composition is unchanged

- **WHEN** the relocated minimal application is built and its bundle is inspected
- **THEN** it still contains only its own code, kit primitives, element registrations, shared styles and their peer runtimes, with no preset or template code

#### Scenario: Recorded budgets are unchanged

- **WHEN** both applications are measured after the move
- **THEN** each remains within its existing budget file and neither budget file requires a value change

#### Scenario: Old application paths do not remain

- **WHEN** the current source tree, scripts, workflows and documentation are searched for the former root application and `examples/minimal` layouts
- **THEN** no current file or command depends on those paths

### Requirement: Application manifests match application imports

Each application manifest SHALL declare the kit packages and runtime peers that the application imports, and no application SHALL import another application's source files.

#### Scenario: Template manifest covers its imports

- **WHEN** the template application's manifest is inspected
- **THEN** it declares the preset, React or core helpers, element registrations, styles, React, React DOM and vscode-elements that its source imports

#### Scenario: Minimal manifest covers its imports

- **WHEN** the minimal application's manifest is inspected
- **THEN** it declares the React primitives, element registrations, styles, React, React DOM and vscode-elements that its source imports, and does not declare the preset as a dependency

#### Scenario: Cross-application imports fail

- **WHEN** one application imports a source file from the other application
- **THEN** the dependency-boundary check fails and names the importing file, line and target
