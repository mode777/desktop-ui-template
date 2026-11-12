# Spec Delta

## Purpose

Defines the single installable workbench artifact: one `@workbench-kit/workbench` package that exposes the preset, composition primitives, headless helpers, per-tag element registrations and styles through stable subpath exports, with no runtime dependency on the private workspace modules.

## ADDED Requirements

### Requirement: One public package carries the kit

The project SHALL produce exactly one public package named `@workbench-kit/workbench`, versioned with the five internal modules, and the internal modules SHALL remain private and absent from a consumer's installed dependency graph.

#### Scenario: Public package identity

- **WHEN** the packed manifest is inspected
- **THEN** its name is `@workbench-kit/workbench`, its version matches the internal modules and it is not marked private

#### Scenario: Internal modules stay private

- **WHEN** a consumer installs the tarball
- **THEN** no `@workbench-kit/core`, `@workbench-kit/react`, `@workbench-kit/elements`, `@workbench-kit/styles-vscode` or `@workbench-kit/preset-vscode` package appears as a dependency of the facade

#### Scenario: Single tarball

- **WHEN** the package is packed once
- **THEN** exactly one tarball is produced and it contains the whole public surface

### Requirement: Subpath exports expose every adoption level

The public package SHALL expose the preset at `"."`, composition primitives at `"./react"`, headless helpers at `"./core"`, element registration at `"./elements/<tag>"`, element typings at `"./elements/types"` and styles at `"./styles/*"`, and SHALL NOT require importing the preset to use a lower level.

#### Scenario: Preset entry

- **WHEN** a consumer imports `@workbench-kit/workbench`
- **THEN** the preset component, default store, command registry and public preset types are available

#### Scenario: Composition and primitive entries

- **WHEN** a consumer imports `@workbench-kit/workbench/react` or `@workbench-kit/workbench/core`
- **THEN** the controlled primitives or headless helpers are available without loading the preset, its store or its commands

#### Scenario: Element entries

- **WHEN** a consumer imports `@workbench-kit/workbench/elements/icon` or another declared tag entry
- **THEN** only that tag's registration side effect runs

#### Scenario: Style entries

- **WHEN** a consumer imports `@workbench-kit/workbench/styles/tokens.css`, `global.css`, `workbench.css` or the aggregate stylesheet
- **THEN** exactly that stylesheet content is resolved from the package, and the aggregate entry loads tokens, base and component styles in that order

#### Scenario: Element typings

- **WHEN** a TypeScript consumer imports `@workbench-kit/workbench/elements/types`
- **THEN** the JSX declarations for the registered custom elements are available

#### Scenario: Unknown deep import

- **WHEN** a consumer imports a path outside the declared export map
- **THEN** module resolution rejects it instead of reaching into the package's generated files

### Requirement: The tarball is self-contained and app-free

The tarball SHALL contain every file its export map references, SHALL reference only relative paths, peer packages and its own runtime dependencies, and SHALL NOT contain template, demo, mock-data, branding or private workspace content.

#### Scenario: Export targets exist

- **WHEN** every declared export target is resolved inside the packed tarball
- **THEN** each target exists and no target is a placeholder or missing generated file

#### Scenario: No private package references

- **WHEN** the packed JavaScript and declarations are searched for `@workbench-kit/` specifiers
- **THEN** no runtime or type import points at a private internal package

#### Scenario: No application content

- **WHEN** the tarball is searched for template composition, demo views, mock workspace data, app menus, branding or `src/app`/`src/demo` markers
- **THEN** none is present

#### Scenario: Only distributable files ship

- **WHEN** the tarball file list is inspected
- **THEN** it contains the manifest, the package README and generated `dist/` output only, with no private source, build metadata, declaration maps or nested dependency directories

### Requirement: Declarations and ESM are consumable

Every JavaScript entry SHALL ship matching type declarations, and the packed ESM SHALL use extension-complete relative imports so the subpaths load in a bundler and in a Node ESM consumer.

#### Scenario: Types accompany code

- **WHEN** a TypeScript consumer imports any declared JavaScript subpath
- **THEN** the matching declarations resolve from the same package and the consumer typechecks

#### Scenario: Relative imports complete

- **WHEN** the packed JavaScript or declarations are imported with Node's ESM resolver
- **THEN** every relative import resolves without extension guessing

#### Scenario: Runtime import succeeds

- **WHEN** a consumer with the declared peers and browser globals imports the preset, primitives and core subpaths
- **THEN** the modules evaluate and expose their documented exports

### Requirement: Dependency metadata matches the public surface

The facade SHALL declare React, React DOM and `@vscode-elements/elements` as peer dependencies, SHALL keep its non-peer runtime dependency set explicit, and SHALL declare side effects only for CSS and element-registration modules.

#### Scenario: Shared libraries are peers

- **WHEN** the facade manifest is inspected
- **THEN** React, React DOM and `@vscode-elements/elements` are peers and are not vendored into the tarball

#### Scenario: Runtime dependencies are explicit

- **WHEN** the packed JavaScript imports a non-peer runtime package
- **THEN** that package is declared in the facade's dependencies

#### Scenario: Side effects stay narrow

- **WHEN** the facade's side-effect metadata is inspected
- **THEN** it lists CSS files and element-registration modules only, leaving components, helpers and computed state tree-shakeable

### Requirement: Packed output is verified before release

The project SHALL provide a pack check that builds the facade, packs one tarball, extracts it into a throwaway consumer, resolves every declared subpath, evaluates the JavaScript entries and typechecks consumer imports, and SHALL fail with an actionable report when any step fails.

#### Scenario: Clean tarball passes

- **WHEN** the pack check runs on a complete build
- **THEN** it exits successfully and reports the tarball, the resolved subpaths and the checked consumer imports

#### Scenario: Missing entry fails

- **WHEN** an export target or declaration file is missing from the build
- **THEN** the check exits non-zero and names the missing entry

#### Scenario: Leaked private or app content fails

- **WHEN** the tarball contains a private package reference, app/demo marker or undeclared runtime dependency
- **THEN** the check exits non-zero and names the offending file or specifier

#### Scenario: Broken types fail

- **WHEN** a consumer import cannot resolve its declarations
- **THEN** the check exits non-zero and reports the failing import

#### Scenario: Standard verification includes the pack check

- **WHEN** a developer runs the standard verification command
- **THEN** the facade build and pack check run as part of it

### Requirement: The facade is a distribution artifact

The facade SHALL be generated from the five internal module builds, SHALL contain no authored duplicate of the UI implementation, and SHALL reflect module changes after a rebuild without editing the facade by hand.

#### Scenario: Rebuild reflects module changes

- **WHEN** an internal module changes and the package build runs again
- **THEN** the packed facade exposes the new module output without a facade source edit

#### Scenario: Clean facade build

- **WHEN** the facade output is removed and the package build runs from a clean checkout
- **THEN** the build regenerates the complete tarball contents in dependency order

### Requirement: Documentation separates repository and published imports

The documentation SHALL state which imports are used inside the repository, which are published, and how to build and pack the public package.

#### Scenario: Import mapping

- **WHEN** a reader compares repository and consumer usage
- **THEN** the documentation maps each adoption level from the internal `@workbench-kit/<module>` name to its published `@workbench-kit/workbench` subpath

#### Scenario: Packaging commands

- **WHEN** a reader wants to inspect the artifact
- **THEN** the documentation names the facade build and pack-check commands, the package directory and the generated output directory
