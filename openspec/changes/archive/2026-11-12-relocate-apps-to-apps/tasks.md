# Tasks

## 1. Application workspace scaffold

- [x] 1.1 Create `apps/template` and `apps/minimal`, then use `git mv` to move `src/` and `index.html` into `apps/template` and `examples/minimal/*` into `apps/minimal`; verify `git status` shows renames rather than deletions/additions where possible, `test ! -d src`, `test ! -d examples`, and the file count under `apps/` equals the old `src/` plus `examples/minimal/` count.
- [x] 1.2 Add `apps/template/package.json` (`@workbench-kit/template-app`, `private: true`, app `dev`/`preview`/`build` scripts with Codicon pre-steps) and `apps/minimal/package.json` (`@workbench-kit/minimal-app`, same shape), declaring only the kit packages, React, React DOM and vscode-elements each app imports; verify `npm ls -w @workbench-kit/template-app --depth=0`, `npm ls -w @workbench-kit/minimal-app --depth=0`, and that neither app has a nested lockfile.
- [x] 1.3 Extend the root workspace to `["packages/*", "apps/*"]`, move `tsconfig.app.json` to `apps/template/tsconfig.json`, replace `tsconfig.examples.json` with `apps/minimal/tsconfig.json`, and point root `tsconfig.json` at both; verify `npx tsc -b` resolves both app projects and reports no missing config.
- [x] 1.4 Add `apps/template/vite.config.ts` and rework `apps/minimal/vite.config.ts` so each uses its own directory as `root`, `base: './'`, the shared root `public/` as `publicDir`, the workspace aliases and app-local `dist/`; remove the old root Vite build config; verify `npm run build -w @workbench-kit/template-app` emits `apps/template/dist/index.html` and `npm run build -w @workbench-kit/minimal-app` emits `apps/minimal/dist/index.html` with `codicons/codicon.css`, without creating root `dist/` or `dist-minimal/`.

## 2. Shared test setup and root orchestration

- [x] 2.1 Move `src/test/setup.ts` to root `test/setup.ts`, add root `vitest.config.ts` (jsdom, `css: false`, `restoreMocks: true`, workspace aliases, `setupFiles: ['./test/setup.ts']`), and update the preset/React TypeScript projects to include `../../test/setup.ts`; verify `npm run test` discovers tests in `apps/template/src`, `apps/minimal/src` and `packages/*`, and that the total test count is not lower than before the move.
- [x] 2.2 Rewrite root `dev`, `dev:minimal`, `build`, `build:minimal`, `preview`, `size`, `size:minimal` and `check:minimal` scripts to delegate to the application workspaces or pass explicit `apps/*/dist` paths; remove root lifecycle hooks that the app scripts now own; verify each documented command starts from the repository root and `npm run build` still runs `build:packages` before `tsc -b` and the template build.
- [x] 2.3 Reconcile root and app dependencies after the move: keep shared dev tooling and the peers required by package tests at the root, keep app runtime imports in the app manifests, and regenerate `package-lock.json` with the new workspaces; verify a clean `npm ci` succeeds, `npm ls --depth=0` reports no invalid or missing workspace links, and neither `react` nor `@vscode-elements/elements` is vendored twice.

## 3. Boundaries, bundle checks and size targets

