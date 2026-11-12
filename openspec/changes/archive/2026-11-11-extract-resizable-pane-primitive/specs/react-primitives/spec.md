# Spec Delta

## Purpose

Provides controlled, app-free React building blocks for composing a workbench — starting with a resizable region that owns resize interaction and accessibility without owning layout configuration, application state or demo views.

## ADDED Requirements

### Requirement: Committed size is controlled by the consumer

The primitive SHALL display the size supplied through its `size` prop and SHALL report each committed resize request through `onSizeChange` instead of keeping a competing committed size of its own.

#### Scenario: Consumer accepts a resize

- **WHEN** the user commits a resize and the consumer updates the `size` prop to the reported value
- **THEN** the region renders at that new size

#### Scenario: Consumer ignores a resize

- **WHEN** the user commits a resize and the consumer leaves the `size` prop unchanged
- **THEN** the region returns to the size supplied by the prop once the interaction ends

#### Scenario: External size change

- **WHEN** the consumer changes the `size` prop while no interaction is in progress
- **THEN** the region immediately renders at the new size

### Requirement: Pointer dragging previews then commits a clamped size

The primitive SHALL update a live preview while the pointer drags the sash and SHALL report a single committed size, clamped to the supplied bounds, when the drag ends.

#### Scenario: Drag preview

- **WHEN** the pointer moves while dragging the sash
- **THEN** the region follows the pointer before the drag is released and no callback is emitted yet

#### Scenario: Drag commit

- **WHEN** the pointer is released after a drag
- **THEN** `onSizeChange` is called once with the clamped final size

#### Scenario: Drag beyond a bound

- **WHEN** the pointer drags past the minimum or maximum
- **THEN** the preview and the committed size stop at that bound

#### Scenario: Drag lifecycle cleanup

- **WHEN** a drag ends or the primitive unmounts mid-drag
- **THEN** the pointer listeners, the body resize cursor and the body resizing class are removed

### Requirement: Keyboard resizing follows sash orientation

The primitive SHALL resize from the keyboard when the sash has focus: arrow keys step by 10 units (50 with Shift) in the direction that grows or shrinks the region for its side, and Home/End jump to the minimum/maximum.

#### Scenario: Arrow step

- **WHEN** an arrow key that applies to the sash orientation is pressed on the focused sash
- **THEN** the reported size moves by 10 units in the direction appropriate to that side

#### Scenario: Shift accelerates the step

- **WHEN** an arrow key is pressed with Shift held
- **THEN** the reported size moves by 50 units instead of 10

#### Scenario: Jump to a bound

- **WHEN** Home or End is pressed on the focused sash
- **THEN** the reported size becomes the minimum or maximum respectively

#### Scenario: Unhandled key is left alone

- **WHEN** a key that is not a resize key is pressed on the sash
- **THEN** no size is reported and the event is not consumed

### Requirement: The sash is an accessible separator

The primitive SHALL expose its sash as a focusable element with the separator role, an accessible label, the sash orientation and the current, minimum and maximum size values.

#### Scenario: Separator attributes

- **WHEN** the sash is rendered
- **THEN** it is focusable and reports its role, label, orientation, minimum, maximum and rounded current size

#### Scenario: Maximized region

- **WHEN** the region is maximized
- **THEN** it fills the available space and the sash is not rendered

### Requirement: Double activation resets the size

The primitive SHALL request a reset when the sash receives a double click, without deciding the reset value itself.

#### Scenario: Double click on the sash

- **WHEN** the user double-clicks the sash
- **THEN** the reset callback is invoked and the consumer decides the resulting size

### Requirement: The primitive is independent of the application

The primitive SHALL compose only from its props, its children and the headless core helpers, and SHALL NOT import application views, data, commands or state.

#### Scenario: App-free import graph

- **WHEN** the primitive's imports are inspected or the dependency-boundary check runs
- **THEN** it depends only on React, the headless core layer and its own layer

#### Scenario: Used without the template

- **WHEN** a consumer renders the primitive with its own content and state
- **THEN** resizing works without any template store, mock data or command registry being present

### Requirement: Styling hooks stay stable

The primitive SHALL render the same structural class names and DOM shape as the template region it replaces, so existing stylesheet rules continue to apply.

#### Scenario: Existing styles still match

- **WHEN** the primitive replaces the template component
- **THEN** the pane, side modifier, maximized and sash class names are unchanged and the template renders identically
