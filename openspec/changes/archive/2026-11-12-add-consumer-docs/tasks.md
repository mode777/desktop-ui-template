# Tasks

## 1. Roadmap and priority

- [x] 1.1 Update `ROADMAP.md`: correct Phase 6 to contributor documentation and release readiness, insert Phase 7 with 7A package-local docs, 7B hosted site/raw Markdown/`llms.txt` and 7C verification/blind-agent evaluation, mark Phase 7 as the next startable change, and update "First pull requests" and "Definition of done". Verify: Phase 7 follows Phase 6 and precedes "Later", no other unstarted item is marked next, and the new sections are present in the rendered file.

## 2. Consumer documentation source

- [x] 2.1 Create `packages/workbench/docs/` with `manifest.json`, `index.md`, `quickstart.md`, `concepts.md`, `recipes/`, `guides/`, `reference/` and `changelog.md`. Verify: every directory exists, `manifest.json` parses as JSON, and it lists every page with a title, description, section and order.
- [x] 2.2 Write `packages/workbench/docs/quickstart.md` for the selective primitives path, with install, availability, file markers and build steps. Verify: the page states the peer requirements, uses only published specifiers, registers only rendered tags, and contains the documented build command.
- [x] 2.3 Write `packages/workbench/docs/concepts.md` covering the preset, composition and primitive levels, state ownership, persistence, element registration, style order and theming. Verify: the page has no private module names and every claim matches the public API reference.
- [x] 2.4 Move `docs/api.md` to `packages/workbench/docs/reference/api.md` and rewrite it with published specifiers only; move any repository-source mapping table to the contributor tree. Verify: the reference still covers every public value export and export key, and contains no `@workbench-kit/core`, `react`, `elements`, `styles-vscode` or `preset-vscode` import instructions.
- [x] 2.5 Move `docs/eject.md` to `packages/workbench/docs/recipes/eject.md`, rewriting imports and state ownership for a package consumer. Verify: the three levels, preset-to-composition and composition-to-primitives steps, and the persistence handoff are present without repository paths.
- [x] 2.6 Write `packages/workbench/docs/recipes/add-view.md` with prerequisites, files, complete code, verification and common failures. Verify: an app following the recipe can add a view to a configured region and build successfully.
- [x] 2.7 Write `packages/workbench/docs/recipes/add-command.md` with command, menu and palette wiring. Verify: the recipe covers a command id, title, keybinding, menu entry and palette availability, and contains no placeholder elisions.
- [x] 2.8 Write `packages/workbench/docs/recipes/replace-document.md` for replacing the document surface. Verify: the recipe keeps tabs, active state and status ownership intact and shows the render prop or composition slot to replace.
- [x] 2.9 Write `packages/workbench/docs/recipes/theme.md` for token overrides and dark/light themes. Verify: the recipe edits only token custom properties, adds no hard-coded colors and documents the persisted theme behavior.
- [x] 2.10 Write `packages/workbench/docs/recipes/persistence.md` for keeping, replacing or clearing the preset persistence adapter. Verify: the recipe names the persisted key, states what survives reloads and shows both the preset store and the headless adapter path.
- [x] 2.11 Write `packages/workbench/docs/guides/coming-from-template.md` as a self-contained bridge for a consumer who copied the template. Verify: it describes the consumer's own copied layout, not repository contributor paths, and links only to consumer pages.
- [x] 2.12 Write `packages/workbench/docs/guides/common-mistakes.md` with symptom, cause, fix and verification for blank custom elements, missing styles, private imports, SSR crashes, duplicate registrations and stale persistence. Verify: each entry maps to a check or recipe in the consumer tree.
- [x] 2.13 Write `packages/workbench/AGENTS.md` as an app-level guide for coding agents. Verify: it covers the recommended app layout, adoption levels, consumer commands, browser-only constraints, element and style order, persistence, non-goals, when to stop and ask, and the verification command.
- [x] 2.14 Restructure `packages/workbench/README.md` as the npm landing page: install and availability, shortest quickstart, adoption levels, absolute hosted-docs link, offline-docs note, agent block and stability/license. Verify: there are no `../../docs/` links, all documentation links are absolute site URLs, and the install statement matches the availability value in `docs/manifest.json`.
- [x] 2.15 Copy the consumer-visible changelog into `packages/workbench/docs/changelog.md`. Verify: version headings match the root `CHANGELOG.md` and the page is included in the manifest.
- [x] 2.16 Update root `README.md` to split its documentation table into "Using the package" and "Working on the repository"; add a contributor-only banner and one-way consumer pointer to root `AGENTS.md`. Verify: the root README no longer presents the contributor docs as the consumer manual and every consumer link points to the package or hosted site.
- [x] 2.17 Update contributor docs and application READMEs that link to moved consumer files (`docs/api.md`, `docs/eject.md`, root documentation tables) so no contributor link is broken. Verify: old consumer paths no longer appear in contributor docs and `npm run check:docs:contributor` passes.

