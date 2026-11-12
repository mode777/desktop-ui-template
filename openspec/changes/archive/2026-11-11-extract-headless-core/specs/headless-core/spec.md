# Spec Delta

## Purpose

Defines the environment-independent workbench helpers — size math, tab transitions and persistence plumbing — that the shell and its future primitives reuse, with no dependency on React, the DOM or any application data.

## ADDED Requirements

### Requirement: Helpers run outside a browser and outside React

The headless helpers SHALL be usable from a plain Node.js test process with no React renderer, no DOM globals and no application modules loaded.

#### Scenario: Plain Node test environment

- **WHEN** the helpers are imported and exercised in a test environment without `document`, `window`, `localStorage` or a React renderer
- **THEN** every documented operation completes and returns its value without touching those globals

#### Scenario: Forbidden dependency is rejected

- **WHEN** a helper module imports React, the DOM, the application's layout configuration, store, mock data or a third-party package
- **THEN** the dependency-boundary check fails and names the offending file and import

### Requirement: Size values are clamped to caller-supplied bounds

The helpers SHALL constrain any requested size to the inclusive range given by the caller, which supplies the minimum and maximum because the helpers carry no configuration of their own.

#### Scenario: Requested size below the minimum

- **WHEN** a requested size is smaller than the minimum
- **THEN** the result is the minimum

#### Scenario: Requested size above the maximum

- **WHEN** a requested size is larger than the maximum
- **THEN** the result is the maximum

#### Scenario: Requested size inside the range

- **WHEN** a requested size lies within the inclusive range
- **THEN** the result is the requested size unchanged

### Requirement: Pointer dragging produces side-aware sizes

The helpers SHALL translate a pointer displacement into a new region size such that dragging a region's edge away from its content grows it and dragging toward its content shrinks it, for left, right and bottom regions.

#### Scenario: Left side region dragged right

- **WHEN** the pointer moves 40 units to the right while dragging a left-hand region's edge
- **THEN** the proposed size is the drag-start size plus 40

#### Scenario: Right side or bottom region dragged right or down

- **WHEN** the pointer moves 40 units to the right for a right-hand region, or 40 units down for a bottom region
- **THEN** the proposed size is the drag-start size minus 40

#### Scenario: Drag beyond the bounds

- **WHEN** a drag would move the region outside its caller-supplied range
- **THEN** the proposed size is clamped to that range

### Requirement: Keyboard resize matches documented steps

The helpers SHALL map resize keys to sizes using a 10-unit step, a 50-unit step when Shift is held, `Home` for the minimum and `End` for the maximum, with arrow direction following the region side.

#### Scenario: Arrow keys step by 10

- **WHEN** an arrow key is pressed without Shift on a focused sash
- **THEN** the proposed size changes by 10 units in the direction that grows or shrinks the region

#### Scenario: Shift arrows step by 50

- **WHEN** an arrow key is pressed with Shift held
- **THEN** the proposed size changes by 50 units instead of 10

#### Scenario: Home and End jump to the bounds

- **WHEN** `Home` is pressed, or `End` is pressed
- **THEN** the proposed size is the caller-supplied minimum, or the caller-supplied maximum, respectively

#### Scenario: Unrelated key is ignored

- **WHEN** any other key is pressed on the sash
- **THEN** no size is proposed and the key is left for the caller to handle

### Requirement: Opening and activating tabs is idempotent

The tab helpers SHALL add a tab only when no tab with the same id exists, place it at the end of the collection, and make it active; activating an id that is not present SHALL change nothing.

#### Scenario: New tab is appended and activated

- **WHEN** a tab with an unused id is opened
- **THEN** it appears last in the collection and becomes the active tab

#### Scenario: Existing tab is not duplicated

- **WHEN** a tab whose id already exists is opened
- **THEN** the collection keeps a single entry for that id and it becomes the active tab

#### Scenario: Unknown id is not activated

- **WHEN** activation is requested for an id that is not in the collection
- **THEN** the active tab is unchanged

### Requirement: Closing the active tab selects a surviving neighbour

Closing a tab SHALL remove it and, when it was active, activate the nearest surviving tab to its right, falling back to the nearest tab to its left, and no tab when none remain. Closing an inactive tab SHALL keep the current active tab.

#### Scenario: Neighbour to the right is selected

- **WHEN** the active tab is closed and at least one tab existed to its right
- **THEN** the tab that followed it becomes active

