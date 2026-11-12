# Spec Delta

## ADDED Requirements

### Requirement: Workspace package builds are not size targets

The size tooling SHALL continue to measure only the template and minimal application production builds, and SHALL NOT treat kit package output as a shipped application budget.

#### Scenario: Existing application targets remain

- **WHEN** the full and minimal size commands run from the workspace root
- **THEN** they measure the template and minimal application builds respectively and report against their existing budget files

#### Scenario: Package output is excluded

- **WHEN** kit packages produce JavaScript and declaration files in their output directories
- **THEN** those files are not counted in either application's JavaScript or CSS totals

#### Scenario: Neutral extraction passes unchanged

- **WHEN** the extraction is complete and neither application's bundle changed intentionally
- **THEN** both size commands pass without editing `budgets.json` or `budgets.minimal.json`

#### Scenario: A deliberate size change is reviewable

- **WHEN** a later change intentionally grows an application bundle
- **THEN** the documented baseline procedure records the new measured value in the relevant budget file as a reviewed change