## 3. Boundary, checks and tarball

- [x] 3.1 Add `docs`, `AGENTS.md` and `llms.txt` to the `files` list in `packages/workbench/package.json`, keeping `dist`, `LICENSE` and `THIRD_PARTY_NOTICES.md`. Verify: `npm pack --dry-run --json` lists the consumer docs and agent guide and does not list contributor docs.
- [x] 3.2 Extend `scripts/lib/pack-check.mjs` to require `docs/index.md`, `docs/quickstart.md`, `AGENTS.md` and `llms.txt`, allow `docs/**`, and reject contributor docs, app READMEs, repository paths, source files and lockfiles. Add cases to `scripts/lib/pack-check.test.mjs`. Verify: the new tests pass and `npm run pack:check` succeeds on the package.
- [x] 3.3 Split `scripts/check-docs.mjs` into contributor and consumer scopes with shared library helpers, add `check:docs:contributor` and `check:docs:consumer` to `package.json`, and update the root `check` sequence to run both before build and pack. Verify: both commands run, the current contributor tree passes after link updates, and a deliberately broken consumer link fails the consumer command.
- [x] 3.4 Implement the consumer boundary rule in `scripts/lib/docs.mjs`: links resolve only inside the consumer tree, to absolute hosted-docs URLs, npm, or license material; private module names fail outside an allowlisted bridge page. Add positive and negative tests to `scripts/lib/docs.test.mjs`. Verify: the consumer check passes on the real docs and a fixture with `../../docs/architecture.md` fails with file and target.
- [x] 3.5 Point API export coverage at `packages/workbench/docs/reference/` and scan every reference page, replacing the hard-coded `docs/api.md` path. Verify: `check:docs:consumer` reports coverage for every public value export and export key, and an undocumented export fixture fails.
- [x] 3.6 Implement manifest coverage in the consumer check: every Markdown file under `packages/workbench/docs/` is listed exactly once, every listed page exists, and no contributor document is listed. Verify: the real manifest passes and a missing or duplicate page fails with the file name.
- [x] 3.7 Add a generator that reads `docs/manifest.json` and writes `packages/workbench/llms.txt` and the site copy, including package version, availability, one-paragraph summary and absolute raw-Markdown links grouped by section. Add generator tests. Verify: the generated index contains the version and availability, every link resolves to a manifest page, and no contributor page is referenced.
- [x] 3.8 Add `llms-full.txt` generation for the hosted site from the same manifest and Markdown. Verify: it contains every manifest page with its source URL, is generated only for the site, and is absent from the package tarball.
- [x] 3.9 Wire the consumer docs check, contributor docs check, `llms.txt` link check and packed-doc check into `npm run check` in the required order before build and pack. Verify: `npm run check` runs all documentation checks and a broken consumer link stops the run before the build step.

## 4. Hosted documentation site

- [x] 4.1 Add a private `docs-site/` workspace with VitePress configuration, `srcDir` pointing at `packages/workbench/docs/`, the Pages base path, a manifest-driven sidebar, navigation, local search and project accent tokens; add it to the root workspaces and add `dev:docs`. Verify: `npm run dev:docs` serves the docs, the sidebar matches the manifest, and no contributor page appears in navigation.
- [x] 4.2 Add `build:docs` and integrate it into `build:site`; update `scripts/assemble-pages-site.mjs` and `scripts/assemble-pages-site.test.mjs` so the docs build is copied to `site/docs/` and `llms.txt` to `site/llms.txt`, and a missing docs build fails the assembly. Verify: `npm run build:site` produces `site/docs/index.html`, `site/llms.txt` and the example demos.
- [x] 4.3 Copy the consumer Markdown to `site/docs/raw/` with the same relative structure and make `llms.txt` target those raw files. Verify: every raw file matches its source, every `llms.txt` link returns the corresponding Markdown, and no contributor file is copied.
- [x] 4.4 Add a human-readable "For AI agents" page to the consumer manifest and site navigation, with the app-level contract, the agent entry points and a copy-paste prompt. Verify: the page is readable as normal documentation, all links resolve, and it appears at desktop and narrow widths without layout breakage.
- [x] 4.5 Add the package version and availability banner to the docs site, driven by `docs/manifest.json`. Verify: the banner matches the manifest in a local build and changing the manifest status changes the banner without editing page content.
- [x] 4.6 Update the Pages workflow and CI so `build:site` includes the docs build and the uploaded artifact contains `site/docs/`, `site/docs/raw/` and `site/llms.txt`. Verify: the workflow configuration names the docs build path and a local `npm run build:site` matches the uploaded structure.
- [x] 4.7 Verify the docs site at 1440x900 and a narrow width: navigation, search, code copy, tables and long code blocks remain usable, no body scroll is introduced, and the reading layout is not a raw text dump. Verify: record the two viewport checks and any fixes in the change notes.

