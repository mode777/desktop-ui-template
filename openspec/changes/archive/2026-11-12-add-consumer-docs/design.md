# Design

## Context

See [`proposal.md`](./proposal.md) for motivation and [`specs/adoption-documentation/spec.md`](./specs/adoption-documentation/spec.md) for the behavior contract.

The current repository has one documentation tree rooted at `docs/`, plus the
root `README.md`, root `AGENTS.md`, package READMEs and application READMEs.
Those documents describe the five internal modules, the facade build, the
roadmap and the release gate. They assume the reader has the repository. The
consumer-facing API reference, migration and eject guides also live there and
use repository-relative links and private `@workbench-kit/*` names.

The public package is `packages/workbench`. Its tarball currently permits only
`package.json`, `README.md`, `LICENSE`, `THIRD_PARTY_NOTICES.md` and `dist/`.
The package README links to `../../docs/*`, which does not resolve for a reader
who only has the npm page or the installed package. `check:docs` validates the
contributor tree and `docs/api.md`; it does not know about a consumer tree, and
it does not build the quickstart.

The package is not yet on npm. Phase 7 must be startable before publication and
must verify adoption with the packed tarball until the registry install path is
available.

## Goals / Non-Goals

**Goals:**

- One consumer documentation source of truth, owned by the package and shipped
  in the tarball.
- A rendered, searchable, human-readable documentation site built from that
  source and deployed with the existing Pages site.
- Clean Markdown and a generated `llms.txt` index for coding agents, served from
  the same site and shipped in the package.
- Enforced physical separation between consumer and contributor documentation.
- A deterministic verification suite plus a blind-agent acceptance protocol that
  proves an agent can adopt the package without the repository.
- A roadmap that makes Phase 7 the next startable change.

**Non-Goals:**

- No runtime API change to `@workbench-kit/workbench`, its exports, peers or
  side-effect metadata.
- No registry publish, version bump or release-tag workflow in this change.
- No reorganization of the five private modules or the facade build.
- No rewrite of the contributor architecture, release policy or roadmap history
  beyond the Phase 6 correction and the new Phase 7.
- No versioned documentation site for 0.x. The site documents the current
  package version only; version switching is deferred.
- No analytics, accounts, comments or other dynamic docs-site services.

## Decisions

### 1. Consumer docs live in `packages/workbench/docs/`

The consumer tree becomes:

```text
packages/workbench/
  README.md                 npm landing page, consumer-only
  AGENTS.md                 app-level guide for coding agents
  docs/
    manifest.json           ordered page list, titles, descriptions, availability
    index.md                consumer landing page and router
    quickstart.md
    concepts.md
    recipes/
      add-view.md
      add-command.md
      replace-document.md
      theme.md
      persistence.md
      eject.md
    guides/
      coming-from-template.md
      common-mistakes.md
    reference/
      api.md
      elements.md
      styles.md
      types.md
    changelog.md            copy of the consumer-visible changelog
  llms.txt                  generated from the manifest
```

`packages/workbench/docs/` is the only source for the hosted site, the tarball
docs and `llms.txt`. The existing `docs/api.md` and `docs/eject.md` move here
and are rewritten to use published specifiers only. `docs/migration.md` stays in
the contributor tree as a repository bridge; the consumer tree gets a
self-contained "coming from the template" page that describes the consumer's own
copied layout rather than linking back to contributor files.

Rationale: npm can only pack files inside the package directory. Putting the
consumer tree there makes the tarball self-contained without a copy step, keeps
the docs and package version together, and lets the site build read the same
files.

Alternative considered: a top-level `consumer-docs/` copied into the package at
build time. It keeps the package directory cleaner but adds a second location, a
copy step and a drift risk. Rejected for this change.

### 2. Render the site with VitePress in a private `docs-site/` workspace

A private `docs-site/` workspace owns the VitePress configuration. Its `srcDir`
points at `packages/workbench/docs/`, and its output is assembled under
`site/docs/`. The site uses the default theme with the project's accent tokens,
local search, code copy buttons, dark/light mode, a sidebar generated from
`manifest.json`, and no contributor navigation.

The site base is `/desktop-ui-template/docs/` for the GitHub Pages project site.
`build:site` runs `build:docs` and then the existing Pages assembly copies the
build to `site/docs/`. The template demo remains at the site root, with the
minimal and custom-shell demos beside it.

Rationale: VitePress gives Markdown authoring, navigation, search, syntax
highlighting, accessibility and a reading-optimized theme without building a
docs framework from scratch. It is a dev-only dependency and does not affect the
published package.

Alternatives considered:

- A minimal `marked` plus layout generator. Fewer dependencies, but recreates
  navigation, search, highlighting and accessibility. Rejected.
