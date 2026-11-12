# Design

## Context

See `proposal.md` for motivation. The relevant current state:

- `src/kit/react` exports `WorkbenchShell`, `ResizablePane` and `TabStrip`; `src/kit/core` owns the resize and tab math they use.
- The template entry (`src/main.tsx`) imports `src/vscode-elements.ts`, which registers every custom element the template uses, then the three stylesheets and `src/app/App.tsx`.
- `scripts/size-report.mjs` builds with the hard-coded `npm run build`, measures the hard-coded `dist/` and writes `size-report.json` against `budgets.json`.
- `scripts/check-boundaries.mjs` collects source files from the single `root` path in `boundaries.json` (`src`) and checks them against repo-relative include globs.
- Vite supports a separate config per entry, `build.manifest`, `publicDir` and `outDir`, so a second app can be built without workspaces or package-manager changes.
- The template's styles are one aggregate stylesheet; component-level CSS splitting is not part of this phase.

## Goals / Non-Goals

**Goals:**

- Build a real second application that imports only `kit-core`, `kit-react`, React and two custom-element tags.
- Make its size and its composition check first-class verification targets, with their own baseline and CI visibility.
- Prove the absence of preset/app/demo code from the emitted bundle, not just from the source imports.
- Keep the template's build, budget and behavior untouched.

**Non-Goals:**

- Workspace/package extraction, `packages/*`, publishing or versioning (Phase 5).
- Splitting `workbench.css`, introducing `kit/elements` or renaming classes.
- A `custom-shell` example, routing, SSR, persistence or a preset store in the example.
- Replacing the full preset with the minimal example in deployment.

## Decisions

### 1. Transitional location: `examples/minimal`

Use `examples/minimal` rather than `apps/minimal`. Phase 5 introduces npm workspaces and moves examples under `apps/`; creating `apps/` now implies workspace layout that does not exist. Vite can point a config at `examples/minimal` and emit to the repo-root `dist-minimal` without workspaces.

**Alternative rejected:** put the example under `src/` so the existing single-root boundary check just works. That would ship an example in the template's source graph and blur the app/example separation the canary is supposed to prove.

### 2. Composition level, not the preset

`examples/minimal/src/App.tsx` uses `useState` for the tab list/active tab and the sidebar width, and composes:

- `WorkbenchShell` with `primarySideBar`, `statusBar` and the center content.
- `ResizablePane side="left"` around an options panel (min 180, max 420, initial 240).
- `TabStrip` with exactly one non-closable tab; the callbacks update the local active id and are no-ops for close/reorder because there is one tab.

No `useWorkbenchStore`, no command registry, no quick open, no notifications. This is the point of the example: consumer-owned state plus controlled primitives.

The status bar is a plain `<footer className="statusbar">` with two static items, proving the slot works without preset state. It is included in the example; the shell still supports omitting it.

**Alternative rejected:** use `VSCodeWorkbench` with every optional region disabled. The preset statically imports quick open, notifications, all region components and the store, so it cannot prove primitive-level adoption and would defeat the composition check.

### 3. Element registration stays local to the example

`examples/minimal/src/elements.ts` imports only:

- `@vscode-elements/elements/dist/vscode-tab-header` (required by `TabStrip`)
- `@vscode-elements/elements/dist/vscode-icon` (tab icon and status bar icon)

It does not import `src/vscode-elements.ts`, `vscode-tree`, `vscode-tabs`, `vscode-context-menu`, `vscode-textfield`, `vscode-textarea`, `vscode-button`, `vscode-collapsible` or `vscode-badge`. `kit/elements` extraction remains a later phase; the example demonstrates the per-tag import rule directly.

The example's `index.html` includes the Codicon `<link>` with `id="vscode-codicon-stylesheet"`, because `vscode-icon` reads it inside shadow roots. It uses a relative `./codicons/codicon.css` href so the build works under a subpath, and Vite copies the existing `public/` directory via `publicDir`.

### 4. Shared CSS, JavaScript-only canary

