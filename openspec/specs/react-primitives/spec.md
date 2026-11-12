# react-primitives Specification

## Purpose

Provides controlled, app-free React building blocks for composing a workbench — starting with a resizable region that owns resize interaction and accessibility without owning layout configuration, application state or demo views.

## Requirements

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

The primitives SHALL compose only from their props, their children or state and the headless core layer, and SHALL NOT import application views, mock data, commands or workbench state.

#### Scenario: App-free import graph

- **WHEN** the primitive's imports are inspected or the dependency-boundary check runs
- **THEN** it depends only on React, the headless core layer and its own layer

#### Scenario: Used without the template

- **WHEN** a consumer renders the primitive with its own content and state
- **THEN** resizing works without any template store, mock data or command registry being present

#### Scenario: Tab strip used without the template

- **WHEN** a consumer renders a tab strip with its own tabs and callbacks
- **THEN** selection, closing, reordering and keyboard navigation work without any template store, mock data or command registry being present

### Requirement: Styling hooks stay stable

The primitives SHALL render the same structural class names and DOM shape as the template regions they replace, so existing stylesheet rules continue to apply.

#### Scenario: Existing styles still match

- **WHEN** the primitive replaces the template component
- **THEN** the pane, side modifier, maximized and sash class names are unchanged and the template renders identically

#### Scenario: Tab strip styles still match

- **WHEN** the tab strip replaces the inline editor tabs
- **THEN** the tab list, scroll area, tab, active, dragging, drop-target, title and close class names are unchanged and the template renders identically

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

### Requirement: Regions are consumer-supplied slots

The shell SHALL compose the workbench from consumer-supplied nodes for the title bar, activity bar, primary side bar, center content, bottom panel, secondary side bar, status bar and overlays, and SHALL NOT render a region whose slot is absent or null.

#### Scenario: Full composition

- **WHEN** the consumer supplies every region slot
- **THEN** each supplied node appears once in the shell

#### Scenario: Omitted region

- **WHEN** a region slot is absent or null
- **THEN** no element is rendered for that region and the remaining regions keep their structure

#### Scenario: Visibility stays with the consumer

- **WHEN** the consumer adds or removes a region slot between renders
- **THEN** the shell renders exactly the slots it currently receives without keeping visibility state of its own

### Requirement: Region nesting matches the workbench structure

The shell SHALL place the title bar above the body, the activity bar and side bars inside the body around the center area, the center content and bottom panel inside the center area with the panel below the content, and the status bar plus overlays after the body.

#### Scenario: Body regions surround the center

- **WHEN** the activity bar, primary side bar and secondary side bar are supplied
- **THEN** they appear inside the body with the center area between the two side bars

#### Scenario: Center and panel stack

- **WHEN** both center content and a bottom panel are supplied
- **THEN** the content appears above the panel inside the same center area

#### Scenario: Status and overlays follow the body

- **WHEN** a status bar or overlays are supplied
- **THEN** they appear after the body in the root, with overlays last

### Requirement: Panel maximization replaces the center content

The shell SHALL accept a panel-maximized flag and, while it is set, SHALL mark its root as maximized, render the panel in the center area and omit the center content; when the flag is cleared, the center content and panel SHALL return to their normal order.

#### Scenario: Maximized panel

- **WHEN** the panel-maximized flag is set
- **THEN** the root carries the maximized marker, the center content is not rendered and the panel occupies the center area

#### Scenario: Restored panel

- **WHEN** the panel-maximized flag is cleared
- **THEN** the maximized marker is removed and the center content renders above the panel again

#### Scenario: Surrounding regions are unaffected

- **WHEN** the panel is maximized or restored
- **THEN** the title bar, activity bar, side bars, status bar and overlays render as supplied in both states

### Requirement: The shell is independent of the application

The shell SHALL compose only from its props and React, and SHALL NOT import application state, configuration, commands, views, mock data or demo modules.

#### Scenario: App-free import graph

- **WHEN** the shell's imports are inspected or the dependency-boundary check runs
- **THEN** it depends only on React and its own layer

#### Scenario: Used without the template

- **WHEN** a consumer renders the shell with its own regions and content
- **THEN** the layout composes without any template store, configuration, command registry or mock data being present

### Requirement: Shell styling hooks stay stable

The shell SHALL render the same structural class names and element nesting as the workbench root it replaces, and a consumer-supplied class name SHALL be appended to those structural classes rather than replacing them.

#### Scenario: Existing styles still match

- **WHEN** the shell replaces the template's inline root layout
- **THEN** the root, body and center class names are unchanged and the template renders identically

#### Scenario: Custom class is additive

- **WHEN** the consumer supplies an additional class name
- **THEN** it appears alongside the structural class names on the root

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
