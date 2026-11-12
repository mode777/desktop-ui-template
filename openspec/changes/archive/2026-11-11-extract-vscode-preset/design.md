# Design

## Context

See `proposal.md` — Why. Current state that shapes the approach:

- `src/layout/Workbench.tsx` is the composition root. It reads seven store flags plus `panelMaximized`, resolves them against `workbenchConfig`, and renders `TitleBar`, `ActivityBar`, primary `ResizablePane` + `Sidebar`, `WorkbenchShell` center with `EditorArea` and the panel `ResizablePane` + `BottomPanel`, secondary `ResizablePane` + `SecondarySideBar`, `StatusBar`, then `QuickOpen` and `Notifications`.
- Every region component imports app modules directly: `Sidebar`/`SecondarySideBar` read `src/views/registry`, `BottomPanel` reads `panelViews`, `EditorArea` renders `DocumentView` and imports `src/data/workspace` icon helpers, `QuickOpen` imports `commandList`, `openFileTab` and `workspaceFiles`, `TitleBar`/`MenuBar` import `src/commands`, and all of them use `useWorkbenchStore`.
- `src/store/workbench-store.ts` is a module-level Zustand singleton persisted under `desktop-ui-template:v1` (version `1`). It imports `workbenchConfig` only for size clamping and initial layout values, seeds three demo tabs and four startup output lines, and is read from outside React through `useWorkbenchStore.getState()` in commands, hooks and views.
- `src/commands/commands.ts` mixes generic workbench actions (file/tab/view toggles, quick open, theme, layout reset) with demo actions (Explorer/Search/Run/Help/Chat). `src/commands/menus.ts` references both.
- `boundaries.json` already declares `kit-core`, `kit-react`, `kit-elements` and `kit-preset`; `layout` may import `kit-react`, and `kit-preset` may import kit layers but not `views`, `commands`, `store` or `data`.
- `src/styles/workbench.css` styles today's class names (`workbench`, `workbench-body`, `workbench-center`, `titlebar`, `activitybar`, `sidebar`, `editor-area`, `panel`, `statusbar`, `quick-open*`, `notification*`); the visual contract depends on preserving the markup shape exactly.
- Bundle baseline: 417,839 B raw / 115,252 B gzip JS and 44,445 B / 8,147 B CSS with a 1 % / 1024 B JS tolerance. Analysis only moves code, so the app's bundle should stay inside tolerance.

## Goals / Non-Goals

**Goals:**

- A preset a consumer can mount with one element and its own views, commands, menus, files, renderer, icons and branding.
- Template behavior, appearance, shortcuts and persisted layout unchanged.
- A layer model where the preset cannot reach app or demo code, and demo code reaches the preset only through documented exports.

**Non-Goals:**

- Turning the region components into controlled `kit-react` primitives; they stay preset implementations driven by the preset store.
- Context-based store injection, store slices or a store-agnostic command runtime. The preset owns one default store, which is what Phase 3 promises.
- Splitting `src/vscode-elements.ts` registration or the stylesheets; both stay app-level.
- Changing any rendered text, class name, shortcut, menu structure or persistence format.

## Decisions

### 1. One `VSCodeWorkbench` element with an explicit injection contract

```tsx
interface VSCodeWorkbenchProps {
  config: WorkbenchConfig
  views: WorkbenchViewRegistry // { primary, secondary, panel } of ViewDefinition
  commands: WorkbenchCommandRegistry // { list(), run(id) }
  menus: MenuDefinition[]
  fileIcons?: FileIconResolver // { icon(path), iconClass?(path) }
  quickOpen?: { files: QuickOpenFile[]; openFile(path: string): void }
  renderDocument?: (tab: WorkbenchTab) => ReactNode
  emptyEditor?: ReactNode
  branding?: { title: string; subtitle?: string; icon?: string; onActivate?: () => void }
  statusBar?: ReactNode
  initialTabs?: WorkbenchTab[]
  initialActiveTabId?: string | null
  initialOutputLines?: string[]
}
```

The preset composes the shell, resolves visibility and renders the regions from these props. A prop object is preferred over a provider tree because the composition root is a single element, the props are static for a session, and consumers can see the whole contract in one place. Alternatives considered:

- **React context/provider** — better for nested opt-in configuration, but this preset is mounted once and already owns its store; context would add indirection and a second way to pass the same data.
- **Default config imported from the preset** — would bake demo regions and view ids into the kit, the exact coupling this change removes.
- **Render-prop regions** — defeats the purpose; the consumer would rebuild the shell.