The example imports `src/styles/tokens.css`, `src/styles/global.css`, `src/styles/workbench.css` and a small `examples/minimal/src/minimal.css` for the options panel and document placeholder. This reuses the structural class contract (`workbench`, `workbench-body`, `workbench-center`, `editor-tabs`, `resizable-pane`, `statusbar`) without copying or renaming styles.

Consequence: the example's CSS is the same aggregate stylesheet as the template, so its CSS budget is not expected to shrink. The canary proves JavaScript module elimination; CSS modularity is explicitly deferred to the per-component CSS work in `ROADMAP.md` §"Later — hardening". The minimal budget records CSS but keeps the existing advisory behavior, while JavaScript is hard-failing.

**Alternative rejected:** duplicate the structural CSS in the example. It would make the CSS number look better while hiding the real coupling, and would drift from the template.

### 5. Separate Vite config, output and TypeScript project

Add `examples/minimal/vite.config.ts`:

- `root` = the example directory, `base: './'`.
- `publicDir` = repo-root `public` so Codicon assets are copied.
- `build.outDir` = repo-root `dist-minimal`, `emptyOutDir: true`, `manifest: true` (the manifest is required by the composition check), `chunkSizeWarningLimit` aligned with the template config.
- React plugin and the same jsdom/test setup are not needed; the example has no Vitest suite of its own beyond library-level tests.

Add `examples/minimal/index.html` and `examples/minimal/src/main.tsx` (elements, tokens, global, workbench, minimal CSS, then `App`).

TypeScript:

- New `tsconfig.examples.json` with the same strict options as `tsconfig.app.json`, `include: ["examples/minimal/src", "src/types"]` and a distinct `tsBuildInfoFile`.
- `tsconfig.node.json` includes `examples/minimal/vite.config.ts` alongside the root config.
- Root `tsconfig.json` references the new project so `npm run typecheck` covers the example.

Generated paths: `dist-minimal/` and `size-report.minimal.json` are gitignored; `dist-minimal` is added to `.prettierignore`; verify oxlint does not scan the generated directory (add an ignore pattern only if it does).

### 6. Size tooling becomes target-aware

Extend `scripts/size-report.mjs` rather than duplicating it:

- `--target <name>` (default `full-preset`) recorded in the report and printed in the table/summary heading.
- `--dist <dir>` (default `dist`) for the asset directory and "other files" collection.
- `--build <script>` (default `build`) to run `npm run <script>`; `--no-build` still reuses `--dist`.
- Existing `--budget`, `--report`, `--summary` keep working.

Keep the comparison logic in `scripts/lib/size-report.mjs` unchanged except for optional target plumbing, so the existing tests and tolerance semantics remain. The default invocation stays byte-identical for the full preset.

New scripts:

```json
"prebuild:minimal": "node scripts/sync-codicons.mjs",
"build:minimal": "vite build --config examples/minimal/vite.config.ts",
"check:minimal": "node scripts/check-minimal-bundle.mjs",
"size:minimal": "node scripts/size-report.mjs --target minimal-example --build build:minimal --dist dist-minimal --budget budgets.minimal.json --report size-report.minimal.json"
```

`npm run check` gains `build:minimal` and `check:minimal` after the template build, so a local check produces both bundles and validates composition. CI then runs `size:minimal -- --no-build --summary "$GITHUB_STEP_SUMMARY"` and uploads both reports, mirroring the existing full-preset step.

### 7. `budgets.minimal.json` records the measured baseline

Same shape as `budgets.json` with its own `baseline` label, `recordedAt`, tolerance (1 % / 1024 B) and `enforcement` (`js: fail`, `css: warn`). Values are filled from the first successful measurement, not guessed. The README states the measured value and the minimal/full gzip ratio. If the ratio is above the roadmap's suggested one-third, the documentation explains the dominant cost (React and the custom elements) and records the actual baseline; the gate still prevents regressions.

### 8. Composition check from the manifest plus markers

Add `scripts/lib/bundle-composition.mjs` with a pure function that takes the parsed manifest and emitted JavaScript texts and returns violations. The CLI `scripts/check-minimal-bundle.mjs` reads `dist-minimal/.vite/manifest.json` and every `.js` asset.

Hard checks:

