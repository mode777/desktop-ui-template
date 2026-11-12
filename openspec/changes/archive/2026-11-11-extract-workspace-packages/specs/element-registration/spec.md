# Spec Delta

## Purpose

Makes custom-element registration selective and explicit: consumers import only the vscode-elements their composition renders, the preset registers the tags its own regions use, and the template keeps one aggregate entry for its demo surfaces.

## ADDED Requirements

### Requirement: Element registration is available per tag

The elements package SHALL expose a separate registration entry for each supported vscode-elements tag, plus grouped entries for tag families whose components are used together, and importing one entry SHALL register only that tag or declared family.

#### Scenario: Single tag registration

- **WHEN** a consumer imports the icon entry
- **THEN** `vscode-icon` is registered and unrelated tags such as tree, tabs and textfield remain unregistered

#### Scenario: Tab family registration

- **WHEN** a consumer imports the tabs family entry
- **THEN** the tabs, tab header and tab panel tags are registered together

#### Scenario: Tree family registration

- **WHEN** a consumer imports the tree family entry
- **THEN** the tree and tree item tags are registered together

#### Scenario: Per-tag entry for a family member

- **WHEN** a consumer needs only the tab header tag
- **THEN** it imports the tab header entry without registering the tabs container or tab panel

### Requirement: The package offers an aggregate registration entry

The elements package SHALL expose one aggregate entry that registers every tag the package supports, for applications that render most of the vscode-elements surface.

#### Scenario: Aggregate entry registers every supported tag

- **WHEN** a consumer imports the aggregate entry
- **THEN** every tag listed by the package's public registration entries is registered exactly once

#### Scenario: Aggregate entry respects the package surface

- **WHEN** the aggregate entry is inspected
- **THEN** it imports the package's own registration entries rather than deep-importing arbitrary vscode-elements modules

### Requirement: The preset registers the elements its regions render

The preset package SHALL import the registration entries for the tags its own components render — badge, button, context menu, icon, the tabs family and textfield — so a consumer that renders the preset does not have to register those tags itself.

#### Scenario: Preset-only consumer

- **WHEN** a consumer imports and renders the preset without importing any element registration entry
- **THEN** the preset's title bar, activity bar, side bars, tabs, panel, quick open and notifications render their vscode-elements controls correctly

#### Scenario: Preset does not register app-only tags

- **WHEN** the preset package is imported
- **THEN** tags it does not render, such as tree, tree item, collapsible and textarea, remain unregistered

### Requirement: Remaining element registration belongs to the consumer

The template application SHALL keep an application-level registration entry for the tags its demo views and app components render that the preset does not own, and the minimal example SHALL register only the tags it renders.

#### Scenario: Template aggregate registration

- **WHEN** the template renders the Explorer tree, collapsibles or textareas
- **THEN** the application registration entry has registered those tags in addition to the preset-owned ones

#### Scenario: Minimal example stays selective

- **WHEN** the minimal example's production bundle is inspected
- **THEN** it contains the icon and tab header registrations it renders and no tree, tabs container, context menu or textfield registration

### Requirement: Registration side effects survive production bundling

The elements package SHALL mark its registration modules as side effects, and the preset package SHALL mark the module that imports its registrations, so a production bundler does not remove registrations whose only purpose is the import.

#### Scenario: Import-only registration is preserved

- **WHEN** a production build imports an element registration entry without referencing a value from it
- **THEN** the registration code remains in the emitted JavaScript

#### Scenario: Tree-shaking still works elsewhere

- **WHEN** a consumer imports only core helpers or React primitives
- **THEN** unused element registration modules are absent from the production bundle

### Requirement: Element typings ship with the registration package

The elements package SHALL provide the JSX intrinsic declarations for every tag it supports, so consumers can render the custom elements in TypeScript without maintaining a local ambient declaration file.

#### Scenario: Consumer renders a registered tag

- **WHEN** a TypeScript consumer imports an element entry and renders the matching tag in JSX
- **THEN** the tag and its documented props type-check without a local declaration

#### Scenario: No application-level typings path

- **WHEN** the template and examples are inspected
- **THEN** they do not import or include a declaration file from the former application-level types folder