### 2. The preset owns its default store; consumers read it through documented exports

The store moves to `src/kit/preset-vscode/store` unchanged in shape: same actions, same persisted subset, same key and version. `VSCodeWorkbench` selects state from it, and the preset exports `useWorkbenchStore`, `WorkbenchTab`/notification types and the command helpers so demo views, demo commands and the app status bar can subscribe and mutate the same instance.

Alternatives considered:

- **Keep the store in the app and inject it** — would force every preset region to take store callbacks or a context, and would make the preset unusable without the app writing a store; the roadmap explicitly allows an optional default store at preset level.
- **Factory + context provider** — cleaner in theory but requires rewriting module-level command/view access (`getState()` outside React) into injected instances, a much larger refactor with no Phase 3 requirement. Deferred until the store-slices/hardening work.

The preset therefore remains a convenience layer: primitives stay controlled and store-free.

### 3. The preset store loses its dependency on the app configuration

`setPrimarySideBarWidth`, `setSecondarySideBarWidth` and `setBottomPanelHeight` currently clamp with `workbenchConfig`. After the move they store the reported size, because the only caller is `ResizablePane`, which already guarantees the clamp and reports a clamped size (documented in `react-primitives`). `createLayoutDefaults()` uses preset constants equal to today's config values (300/330/230); the configuration still supplies `min`/`max` to the panes and the reset value used by `onReset`.

Alternatives considered: pass the app config into a store factory (reintroduces app coupling and singleton initialization order), or keep a configured bounds object (mutable global state for a safety net the pane already provides).

The existing store test that asserts clamping moves to the preset test suite and now asserts that the pane clamps (or is narrowed accordingly); the reset test keeps asserting the preset defaults.

### 4. Demo content moves into the preset only through props

Concretely:

| Preset responsibility                                        | Consumer-supplied input                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| Editor area markup, tab strip, breadcrumbs, tab context menu | `renderDocument`, `fileIcons`, `emptyEditor`, command runner |
| Quick open dialog, filtering, keyboard handling              | `quickOpen.files`, `quickOpen.openFile`, command registry    |
| Title bar, menu bar, layout controls                         | `branding`, `menus`, command runner                          |
| Activity bar, side bars, panel, notifications                | `config`, `views`, command runner                            |
| Layout state, persistence, region sizing                     | `initialTabs`, `initialActiveTabId`, `initialOutputLines`    |

`StatusBar` stays in the app and is passed through the `statusBar` slot: it contains the template's brand, mock git state and mock cursor values, and forcing it into the preset would bake branding into the kit. `use-workbench-hotkeys` also stays in the app because its key map is app policy; `App` calls it next to the preset.

### 5. Commands are split by ownership and recombined by the consumer

The preset ships a default command list for generic workbench behavior, keeping today's ids: `file.new/open/save/saveAll/close/closeAll/reopen`, `view.commandPalette/quickOpen/toggle*/toggleTheme/resetLayout`, `tab.close/closeOthers/closeAll`. The demo layer keeps everything that names a demo view, file, menu or brand (`view.explorer`, `run.*`, `help.*`, `explorer.*`, `edit.*`, …).

`src/demo/commands/registry.ts` builds one registry by composing the preset defaults with the demo commands and exposing `list()`/`run(id)`. The demo layer owns the merged registry so demo views, menus and the app status bar import one module without creating an app↔demo cycle; the preset receives the registry as a prop and never imports it. `run(id)` returns `false` for unknown ids, preserving today's `runWorkbenchCommand` behavior.

### 6. String view identifiers in the preset contract, unions in the demo layer

`WorkbenchConfig`, `ViewDefinition`, `ActivityItem` and the store's active-view fields use `string` ids in the preset. The demo layer keeps `PrimaryViewId`/`SecondaryViewId`/`PanelViewId` unions next to its registry and config so the template retains compile-time checks.

Region lookups fall back to the first configured id present in the registry and skip ids the registry does not define, instead of indexing blindly. That removes a crash path for consumers without changing today's output, because the template's config and registry always agree.

### 7. Target in-repo layout and layer model

