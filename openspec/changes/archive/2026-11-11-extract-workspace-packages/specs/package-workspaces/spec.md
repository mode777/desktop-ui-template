# Spec Delta

## Purpose

Makes the workbench kit consumable as named workspace packages rather than source folders, so the template and future applications depend on explicit public entry points while the repository still installs, builds, tests and verifies as one project.

## ADDED Requirements

### Requirement: One workspace installs and resolves all packages

The repository SHALL define a single npm workspace containing the five kit packages and the root template application, and a clean root install SHALL link every package so its package name resolves from the template, the minimal example and the test runner.

#### Scenario: Fresh install links the workspace

- **WHEN** a developer removes `node_modules` and runs the root install command in a clean checkout
- **THEN** every `@workbench-kit/*` package resolves from the root application without a package-local install

#### Scenario: One lockfile

- **WHEN** the repository is inspected after installation
- **THEN** a single root lockfile records the workspace and no package directory carries its own lockfile or required nested install

#### Scenario: Package names resolve in every runner

- **WHEN** the template, the minimal example or a test imports a declared `@workbench-kit/*` entry point
- **THEN** Vite, Vitest and TypeScript resolve that import to the workspace package rather than to a copied source folder

### Requirement: Five packages expose named public entry points

The workspace SHALL provide `@workbench-kit/core`, `@workbench-kit/react`, `@workbench-kit/elements`, `@workbench-kit/styles-vscode` and `@workbench-kit/preset-vscode`, and consumers SHALL import them by package name rather than by relative path into another package's source tree.

#### Scenario: Root entry point

- **WHEN** a consumer imports the root entry of the core, React, elements or preset package
- **THEN** the package's documented exports are available from that single import

#### Scenario: Subpath entry point

- **WHEN** a consumer imports a declared subpath such as an element registration entry or a stylesheet entry
- **THEN** that subpath resolves to the declared package file

#### Scenario: No cross-package relative imports

- **WHEN** source outside a package imports that package's implementation
- **THEN** the import uses the package name and the boundary check rejects a relative path into the package instead

#### Scenario: Types resolve with the code

- **WHEN** a TypeScript consumer imports a JavaScript package entry point
- **THEN** the matching type declarations resolve from the same package

### Requirement: Package metadata declares consumable boundaries

Each kit package SHALL declare its public `exports` map, shipped files and side-effect metadata, and each JavaScript package SHALL additionally declare its module format, type declarations and peer or runtime dependencies; no package SHALL include application or demo modules in its public surface.

#### Scenario: Metadata covers the public surface

- **WHEN** a package manifest is inspected
- **THEN** it declares every documented root and subpath entry, the files required by those entries, and for JavaScript packages the ESM output and declarations

#### Scenario: Side effects are limited to CSS and registration

- **WHEN** a package's side-effect metadata is inspected
- **THEN** it lists only CSS files and element-registration modules, so React components, helpers and computed state remain tree-shakeable

#### Scenario: Shared dependencies are not duplicated

- **WHEN** a consumer installs the workspace packages
- **THEN** React, React DOM, Zustand and vscode-elements are resolved once through the declared peer or runtime dependencies instead of being vendored into several packages

#### Scenario: No app or demo content ships

- **WHEN** a package's source and shipped files are inspected
- **THEN** they contain no template composition root, demo view, mock workspace data, menu, branding or template configuration

### Requirement: JavaScript packages build independently with declarations

The workspace SHALL provide a package build command that compiles each JavaScript kit package to its own output directory as ESM JavaScript with type declarations, in dependency order, without importing application or demo code.

#### Scenario: Build all JavaScript packages

- **WHEN** a developer runs the package build command
- **THEN** each of the four JavaScript packages produces its declared output and type declarations

#### Scenario: Clean package build

- **WHEN** every JavaScript package output directory is removed and the package build runs again
- **THEN** the build succeeds without a prior application build

#### Scenario: Built output is app-free

- **WHEN** the emitted package JavaScript and declarations are inspected
- **THEN** they reference package dependencies and platform modules only, never the template application or demo layers

### Requirement: The template consumes the kit through public package entry points

The root template application SHALL import the kit, styles and element registrations through `@workbench-kit/*` entry points, SHALL NOT import the former `src/kit`, `src/styles` or `src/types` paths, and SHALL keep its rendered output, shortcuts, persisted session and production build behavior unchanged.

#### Scenario: Package imports only

- **WHEN** the template application, demo layer and entry files are inspected
- **THEN** every workbench, style and element import uses a `@workbench-kit/*` entry point and no relative path reaches into a package's source

#### Scenario: Local development needs no manual package build

- **WHEN** a developer runs the template development server after a clean install without running the package build first
- **THEN** the application starts and resolves workspace source

#### Scenario: Production build is unchanged

- **WHEN** the template production build is measured and opened
- **THEN** the same regions, tabs, menus, overlays, shortcuts and persisted layout appear as before the extraction

### Requirement: The style package exposes token, base and component CSS

The styles package SHALL expose `tokens.css`, `global.css`, `workbench.css` and an aggregate stylesheet entry, and its CSS SHALL contain no selectors for demo views.

#### Scenario: Separate stylesheet imports

- **WHEN** a consumer imports the token, base or component stylesheet entry
- **THEN** only that stylesheet is loaded

#### Scenario: Aggregate stylesheet

- **WHEN** a consumer imports the aggregate stylesheet entry
- **THEN** tokens, base styles and component styles load in that order

#### Scenario: No demo selectors in the package

- **WHEN** the styles package is searched for demo view selectors
- **THEN** no Explorer, Search, Source Control, Run, Extensions, Chat, Problems, Output, Terminal or Welcome selector is present

### Requirement: Existing verification remains the gate

The workspace SHALL keep the existing verification command, tests, template build, minimal build and composition check, and bundle-size commands working from the repository root, without adding a new CI job or changing a recorded budget to pass this extraction.

#### Scenario: Standard verification passes

- **WHEN** a developer runs the standard verification command after a clean install
- **THEN** lint, formatting, typecheck across the workspace, boundary check, tests, template build and minimal build all pass

#### Scenario: Size targets remain

- **WHEN** the bundle-size commands run
- **THEN** the full template and the minimal example are measured against their existing budget files and pass within tolerance

#### Scenario: Existing CI still applies

- **WHEN** the current continuous-integration workflow runs on a pull request
- **THEN** it installs the workspace and runs the same verification and size steps without needing a new job or a package-specific pipeline
