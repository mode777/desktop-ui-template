# adoption-documentation Specification

## Purpose

Makes the single published workbench package adoptable from its documentation
alone: accurate API reference for every public entry, a migration path from the
template, and a staged eject path from the preset to composition and primitives.

## Requirements

### Requirement: The API reference covers every public entry point

The project SHALL publish an API reference that documents the preset, composition primitives, headless helpers, per-tag element entries and style entries exposed by the public package, including each entry's required and optional inputs, callbacks and public types.

#### Scenario: Preset reference

- **WHEN** a reader opens the preset section of the API reference
- **THEN** `VSCodeWorkbench`'s props, the `WorkbenchConfig` region shape, the view registry, command registry, menus, branding, document renderer, status bar and initial session inputs are documented with requiredness and defaults

#### Scenario: Composition and primitive reference

- **WHEN** a reader opens the composition section
- **THEN** `WorkbenchShell`, `ResizablePane`, `TabStrip` and `IconButton` are documented with their slots, controlled values, callbacks, keyboard and pointer behavior and public prop types

#### Scenario: Headless helper reference

- **WHEN** a reader opens the core section
- **THEN** every public helper for size clamping, pointer and keyboard resizing, tab collection transitions and versioned persistence is documented with its inputs, return value and error or no-op conditions

#### Scenario: Element and style reference

- **WHEN** a reader opens the element and style sections
- **THEN** every element subpath, its registered tag and its side effect are listed, and every stylesheet entry is listed with the order and scope it serves

### Requirement: Documented API names match the packed surface

The API reference SHALL name only exports and subpaths declared by the public package, and every public value export SHALL appear in the reference.

#### Scenario: Undocumented value export

- **WHEN** a public entry gains a value export that the API reference does not mention
- **THEN** the documentation check fails and names the export and its subpath

#### Scenario: Unknown subpath in documentation

- **WHEN** documentation references a `vscode-workbench` subpath that the export map does not declare
- **THEN** the documentation check fails and names the file and specifier

#### Scenario: Deep generated path is not advertised

- **WHEN** the API reference mentions the package
- **THEN** it directs readers to declared subpaths rather than generated `dist/` files or private module names

### Requirement: Repository and published imports are clearly separated

The documentation SHALL map each repository-internal module name to its published subpath and SHALL make clear which form consumers install and import.

#### Scenario: Import mapping table

- **WHEN** a reader compares repository usage with consumer usage
- **THEN** a table maps preset, React primitives, core helpers, element entries and styles from the internal package names to the published package subpaths

#### Scenario: Consumer examples use published names

- **WHEN** a code example is presented for an external consumer
- **THEN** it imports from `vscode-workbench` subpaths and does not instruct the reader to install or import a private workspace module

### Requirement: A migration guide moves the template to the published package

The project SHALL publish a migration guide that takes an existing template copy or in-repository application to the single published package without losing its views, data, commands, branding or persistence behavior.

#### Scenario: Installation and peer requirements

- **WHEN** a team starts the migration
- **THEN** the guide states the one package to install, the React and vscode-elements peer requirements and the supported adoption level for their application

#### Scenario: Import replacement

- **WHEN** the team replaces layout, store, command, element and style imports
- **THEN** the guide maps each template or workspace import to its published subpath and lists the files that own views, data, menus and branding

#### Scenario: Preset state is preserved

- **WHEN** the migrated application uses the preset
- **THEN** the guide explains the preset store's persisted key, which fields survive reloads and what changes if the application previously used its own store

#### Scenario: Breaking differences are explicit

- **WHEN** the published package differs from the copied template in imports, file layout, CSS entry points or element registration
- **THEN** the guide lists the difference and the required action instead of leaving it implicit

### Requirement: An eject guide stages preset, composition and primitives

The project SHALL publish an eject guide that explains when and how to move from the preset to composition and from composition to individual primitives, and SHALL keep every level independently usable.

#### Scenario: Levels describe trade-offs

- **WHEN** a reader compares the three levels
- **THEN** each level states what the consumer gains, what preset behavior they give up, who owns layout and tab state, and which reference application demonstrates it

#### Scenario: Preset to composition

- **WHEN** a reader follows the first ejection step
- **THEN** the guide replaces `VSCodeWorkbench` with shell and region composition, moves state and commands into the application and names the preset surfaces that must be reimplemented or omitted

#### Scenario: Composition to primitives

- **WHEN** a reader follows the final ejection step
- **THEN** the guide keeps only the resizing, tab or element behavior needed inside an existing layout and removes the shell, default regions and command registry

#### Scenario: Persistence after ejecting

- **WHEN** a consumer leaves the preset store
- **THEN** the guide shows how to keep persistence through the headless versioned storage helper or replace it with the consumer's own adapter

### Requirement: Consumer documentation is separate from contributor documentation