```text
src/
  kit/
    core/                 (unchanged)
    react/                (unchanged)
    preset-vscode/
      VSCodeWorkbench.tsx
      types.ts
      store/              workbench-store, workbench-types, tests
      commands/           default command list + registry helpers
      components/         TitleBar, MenuBar, ActivityBar, Sidebar, BottomPanel,
                          SecondarySideBar, EditorArea, QuickOpen, Notifications,
                          IconButton, VsContextMenu
      index.ts
  app/
    App.tsx
    workbench.config.ts
    use-workbench-hotkeys.ts
    components/StatusBar.tsx
  demo/
    views/                (registry + view components + DocumentView)
    commands/             (commands.ts, menus.ts, registry.ts)
    components/FileTree.tsx
    data/workspace.ts
  styles/                 (unchanged)
  main.tsx, vscode-elements.ts, types/
```

`boundaries.json` drops the `layout`, `views`, `commands`, `store`, `data`, `components` and `hooks` layers and gains `app` (composition root, config, status bar, hotkeys) and `demo` (views, commands, menus, file tree, mock data). `kit-preset` keeps importing kit layers only and adds `zustand` to its allowed externals because its default store uses it. `demo` may import `demo`, `kit-preset`, `kit-react` and `kit-core`; `app` keeps `"*"`. The boundary unit-test fixtures that reference `src/views`, `src/store`, `src/data` and `src/layout` are rewritten to the new paths.

### 8. First-run seeding is keyed on storage presence, not empty state

The preset store starts with no tabs and a generic output line. `VSCodeWorkbench` seeds `initialTabs`, `initialActiveTabId` and `initialOutputLines` once, only when the persistence key is absent, so a user who closed every tab keeps an empty session after reload. Persisted sessions written by the template before extraction are read by the same key/version and therefore restore as before.

### 9. Parameterize in place, then move

Moving `src/layout` into the preset before it stops importing demo modules would leave an intermediate tree that fails the boundary check (a kit-preset module importing `views`/`data`). The order is therefore: split commands, decouple the store, parameterize the regions and composition root in place behind unchanged behavior, then move the files and update the declaration in one step, then switch the app and documentation. Each stage keeps `npm run check` green and is independently revertible.

## Risks / Trade-offs

- **Silent behavior drift during the move** → Do the moves as renames without logic edits, run the full check after each stage, and compare the template visually and by interaction (regions, tabs, menus, quick open, notifications, resize) at 1440×900 and a narrow width.
- **Persisted-session regression** → Keep the key `desktop-ui-template:v1` and version `1`; add a test that stores a session, mounts the preset and asserts restoration, plus the closed-all-tabs case.
- **Preset re-acquires demo dependencies** → The boundary check fails on such imports, the preset test renders it with a single generic view, and its source is reviewed for demo ids and brand strings.
- **String ids lose compile-time safety** → The demo keeps its unions and registry typing; the preset falls back gracefully on unknown ids so a typo degrades instead of crashing.
- **Injection surface grows into a kitchen-sink API** → Keep it to the listed props; new behavior that does not need app data stays internal. Preset subpath/exports work is explicitly out of scope.
- **Command id drift while splitting commands** → Keep existing ids and move command definitions verbatim; the palette and menus read the same registry, and tests assert dispatch through the registry.
- **Bundle growth beyond the 1 % tolerance** → Code moves rather than duplicates; `npm run size` runs in `npm run check`. If gzip JS moves outside tolerance, investigate first and only then update `budgets.json` deliberately.
- **Docs and mock tree drift** → Same change updates `AGENTS.md`, `README.md`, `ROADMAP.md` and `src/demo/data/workspace.ts`; the mock documents must not describe paths that no longer exist.

## Migration Plan

1. Split the command list into preset defaults and demo commands, and build one registry in the demo layer; the palette, menus and views keep working through it.
2. Decouple the store from the app configuration and give it explicit first-run seeding; move the demo tab constants and startup output into the demo layer.
3. Parameterize the region components and the composition root in place so every demo input arrives as a prop while `App` still supplies today's values.
4. Move the files into `src/kit/preset-vscode`, `src/app` and `src/demo`, rename `Workbench` to `VSCodeWorkbench`, export the preset surface, and update `boundaries.json` plus its test fixtures in the same step.
5. Add preset tests for composition, injection, unknown-id fallbacks and persistence, and point the app at the preset's documented exports.
6. Update `AGENTS.md`, `README.md`, `ROADMAP.md` Phase 3 status and the mock explorer tree/documents.
7. Run `npm run check` and `npm run size`, then verify the template by hand. Rollback is a revert; the persistence key is unchanged, so no user data migration is needed.

## Open Questions

None.
