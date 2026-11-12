# preset-vscode Specification

## Purpose

Defines the composed VS Code-style workbench preset: a ready-made shell a consumer configures with its own views, commands, menus, files, documents and branding, instead of forking the template application to get a full workbench.

## Requirements

### Requirement: The preset composes the full workbench from consumer input

The preset SHALL render the complete workbench — title bar, activity bar, primary side bar, editor area, bottom panel, secondary side bar, status bar and overlays — and SHALL take every application-specific input from props: region configuration, view registry, menus, command registry, quick-open files, document renderer, file icons, branding and status bar content.

#### Scenario: Full composition

- **WHEN** the consumer supplies a configuration and content for each region
- **THEN** each supplied region appears once in the expected position and no region is invented that the consumer did not configure

#### Scenario: Disabled region

- **WHEN** the configuration disables a region
- **THEN** that region is not rendered and the remaining regions keep their structure and reclaim the space

#### Scenario: Status bar is consumer-owned

- **WHEN** the consumer supplies status bar content
- **THEN** it renders in the status bar position, and when it supplies none no status bar element is rendered

#### Scenario: Runtime visibility

- **WHEN** a region is hidden or shown at runtime through preset commands
- **THEN** only that region is added or removed and the other regions keep their state

### Requirement: The preset contains no demo application content

The preset SHALL NOT import or render the template's demo views, mock workspace data, app menus, app commands, app branding or app configuration, and SHALL ship no built-in Explorer, Chat, Terminal, workspace file, menu label or brand content.

#### Scenario: App-free import graph

- **WHEN** the preset's imports are inspected or the dependency-boundary check runs
- **THEN** it depends only on React, the kit layers, the custom-element package and its own default store

#### Scenario: Used without the template

- **WHEN** a consumer renders the preset with a single view and its own files
- **THEN** the workbench composes and operates without any demo view, mock data, app menu or command registry being loaded

#### Scenario: No demo content in the output

- **WHEN** the preset is rendered by a consumer that supplies none of the template's data
- **THEN** no demo view identifier, mock workspace path or template brand string appears in the rendered markup

### Requirement: Views render from the supplied registry

The preset SHALL render the active view of each region from the registry the consumer supplies, in the order the region configuration declares, and SHALL ignore configured view identifiers that the registry does not define.

#### Scenario: Active view

- **WHEN** the active primary view identifier exists in the supplied registry
- **THEN** the header title, icon and actions come from that definition and its component renders in the view body

#### Scenario: Unknown active identifier

- **WHEN** the active identifier is not in the registry
- **THEN** the first configured identifier present in the registry is shown instead of failing

#### Scenario: Missing definitions are skipped

- **WHEN** the configuration lists a view identifier the registry does not define
- **THEN** the region renders without that view and no error is thrown

#### Scenario: Panel tabs follow configuration

- **WHEN** several panel views are configured
- **THEN** their tabs render in configuration order and selecting a tab shows that view's component

### Requirement: Actions run through the consumer's command registry

The preset SHALL run view actions, menu entries, title bar controls, activity bar commands and editor menu entries through the command registry supplied by the consumer, and SHALL provide a documented default command set for tab and layout operations that the registry composes with app commands.

#### Scenario: Default commands available

- **WHEN** a consumer composes a registry from the preset defaults
- **THEN** toggling regions, switching theme, resetting the layout, opening quick open and creating, saving or closing tabs work without the app defining those commands

#### Scenario: App command dispatch

- **WHEN** a menu entry, view action or activity item references an app command
- **THEN** the registry runs that app command

#### Scenario: Unknown command

- **WHEN** a command identifier is not registered
- **THEN** nothing happens and the runner reports that it did not run

#### Scenario: Command palette contents

- **WHEN** quick open is opened in command mode
- **THEN** it lists the commands of the composed registry, including app commands

### Requirement: Title bar and menus come from the consumer

The preset SHALL render its title bar from the consumer's branding and menu definitions, and SHALL NOT contain menu labels, product names or workspace names of its own.

#### Scenario: Supplied menus

- **WHEN** the consumer supplies menu definitions
- **THEN** the menu bar renders them in order and choosing an entry runs that entry's command identifier

#### Scenario: Supplied branding

- **WHEN** the consumer supplies a brand label or icon
- **THEN** it appears in the title bar and activating it runs the supplied handler

#### Scenario: No branding supplied

- **WHEN** the consumer supplies no branding
- **THEN** no brand control is rendered and the rest of the title bar stays functional

#### Scenario: Title bar layout controls

- **WHEN** a title bar layout control is used
- **THEN** the corresponding region is shown or hidden

### Requirement: Quick open works from supplied files and commands