- The build emits `.vite/modules.json` from a small Vite plugin, because Vite 8's manifest does not list contributing modules. Manifest keys, `chunk.src`, `chunk.file` and every id in the module inventory must not resolve to `src/demo/`, `src/app/` or `src/kit/preset-vscode/`.
- Emitted JavaScript must not contain demo/preset markers: `explorer-view`, `terminal-view`, `chat-view`, `welcome-view`, `quick-open-overlay`, `Desktop UI Template`. These are class names and brand strings that only demo or preset modules emit.
- The manifest must exist and list the example's entry, and the module inventory must be non-empty, so a missing file is a failure rather than a silently skipped check.

The check reports the forbidden module or marker and the asset that contains it. Unit tests cover clean bundles, forbidden manifest modules, marker-only leaks and a missing manifest.

**Alternative rejected:** grep the minified bundle for module names only. Minification and inlining can hide paths, so the manifest supplies the structural answer and markers catch the behavioral leak.

### 9. Boundary model: a second source root and an example layer

Extend `boundaries.json`:

```json
"roots": ["src", "examples/minimal/src"]
```

Keep `root` supported for backward compatibility in the checker; prefer `roots` when present. The checker collects sources from every root and passes one combined list to `checkBoundaries`, so layer resolution and reporting stay unchanged.

Add a layer:

```json
{
  "name": "example-minimal",
  "description": "Minimal example app: primitives and core only, never the preset, app or demo layers.",
  "include": ["examples/minimal/src/**"],
  "mayImport": ["kit-core", "kit-react"],
  "allowedExternals": ["react", "react-dom", "@vscode-elements/elements"]
}
```

`examples/minimal/src` is the root rather than `examples` so the Vite config (which imports `node:url`/`vite`) and HTML are not treated as browser source. This is a deliberate, documented boundary: build tooling is not application source. Cross-root relative imports (`../../src/kit/react`) resolve to the kit layers and are checked normally.

The checker's CLI reads `config.roots` and loops its collector; tests get a second root fixture and a case where `examples/minimal/src` imports `src/kit/preset-vscode` (must fail) and `src/kit/react` (must pass).

### 10. Documentation and roadmap

- `README.md`: a "Minimal example" section under the project structure/architecture area, with the exact commands, the three adoption levels, the measured numbers and the link to the example.
- `examples/minimal/README.md`: what it renders, which imports prove the level, what is deliberately absent, how to run/build it and how to grow it into the preset.
- `ROADMAP.md`: Phase 4 status becomes done with the measured result and a link to the example; no change to later phases.

## Risks / Trade-offs

- **React/Lit dominate the minimal bundle** → Record the real baseline, report the ratio, explain the dominant cost in the README, and keep the gate on gzipped JavaScript. Do not force a one-third budget that cannot pass.
- **Shared aggregate CSS means CSS does not shrink** → State the JavaScript-only scope in the example README and keep CSS advisory; CSS splitting remains a later roadmap item.
- **Vite manifest paths vary by version or platform** → Normalize separators before prefix matching and cover both manifest keys and `modules` keys in tests; the check fails clearly if the manifest is absent.
- **Boundary scanning accidentally includes build config** → Use `examples/minimal/src` as the root; document why and add a test that `vite.config.ts` is outside the checked root.
- **Example drifts from the template styles** → Reuse the real stylesheet and structural class names; the example README lists the contract classes it relies on.
- **`build:minimal` forgets Codicon assets** → Add `prebuild:minimal` and verify icons in the built output; the composition check does not treat missing fonts as a pass.
- **CI time grows by a second build** → The minimal build is small and Vite reuses the same dependency graph; keep the existing "build once in check, measure with `--no-build`" pattern.

## Migration Plan

1. Land the example, tooling and boundary changes together so the gate is never half-wired.
2. Record the baseline from the first successful build, then enable the CI size step.
3. No runtime or data migration: the template continues to deploy `dist/`; the example is a verification artifact.
4. Rollback is deleting `examples/minimal`, the new scripts/budget/report entries, the extra boundary root and layer, and the CI step; no public API or persistence changes are involved.

## Open Questions

None. The example's measured ratio is determined during implementation; it changes the recorded number, not the approach or the specs.
