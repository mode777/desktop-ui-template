# Design

## Context

See [`proposal.md`](./proposal.md) for motivation and the delta specs for the required behavior.

The current tree couples the monorepo host to one application:

- The root package is the template: `src/`, `index.html`, `vite.config.ts` (build plus Vitest), `tsconfig.app.json` and `tsconfig.examples.json` all live at the repository root.
- `packages/*` are workspace members; `examples/minimal` is not. Its Vite config reaches out to the root `public/` directory and writes to the root `dist-minimal/`.
- The boundary declaration scans `src`, `packages` and `examples/minimal/src`. The bundle-composition check forbids `src/demo/` and `src/app/` prefixes. Package TypeScript projects include `../../src/test/setup.ts`.
- Size scripts default to root `dist/` and `dist-minimal/`; CI and Pages upload the root `dist/`.

This change moves the applications without changing kit source, the public facade or either recorded budget.

## Goals / Non-Goals

**Goals:**

- Make `apps/template` and `apps/minimal` private workspace applications with app-owned entry, Vite and TypeScript configuration, manifests and `dist/` output.
- Keep one root install, one lockfile, one standard verification command and one CI job.
- Remove the package tests' dependency on the template's source tree and the scripts' implicit assumption that the root is an application.
- Preserve rendered behavior, composition checks, bundle budgets and the packed-tarball contract.

**Non-Goals:**

- Adding `apps/custom-shell`, publishing, changing the facade export map or changing any kit/app behavior.
- Making the applications independently publishable or moving generated public assets into one app.
- Renaming the `example-minimal` layer or the minimal application's product identity.
- Archiving `add-workbench-facade` as part of this change.

## Decisions

### 1. Both applications are private npm workspaces

`package.json` adds `apps/*` to `workspaces`, so the root install links `apps/template` and `apps/minimal` beside `packages/*`. Each application gets a private manifest:

- `apps/template`: `@workbench-kit/template-app`, depending on the preset, React primitives, elements, styles, React, React DOM and vscode-elements.
- `apps/minimal`: `@workbench-kit/minimal-app`, depending on the React primitives, elements, styles, React, React DOM and vscode-elements, deliberately not the preset.

The root package keeps the shared dev tooling (`vite`, `vitest`, Testing Library, TypeScript, oxlint, Prettier, jsdom, the Codicon sync dependency) and the transitive peers needed by package tests. Application manifests declare only what their source imports.

**Why:** workspace membership is what proves the applications resolve the kit by package name, and it gives each app a real command surface (`npm run dev -w …`). Keeping the apps as plain directories would leave the root as their de facto package and repeat the current coupling.

**Alternative considered:** move only `examples/minimal` into `apps/minimal` and leave the template at the root. Rejected: it leaves two different app models and does not reach the roadmap's `apps/*` target.

### 2. Each application emits its own `apps/<name>/dist/`

Vite runs with the application directory as its `root`; the default output is therefore `apps/template/dist/` or `apps/minimal/dist/`. The root keeps only `size-report.json`, `size-report.minimal.json` and build/pack tooling.

`public/` stays at the repository root as a shared generated-asset directory. Both Vite configs set `publicDir` to it, so the Codicon stylesheet and favicon are copied into each output without a committed duplicate. This is the deliberate exception to app-local ownership: the assets are generated once from `@vscode/codicons` and consumed by both apps.

**Why:** app-local output completes the workspace model and removes the root `dist`/`dist-minimal` special cases. Sharing `public/` avoids two generated copies and keeps `scripts/sync-codicons.mjs` as the single generator.

**Alternative considered:** keep root `dist/` and `dist-minimal/` to avoid touching CI and size paths. Rejected: the root would still look like an application and the app workspaces would not own their artifacts.

### 3. Configuration ownership moves with the code; Vitest stays at the root

- `apps/template/vite.config.ts` owns the template build: `root` is the app directory, `base: './'`, the React plugin, workspace aliases and the existing chunk-size threshold.
- `apps/minimal/vite.config.ts` owns the minimal build: app root, shared `publicDir`, aliases, the module-inventory plugin, `manifest: true` and app-local `dist/`.
- A new root `vitest.config.ts` owns test discovery: jsdom, `css: false`, `restoreMocks: true`, workspace aliases and `setupFiles: ['./test/setup.ts']`.
- `test/setup.ts` at the root replaces `src/test/setup.ts`. The preset and React package TypeScript projects include `../../test/setup.ts` instead of reaching into the template source.
- `apps/template/tsconfig.json` and `apps/minimal/tsconfig.json` extend `../../tsconfig.base.json` and include their own `src` plus the elements JSX typings. The root `tsconfig.json` references them, the kit projects and `tsconfig.node.json`; `tsconfig.app.json` and `tsconfig.examples.json` disappear.
- Application `predev` and `prebuild` scripts run `node ../../scripts/sync-codicons.mjs`, so a workspace-local command works without a root lifecycle hook.

**Why:** a Vite config belongs to the app it builds, while tests span the whole workspace and need one shared environment. A root test setup removes the package-to-app include path that would otherwise survive the move.

