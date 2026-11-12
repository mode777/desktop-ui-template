# minimal-example Specification

## Purpose

Defines the minimal consumer application that proves the workbench kit can be adopted below the preset: one tab and one options sidebar composed from primitives, with the absence of demo and preset code verified from the production build.

## Requirements

### Requirement: A minimal application exists outside the template

The project SHALL ship a runnable minimal application as a private workspace member at `apps/minimal` that renders one tab, one options sidebar and an optional status bar, using the workbench kit without the VS Code-style preset, and SHALL build it as a separate application entry and `apps/minimal/dist/` output from the full template.

#### Scenario: Example renders its three surfaces

- **WHEN** the minimal application is started or its production build is opened
- **THEN** one tab strip with a single active tab, one resizable options sidebar and an optional status bar are visible

#### Scenario: Workspace application

- **WHEN** the repository is installed from the root
- **THEN** `apps/minimal` is linked as a workspace member and resolves the kit packages it imports without a nested install

#### Scenario: Separate build target

- **WHEN** the minimal application is built
- **THEN** it produces its own HTML entry and assets in `apps/minimal/dist/` without overwriting or reusing the template's `apps/template/dist/`

#### Scenario: No template shell

- **WHEN** the minimal application is inspected
- **THEN** it contains no title bar, activity bar, bottom panel, secondary side bar, quick open, notifications or menu bar that the consumer did not ask for

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

### Requirement: Element registration is limited to what the example renders

The minimal example SHALL register only the custom elements its composition actually uses and SHALL NOT load the template's aggregate registration module.

#### Scenario: Only rendered tags are registered

- **WHEN** the example's production JavaScript is inspected
- **THEN** the custom elements it imports correspond to the tags present in its rendered markup, and tree, tabs container, context menu, text field and other unused template registrations are absent

#### Scenario: Missing tag is visible

- **WHEN** the example renders a custom element it did not register
- **THEN** development and production output expose the unregistered tag rather than silently pulling in the aggregate registration module

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

### Requirement: The example has a recorded, enforced budget

The minimal example SHALL have a committed budget baseline recorded from its own measured production build, and its gzipped JavaScript SHALL be gated at that baseline during verification and in continuous integration.

#### Scenario: Baseline is explicit

- **WHEN** the minimal budget file is opened
- **THEN** it names the minimal example build, records its own JavaScript and CSS totals and carries the same tolerance and enforcement model as the full preset budget

#### Scenario: Growth fails

- **WHEN** the example's gzipped JavaScript exceeds its recorded baseline plus tolerance
- **THEN** the size command exits non-zero and the verification fails

#### Scenario: Ratio is reported

- **WHEN** the minimal size command runs
- **THEN** its output or report states the minimal gzipped JavaScript total and its ratio to the full preset baseline, so the saving is attributable

### Requirement: Adoption levels are documented from the example

The project documentation SHALL use the minimal example to explain the preset, composition and primitive adoption levels, including what each level imports and what it leaves out.

#### Scenario: Reader picks a level

- **WHEN** a reader opens the minimal example documentation
- **THEN** they can see which imports produce the example, which imports are deliberately absent and how to move from the example to the full preset

#### Scenario: Root documentation links the example

- **WHEN** a reader opens the root `README.md`
- **THEN** it points to the minimal example and summarizes the measured difference without duplicating the full API documentation

### Requirement: The minimal example loads only the styles it renders

The minimal example SHALL import the token and base styles plus only the
per-component stylesheets for the primitives it renders, and its production CSS
SHALL NOT contain rules owned by regions the example does not render.

#### Scenario: Selective style imports

- **WHEN** the example's stylesheet imports are inspected
- **THEN** they name the token, base, shell, resizable pane, tab strip and status
  bar entries and do not import the aggregate workbench entry

#### Scenario: Unused region rules are absent

- **WHEN** the example's production CSS is inspected
- **THEN** rules for the activity bar, title bar, menu bar, sidebar, editor area,
  panel, quick open, context menu and notifications are absent

#### Scenario: An extra component entry is caught

- **WHEN** the example imports a component stylesheet outside its declared style
  subset
- **THEN** the example's style check exits non-zero and names the extra entry

#### Scenario: The smaller CSS baseline is recorded

- **WHEN** the example is measured after the split
- **THEN** the new CSS total is recorded in its budget file and reported against
  the previous aggregate baseline
