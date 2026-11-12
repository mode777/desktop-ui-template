# Tasks

## 1. Workspace scaffold

- [x] 1.1 Add `"workspaces": ["packages/*"]` to the root `package.json`, add `@workbench-kit/{core,react,elements,styles-vscode,preset-vscode}` as `"*"` dependencies, and create the five `packages/*` directories with manifests declaring name, version `0.1.0`, `private: true`, `type: module`, `exports`, `files`, `sideEffects`, peer dependencies and workspace/runtime dependencies as designed; run `npm install` and verify `npm ls --workspaces --depth=0` lists all five links and `package-lock.json` contains the workspace entries.
- [x] 1.2 Add `tsconfig.base.json` with the shared compiler options and workspace `paths`, point `tsconfig.app.json` and `tsconfig.examples.json` at it, and add one `tsconfig.json` reference per package once its source exists; verify `npm run typecheck` still passes on the pre-move tree.
- [x] 1.3 Add `vite.workspace.ts` with the source aliases for the four JS packages and their subpaths, wire it into `vite.config.ts` and `examples/minimal/vite.config.ts`, add `vite.workspace.ts` to `tsconfig.node.json`, and add generated package output to `.oxlintrc.json` ignore patterns; verify `npm run typecheck`, `npm run test` and `npm run build:minimal` pass (the aliases are not yet required by imports).

## 2. Extract the core package

- [x] 2.1 Move `src/kit/core/**` to `packages/core/src/**`, add `packages/core/tsconfig.json`, add the package reference to the root `tsconfig.json`, update `src/kit/react` and `src/kit/preset-vscode` to import core helpers through `@workbench-kit/core`, and replace the core test's import of the preset `WorkbenchTab` with a package-local tab fixture; verify `npm run test -- packages/core`, the react/preset tests and `npm run typecheck` pass.
- [x] 2.2 Move the "preset tab type is assignable to core `TabLike`" compile-time assertion into `src/kit/preset-vscode` tests; verify the preset tests pass and `rg "preset-vscode" packages/core` reports no import.

## 3. Extract the React primitives package

- [x] 3.1 Move `src/kit/react/**` to `packages/react/src/**`, add `packages/react/tsconfig.json`, add the package reference to the root `tsconfig.json`, and update the preset's imports from `../react` to `@workbench-kit/react`; verify `npm run test -- packages/react`, the preset tests and `npm run typecheck` pass.
- [x] 3.2 Confirm the React package manifest declares core as a runtime dependency and React as a peer, then verify `npm ls react @workbench-kit/react @workbench-kit/core` shows one React copy and no duplicate workspace dependency.

## 4. Add per-tag element registration and typings

- [x] 4.1 Create `packages/elements/src/` with per-tag entries (`badge`, `button`, `collapsible`, `context-menu`, `icon`, `tab-header`, `tab-panel`, `textarea`, `textfield`), family entries (`tabs`, `tree`) and the aggregate `all` entry, each importing the matching `@vscode-elements/elements` deep module; add `packages/elements/tsconfig.json` and the root reference; add registration tests for a selective entry and the aggregate entry using jsdom's `customElements`; verify `npm run test -- packages/elements` passes and only the imported tags are registered in each test.
- [x] 4.2 Move `src/types/vscode-elements.d.ts` to `packages/elements/src/global.d.ts`, point the package `types` field at it, and load that declaration in `tsconfig.app.json` and `tsconfig.examples.json` (the workspace package cannot be resolved through the `types` array, so the file is included explicitly); verify `npm run typecheck` resolves the JSX typings from the package and no `src/types` path remains.
- [x] 4.3 Replace the template's `src/vscode-elements.ts` body with an import of `@workbench-kit/elements/all`, and change `examples/minimal/src/elements.ts` to import `@workbench-kit/elements/icon` and `@workbench-kit/elements/tab-header`; verify `npm run test -- examples/minimal`, `npm run build` and `npm run build:minimal` pass.

## 5. Extract the styles package

- [x] 5.1 Move `src/styles/{tokens,global,workbench}.css` to `packages/styles-vscode/src/`, add `packages/styles-vscode/src/index.css` importing the three in order, and declare the subpath and aggregate exports with `sideEffects` limited to CSS; verify the package manifest resolves every stylesheet and no selector from a demo view appears in the package.
- [x] 5.2 Update `src/main.tsx` and `examples/minimal/src/main.tsx` to import `@workbench-kit/styles-vscode/tokens.css`, `.../global.css` and `.../workbench.css`, delete `src/styles`, and verify `npm run typecheck`, `npm run build`, `npm run build:minimal` and both apps' visual smoke checks still render the same tokens and layout.

## 6. Extract the preset package