- Astro Starlight or Docusaurus. More capable but heavier and less aligned with
  the existing Vite toolchain. Rejected for this scope.
- GitHub-rendered Markdown only. Consumers may not have the repository, and
  GitHub Pages does not render Markdown automatically. Rejected.

### 3. Publish raw Markdown beside the rendered pages

The site build copies the consumer Markdown to `site/docs/raw/` with the same
relative structure. `llms.txt` links to those raw files, not to the HTML pages,
so agents ingest clean text. The installed package already contains the same
Markdown under `docs/`, so an offline agent has an equivalent path.

A `manifest.json` entry supplies the canonical site path, raw path, title,
description and section for each page. The docs check verifies that every
Markdown file in the consumer tree is listed exactly once and that every listed
page exists.

Rationale: rendered HTML is noisy and token-expensive for agents. Raw Markdown
is also what humans copy into an assistant, so the same artifact serves both.

### 4. Generate `llms.txt` from the manifest, publish it at the site root

`llms.txt` is generated, not hand-written. It contains:

- the package name, version and availability status;
- a one-paragraph description;
- a "Start here" section with the consumer landing page and quickstart;
- sections for concepts, recipes, guides and reference;
- optional links to the changelog and license material.

All links are absolute URLs to the raw Markdown on the hosted site. The file is
written to `site/llms.txt` and copied to `site/docs/llms.txt`. It is also written
to `packages/workbench/llms.txt` for the tarball. A broken link fails
`check:docs:consumer`.

`llms-full.txt` is generated for the hosted site only, concatenating the same
Markdown with source URLs. It is not shipped in the tarball because the
individual Markdown files are already there and the full text would duplicate
them.

Rationale: `llms.txt` is a discovery convention, not a standard. Generating it
from the manifest keeps it honest; treating it as an index rather than the
manual keeps the primary docs readable and maintainable.

### 5. Split the documentation check into contributor and consumer checks

`scripts/check-docs.mjs` becomes an entry point that runs two scopes:

- `check:docs:contributor` validates the root `README.md`, `ROADMAP.md`,
  `AGENTS.md`, `CHANGELOG.md`, `THIRD_PARTY_NOTICES.md`, contributor `docs/*`
  and application READMEs for links, scripts, public specifiers and API export
  coverage where applicable.
- `check:docs:consumer` validates `packages/workbench/README.md`,
  `packages/workbench/AGENTS.md`, `packages/workbench/docs/**` and
  `packages/workbench/llms.txt` for links, documented scripts, published
  specifiers, API export coverage, the consumer boundary, manifest coverage and
  `llms.txt` link resolution.

The consumer boundary rule:

- a link target must resolve inside `packages/workbench/docs/`, to an absolute
  hosted-docs URL, to npm, or to a license file;
- a relative link to `../../docs/`, `../../AGENTS.md`, `../../../apps/` or any
  repository path fails;
- a private module name (`@workbench-kit/core`, `@workbench-kit/react`,
  `@workbench-kit/elements`, `@workbench-kit/styles-vscode`,
  `@workbench-kit/preset-vscode`) fails unless the file is an explicitly listed
  bridge page and the occurrence is in a clearly marked migration note;
- a `llms.txt` target must map to a manifest page and an existing Markdown file.

Contributor docs may link to consumer docs. The reverse fails.

The API export coverage check points at `packages/workbench/docs/reference/`.
The existing hard-coded `docs/api.md` path is replaced by a scan of the consumer
reference tree.

### 6. Make the package tarball self-contained

`packages/workbench/package.json` adds `docs`, `AGENTS.md` and `llms.txt` to
`files`. The pack check:

- requires `docs/index.md`, `docs/quickstart.md`, `docs/AGENTS.md` (if the
  guide lives there), `AGENTS.md` and `llms.txt`;
- allows `docs/**` and the agent guide;
- rejects contributor documents, application READMEs, repository-only paths,
  source files, test files and lockfiles;
- verifies that `llms.txt` links to files present in the tarball or the public
  site.

The package README is restructured as a short npm landing page: install and
availability, a 20-line quickstart, adoption levels, an absolute link to the
hosted docs, an offline-docs note, an agent block and stability/license. The
README uses the site URL constant, not relative `../../docs` links.

The availability status is recorded in `docs/manifest.json`. The release
checklist flips it from preview to published after the registry publish. The
README and site banner render that status; a release task, not a runtime check,
keeps them aligned.

### 7. Verify the quickstart and adoption deterministically, then with an agent

