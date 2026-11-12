# Spec Delta

## MODIFIED Requirements

### Requirement: One workspace installs and resolves all packages

The repository SHALL define a single npm workspace containing the five kit packages plus the template and minimal applications, and a clean root install SHALL link every package so its package name resolves from both applications and the test runner.

#### Scenario: Fresh install links the workspace

- **WHEN** a developer removes `node_modules` and runs the root install command in a clean checkout
- **THEN** every `@workbench-kit/*` package resolves from the template and minimal applications without a package-local install

#### Scenario: One lockfile

- **WHEN** the repository is inspected after installation
- **THEN** a single root lockfile records the workspace and no package or application directory carries its own lockfile or required nested install

#### Scenario: Package names resolve in every runner

- **WHEN** the template application, the minimal application or a test imports a declared `@workbench-kit/*` entry point
- **THEN** Vite, Vitest and TypeScript resolve that import to the workspace package rather than to a copied source folder

### Requirement: The template consumes the kit through public package entry points

The template application at `apps/template` SHALL import the kit, styles and element registrations through `@workbench-kit/*` entry points, SHALL NOT import the former `src/kit`, `src/styles` or `src/types` paths, and SHALL keep its rendered output, shortcuts, persisted session and production build behavior unchanged.

#### Scenario: Package imports only

- **WHEN** the template application, demo layer and entry files are inspected
- **THEN** every workbench, style and element import uses a `@workbench-kit/*` entry point and no relative path reaches into a package's source

#### Scenario: Local development needs no manual package build

- **WHEN** a developer runs the template development server after a clean install without running the package build first
- **THEN** the application starts and resolves workspace source

#### Scenario: Production build is unchanged

- **WHEN** the template production build is measured and opened
- **THEN** the same regions, tabs, menus, overlays, shortcuts and persisted layout appear as before the extraction
