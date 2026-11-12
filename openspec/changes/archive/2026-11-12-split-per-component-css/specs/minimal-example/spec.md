# Spec Delta

## ADDED Requirements

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
