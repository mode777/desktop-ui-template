# Spec Delta

## ADDED Requirements

### Requirement: Activity bar activation is controlled by the consumer

The activity bar primitive SHALL render the supplied top items in order, mark only the item matching the supplied active id as active, and report an activation request through its callback without changing the active item itself.

#### Scenario: Active item

- **WHEN** the consumer supplies items and an active id that matches one item
- **THEN** that item is marked active and no other item is

#### Scenario: Consumer accepts an activation

- **WHEN** the user activates an item and the consumer updates the active id to the reported value
- **THEN** the newly selected item becomes active

#### Scenario: Consumer ignores an activation

- **WHEN** the user activates an item and the consumer leaves the active id unchanged
- **THEN** the previously active item remains active

#### Scenario: External active change

- **WHEN** the consumer changes the active id while the user is not interacting
- **THEN** the primitive immediately marks the new item as active

#### Scenario: No active item

- **WHEN** the active id is absent or matches no item
- **THEN** no activity item is marked active

### Requirement: Activity bar actions and badges are consumer-supplied

The activity bar primitive SHALL render optional badges on top items and SHALL render bottom actions that report an action request through a separate callback, without deciding what either callback does.

#### Scenario: Badge

- **WHEN** a top item carries a badge value
- **THEN** the badge is rendered with that item and the accessible label still names the item

#### Scenario: Bottom action

- **WHEN** the user activates a bottom action
- **THEN** the action callback receives that action's identity and no top-item activation is reported

#### Scenario: No bottom actions

- **WHEN** the consumer supplies no bottom actions
- **THEN** the bottom action group renders without action controls

### Requirement: Sidebar header and content are consumer-supplied

The sidebar primitive SHALL render an optional header with a title and icon, optional header actions, an optional close control and a content slot, and SHALL NOT resolve views, read a store or decide whether the sidebar is visible.

#### Scenario: Header and actions

- **WHEN** the consumer supplies a title, icon and header actions
- **THEN** the title, icon and actions render in the header in that order

#### Scenario: Action dispatch

- **WHEN** the user activates a header action
- **THEN** the action callback receives that action's identity and the primitive keeps no action state

#### Scenario: Close request

- **WHEN** the consumer supplies a close callback and the user activates the close control
- **THEN** the callback is invoked with a configurable accessible label for the control

#### Scenario: No close callback

- **WHEN** the consumer supplies no close callback
- **THEN** no close control is rendered

#### Scenario: Empty body

- **WHEN** the consumer supplies no title or children
- **THEN** the sidebar renders its body container without inventing header content or an empty-state view

#### Scenario: Secondary region modifier

- **WHEN** the consumer supplies an additional structural class
- **THEN** it is appended to the sidebar classes instead of replacing them, so the same primitive serves primary and secondary regions

### Requirement: Panel tab selection is controlled by the consumer

The panel primitive SHALL render the supplied tabs in order, show the tab matching the supplied active id as selected, and report a selection request without changing the selected tab itself.

#### Scenario: Selection request

- **WHEN** the user selects another panel tab
- **THEN** the selection callback receives that tab's identity and the primitive does not change the active tab

#### Scenario: Consumer accepts a selection

- **WHEN** the consumer updates the active id to the reported tab
- **THEN** that tab becomes selected and its content is shown

#### Scenario: Consumer ignores a selection

- **WHEN** the consumer leaves the active id unchanged after a selection request
- **THEN** the previously selected tab stays selected

#### Scenario: External selection change

- **WHEN** the consumer changes the active id while the user is not interacting
- **THEN** the primitive immediately selects the new tab

#### Scenario: Missing active tab

- **WHEN** the active id matches no supplied tab
- **THEN** every supplied tab still renders and the next user selection is reported by that tab's identity

### Requirement: Panel content and chrome are consumer-supplied

The panel primitive SHALL render each tab's title, optional badge and supplied content, and SHALL expose optional maximize and close requests through callbacks with accessible labels that reflect the maximized state.

#### Scenario: Tab content

- **WHEN** a tab carries content
- **THEN** that content renders in the tab's panel and switching tabs shows the content for the newly selected tab

#### Scenario: Tab badge

- **WHEN** a tab carries a badge value
- **THEN** the badge renders next to that tab's title

#### Scenario: Maximize request

- **WHEN** the consumer supplies a maximize callback and the user activates it
- **THEN** the callback is invoked and the control's label describes maximizing or restoring according to the supplied maximized flag

#### Scenario: Close request

- **WHEN** the consumer supplies a close callback and the user activates it
- **THEN** the callback is invoked and no tab is removed by the primitive

#### Scenario: No panel actions

- **WHEN** the consumer supplies neither maximize nor close callbacks
- **THEN** the panel renders its tabs without those controls

### Requirement: Status bar exposes left and right slots

