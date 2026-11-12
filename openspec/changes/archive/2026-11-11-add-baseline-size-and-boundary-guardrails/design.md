# Design

## Context

See `proposal.md` for motivation. Facts that shape the approach, verified against the current tree:

- The build is `tsc -b && vite build` with `prebuild` syncing Codicons; Vite emits hashed files into `dist/assets/`. Measured baseline: JS 417,839 B raw / 115,252 B gzip; CSS 44,445 B raw / 8,147 B gzip. Codicon font/CSS in `dist/codicons/` is a separate, untracked-by-budget asset.
- CI is one job (`verify`) running `npm run check`, which already ends with `npm run build`. `npm ci` + `npm run check` is the only verification path today.
- TypeScript is 7.0.2 (the native compiler). It no longer ships the classic `createSourceFile` API; only `unstable/*` JS entry points exist.
- `src/data/workspace.ts` embeds mock document contents that themselves contain `import … from '…'` lines (e.g. lines 60-70, 94-97). Text-level scanning of the source tree therefore produces false imports pointing at files that are not real dependencies.
- 43 TypeScript files under `src/`; all imports are relative (no path aliases in `tsconfig.app.json`) plus package imports. Every relative import currently resolves; there are zero unresolved specifiers.
- Observed layer edges today (file-level resolution, not text matching): `app → layout, store`; `layout → views, commands, store, data, components, hooks`; `views → layout, commands, store, data, components, views`; `components → commands, store, data`; `hooks → commands, store`; `commands → store, data`; `store → layout`; `data → data` only.

`store → layout` (config + types) and `views → layout` (types) are the current shape. They are recorded in the rule set as-is; splitting a shared contract layer out of `layout` is Phase 1 work, not this change.

## Goals / Non-Goals

**Goals:**

- One command that turns a production build into a comparable size report and a pass/fail verdict.
- One declarative file that states the allowed layer edges, including kit layers that do not exist yet.
- Checks that are cheap (a few seconds, no extra dependencies) and precise enough to point at file + line.
- Wiring that produces the same numbers locally and in CI.

**Non-Goals:**

- Enforcing per-entry tree-shaking, element registration granularity, or CSS splitting — those arrive with Phase 2-4.
- Measuring the minimal app or introducing a second build target.
- Changing `src/`, `vite.config.ts`, `package.json` dependencies, or the rendered demo.
- Making the boundary checker aware of committed build artifacts, CSS selectors, or runtime behavior.

## Decisions

### 1. Parse with Vite's `parseAst`, not TypeScript's API or a regex

`vite.parseAst(code, { lang: 'tsx' })` is exported by Vite 8 (which is already a dev dependency) and wraps the oxc parser. It returns an ESTree-shaped AST with correct handling of strings, comments and JSX, so the mock-document `import` lines in `src/data/workspace.ts` are ignored. Nodes carry `start`/`end` character offsets but no `loc`; line numbers are derived by counting newlines in `code.slice(0, start)` (offsets were verified to be UTF-16 code-unit indices, not UTF-8 bytes).

Alternatives rejected:

- **Regex scan** — simplest, but demonstrably wrong in this repository: it would report a dozen fake edges from `src/data/workspace.ts` and from any future docs-in-strings.
- **TypeScript compiler API** — the familiar API is gone in TypeScript 7; `typescript/unstable/ast` is explicitly unstable and would put the build gate on a moving surface.
- **`dependency-cruiser`** — capable, but adds a dependency, a second config language and a rule model we would partly bypass; our rules are a short, repo-specific allow-list.

Trade-off: `parseAst` is a build-tool API, not a language-spec one. It is wrapped in a single `parseImports(code, file)` helper so the parser can be swapped without touching rule logic.

### 2. Rules live in `boundaries.json` at the repository root

The file is data, not code: layers with `include` globs, `mayImport` layer names, `allowedExternals` package names, and the global policy for unresolved relative imports. Adding the kit layers or tightening an edge is a reviewable data diff; the checker has no rule constants of its own. Placing it next to `vite.config.ts` keeps policy discoverable rather than buried under `scripts/`.

Alternative rejected: putting rules inside the script (fast, but every rule change edits executable code and the rule set becomes invisible in review).

### 3. Layer classification is path-based and scoped to `src/`

A file's layer is the first path segment below `src/` (`layout`, `views`, `commands`, `store`, `data`, `components`, `hooks`, `types`, `test`, or `(root)` for `src/main.tsx` and `src/vscode-elements.ts`). Future kit files are matched before the flat rule by longest glob prefix, so `src/kit/core/**` is `kit-core` rather than `kit`. Test files (`*.test.ts`, `*.test.tsx`) are classified as `test` regardless of directory and may import anything, because tests assert on several layers at once and each file is checked independently.