- [x] 3.1 Update `boundaries.json` to `roots: ["apps/template/src", "apps/minimal/src", "packages"]`, move the `app`, `demo` and `test-support` globs to the new locations, point `example-minimal` at `apps/minimal/src/**` and update the declaration description; verify `npm run check:boundaries` reports zero violations and includes both applications in its file count.
- [x] 3.2 Update `scripts/lib/boundaries.test.mjs` and `scripts/check-boundaries.test.mjs` fixtures from `src/` and `examples/minimal` to `apps/template/src` and `apps/minimal/src`, including a cross-application import that must fail; verify `npm run test -- scripts/lib/boundaries.test.mjs scripts/check-boundaries.test.mjs` passes and the negative fixture names the target layer.
- [x] 3.3 Change `scripts/lib/bundle-composition.mjs` to forbid `apps/template/src/` and keep `packages/preset-vscode/`, then update its tests and the fake module ids; verify `npm run test -- scripts/lib/bundle-composition.test.mjs` rejects both a template module and a preset module, and `npm run check:minimal` passes against the real `apps/minimal/dist`.
- [x] 3.4 Point `scripts/size-report.mjs`, `scripts/check-minimal-bundle.mjs`, the root scripts and CI at `apps/template/dist` and `apps/minimal/dist`; verify `npm run size` and `npm run size:minimal` write the same report files, compare against the unchanged budget values and exit zero.
- [x] 3.5 Update `.gitignore`, `.prettierignore` and `.oxlintrc.json` for app-local output, then update the CI and Pages workflows to reuse/upload `apps/template/dist` and `apps/minimal/dist`; verify no current ignore or workflow entry names root `dist/`/`dist-minimal/`, both YAML files still parse, and `npm run format:check` ignores only generated output.
- [x] 3.6 Replace the packed-artifact app markers `src/app/` and `src/demo/` in `scripts/lib/pack-check.mjs` with `apps/template/src/`, update its unit and CLI fixtures, and confirm the facade tarball still rejects template or preset content; verify `npm run test -- scripts/lib/pack-check.test.mjs scripts/check-workbench-pack.test.mjs` and `npm run pack:check` pass.

## 4. Product surfaces, demo tree and documentation

- [x] 4.1 Update the template demo data in `apps/template/src/demo/data/workspace.ts` — tree nodes, file keys, embedded package manifests, README excerpts and import snippets — so the explorer shows `apps/template`, `apps/minimal`, `packages` and the new root files; verify every displayed path exists on disk and `npm run typecheck` plus the template test pass.
- [x] 4.2 Update `README.md` and `apps/minimal/README.md` for the new commands, paths, workspace model and build outputs, including the architecture tree and the adoption-level section; verify every command and relative link in both files resolves and `npx prettier --check README.md apps/minimal/README.md` passes.
- [x] 4.3 Update `AGENTS.md`, `docs/architecture.md` and `ROADMAP.md` Phase 5 status to describe `apps/template` and `apps/minimal`, the root as a non-application host, the relocated boundary roots and the remaining `apps/custom-shell`/publish work; verify Prettier passes and every command named in `AGENTS.md` exists in the root or app `package.json`.
- [x] 4.4 Search the current tree for stale `examples/minimal`, root `src/`, `dist-minimal` and root-`vite.config` references in code, scripts, workflows, tests and documentation; verify no current behavior depends on them, with remaining mentions limited to `openspec/changes/archive/**`, this change's artifacts, and main specs awaiting the archive/sync.

## 5. Integration verification

- [x] 5.1 Run a clean install and the full gate: remove `node_modules`, run `npm ci`, then `npm run check`; verify lint, format, typecheck, boundaries, distribution, tests, both app builds and `pack:check` all pass.
- [x] 5.2 Run both size targets and the pack dry run: `npm run size`, `npm run size:minimal` and `npm pack --dry-run` from `packages/workbench`; verify both budgets pass unchanged, reports identify the new build paths, and the tarball still contains only the facade manifest, README and generated `dist/`.
- [x] 5.3 Start `npm run dev` and `npm run dev:minimal`, then preview both production builds; verify the template renders at 1440×900 and a narrow width with no body scroll, the minimal app still shows one tab, options sidebar and status bar, and Codicon assets load from each app's output.
- [x] 5.4 Review the final diff for accidental behavior changes; verify root has no `src/`, `index.html`, `vite.config.ts`, `dist/` or `dist-minimal/`, both app outputs are gitignored, and `git status` contains only the intended move, config, test, workflow and documentation changes.

## Workflow follow-up

- Archive this change after review and the full verification gate pass.
- Review the archived spec deltas against `openspec/specs/` and confirm `application-workspaces` was created with its purpose.
