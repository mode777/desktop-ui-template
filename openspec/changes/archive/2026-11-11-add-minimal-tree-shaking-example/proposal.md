# Proposal

## Why

The kit layers now exist, but nothing consumes them without the preset. The template imports every demo view, command and mock file, so the claim that a small app can ship only a tab and a sidebar is still untested, and the only recorded bundle baseline is the full preset. Phase 4 of `ROADMAP.md` exists to turn that claim into a measured, CI-enforced canary before the workspace migration makes the boundaries expensive to change.

## What Changes

- Add `examples/minimal`, a transitional app (before Phase 5 workspaces) that builds one tab, one options sidebar and an optional status bar from `kit/react` primitives plus `kit/core` helpers only. It must not import the preset, `src/app` or `src/demo`, and it registers only the vscode-elements tags it renders.
- Give the example its own Vite entry, HTML shell, TypeScript project and `dist-minimal` output, with generated output and reports ignored by version control and formatting.
- Extend the size tooling so it can build and measure a second application: configurable build command and output directory, a separate `budgets.minimal.json` baseline and a separate report, while keeping the existing full-preset behavior unchanged.
- Record the minimal app's baseline from its first measured build and gate its gzipped JavaScript in CI. The report must state the minimal-to-full ratio and the gzip headroom, and the budget is hard-failing on JavaScript like the full preset.
- Add a composition check that inspects the minimal production build's Vite manifest and JavaScript output, failing when any `src/demo`, `src/app` or `src/kit/preset-vscode` module, demo view marker or demo workspace marker is present. This verifies the elimination structurally, not by trusting the bundler.
- Extend the boundary declaration and checker to scan `examples/` and declare a minimal-example layer that may import `kit-core`, `kit-react` and React, but not `kit-preset`, `app` or `demo`.
- Add `build:minimal`, `check:minimal` and `size:minimal` scripts, include the build and composition check in `npm run check`, and run the minimal size gate and artifact upload in CI.
- Document the three adoption levels using the example: root `README.md` gets a short section and `examples/minimal/README.md` explains what the example imports, what it leaves out and what the recorded budget proves. Update `ROADMAP.md` Phase 4 status once implemented.

**BREAKING** (internal, not published): `examples/minimal` becomes the first consumer outside `src/`, so the boundary checker's single-root assumption and the size tooling's single-build assumption are removed.

Not included: npm/pnpm workspaces and `packages/*` (Phase 5), extracting `kit/elements` or per-component CSS, the `custom-shell` example, a CSS-splitting refactor, publishing, any change to the template's visuals or the preset's public API, and any Playwright/visual regression work.

## Capabilities

### New Capabilities

- `minimal-example`: the project ships a minimal, non-preset example app that composes primitives into one tab and one options sidebar, proves that demo and preset code is absent from its production bundle, and carries an enforced size budget.

### Modified Capabilities

- `bundle-size-budget`: measurement, baseline, reporting and the JavaScript growth gate must support more than one build target with its own output directory, budget file and report, and the minimal target must be gated in CI.
- `dependency-boundaries`: the declared layer model and checker must cover `examples/` as a source root, with a minimal-example layer that may use kit primitives but never the preset, app or demo layers.

## Impact

- New code and assets: `examples/minimal/{index.html,src/main.tsx,src/App.tsx,src/*.css,vite.config.ts,tsconfig.json,README.md}` plus any small example-only components; `budgets.minimal.json`.
- New tooling: a manifest/marker-based bundle composition check (for example `scripts/check-minimal-bundle.mjs` and a `scripts/lib/` module with tests); extended flags in `scripts/size-report.mjs`.
- Modified code: `boundaries.json` (extra scan root and the minimal-example layer), `scripts/check-boundaries.mjs` and `scripts/lib/boundaries.mjs` for multiple roots, `package.json` scripts and TypeScript project references, `tsconfig.json`, `.gitignore`, `.prettierignore`, `.github/workflows/ci.yml`.
- Docs: `README.md` (minimal example and adoption levels), `examples/minimal/README.md`, `ROADMAP.md` Phase 4 status.
- Unchanged: `src/kit/**` public components and behavior, the template's `dist/` and `budgets.json` baseline, the preset's dependency set, persistence keys and styling contract.
- Expected size effect: none for the full preset; the minimal app adds a second build that should be materially smaller in JavaScript than the full preset, with the measured value recorded rather than guessed.
- Risk: React and the vscode-elements deep imports dominate the minimal bundle, so the first measured baseline may not reach the roadmap's suggested one-third target; the plan records and explains the actual value instead of forcing an unattainable budget.
