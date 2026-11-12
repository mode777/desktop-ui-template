# Spec Delta

## ADDED Requirements

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
