# Spec Delta

## MODIFIED Requirements

### Requirement: A minimal application exists outside the template

The project SHALL ship a runnable minimal application as a private workspace member at `apps/minimal` that renders one tab, one options sidebar and an optional status bar, using the workbench kit without the VS Code-style preset, and SHALL build it as a separate application entry and `apps/minimal/dist/` output from the full template.

#### Scenario: Example renders its three surfaces

- **WHEN** the minimal application is started or its production build is opened
- **THEN** one tab strip with a single active tab, one resizable options sidebar and an optional status bar are visible

#### Scenario: Workspace application

- **WHEN** the repository is installed from the root
- **THEN** `apps/minimal` is linked as a workspace member and resolves the kit packages it imports without a nested install

#### Scenario: Separate build target

- **WHEN** the minimal application is built
- **THEN** it produces its own HTML entry and assets in `apps/minimal/dist/` without overwriting or reusing the template's `apps/template/dist/`

#### Scenario: No template shell

- **WHEN** the minimal application is inspected
- **THEN** it contains no title bar, activity bar, bottom panel, secondary side bar, quick open, notifications or menu bar that the consumer did not ask for