Unknown paths are treated as a violation of a `default` rule that lists no permitted imports, so a new top-level directory must be classified deliberately instead of inheriting permissiveness.

### 4. Resolution: relative imports must resolve; packages are classified and checked

Relative specifiers resolve against the sibling `dist`-free file set: exact path, then `.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.json`, then `index.*` variants. CSS and JSON targets count as assets and are allowed from any layer. A relative import that resolves to nothing is a violation with file + line — a typo must not silently disable a rule.

Non-relative specifiers are external. The package root (`@scope/pkg` or `pkg`) is checked against the importing layer's `allowedExternals`; `node:` builtins are rejected from `src/` entirely. This keeps `kit-core` honest (no `react`, no `zustand`) without a special case.

### 5. The rule set encodes today's tree and the future kit, with no exemption list

Rules must pass on the current tree unmodified — no baseline of known violations, no inline suppression comments. The kit layers (`kit-core`, `kit-react`, `kit-elements`, `kit-preset`) are declared now with the imports their layer contract permits, so the first file created there is already constrained; empty globs simply match nothing.

`layout` is currently a shared contract (views store its types, the store imports its config). The rule set records `store → layout` and `views → layout` explicitly rather than pretending the dependency is absent. Phase 1 moves that contract into `kit/core` and removes the edges in a visible diff.

### 6. Size measurement is scoped to emitted JS/CSS and gated on gzip JavaScript

The report sums only `dist/assets/*.js` and `dist/assets/*.css`, because fonts and HTML are tracked separately and would otherwise dominate the numbers. Gzip is computed in-process with `node:zlib` at level 9 so no external tool is required and results are comparable run to run.

The budget stores raw and gzip for both kinds, with a percentage tolerance and an absolute byte floor (the larger of the two wins). Tolerance exists because zlib and oxc/rolldown output can drift by a few bytes between machines; it is deliberately small. JavaScript failure is fatal; CSS overage is a warning in this phase because CSS is still one aggregate file that Phase 2-4 splits.

Default behavior builds first (`npm run build`), so the report can never describe a stale `dist/`. `--no-build` reuses the existing `dist/` and exists for CI, where `npm run check` has just built. `--summary <file>` appends a Markdown table for GitHub job summaries.

### 7. CI reuses the verify build and publishes the report

`check:boundaries` becomes part of `npm run check`, so the boundary gate runs wherever verification runs with no extra job. The size step runs after `npm run check` in the same job with `--no-build`, so CI builds once, writes `size-report.json`, appends the table to `$GITHUB_STEP_SUMMARY`, and uploads the report as an artifact. A separate job would duplicate the build (the cold build is the dominant cost) and could measure different output.

### 8. Baseline updates are a documented, reviewable edit

Updating `budgets.json` is never automatic: no `--update` flag. The documented procedure is to run the size command, confirm the growth is intended, and commit the edited numbers with a justification in the PR. A flag would let a regression be papered over in one command.

## Risks / Trade-offs

- **`parseAst` surface changes with Vite majors** → contained in one helper; `npm run check` fails loudly if the shape changes, and the pinned Vite version makes upgrades intentional.
- **Rules encoded now may need tightening after Phase 1** → rules are data; the change that tightens them shows up as a two-line diff in `boundaries.json`.
- **Tolerance hides small regressions** → tolerance is a percentage with a small byte floor, and the report prints headroom, so gradual growth is visible in the summary even when it passes.
- **Budget updates become routine** → procedure requires a justification; the diff is reviewed like code, and JS remains fatal so a widened budget cannot silently ship.
- **Checker false negatives from unusual syntax** (e.g. future path aliases) → alias-free resolution is asserted in the design; if aliases are introduced, the check fails as unresolved rather than passing silently, which is the safe direction.
- **Size measurement is single-build-specific** → only one build target exists in this phase; the minimal app's budget is a Phase 4 deliverable.

## Migration Plan

No consumer-facing migration. Landing is additive: scripts and rules files, two new npm scripts, one added step in `npm run check`, and CI wiring. Rollback is reverting the commit; no data, config or build output depends on it.

## Open Questions

- Whether to split a `contract` layer out of `layout` before Phase 1, or fold it into the `kit/core` extraction. Deferrable: the current edges are declared either way.
- When CSS overage becomes fatal (candidate: once per-component CSS exists). Deferrable: the spec records the current advisory behavior.
