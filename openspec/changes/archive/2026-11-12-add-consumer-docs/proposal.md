# Proposal

## Why

The repository's documentation is written for people developing the workbench
kit, not for people consuming the published package. Consumer-facing material
lives in the contributor tree, links to repository paths and uses private
module names. A consumer who installs `@workbench-kit/workbench` may have no
repository checkout at all, so those docs are unavailable or misleading.

The package is also not yet on npm. The current quickstart tells a reader to
install it before that is possible. The consumer documentation needs to be
self-contained in the package, honest about availability, and separately
published so humans and coding agents can adopt the package without the
repository.

## What Changes

- Move consumer documentation into `packages/workbench/docs/` and make it the
  single source of truth for the package.
- Add `packages/workbench/AGENTS.md` for app builders. Keep the root `AGENTS.md`
  and root `docs/` contributor-only, with a one-way pointer.
- Restructure the package README as the npm landing page: install, quickstart,
  adoption levels, absolute documentation links, an offline-docs note and an
  agent block.
- Ship `docs/`, `AGENTS.md` and `llms.txt` in the published tarball. Extend the
  pack check so consumer docs are required and contributor docs are rejected.
- Build a consumer-only documentation site from the package docs and host it
  under `/docs/` on the existing GitHub Pages site.
- Publish raw Markdown alongside the rendered site for clean agent ingestion.
- Generate `/llms.txt` and optional `/llms-full.txt` from the consumer docs
  manifest. `llms.txt` is an index, not a replacement for the documentation.
- Add a human-readable "For AI agents" page with the app-level contract and a
  copy-paste prompt.
- Add a consumer documentation boundary check: consumer docs may not link to
  contributor docs, repository paths or private module names, and the tarball
  must not contain contributor docs.
- Add complete task recipes for adding a view, adding a command, replacing the
  document surface, theming, persistence and ejecting from the preset.
- Add a consumer-side adoption check and a blind-agent acceptance test that
  builds a small app from the packed tarball with no repository access.
- Build the documented quickstart in CI, not only the tarball consumer fixture.
- Add Phase 7 to `ROADMAP.md` and make it the next startable change, ahead of
  later hardening and any other unstarted work. Correct Phase 6 to describe the
  existing documentation as contributor-facing.

Documentation URL and path moves are **BREAKING** for existing links. Contributor
docs that point at consumer docs must be updated, and old consumer paths should
redirect or be replaced by stable site URLs.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `adoption-documentation`: consumer documentation becomes package-local and
  self-contained, separate from contributor documentation, published as a
  hosted site with raw Markdown and `llms.txt`, enforced by a boundary check and
  validated by a blind-agent acceptance test.

## Impact

- `packages/workbench/docs/`, `packages/workbench/AGENTS.md`,
  `packages/workbench/README.md`, `packages/workbench/package.json` and the
  packed-tarball allowlist.
- A new consumer docs site build (VitePress or equivalent), the Pages assembly
  script, `build:site`, and CI.
- `scripts/check-docs.mjs` and its library: split contributor and consumer
  checks, add the boundary rule, validate `llms.txt` links, and build the
  quickstart.
- `scripts/check-workbench-pack.mjs` and its library: require consumer docs and
  reject contributor docs in the tarball.
- Root `README.md` and `AGENTS.md`: contributor-facing routing and links to the
  hosted consumer docs.
- `ROADMAP.md`: new Phase 7 with 7A package-local docs, 7B hosted site and
  `llms.txt`, and 7C verification and blind-agent evaluation.
- No runtime API change. The public package gains documentation files and
  `llms.txt`; its exports and peer requirements remain unchanged.
- Registry publication remains a separate owner-approved gate. Phase 7 can start
  before publication and is verified by packing and installing the local
  tarball until the package is on npm.
