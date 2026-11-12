# custom-shell-example Specification

## Purpose

Defines a runnable composition-level application that builds a complete
workbench from kit primitives and consumer-owned regions, so the shell,
resizing, tab and element-registration contracts are proven without the preset
and before the package is documented for external adoption.

## Requirements

### Requirement: A composition-level example application exists

The project SHALL ship a third runnable application under `apps/custom-shell`
that composes a complete workbench from kit primitives and consumer-owned
region chrome without the preset, and SHALL build it as a separate application
entry and output.

#### Scenario: Full workbench is visible

- **WHEN** the custom-shell example is started or its production build is opened
- **THEN** a title bar, activity bar, primary sidebar, editor area with tabs, bottom panel and status bar are visible

#### Scenario: Optional regions are available

- **WHEN** the example enables its secondary sidebar or toggles the bottom panel
- **THEN** those regions appear through the shell's corresponding slots

#### Scenario: Separate build target

- **WHEN** the custom-shell example is built
- **THEN** it emits its own HTML entry and `apps/custom-shell/dist/` output without overwriting or reusing the template or minimal build directories

### Requirement: The example composes primitives instead of the preset

The custom-shell example SHALL import only the kit's headless helpers,
controlled React primitives, per-tag element registrations and shared styles,
and SHALL NOT import the preset package, the template application layer or the
demo layer.

#### Scenario: Composition-level imports

- **WHEN** the example's source imports are inspected
- **THEN** every workbench import resolves to the core, React primitive, element registration or styles layer, and no import resolves to the preset, app or demo layer

#### Scenario: Boundary enforcement

- **WHEN** the example adds an import from the preset, app or demo layer
- **THEN** the dependency-boundary check fails and names the file, line and forbidden target

#### Scenario: Consumer-owned state

- **WHEN** the user changes the active activity item, toggles a region, resizes a pane or edits the tab list
- **THEN** the change is driven by the example's own state and callbacks, with no preset store or command registry involved

#### Scenario: Consumer-owned region chrome

- **WHEN** the example renders its title bar, activity bar, sidebars, panel or status bar
- **THEN** those surfaces are supplied by the example rather than imported from the preset package

### Requirement: Shell regions are consumer-supplied slots

The example SHALL place every rendered region through the shell's title bar,
activity bar, primary sidebar, center content, bottom panel, secondary sidebar,
status bar and overlay slots, and region visibility SHALL be expressed by
omitting a slot rather than by shell-owned state.

#### Scenario: All slots are composed

- **WHEN** every region is enabled
- **THEN** each region appears once in the structure supplied by the shell

#### Scenario: Region toggles

- **WHEN** the user hides the primary sidebar, secondary sidebar or bottom panel
- **THEN** that region disappears and the remaining regions keep their structure, and showing it again restores the consumer's content

#### Scenario: Panel maximize and restore

- **WHEN** the user maximizes the bottom panel
- **THEN** the panel occupies the center area with the editor content hidden, and restoring returns the editor above the panel

### Requirement: Controlled interactions cover the primitive surface

The example SHALL exercise controlled resizing, tab activation, close and
reorder, panel tab selection, region toggles and panel maximize/restore through
local state and callbacks.

#### Scenario: Sidebar and panel resizing

- **WHEN** the user drags a sash, uses its resize keys or double-clicks it
- **THEN** the corresponding region follows the reported size and resets to the example's chosen default

#### Scenario: Tab lifecycle

- **WHEN** the user activates, closes or reorders an editor tab
- **THEN** the example updates its own tab list and active tab, and the next surviving tab is activated when the active tab closes

#### Scenario: Panel tab selection

- **WHEN** the user selects a different bottom panel tab
- **THEN** the example switches the panel content through its own selected-tab state

#### Scenario: Status reflects local state

- **WHEN** the active tab, region visibility, panel maximized state, panel tab or sidebar width changes
- **THEN** the status bar reflects the current consumer-owned values

### Requirement: Element registration is limited to what the example renders

The custom-shell example SHALL register only the custom elements its composition
actually uses and SHALL NOT load the template's aggregate registration module.

#### Scenario: Only rendered tags are registered

- **WHEN** the example's production JavaScript is inspected
- **THEN** the custom elements it imports correspond to the tags present in its rendered markup, and tree, context menu, text field and other unused template registrations are absent

#### Scenario: Missing tag is visible

- **WHEN** the example renders a custom element it did not register
- **THEN** development and production output expose the unregistered tag rather than silently pulling in the aggregate registration module

### Requirement: The production bundle proves preset and demo absence

The project SHALL verify, from the custom-shell production build, that no
preset module, template application module, demo view, demo command or mock
workspace data contributed code to the bundle, and SHALL fail verification with
an actionable report when one does.

#### Scenario: Clean bundle passes

- **WHEN** the custom-shell production build contains only kit core, kit React, element registrations, shared styles, example code, React and the custom elements the example renders
- **THEN** the composition check passes and reports the modules and assets it examined

#### Scenario: Leaked preset or template module fails

- **WHEN** a preset module, template application module or demo module is reachable from the example
- **THEN** the composition check exits non-zero and names the offending module

#### Scenario: Leaked UI content fails

- **WHEN** preset or demo-only content such as a quick-open overlay or the template's product branding appears in the emitted JavaScript
- **THEN** the composition check fails even if the module path is obscured by bundling

### Requirement: The example runs with normal verification

The standard verification command SHALL build the custom-shell example, run its
component tests and run its composition check, and a failure in any of them
SHALL fail verification.

#### Scenario: Standard verification includes the example

- **WHEN** a developer runs the standard verification command from the repository root
- **THEN** lint, formatting, typecheck, boundary check, distribution check, tests, the template build, the minimal build and its check, the custom-shell build and its check, and the packed-tarball check all run

#### Scenario: Component tests cover the example

- **WHEN** the example's tests run
- **THEN** they cover region rendering, consumer-owned state transitions, tab lifecycle, panel switching and resizing behavior

#### Scenario: Existing targets are unaffected

- **WHEN** the custom-shell example is added
- **THEN** the template and minimal builds and their composition checks remain unchanged, the minimal budget is unchanged, and the template's raw JavaScript baseline is updated only for the intentional mock-tree growth while its gzip baseline stays unchanged

### Requirement: Documentation presents the custom-shell adoption level

The project documentation SHALL describe the custom-shell example at the
composition level, including its commands, what it imports, what it
deliberately omits and how it relates to the minimal and preset levels.

#### Scenario: Example README explains the level

- **WHEN** a reader opens the custom-shell README
- **THEN** they can see the shell slots and primitives it composes, the regions it owns, the parts of the preset it does not use and how to run and build it

#### Scenario: Root documentation links the example

- **WHEN** a reader opens the root `README.md` or `docs/architecture.md`
- **THEN** the custom-shell example appears in the application layout, the adoption-level explanation and the current project state

#### Scenario: Roadmap reflects the completed example

- **WHEN** a reader opens `ROADMAP.md`
- **THEN** the custom-shell example is described as the completed Phase 5 deliverable and publishing remains the next phase