#### Scenario: Falling back to the left

- **WHEN** the active last tab is closed
- **THEN** the tab that preceded it becomes active

#### Scenario: Last tab closed

- **WHEN** the only tab is closed
- **THEN** the collection is empty and there is no active tab

#### Scenario: Inactive tab closed

- **WHEN** a tab other than the active one is closed
- **THEN** the active tab is unchanged

#### Scenario: Unknown tab closed

- **WHEN** closing is requested for an id that is not in the collection
- **THEN** the collection and the active tab are unchanged

### Requirement: Bulk closing reports what was closed

Closing other tabs SHALL keep only the requested tab, and closing all tabs SHALL empty the collection; both SHALL report the removed tabs in most-recently-closed-first order.

#### Scenario: Close others keeps the target

- **WHEN** other tabs are closed for a given id
- **THEN** that tab is the only remaining tab, it is active, and every removed tab is reported

#### Scenario: Close all empties the collection

- **WHEN** all tabs are closed
- **THEN** the collection is empty, no tab is active, and every removed tab is reported

#### Scenario: Reopening restores the most recent tab

- **WHEN** a previously closed tab is reopened from the reported history
- **THEN** the most recent entry is appended, becomes active, and is removed from the history

### Requirement: Reordering moves a tab to the target position

Reordering SHALL remove the source tab and insert it at the target tab's index: a tab moved toward the start is placed immediately before the target, a tab moved toward the end immediately after it, and the relative order of all other tabs is preserved. Unknown or identical ids SHALL change nothing.

#### Scenario: Moved toward the start

- **WHEN** the last of three tabs is reordered onto the first
- **THEN** the resulting order is source, first, second

#### Scenario: Moved toward the end

- **WHEN** the first of three tabs is reordered onto the last
- **THEN** the resulting order is second, last, source

#### Scenario: Unknown or identical ids

- **WHEN** either id is absent from the collection, or both ids are equal
- **THEN** the order is unchanged

### Requirement: Tab cycling wraps in both directions

Cycling SHALL move activation to the adjacent tab, wrapping from the last tab to the first when moving forward and from the first to the last when moving backward, and SHALL leave an empty collection unchanged.

#### Scenario: Forward wrap

- **WHEN** the last tab is active and cycling moves forward
- **THEN** the first tab becomes active

#### Scenario: Backward wrap

- **WHEN** the first tab is active and cycling moves backward
- **THEN** the last tab becomes active

#### Scenario: No active tab yet

- **WHEN** cycling is requested while no tab is active
- **THEN** the first tab becomes active when moving forward, and the last when moving backward

#### Scenario: Empty collection

- **WHEN** cycling is requested with no tabs
- **THEN** nothing changes and no error is raised

### Requirement: Persistence is storage-agnostic and versioned

Persistence helpers SHALL read and write a versioned envelope through a caller-supplied storage adapter, so the same logic works with browser storage, memory or a server, and SHALL never depend on a particular storage implementation.

#### Scenario: Round trip through an injected adapter

- **WHEN** state is written and then read back through the same adapter
- **THEN** the returned state equals the written state and the stored envelope records the current schema version

#### Scenario: Adapter failure does not throw

- **WHEN** the adapter throws or returns an unreadable payload
- **THEN** the read returns the caller's fallback state instead of propagating the error

#### Scenario: Stored version differs

- **WHEN** the stored envelope carries a different version than the current one and a migration is supplied
- **THEN** the migration receives the stored version and state and its result is used as the current state

#### Scenario: No migration for an older version

- **WHEN** the stored envelope carries an unknown version and no migration is supplied
- **THEN** the read returns the caller's fallback state rather than partial or unvalidated data

### Requirement: Existing workbench behavior is preserved

Moving logic into the helpers SHALL NOT change any observable application behavior, including persisted state key, persisted schema version, tab transitions, region sizes, resize interaction or rendered output.

#### Scenario: Existing test suite still describes the behavior

- **WHEN** the existing store tests run against the refactored actions
- **THEN** they pass without changes to their expectations

#### Scenario: Persisted state remains readable

- **WHEN** a session started before the refactor has saved workbench state
- **THEN** the refactored application restores theme, visibility flags, region sizes, active views, tabs and closed tabs from that saved state

#### Scenario: Bundle budget still holds

- **WHEN** `npm run size` runs on the production build
- **THEN** the reported JavaScript and CSS sizes stay within the recorded budget and tolerance
