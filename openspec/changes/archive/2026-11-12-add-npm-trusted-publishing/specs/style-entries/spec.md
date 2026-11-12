# Spec Delta

## MODIFIED Requirements

### Requirement: The public facade forwards every component entry

The public package SHALL expose each component stylesheet under its `styles/`
subpath, and a packed installation SHALL contain the file for every declared
style entry.

#### Scenario: Public style subpath resolves from the tarball

- **WHEN** a consumer imports a declared
  `vscode-workbench/styles/<component>.css` entry from an installed
  tarball
- **THEN** the stylesheet resolves and loads

#### Scenario: Missing style target fails the build

- **WHEN** a declared style export has no corresponding built file
- **THEN** the facade build or packed-tarball check exits non-zero and names the
  missing target

#### Scenario: Internal and public entries agree

- **WHEN** the styles package and the public facade manifests are compared
- **THEN** every component entry appears in both, and the style check fails when
  one is missing
