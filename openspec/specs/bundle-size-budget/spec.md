# bundle-size-budget Specification

## Purpose

Makes the shipped weight of the workbench a measured, reviewable and gated quantity instead of a claim, so every later extraction phase can prove it did not grow the bundle.

## Requirements

### Requirement: Reproducible bundle measurement

The project SHALL provide a command that measures a production build output and reports raw and gzip byte totals for JavaScript and CSS separately, together with the number and size of each emitted asset, and SHALL support measuring more than one build target with its own output directory and build command.

#### Scenario: Measuring the current build

- **WHEN** a developer runs the size command in a clean checkout
- **THEN** the command produces the production build and prints a table listing every emitted JavaScript and CSS asset with raw bytes, gzip bytes and totals per kind

#### Scenario: Repeated runs agree

- **WHEN** the size command runs twice against the same production build on the same machine
- **THEN** both reports contain identical byte totals

#### Scenario: Measurement covers only shipped assets

- **WHEN** the build emits fonts, images or HTML alongside scripts and styles
- **THEN** the reported JavaScript and CSS totals exclude those assets and the report states that they are tracked separately

#### Scenario: Measuring a second target

- **WHEN** the size command runs for the minimal example
- **THEN** it builds or reuses only that target's output directory and measures only that target's assets, leaving the full preset build and report untouched

#### Scenario: Reusing a build per target

- **WHEN** the size command is asked not to build a specific target
- **THEN** it reads that target's existing output directory and fails clearly if that output is missing

### Requirement: Machine-readable report

The size command SHALL write its results to a machine-readable report file, so values can be diffed, compared across branches and consumed by CI without scraping console output, and each measured build target SHALL have its own report file.

#### Scenario: Report file contents

- **WHEN** the size command completes successfully
- **THEN** a report file exists containing, at minimum, the build timestamp, the measured build target, per-asset raw and gzip sizes, and the totals for JavaScript and CSS

#### Scenario: Report is not committed

- **WHEN** a developer runs the size command
- **THEN** the generated report is ignored by version control and does not appear as a working-tree change

#### Scenario: Reports do not overwrite each other

- **WHEN** both the full preset and the minimal example are measured in the same checkout
- **THEN** each writes its own report file and neither report replaces the other

### Requirement: Committed baseline with tolerance

The project SHALL record a size baseline in a committed budget file for each measured build target that names the build it applies to and carries an explicit tolerance, and the full preset baseline SHALL continue to reflect the template application as shipped.

#### Scenario: Baseline is reviewable

- **WHEN** someone opens a budget file in a pull request
- **THEN** the file states the target it applies to, the recorded JavaScript and CSS sizes in raw and gzip bytes and the tolerance applied to each

#### Scenario: Environment drift does not fail the gate

- **WHEN** the same commit is measured on a machine whose compression library produces sizes that differ by a few bytes from the recorded baseline
- **THEN** the gate still passes as long as the difference stays within the recorded tolerance

#### Scenario: Minimal baseline is recorded, not guessed

- **WHEN** the minimal example is added
- **THEN** its budget file records the totals of its first measured production build and identifies that build as the baseline

#### Scenario: Baseline files are independent

- **WHEN** the minimal example's budget is updated
- **THEN** the full preset's recorded totals and tolerance remain unchanged

### Requirement: Growth gate on JavaScript

The size command SHALL exit with a non-zero status when a measured target's gzipped JavaScript exceeds that target's recorded baseline plus tolerance, and SHALL report which asset contributed the growth when the exceeded size is attributable to a single asset.

#### Scenario: Regression fails the check

- **WHEN** gzipped JavaScript grows beyond the baseline plus tolerance
- **THEN** the command exits non-zero, prints the budget, the measured value and the overage, and the failure is visible without reading the report file

#### Scenario: Within-budget build passes

- **WHEN** gzipped JavaScript stays at or below the baseline plus tolerance
- **THEN** the command exits successfully and reports the remaining headroom

#### Scenario: CSS growth is advisory in this phase

- **WHEN** gzipped CSS exceeds its recorded baseline plus tolerance while JavaScript stays within budget
- **THEN** the command reports the CSS overage as a warning and exits successfully

#### Scenario: Minimal growth blocks verification

- **WHEN** the minimal example's gzipped JavaScript exceeds its recorded baseline plus tolerance
- **THEN** its size command exits non-zero and the standard verification command fails

#### Scenario: Targets are judged against their own baselines

- **WHEN** both targets are measured
- **THEN** each is compared only with its own budget file and a pass or failure for one target does not change the other's verdict

### Requirement: CI reports bundle size on every change

The continuous integration workflow SHALL run the size command for every measured build target on pushes and pull requests, publish each target's size table in the workflow run summary, and retain each machine-readable report as a downloadable artifact.

#### Scenario: Size visible on a pull request

- **WHEN** a pull request runs the workflow
- **THEN** its run summary shows each target's measured JavaScript and CSS sizes next to that target's recorded baseline, and the report files are available as artifacts

#### Scenario: Size failure blocks the workflow

- **WHEN** any target's size command exits non-zero in CI
- **THEN** the workflow job fails and the pull request cannot be merged as green

#### Scenario: Minimal report is attributable

- **WHEN** the workflow reports the minimal example's size
- **THEN** the summary identifies it as the minimal target and states its gzipped JavaScript saving against the full preset baseline

### Requirement: Documented measurement

The project documentation SHALL describe how to run the size command for each build target, what each target measures, where each baseline lives and how a baseline is intentionally updated.

#### Scenario: Updating the baseline deliberately

- **WHEN** a change legitimately increases a target's bundle and the author follows the documented procedure
- **THEN** the procedure results in that target's budget file change being reviewed like any other code change, rather than a silently widened budget

#### Scenario: Target-specific commands

- **WHEN** a developer wants to measure only the minimal example or only the full preset
- **THEN** the documentation names the command, output directory, budget file and report for that target

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