## 5. Quickstart and adoption verification

- [x] 5.1 Implement the quickstart build script: extract code blocks marked with `<!-- quickstart-file: ... -->`, create a temporary Vite application, install the packed tarball, and run build and typecheck. Verify: the current quickstart builds, and changing an import to a missing path makes the check fail with the file name.
- [x] 5.2 Implement `scripts/check-adoption.mjs` and its library with a human summary and `--json` output for private imports, rendered tags without registration, missing tokens/global/component styles, top-level SSR globals, demo-only markers, and package version/peer checks. Verify: it passes on the built quickstart and reports actionable findings on a deliberately incomplete app.
- [x] 5.3 Add tests for the adoption check and its negative fixtures in `scripts/lib/` (or a colocated test file). Verify: `npm run test -- scripts/lib` covers each rule and the expected exit behavior.
- [x] 5.4 Add `check:quickstart` and `check:adoption` scripts and wire them into `npm run check`. Verify: `npm run check` builds the documented quickstart, runs the adoption check and fails when either check fails.
- [x] 5.5 Extend `packages/workbench/docs/guides/common-mistakes.md` with an entry for every adoption-check rule, using the check's wording for the symptom and the fix. Verify: every check rule is represented and the page links to the relevant recipe.
- [x] 5.6 Run the blind-agent protocol: create an empty temporary project with only the packed tarball, `README.md`, `AGENTS.md` and `docs/`; give the agent the task to add a view and a command; record the transcript and failures. Verify: the agent passes build and typecheck, or every failure becomes a new recipe, check or task before the change is considered complete.

## 6. Integration and release

- [x] 6.1 Run `npm run check` and `npm run build:site` from a clean install and verify lint, format, typecheck, boundaries, distribution, docs, release, styles, tests, builds, pack, docs site and bundle budgets all pass.
- [x] 6.2 Pack the tarball and install it into an empty temporary project with no repository access; build the quickstart and import the preset, composition, core, element and style entries. Verify: the build succeeds, no private module resolves, and the installed `docs/`, `AGENTS.md` and `llms.txt` are present.
- [x] 6.3 Audit the built site: no contributor pages, raw Markdown matches the source, `llms.txt` and `llms-full.txt` links resolve, search indexes consumer pages only, and the human navigation reaches every guide. Verify: the audit checklist is recorded with no unresolved failures.
- [x] 6.4 Update `docs/release.md` for the new tarball contents, the availability-status flip and the post-publish acceptance rerun; add a consumer-docs entry to `CHANGELOG.md`. Verify: `npm run check:release` passes and the release checklist names the consumer docs and `llms.txt`.
- [x] 6.5 Update `ROADMAP.md` Phase 7 status and progress after 7A, 7B and 7C, and confirm no other unstarted item is marked next. Verify: the roadmap reflects completed sub-phases and the next startable change is unambiguous.
- [x] 6.6 Run `openspec validate add-consumer-docs --strict` and `openspec status --change add-consumer-docs`; resolve any spec or artifact issues before review. Verify: validation passes and every artifact is done.

## Verification notes

- Blind-agent protocol: a fresh agent used only the packed package README,
  `AGENTS.md` and `docs/`, then built a preset app with an Inspector view and a
  command. `npm run build` and `tsc --noEmit` passed.
- Gaps reported by the blind agent and fixed during this change: missing Codicon
  stylesheet instructions, placeholder element/style/type reference pages,
  missing preset element-registration list, and no complete preset entry example.
- Viewport checks on the verification server with chrome-headless-shell:
  1440x900 had no horizontal overflow, with sidebar, search, nav and the
  version/availability banner visible; 390x844 had no horizontal overflow, used
  the responsive menu, and kept wide tables scrollable inside their container.

## Workflow follow-up

- Run the post-publish acceptance path: `npm install @workbench-kit/workbench` from a clean project, build the quickstart and run the adoption check. Update the availability status to `published` after the registry publish.
- Archive the change after review and after the post-publish acceptance path has been run or explicitly deferred by the owner.
- If publication is deferred, keep the availability status on preview, keep the local-tarball verification path in the release checklist, and do not advertise a registry install that cannot succeed.