The quickstart page carries file markers such as
`<!-- quickstart-file: src/main.tsx -->` above each fenced code block. A script
extracts those blocks into a temporary Vite application, installs the built
tarball, and runs the documented build and typecheck. This makes the page the
source of truth rather than a separate fixture that can drift.

A consumer-side adoption script checks the built app for:

- imports from private `@workbench-kit/*` modules;
- rendered `vscode-*` tags without a matching element registration;
- missing `tokens.css`, `global.css` or component styles;
- top-level `window`/`document` use in an SSR entry;
- demo-only markers or preset modules in a primitives-level bundle;
- the expected package version and peers.

The script supports a human summary and a `--json` mode for agents.

The blind-agent acceptance test is a documented protocol, not a permanent CI
job: create a temporary empty project, install the packed tarball, provide only
`README.md`, `AGENTS.md` and `docs/`, give the agent the task "add a view and a
command, then pass build and typecheck," and record the transcript and failures.
Failures become recipe or check tasks. The deterministic quickstart build and
adoption script remain in CI.

### 8. Keep the roadmap change as the first task, not a side effect

The change's first task updates `ROADMAP.md`:

- correct Phase 6 to describe contributor documentation and release readiness;
- add Phase 7 with 7A package-local docs, 7B hosted site/raw Markdown/`llms.txt`,
  and 7C verification and blind-agent evaluation;
- mark Phase 7 as the next startable change, ahead of later hardening and any
  other unstarted work;
- add the Phase 7 sequence to "First pull requests" and the consumer-docs
  criteria to "Definition of done."

This keeps the change's priority visible before any implementation task.

## Risks / Trade-offs

- **Consumer docs drift from the package** -> One source in
  `packages/workbench/docs/`; the site build and tarball copy that source; the
  boundary check and pack check fail on divergence.
- **Contributor and consumer docs bleed into each other** -> Physical trees,
  one-way link rules, a manifest allowlist and a failing boundary check.
- **A docs-site framework adds build cost and a dependency** -> VitePress is a
  dev-only dependency in a private workspace; the published package is unchanged.
  The docs build runs only in `build:site` and the relevant CI step.
- **The site base path breaks on Pages** -> Use a single configured base,
  verify the built links in CI, and keep raw Markdown paths independent of the
  HTML routing.
- **Raw Markdown is served with an unhelpful content type** -> GitHub Pages
  serves static files; agents read text regardless. If it becomes a problem,
  serve `.txt` copies or a small redirect layer.
- **`llms.txt` is treated as a standard or as the manual** -> Position it as a
  generated index; keep raw Markdown, `AGENTS.md`, recipes and verification as
  the actual adoption path.
- **The quickstart check passes while a recipe is wrong** -> Recipes carry their
  own verification steps; the blind-agent run and the deterministic checks cover
  the common tasks.
- **Publication is still gated** -> Phase 7 starts against the packed tarball;
  `manifest.json` carries the availability status; the post-publish task reruns
  the acceptance test with `npm install`.
- **Existing documentation links break when files move** -> Update root README,
  AGENTS and contributor docs in the same change; keep the old paths out of the
  consumer tree; add redirects or stable site URLs where a public link existed.
- **The docs manifest becomes another source of truth** -> The check requires
  every consumer Markdown file to be listed exactly once and every listed file to
  exist; the site sidebar and `llms.txt` both read the manifest.

## Migration Plan

1. **7A: package-local docs and boundary.**
   Create `packages/workbench/docs/`, move and rewrite the API and eject
   material, add the agent guide, restructure the package README, extend the
   tarball allowlist and split the docs checks. At the end, the packed tarball is
   self-contained and the boundary check passes.
2. **7B: hosted site and `llms.txt`.**
   Add the private `docs-site/` workspace, generate the manifest-driven sidebar,
   copy raw Markdown, generate `llms.txt`/`llms-full.txt`, add the build to
   `build:site`, and deploy under `/docs/`. At the end, a consumer can navigate
   the site and fetch raw Markdown without the repository.
3. **7C: verification and blind-agent evaluation.**
   Extract and build the quickstart, add the adoption script, write the recipes
   and run the blind-agent protocol. At the end, a fresh agent can add a view and
   a command from the package alone.
4. **Roadmap and release gate.**
   The first task updates `ROADMAP.md`; the release checklist gains the
   post-publish rerun. Registry publication remains out of scope and
   owner-approved.

Rollback: the site and docs build are additive. Reverting the change removes
`docs-site/`, the docs build step, the new tarball files and the split checks;
the package's runtime surface is untouched. The main migration cost is the
documentation path move, which should be done in one commit with updated links.

## Open Questions

None that change the specs or the task breakdown. The docs-site theme details,
the exact VitePress version and the final navigation labels can be settled
during implementation without changing the contract.