The preset SHALL list the files the consumer supplies, using the supplied icon resolver and open handler, and SHALL list the registry's commands in command mode, filtering both by the typed query; it SHALL NOT read workspace data itself.

#### Scenario: File search and open

- **WHEN** the consumer supplies files and the user types a query
- **THEN** matching files are listed and choosing one invokes the consumer's open handler with that file's path

#### Scenario: Command search and dispatch

- **WHEN** quick open is in command mode and a query is typed
- **THEN** matching commands are listed and choosing one runs it

#### Scenario: No matches

- **WHEN** the query matches no file or command
- **THEN** an empty state is shown and no action is run

#### Scenario: Keyboard operation

- **WHEN** the user presses the arrow keys, Enter or Escape
- **THEN** the selection moves within the results, the selection is opened, or the dialog closes respectively

### Requirement: The editor area renders the consumer's document

The preset SHALL render the active tab's document through the consumer-supplied renderer, use the consumer's icon resolver for tab and breadcrumb icons, and fall back to a generic file icon when no icon is resolved.

#### Scenario: Active document

- **WHEN** a tab is active
- **THEN** its title, breadcrumb and icons render and the supplied renderer's output appears in the content area

#### Scenario: Tab interaction drives the document

- **WHEN** the user activates, closes or reorders a tab
- **THEN** the preset's tab state updates and the rendered document follows the new active tab

#### Scenario: Empty editor

- **WHEN** no tabs are open
- **THEN** the consumer-supplied empty state renders, or a generic message with a quick-open action that runs through the registry

### Requirement: Layout state and persistence belong to the preset's default store

The preset SHALL own runtime layout state — region visibility, sizes, active views, panel maximization, theme, tabs, notifications and quick-open state — persist the same subset under the existing storage key and version, and treat consumer-supplied initial tabs and startup output as first-run defaults only.

#### Scenario: Previously persisted session

- **WHEN** a session persisted by the template before the preset existed is present
- **THEN** the persisted visibility, sizes, active views, theme and tabs are restored

#### Scenario: First run

- **WHEN** no session is stored and the consumer supplies initial tabs, an active tab or startup output
- **THEN** those supplied values become the initial state

#### Scenario: Closed tabs stay closed

- **WHEN** the user closes every tab and reloads the application
- **THEN** no tabs are restored, because the initial defaults are not re-seeded over a persisted session

#### Scenario: Region size bounds

- **WHEN** the user resizes a region beyond the configured minimum or maximum, or resets it
- **THEN** the size stays within the configured bounds or returns to the configured initial size

### Requirement: Consumers can read and drive the default store

The preset SHALL export its default store accessor, its tab and notification types and its command runner, so consumer views and commands can subscribe to and mutate the same state without importing preset internals.

#### Scenario: App view subscribes to preset state

- **WHEN** a consumer view selects state from the exported store
- **THEN** the view re-renders when that state changes

#### Scenario: App command mutates preset state

- **WHEN** a consumer command runs against the exported store
- **THEN** the preset's rendered regions and tabs reflect the change

#### Scenario: Store is optional at composition level

- **WHEN** a consumer composes the shell and primitives only
- **THEN** no preset store, command registry or persistence is required

### Requirement: The preset keeps the template's visual and interaction contract

The preset SHALL render the same structural class names, DOM nesting and keyboard interactions as the template did before extraction, so the existing stylesheet applies unchanged and the template looks and behaves the same.

#### Scenario: Class contract

- **WHEN** the preset renders
- **THEN** the shell, body, center and region class names match those the stylesheet styles

#### Scenario: Template renders identically

- **WHEN** the template is rendered through the preset
- **THEN** the same regions, tabs, menus, overlays and shortcuts appear, with no body scroll at 1440×900 or at a narrow width

#### Scenario: Shortcuts still fire

- **WHEN** the template installs its keyboard shortcut hook
- **THEN** the region toggles, quick open, save/close and view shortcuts run the same commands as before

### Requirement: The template is a preset consumer

The template application SHALL compose the preset through the same public contract available to any consumer, and SHALL keep its demo views, mock data, menus, commands, configuration, document renderer and branding in the app and demo layers.

#### Scenario: Template composition

- **WHEN** the template renders
- **THEN** it does so with one preset element receiving the app's configuration, view registry, menus, command registry, files, document renderer, icons, branding and status bar

#### Scenario: No region rebuilding in the app

- **WHEN** the app and demo layers are inspected
- **THEN** they do not rebuild shell regions outside of demo view content and do not import preset internals beyond its documented exports

#### Scenario: App-only changes

- **WHEN** a demo view, mock file, menu or brand changes
- **THEN** the change is made in the app or demo layer and no preset code is edited