The project SHALL maintain physically separate consumer and contributor documentation trees. Consumer documentation SHALL use published package specifiers and public URLs only. Contributor documentation MAY link to consumer documentation, but consumer documentation SHALL NOT link to contributor documentation, repository source paths, private module names or application READMEs.

#### Scenario: Consumer links stay public

- **WHEN** a consumer document contains a link
- **THEN** the link resolves within the consumer documentation tree, to the hosted documentation site, to npm, or to license material, and never to a contributor document or repository source path

#### Scenario: Contributor docs may point to consumer docs

- **WHEN** a contributor document links to adoption material
- **THEN** it may link to the consumer documentation or hosted site without making the consumer docs depend on the contributor tree

#### Scenario: Boundary violation fails verification

- **WHEN** a consumer document links to a contributor document, a repository path or a private module name
- **THEN** the consumer documentation check exits non-zero and names the file and target

### Requirement: Consumer documentation ships in the published package

The public package SHALL include its consumer documentation, app-level agent guide and `llms.txt` in the packed tarball, and SHALL NOT include contributor documentation, repository-only material or private source.

#### Scenario: Packed package is self-contained

- **WHEN** the tarball is packed and inspected
- **THEN** it contains the consumer documentation, `AGENTS.md` and `llms.txt` alongside the manifest, README, license and notices

#### Scenario: Consumer has no repository checkout

- **WHEN** a consumer installs the packed tarball into an empty project with no repository access
- **THEN** the installed package contains the documentation needed to install, configure and build an application

#### Scenario: Contributor documentation does not ship

- **WHEN** the tarball is inspected
- **THEN** it contains no contributor architecture, roadmap, release policy, root `AGENTS.md` or application README

#### Scenario: Missing consumer documentation fails the pack check

- **WHEN** a required consumer document or agent guide is absent from the tarball
- **THEN** the pack check exits non-zero and names the missing file

### Requirement: A hosted documentation site serves consumers

The project SHALL publish a consumer-only documentation site at a stable URL, with rendered pages for humans and raw Markdown for agent ingestion, and SHALL NOT publish contributor documentation.

#### Scenario: Human navigates without repository access

- **WHEN** a consumer opens the hosted documentation site
- **THEN** they can reach the quickstart, concepts, recipes, reference, eject guide and changelog from the landing page without a repository checkout

#### Scenario: Raw Markdown is available

- **WHEN** an agent requests a documentation page as raw Markdown from the hosted site
- **THEN** the site returns the same content as the rendered page without HTML chrome

#### Scenario: Contributor documentation is absent

- **WHEN** the hosted site is searched for architecture, roadmap, release policy or root `AGENTS.md` content
- **THEN** no contributor-only page is published

### Requirement: The package README is the consumer entry point

The package README SHALL be a self-contained npm landing page that states install and availability, shows the shortest working quickstart, names the adoption levels, links to the hosted consumer documentation by absolute URL, explains how to read the documentation offline from the package, and gives coding agents a stable entry point.

#### Scenario: npm reader finds the adoption path

- **WHEN** a reader opens the package README on npm
- **THEN** the install command, quickstart, adoption levels and full documentation link are visible without following a repository-relative link

#### Scenario: Package is not yet published

- **WHEN** the package is not available on the registry
- **THEN** the README states the availability status and the supported local-tarball fallback instead of presenting an install command that cannot succeed

#### Scenario: Agent entry point is explicit

- **WHEN** a coding agent opens the package README
- **THEN** it finds the app-level `AGENTS.md` and `llms.txt` entry points and the verification command

### Requirement: An llms.txt index and agent guide support coding agents

The project SHALL generate a consumer-only `llms.txt` index from the consumer documentation manifest, SHALL publish it at the documentation site root, and SHALL ship it in the package. The index SHALL link to raw Markdown and SHALL include the package version and availability.

#### Scenario: Agent discovers the documentation

- **WHEN** an agent fetches `llms.txt`
- **THEN** it receives a short curated index with absolute links to the consumer quickstart, recipes, reference and agent guide

#### Scenario: Index links resolve

- **WHEN** the documentation checks run
- **THEN** every `llms.txt` link resolves to a consumer page or raw Markdown file and a broken link fails the check

#### Scenario: Index does not leak contributor documentation

- **WHEN** `llms.txt` is inspected
- **THEN** it contains no contributor architecture, roadmap, release policy or repository-only path

#### Scenario: Full text is optional

- **WHEN** an agent needs the whole manual in one request
- **THEN** the site provides an optional `llms-full.txt` generated from the same Markdown, while `llms.txt` remains the primary index

### Requirement: Consumer recipes cover common application tasks

The consumer documentation SHALL include complete, verified recipes for adding a view, adding a command and menu entry, replacing the document surface, theming, persistence and ejecting from the preset. Each recipe SHALL state prerequisites, files, copyable code, a verification step and common failures.

#### Scenario: Agent adds a view

- **WHEN** an agent follows the add-view recipe in an empty application
- **THEN** the new view appears in the configured region and the application builds and typechecks