**Alternative considered:** keep the root `vite.config.ts` and point it at `apps/template`. Rejected: that keeps the root as the build owner and makes `apps/template` incomplete.

### 4. Root scripts delegate; they do not duplicate app configuration

The root keeps the orchestration contract:

- `dev` / `dev:minimal` → `npm run dev -w @workbench-kit/template-app` (or minimal).
- `build` → `build:packages`, `tsc -b`, then the template workspace build.
- `build:minimal` → the minimal workspace build.
- `preview` → the template workspace preview.
- `size` / `size:minimal` → the existing size tool with `--dist apps/template/dist` or `--dist apps/minimal/dist`.
- `check` → the same ordered verification gate, now building both apps through their workspaces.

`check:minimal` defaults to `apps/minimal/dist`; CI passes the same path. The Pages workflow uploads `apps/template/dist`. Size reports remain root-level, gitignored artifacts.

**Why:** one command surface for contributors and CI, with no second copy of Vite or TypeScript options at the root.

### 5. Boundaries and bundle checks follow the source, not the old root

`boundaries.json` changes to:

- `roots: ["apps/template/src", "apps/minimal/src", "packages"]`.
- `app` layer: `apps/template/src/app/**` and `apps/template/src/*.{ts,tsx}` (entry and aggregate registration).
- `demo` layer: `apps/template/src/demo/**`.
- `example-minimal` layer: `apps/minimal/src/**`, still allowed only the core, React, elements and styles layers.
- `test-support`: the root `test/**` setup.

The boundary tests and CLI fixtures move to the new paths. `scripts/lib/bundle-composition.mjs` replaces the `src/demo/` and `src/app/` forbidden prefixes with `apps/template/src/`, which covers every template module, and keeps `packages/preset-vscode/` forbidden. The existing UI markers stay.

**Why:** prefix-based checks must move with the source or they silently stop protecting the minimal bundle. Forbidding the whole template source is stricter than the old demo/app split and cannot miss `main.tsx` or `vscode-elements.ts`.

### 6. Documentation and the demo workspace tree are part of the move

`README.md`, `AGENTS.md`, `ROADMAP.md`, `docs/architecture.md` and `apps/minimal/README.md` update their layout diagrams, commands and Phase 5 status. The mock workspace tree and file contents in the template's demo data move from root `src/` to `apps/template/src/` and from `examples/minimal` to `apps/minimal`, including the embedded package.json, README and import snippets.

**Why:** the demo explorer is a visible part of the product; stale paths would show a repository that no longer exists and would break the "open file" mock targets.

### 7. Verification remains the existing gate

The implementation runs the existing sequence rather than adding a new pipeline: clean `npm ci`, `npm run check`, `npm run size`, `npm run size:minimal`, a `npm pack --dry-run` from the facade, and a manual dev smoke check at 1440×900 and a narrow width. Budget values stay unchanged; only paths move.

## Risks / Trade-offs

- **Workspace hoisting changes module resolution** → run a clean `npm ci`, `npm ls` for both apps and the kit packages, and verify Vitest, Vite and `tsc` resolve workspace names.
- **Vite `root`/`publicDir` changes break the Pages base path or Codicon URLs** → keep `base: './'`, verify both `dist/index.html` files reference relative assets and include `codicons/codicon.css`, and smoke-test the production output.
- **Vitest silently stops discovering app tests after the config split** → compare the test count before and after, assert `apps/template/src/app/App.test.tsx` and `apps/minimal/src/App.test.tsx` run, and keep the root config's jsdom setup.
- **Size or composition checks point at stale directories** → make `--dist` explicit in every root script, keep `check:minimal` and CI on `apps/minimal/dist`, and confirm report targets are unchanged.
- **Boundary/bundle prefixes keep matching old paths and pass vacuously** → update the unit fixtures first, then run the checks against the moved tree; add a negative fixture that a template module is rejected.
- **Package TypeScript projects still include the removed app test setup** → update both package configs to `../../test/setup.ts` and run `tsc -b` from a clean `node_modules/.tmp`.
- **Demo mock data drifts from the real tree** → update keys, tree nodes and embedded snippets together and verify every displayed path exists after the move.
- **Large move obscures history or leaves empty directories** → use `git mv` for tracked files, delete only empty `src/` and `examples/` shells, and review `git status` for accidental deletions.

## Migration Plan

1. Create `apps/template` and `apps/minimal`; `git mv` the template source/entry and the minimal source/entry, then add app manifests and app-local Vite/TypeScript configs.
2. Move test setup to the root and split the root Vitest config from the template build config.
3. Update root workspaces, scripts, lockfile, ignore patterns and TypeScript references.
4. Move boundary roots/layers, bundle-composition prefixes and their tests; update size and composition defaults.
5. Update CI, Pages, README/AGENTS/roadmap/architecture docs and the demo workspace tree.
6. Run the full verification, both size targets, the pack check and the manual smoke check.

Rollback is a normal revert of the change: no public API, persisted state or data migration is involved. If only the move is committed, moving the directories back and restoring root scripts/configs is sufficient.

## Open Questions

None. The remaining Phase 5 work (`apps/custom-shell`) and publishing stay follow-up changes.