The status bar primitive SHALL render consumer-supplied left and right content in separate sides of one accessible status region, without generating items of its own.

#### Scenario: Both sides

- **WHEN** the consumer supplies left and right content
- **THEN** both render in their respective sides of the status bar

#### Scenario: One side omitted

- **WHEN** the consumer supplies content for only one side
- **THEN** the other side renders empty and the supplied side keeps its position

#### Scenario: Accessible label

- **WHEN** the primitive renders
- **THEN** it exposes the supplied accessible label, or a default status-bar label when none is supplied

### Requirement: Title bar exposes structural slots

The title bar primitive SHALL render consumer-supplied left, center and right content in the workbench title bar structure, and SHALL NOT contain branding, menu definitions, layout commands, window commands or quick-open behavior.

#### Scenario: Slot placement

- **WHEN** the consumer supplies left, center and right content
- **THEN** each renders in its corresponding part of the title bar and the center area still occupies the space between the sides

#### Scenario: Empty center

- **WHEN** the consumer supplies no center content
- **THEN** the title bar keeps the center spacer so the left and right areas keep their layout

#### Scenario: Double activation

- **WHEN** the user double-activates a non-button part of the title bar and the consumer supplied a double-activation callback
- **THEN** the callback is invoked

#### Scenario: Interactive controls are excluded

- **WHEN** the user double-activates a button inside the title bar
- **THEN** the double-activation callback is not invoked

#### Scenario: Accessible label and modifier

- **WHEN** the consumer supplies an accessible label or an additional class
- **THEN** the label is exposed on the title bar and the class is appended to its structural classes

### Requirement: Menu bar dispatches command identifiers

The menu bar primitive SHALL render the supplied menus in order and report the command identifier of a chosen entry through a callback, without owning a command registry or executing commands itself.

#### Scenario: Menu order

- **WHEN** the consumer supplies several menus
- **THEN** their triggers render in the supplied order

#### Scenario: Entry dispatch

- **WHEN** the user chooses a menu entry with a command identifier
- **THEN** the callback receives that identifier once and the menu closes

#### Scenario: Separator and unlabeled entries

- **WHEN** a menu entry is a separator or has no command identifier
- **THEN** choosing it reports no command

#### Scenario: Overflow entries

- **WHEN** the consumer supplies overflow entries
- **THEN** an overflow trigger renders and its entries dispatch like menu entries

#### Scenario: Escape closes

- **WHEN** a menu is open and the user presses Escape
- **THEN** the menu closes without dispatching a command

### Requirement: Context menu visibility and selection are controlled

The context menu primitive SHALL render the supplied entries in a viewport-positioned portal only while the consumer marks it open, report a chosen entry's value and a close request through callbacks, and SHALL NOT own the open state or execute the selected value.

#### Scenario: Closed menu

- **WHEN** the consumer marks the context menu closed
- **THEN** no context-menu element or portal is rendered

#### Scenario: Open menu

- **WHEN** the consumer marks the context menu open with a position and entries
- **THEN** the entries are supplied to the context-menu element and the portal is placed at the requested viewport position

#### Scenario: Viewport clamping

- **WHEN** the requested position would push the menu past a viewport edge
- **THEN** the portal is shifted inward so it remains visible

#### Scenario: Selection

- **WHEN** the user chooses an entry with a value
- **THEN** the selection callback receives that value and the close callback is invoked

#### Scenario: Missing selection value

- **WHEN** the menu reports a selection without a value
- **THEN** no selection callback is invoked but the close callback still runs

#### Scenario: Outside pointer

- **WHEN** the user presses a pointer outside the menu and outside an ignored selector
- **THEN** the close callback is invoked

#### Scenario: Ignored selector

- **WHEN** the pointer press originates inside the supplied ignore selector
- **THEN** the menu stays open

### Requirement: Region primitives are independent and style-compatible

Every region primitive SHALL compose only from its props, its children, React and React DOM, and SHALL render the structural class names and DOM nesting used by the existing workbench styles so a preset or example can adopt it without visual change.

#### Scenario: App-free import graph

- **WHEN** the primitives' imports are inspected or the dependency-boundary check runs
- **THEN** they depend only on React, React DOM, the headless core layer and their own layer, with no application, preset, store, command or demo import

#### Scenario: Controlled use without the preset

- **WHEN** a consumer renders the region primitives with its own state and callbacks
- **THEN** every interaction is reported to that consumer without a preset store or command registry being present

#### Scenario: Existing styles still match

- **WHEN** a primitive replaces the preset or example markup it was extracted from
- **THEN** the title bar, menu bar, activity bar, sidebar, panel and status bar structural classes and nesting are preserved

#### Scenario: Element registration stays external

- **WHEN** a consumer renders a primitive that uses vscode-elements
- **THEN** the primitive does not register those tags itself and the documented element entries remain the registration point