#### Scenario: Agent adds a command

- **WHEN** an agent follows the add-command recipe
- **THEN** the command is available from the command palette and its menu entry, and the application builds

#### Scenario: Copyable code is complete

- **WHEN** a recipe presents code intended for copying
- **THEN** it contains no placeholder elisions and the documented verification passes

#### Scenario: Recipe verification fails

- **WHEN** a recipe's code or verification step no longer matches the package
- **THEN** the documentation check or the quickstart build fails and names the recipe

### Requirement: A blind-agent acceptance test validates adoption

The project SHALL verify that an agent with only the packed package and its consumer documentation can build a small application. The test SHALL use no repository access and SHALL add at least one view and one command.

#### Scenario: Agent succeeds from the package alone

- **WHEN** a blind agent starts from an empty project with the packed tarball and no repository checkout
- **THEN** it can install the package, build the quickstart, add a view and a command, and pass build and typecheck

#### Scenario: Failure identifies a documentation gap

- **WHEN** the blind agent fails
- **THEN** the failure is recorded as a missing recipe, missing check or ambiguous instruction and becomes a task in the change

### Requirement: Documentation is verified by the standard check

The project SHALL provide documentation checks for the contributor and consumer trees that validate relative links, documented npm scripts, published specifiers, API export coverage, consumer boundary rules and `llms.txt` links, and SHALL run them with the standard verification command.

#### Scenario: Broken documentation fails

- **WHEN** a documentation link points to a missing file, a documented npm script does not exist or a published import is outside the export map
- **THEN** the documentation check exits non-zero and names the file, line and failing target

#### Scenario: Export coverage fails

- **WHEN** a public value export has no mention in the API reference
- **THEN** the documentation check exits non-zero and names the missing export

#### Scenario: Standard verification includes documentation

- **WHEN** a developer runs the standard verification command
- **THEN** the documentation check runs and a failure fails verification before the build and pack steps

#### Scenario: Consumer boundary is checked

- **WHEN** a consumer document links outside the consumer tree or mentions a private module name
- **THEN** the consumer documentation check exits non-zero and names the file and offending target

#### Scenario: Index links are checked

- **WHEN** `llms.txt` links to a page or raw Markdown file that does not exist
- **THEN** the documentation check exits non-zero and names the broken link

#### Scenario: Packed documentation is checked

- **WHEN** the package tarball is inspected
- **THEN** the pack check verifies that consumer documentation and the agent guide are present and contributor documentation is absent

### Requirement: A minimal quickstart is buildable from documentation alone

The consumer documentation SHALL include a self-contained minimal quickstart that installs the single package, imports documented entries, registers only the elements it renders and produces a successful production build. The quickstart SHALL be built in continuous integration and SHALL be available offline from the installed package.

#### Scenario: New consumer follows the quickstart

- **WHEN** a reader creates an empty React application, installs the documented package and peers and follows the quickstart imports and styles
- **THEN** the application builds and renders a workbench region without importing repository source or private modules

#### Scenario: Quickstart remains selective

- **WHEN** the quickstart imports primitives and elements
- **THEN** it uses subpath entries and per-tag registration rather than the preset or the aggregate element entry

#### Scenario: Quickstart builds in continuous integration

- **WHEN** the standard verification runs
- **THEN** it builds the documented quickstart from the consumer documentation and fails when the documented code or import paths no longer compile

#### Scenario: Quickstart works from the installed package

- **WHEN** a consumer follows the quickstart from the documentation shipped inside the package
- **THEN** the same files build without fetching a repository checkout or a contributor document

### Requirement: Documentation is discoverable from the project entry points

Consumer documentation SHALL be discoverable from the package README and the hosted documentation site without a repository checkout. Contributor documentation SHALL remain discoverable from the root README and root `AGENTS.md`, and contributor entry points MAY link to consumer documentation, but consumer entry points SHALL NOT depend on contributor documentation.

#### Scenario: Root entry point

- **WHEN** a reader opens the root README
- **THEN** the documentation section separates consumer links (package README, hosted documentation, `llms.txt`) from contributor links (architecture, release policy, roadmap) and states which audience each serves

#### Scenario: Package entry point

- **WHEN** a reader opens the published package README
- **THEN** it links the hosted consumer documentation by absolute URL, points to the offline `docs/` copy, and states the package version and `0.x` stability expectation

#### Scenario: Consumer entry point

- **WHEN** a consumer opens the package README or the hosted documentation site
- **THEN** the quickstart, API reference, recipes and eject guide are reachable without following a link into the repository's contributor documentation

#### Scenario: Contributor entry point

- **WHEN** a contributor opens the root README or root `AGENTS.md`
- **THEN** the architecture, release policy and contributor workflow are reachable, and any adoption link points one way to the consumer documentation

#### Scenario: No reverse dependency

- **WHEN** a consumer document is inspected
- **THEN** it contains no link to the root README, root `AGENTS.md`, architecture document, roadmap or release policy