- [x] 6.1 Move `src/kit/preset-vscode/**` to `packages/preset-vscode/src/**`, add `packages/preset-vscode/tsconfig.json` and the root reference, rewrite internal core/react imports to package names, move `zustand` to the preset manifest's runtime dependencies, declare React/React DOM peers, update `src/app/**`, `src/demo/**` and `src/main.tsx` to import through `@workbench-kit/*`, and delete the remaining `src/kit` directory; verify `npm run typecheck`, `npm run test` and `npm run build` pass with no relative `src/kit` import left.
- [x] 6.2 Add `packages/preset-vscode/src/elements.ts` importing the badge, button, context-menu, icon, tabs and textfield registrations, import it for its side effect from the package `index.ts`, and add a registration test proving those tags are registered by the package root while tree, collapsible and textarea remain unregistered; verify the preset package tests pass.
- [x] 6.3 Replace the preset store test's demo fixtures with package-local tabs, active tab and output lines; verify `npm run test -- packages/preset-vscode` passes and `rg "src/demo" packages/preset-vscode` finds no import.

## 7. Build the packages

- [x] 7.1 Add `tsconfig.build.json` for core, React, elements and the preset with `declaration`, `outDir: "./dist"`, `rootDir: "./src"`, tests excluded, `paths` cleared and `allowImportingTsExtensions` disabled; add `build:packages` in dependency order and make the root `build` run it before `tsc -b` and `vite build`; verify a clean `rm -rf packages/*/dist && npm run build:packages` emits `.js` and `.d.ts` for every declared entry.
- [x] 7.2 Verify the built package output contains no `src/app`, `src/demo`, template branding or relative path that escapes its own package; run `npm run build` and `npm run build:minimal` and confirm both applications still build from source aliases.

## 8. Migrate the minimal example and composition check

- [x] 8.1 Update `examples/minimal/src/App.tsx`, `main.tsx`, `elements.ts` and `README.md` to use `@workbench-kit/react`, `@workbench-kit/core`, the element entries and the styles package; verify `npm run test -- examples/minimal`, `npm run build:minimal` and `npm run dev:minimal` still render one tab, one sidebar and the status bar with no preset store.
- [x] 8.2 Change the composition check's forbidden module prefixes from `src/kit/preset-vscode/` to `packages/preset-vscode/`, update the clean/leak fixtures and module paths in `scripts/lib/bundle-composition.test.mjs`, and verify `npm run test -- scripts` and `npm run check:minimal` pass while a temporary preset import still fails the check.

## 9. Enforce the workspace boundary model

- [x] 9.1 Update `boundaries.json` with the `packages` root, one layer per package, the `workspacePackages` map and the adjusted app/demo/example rules; extend `scripts/lib/boundaries.mjs` to map package-name imports to their target layer and to fail package-relative imports with the new `package-relative-import` rule; verify `npm run check:boundaries` reports zero violations on the migrated tree and that a deliberate `packages/core` → `@workbench-kit/preset-vscode` import fails with file, line and rule.
- [x] 9.2 Rewrite the checker fixtures from `src/kit`/`src/styles` to package paths, add cases for allowed package imports, forbidden package imports, allowed subpath imports, cross-package relative imports and in-package relative imports, and verify `npm run test -- scripts` plus `npm run check:boundaries` pass.

## 10. Update documentation and the mock workspace

- [x] 10.1 Update `README.md` with the workspace layout, package entry points, element and styles imports, the dependency-boundary table and the note that package `dist/` is not a size target; verify no `src/kit`, `src/styles` or `src/types` path remains and every documented command runs as written.
- [x] 10.2 Update `AGENTS.md` architecture rules, commands, element-registration guidance and test locations to the package layout; verify the documented paths exist and no stale kit path remains.
- [x] 10.3 Update `ROADMAP.md` Phase 1/2/3 links to `packages/*`, mark Phase 5 as partially delivered by this change, and state that app relocation, custom-shell, packing validation and publishing remain; verify the Phase 5 status matches the actual repository layout.
- [x] 10.4 Update `src/demo/data/workspace.ts` — the explorer tree, mock package manifest, import snippets and README excerpts — and `examples/minimal/README.md` to the workspace paths; verify the displayed tree contains only paths that exist and `npm run typecheck` still passes.

## 11. Integration verification

- [x] 11.1 Run a clean `npm ci` followed by `npm run check` and confirm lint, formatting, workspace typecheck, boundaries, tests, template build, minimal build and the minimal composition check all pass with zero violations.
- [x] 11.2 Run `npm run size` and `npm run size:minimal` and confirm both targets stay within their existing budgets; if either moves outside tolerance, investigate before changing a budget file and record the reason if the change is intentional.
- [x] 11.3 Run `npm ls react react-dom zustand @vscode-elements/elements` and confirm each dependency resolves to a single workspace copy with no invalid peers.
- [x] 11.4 Verify the template and minimal example by hand at 1440×900 and a narrow width: regions, tabs, menus, quick open, notifications, resize, theme, persisted layout, minimal options sidebar and no body scroll or console errors.
- [x] 11.5 Confirm `git status` shows the regenerated lockfile, no committed package `dist/` output and no stale `src/kit`, `src/styles` or `src/types` references in tracked files.

## Workflow follow-up

- Archive the change after review and merge.
- Verify the archived specs and the updated `ROADMAP.md` Phase 5 status line after archiving.
