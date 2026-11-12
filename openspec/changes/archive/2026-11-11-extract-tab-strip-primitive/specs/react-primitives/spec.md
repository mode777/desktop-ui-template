# Spec Delta

## Purpose

Provides controlled, app-free React building blocks for composing a workbench. This delta extends the capability with a tab strip that owns tab presentation, selection and reorder interaction while leaving tab state, menus, icons and commands to the consumer.

## ADDED Requirements

### Requirement: Selection is controlled by the consumer

The tab strip SHALL render the tabs supplied through `tabs` and mark the tab supplied through `activeId` as active, and SHALL report a requested selection through `onActivate` instead of changing the active tab itself.

#### Scenario: Consumer accepts a selection

- **WHEN** the user activates a tab and the consumer updates `activeId` to the reported id
- **THEN** that tab becomes the active tab

#### Scenario: Consumer ignores a selection

- **WHEN** the user activates a tab and the consumer leaves `activeId` unchanged
- **THEN** the previously active tab remains active

#### Scenario: External selection change

- **WHEN** the consumer changes `activeId` while the user is not interacting
- **THEN** the strip immediately marks the new tab as active

### Requirement: Tabs render consumer-supplied content

The tab strip SHALL render each tab's title, optional leading icon and optional dirty state, and SHALL hide the close affordance when the tab is marked as not closable.

#### Scenario: Title and icon

- **WHEN** a tab supplies a title and an icon
- **THEN** both appear in the tab, in that visual order after the leading slot

#### Scenario: Dirty tab

- **WHEN** a tab is marked dirty
- **THEN** its close affordance shows the dirty indicator and is labelled as closing the tab with unsaved changes

#### Scenario: Non-closable tab

- **WHEN** a tab is marked as not closable
- **THEN** no close affordance is rendered for it

### Requirement: Closing reports the requested tab

The tab strip SHALL report a close request through `onClose` when the user activates a tab's close affordance or middle-clicks the tab, and SHALL NOT remove the tab itself.

#### Scenario: Close affordance

- **WHEN** the user activates a tab's close affordance
- **THEN** `onClose` receives that tab's id and the tab stays visible until the consumer removes it

#### Scenario: Middle click

- **WHEN** the user middle-clicks a tab
- **THEN** `onClose` receives that tab's id and no activation is reported

#### Scenario: Middle click on a non-closable tab

- **WHEN** the user middle-clicks a tab marked as not closable
- **THEN** no close is reported

### Requirement: Dragging reports a reorder request

The tab strip SHALL report a reorder request through `onReorder` with the dragged tab id and the drop target tab id, and SHALL mark the dragged tab and the current drop target visually while the drag is in progress.

#### Scenario: Drop on another tab

- **WHEN** the user drags a tab and drops it on a different tab
- **THEN** `onReorder` receives the source and target ids once

#### Scenario: Drop on the same tab

- **WHEN** the user drops a dragged tab on itself
- **THEN** no reorder is reported

#### Scenario: Drag state cleanup

- **WHEN** the drag ends or the drop completes
- **THEN** the dragging and drop-target markers are removed

#### Scenario: Consumer ignores a reorder

- **WHEN** the consumer leaves `tabs` unchanged after `onReorder`
- **THEN** the strip renders the original order

### Requirement: Keyboard navigation moves activation and focus

When the tab strip has focus, it SHALL activate and focus the next or previous tab on Left/Right with wrap-around, the first or last tab on Home/End, and SHALL report a close request on Delete/Backspace for the active tab. Unrelated keys SHALL be left untouched.

#### Scenario: Arrow navigation

- **WHEN** Left or Right is pressed while a tab is active
- **THEN** the adjacent tab is activated and receives focus, wrapping at the ends

#### Scenario: Jump to an end

- **WHEN** Home or End is pressed while a tab is active
- **THEN** the first or last tab is activated and receives focus

#### Scenario: Keyboard close

- **WHEN** Delete or Backspace is pressed while a tab is active
- **THEN** `onClose` receives the active tab's id and focus moves to a sensible neighbouring tab

#### Scenario: Unrelated key

- **WHEN** a key other than a navigation or close key is pressed in the strip
- **THEN** no callback is invoked and the event is not consumed by the strip

### Requirement: The strip exposes accessible tab semantics

The tab strip SHALL expose an accessible tab list with a configurable label, mark the active tab as selected, and give every close affordance a label naming the tab it closes.

#### Scenario: Tab list semantics

- **WHEN** the strip is rendered with its label
- **THEN** it exposes a tab list role with that label and marks exactly the active tab as selected

#### Scenario: Close affordance label

- **WHEN** a tab renders a close affordance
- **THEN** the affordance has an accessible name that includes the tab title

### Requirement: Host interactions stay with the consumer

The tab strip SHALL expose optional hooks for tab context menus and double activation and SHALL render a consumer-supplied actions slot alongside the tabs, without deciding what those actions or menus do.

#### Scenario: Context menu hook

- **WHEN** the user opens the context menu on a tab
- **THEN** the hook receives the tab id and the pointer position and the browser's default menu is suppressed

#### Scenario: Double activation hook

- **WHEN** the user double-activates a tab
- **THEN** the hook receives that tab's id

#### Scenario: Actions slot

- **WHEN** the consumer supplies actions
- **THEN** they render in the strip's actions area next to the scrollable tab list

### Requirement: The primitive is independent of the application

The tab strip SHALL compose only from its props, its state and its own layer, and SHALL NOT import application views, mock data, commands or workbench state.

#### Scenario: App-free import graph

- **WHEN** the primitive's imports are inspected or the dependency-boundary check runs
- **THEN** it depends only on React and its own layer

#### Scenario: Used without the template

- **WHEN** a consumer renders the primitive with its own tabs and callbacks
- **THEN** selection, closing, reordering and keyboard navigation work without any template store, mock data or command registry being present

### Requirement: Styling hooks stay stable

The tab strip SHALL render the same structural class names and DOM shape as the editor tabs it replaces, so existing stylesheet rules continue to apply.

#### Scenario: Existing styles still match

- **WHEN** the primitive replaces the inline editor tabs
- **THEN** the tab list, scroll area, tab, active, dragging, drop-target, title and close class names are unchanged and the template renders identically
