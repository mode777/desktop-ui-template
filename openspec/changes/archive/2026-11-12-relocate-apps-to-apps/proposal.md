# Proposal

## Why

Phase 5 of the roadmap is structurally incomplete: the template is still the root package and the minimal example still lives under `examples/`, so the repository has workspace packages but no application workspace. The facade exists and is packed, but the target layout `apps/template`, `apps/minimal` and a later `apps/custom-shell` cannot be reached while the root directory is both the monorepo host and a runnable application.

This is the next roadmap step after the facade. Moving the applications makes each one an explicit workspace consumer with its own entry, build configuration and output, while the root becomes a pure install/verification host. It also removes the remaining cross-tree coupling in test setup, boundary roots and bundle checks before the custom-shell example and publishing are added.

## What Changes

- Move the current template application from the repository root into `apps/template`: `src/`, `index.html`, Vite config, TypeScript project and app-level scripts/manifest. The generated public assets in `public/` stay shared at the root because both applications consume the same generated Codicon stylesheet.
- Move `examples/minimal` into `apps/minimal` and give it the same app-local structure, including a workspace manifest, Vite config, TypeScript project and its own build output.
- Extend the npm workspace from `packages/*` to `packages/*` plus `apps/*`. Each application is a private workspace member that declares the kit packages and peer runtimes it imports; the root package becomes the monorepo host and verification orchestrator.
- **BREAKING** (internal): application source paths move from `src/` to `apps/template/src/` and from `examples/minimal/src/` to `apps/minimal/src/`. Scripts, docs, mock workspace data, boundary roots, bundle-composition prefixes, test setup includes, size-target output paths, CI artifacts and the Pages upload path move with them.
- Each application builds into its own `apps/<name>/dist/` directory. The existing bundle budgets and their measured values stay unchanged; only the measured directory and the commands' target paths change.
- Keep one root lockfile, one `npm install`, one standard verification command and the existing CI job. Root commands delegate to the application workspaces instead of describing their directories directly.
- Update `README.md`, `AGENTS.md`, `ROADMAP.md`, `docs/architecture.md`, `examples` references, the demo workspace tree and all committed examples of the old layout.

Not included: adding `apps/custom-shell`, publishing to a registry, changing the preset/primitives/core/styles behavior, changing tabs, menus, persistence, shortcuts or rendered output, and changing either recorded bundle budget. Archiving the prior `add-workbench-facade` change is separate.

## Capabilities

### New Capabilities

- `application-workspaces`: the repository's runnable applications are private workspace members under `apps/*`, each owning its entry, build configuration, manifest and output, while the root workspace installs once and orchestrates their commands.

### Modified Capabilities

- `package-workspaces`: the single workspace now contains the five kit packages plus the template and minimal applications; the template is a workspace application rather than the root package, and the standard verification commands continue to work from the root.
- `minimal-example`: the minimal application now lives at `apps/minimal` as a workspace member and emits `apps/minimal/dist/`, while keeping its primitive-only composition, selective registration, composition check and budget.
- `dependency-boundaries`: the declared source roots move from `src/` and `examples/minimal/src/` to `apps/template/src/` and `apps/minimal/src/`, and the layer model, tests and forbidden-bundle prefixes cover the new application paths.

## Impact

- Moved: `src/**`, `index.html`, `vite.config.ts`, `tsconfig.app.json` → `apps/template/**`; `examples/minimal/**` → `apps/minimal/**`.
- New: `apps/template/{package.json,tsconfig.json,vite.config.ts}`, `apps/minimal/{package.json,tsconfig.json,vite.config.ts}`, a root Vitest configuration and a shared root test setup.
- Changed: root `package.json` scripts/workspaces, `package-lock.json`, `tsconfig.json`, `tsconfig.node.json`, package `tsconfig.json` test includes, `boundaries.json`, `scripts/size-report.mjs` defaults and callers, `scripts/check-minimal-bundle.mjs`, `scripts/lib/bundle-composition.mjs` and tests, `scripts/lib/boundaries.test.mjs`, `.gitignore`, `.prettierignore`, `.oxlintrc.json`, CI and Pages workflows, `README.md`, `AGENTS.md`, `ROADMAP.md`, `docs/architecture.md`, `apps/minimal/README.md` and `src/demo/data/workspace.ts` (after the move, `apps/template/src/demo/data/workspace.ts`).
- Unchanged: kit source and public facade, rendered template and minimal behavior, persisted state shape, element registration semantics, `budgets.json`, `budgets.minimal.json`, `distribution.json` and the five-module/one-package distribution model.
- Compatibility: repository-internal paths change; no published API or consumer-facing contract changes.
