# Spec Delta

## Purpose

Makes the shipped weight of the workbench a measured, reviewable and gated quantity instead of a claim, so every later extraction phase can prove it did not grow the bundle.

## ADDED Requirements

### Requirement: Reproducible bundle measurement

The project SHALL provide a command that measures the production build output and reports raw and gzip byte totals for JavaScript and CSS separately, together with the number and size of each emitted asset.

#### Scenario: Measuring the current build

- **WHEN** a developer runs the size command in a clean checkout
- **THEN** the command produces the production build and prints a table listing every emitted JavaScript and CSS asset with raw bytes, gzip bytes and totals per kind

#### Scenario: Repeated runs agree

- **WHEN** the size command runs twice against the same production build on the same machine
- **THEN** both reports contain identical byte totals

#### Scenario: Measurement covers only shipped assets

- **WHEN** the build emits fonts, images or HTML alongside scripts and styles
- **THEN** the reported JavaScript and CSS totals exclude those assets and the report states that they are tracked separately

### Requirement: Machine-readable report

The size command SHALL write its results to a machine-readable report file, so values can be diffed, compared across branches and consumed by CI without scraping console output.

#### Scenario: Report file contents

- **WHEN** the size command completes successfully
- **THEN** a report file exists containing, at minimum, the build timestamp, per-asset raw and gzip sizes, and the totals for JavaScript and CSS

#### Scenario: Report is not committed

- **WHEN** a developer runs the size command
- **THEN** the generated report is ignored by version control and does not appear as a working-tree change

### Requirement: Committed baseline with tolerance

The project SHALL record its size baseline in a committed budget file that names the build it applies to and carries an explicit tolerance, and the recorded baseline SHALL reflect the full preset application as shipped.

#### Scenario: Baseline is reviewable

- **WHEN** someone opens the budget file in a pull request
- **THEN** the file states the recorded JavaScript and CSS sizes in raw and gzip bytes and the tolerance applied to each

#### Scenario: Environment drift does not fail the gate

- **WHEN** the same commit is measured on a machine whose compression library produces sizes that differ by a few bytes from the recorded baseline
- **THEN** the gate still passes as long as the difference stays within the recorded tolerance

### Requirement: Growth gate on JavaScript

The size command SHALL exit with a non-zero status when gzipped JavaScript exceeds its recorded baseline plus tolerance, and SHALL report which asset contributed the growth when the exceeded size is attributable to a single asset.

#### Scenario: Regression fails the check

- **WHEN** gzipped JavaScript grows beyond the baseline plus tolerance
- **THEN** the command exits non-zero, prints the budget, the measured value and the overage, and the failure is visible without reading the report file

#### Scenario: Within-budget build passes

- **WHEN** gzipped JavaScript stays at or below the baseline plus tolerance
- **THEN** the command exits successfully and reports the remaining headroom

#### Scenario: CSS growth is advisory in this phase

- **WHEN** gzipped CSS exceeds its recorded baseline plus tolerance while JavaScript stays within budget
- **THEN** the command reports the CSS overage as a warning and exits successfully

### Requirement: CI reports bundle size on every change

The continuous integration workflow SHALL run the size command for pushes and pull requests, publish the size table in the workflow run summary, and retain the machine-readable report as a downloadable artifact.

#### Scenario: Size visible on a pull request

- **WHEN** a pull request runs the workflow
- **THEN** its run summary shows the measured JavaScript and CSS sizes next to the recorded baseline, and the report file is available as an artifact

#### Scenario: Size failure blocks the workflow

- **WHEN** the size command exits non-zero in CI
- **THEN** the workflow job fails and the pull request cannot be merged as green

### Requirement: Documented measurement

The project documentation SHALL describe how to run the size command, what it measures, where the baseline lives and how a baseline is intentionally updated.

#### Scenario: Updating the baseline deliberately

- **WHEN** a change legitimately increases the bundle and the author follows the documented procedure
- **THEN** the procedure results in a budget file change that is reviewed like any other code change, rather than a silently widened budget
