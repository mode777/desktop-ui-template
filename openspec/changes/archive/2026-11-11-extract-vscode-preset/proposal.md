# Proposal

## Why

Phase 2 produced `WorkbenchShell`, `ResizablePane` and `TabStrip`, but the composed VS Code-style workbench still exists only as the template application: `src/layout/Workbench.tsx` and its region components import the demo views, mock workspace data, app menus, commands and the store directly. A consumer can use a primitive, but nobody can use the assembled shell without also shipping Explorer, Chat, Terminal, the mock tree and the template's branding — the exact limitation Phase 3 of `ROADMAP.md` exists to remove.

Extracting the preset now is the next step in the `ROADMAP.md` §8 sequence and is the precondition for the minimal example: once the preset receives its views, commands, menus and file data as props, a small app can drive the same shell with one tab and one options sidebar.

## What Changes

- Add `src/kit/preset-vscode`, the composed preset layer:
  - `VSCodeWorkbench`, the composition root that replaces `src/layout/Workbench.tsx`: reads the preset's default layout store, resolves region visibility against the supplied configuration and composes `WorkbenchShell` with the preset region components.
  - Preset-owned region components moved from `src/layout/components` and parameterized so demo content arrives through props: title bar/menu bar (menus, branding, command runner), activity bar, primary/secondary side bar and bottom panel (view registry, command runner), editor area (document renderer, file icons, command runner), quick open (files, open handler, command registry) and notifications.
  - The default workbench store moved from `src/store`, including persistence, with the demo-specific initial data (initial tabs, startup output lines) supplied by the app instead of seeded by the module.
  - A generic default command set for file/tab actions, quick open, region toggles, theme and layout reset, merged with the app's commands through one registry the preset can run by id.
  - Preset-level types (`WorkbenchConfig`, `ViewDefinition`, `WorkbenchTab`, command and menu shapes) that use string view identifiers instead of the template's view unions.
- Move app/demo surfaces out of the kit's way:
  - `src/views/**` → `src/demo/views/**`, `src/commands/**` → `src/demo/commands/**`, `src/data/workspace.ts` → `src/demo/data/workspace.ts`, `src/components/FileTree.tsx` → `src/demo/components/FileTree.tsx`.
  - `src/layout/workbench.config.ts` → `src/app/workbench.config.ts`; `src/layout/components/StatusBar.tsx` → `src/app/components/StatusBar.tsx` (the preset accepts it as a slot).
  - `src/layout/components/IconButton.tsx`, `VsContextMenu.tsx` → the preset's internal components; `src/hooks/use-workbench-hotkeys.ts` → `src/app/use-workbench-hotkeys.ts` (shortcut policy is app policy).
  - Delete `src/layout`, `src/store`, `src/hooks` and the remaining `src/components` layer once their files have moved.
- Make the template a preset consumer: `src/app/App.tsx` composes `VSCodeWorkbench` with the template's config, view registry, menus, command registry, quick-open files, document renderer, file icon resolver, branding and status bar. Visible behavior, keyboard shortcuts, persisted layout and class names stay identical.
- Update `boundaries.json` and the boundary tests to the new layer model (kit core/react/preset plus app and demo), and update `AGENTS.md`, `README.md`, `ROADMAP.md` and the mock explorer tree/documents in `src/demo/data/workspace.ts` to the new paths.

**BREAKING** (internal, not published): `src/layout`, `src/store`, `src/hooks` and `src/views` no longer exist, and the workbench store is now exported by the preset rather than by `src/store`.

Not included: extracting `Sidebar`, `Panel`, `StatusBar`, `TitleBar` and `MenuBar` as controlled `kit-react` primitives (the preset keeps generic region implementations for now), `kit/elements` registration splitting, CSS relocation or `wb-*` renaming, the minimal example, workspace/package migration, any visual redesign, and any change to what the shell renders.

## Capabilities

### New Capabilities

- `preset-vscode`: the composed VS Code-style workbench preset — its injection contract, region composition, default store and commands, application independence, and unchanged visual/behavioral contract.

### Modified Capabilities

- `dependency-boundaries`: the declared layer model changes from `layout`/`views`/`commands`/`store`/`data`/`components`/`hooks` to kit layers plus `app` and `demo`, and the kit-preset layer gains an explicit rule that it may own its store and generic regions but never import demo or app modules.

## Impact

- New code: `src/kit/preset-vscode/**` (`VSCodeWorkbench.tsx`, `types.ts`, `store/`, `commands/`, `components/`, `index.ts` and colocated tests).
- Moved code: the region components, store, icon button, context menu, views, commands, mock data, file tree, config and hotkeys listed above; imports updated across the tree.
- Modified code: `src/app/App.tsx` (composes the preset), `src/main.tsx` (initialization entry point if needed), `src/demo/views/registry.tsx` (string-keyed registry and app view-id unions), `boundaries.json`, `scripts/lib/boundaries.test.mjs` and `scripts/check-boundaries.test.mjs` fixtures, `src/demo/data/workspace.ts`.
- Unchanged: `WorkbenchShell`/`ResizablePane`/`TabStrip` behavior, `src/styles/*` class contract, `budgets.json`, persistence key `desktop-ui-template:v1` and its version, bundled custom elements.
- Expected size effect: neutral; code moves between layers and the template still imports everything it renders. `npm run size` must stay inside the recorded tolerance.
- Docs: `AGENTS.md` architecture rules, `README.md` customization paths, `ROADMAP.md` Phase 3 status.
