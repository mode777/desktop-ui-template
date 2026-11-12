# Changelog

All notable changes to `@workbench-kit/workbench` are recorded here. The format
follows [Keep a Changelog](https://keepachangelog.com/) and the package follows
[Semantic Versioning](https://semver.org/). While the major version is `0`,
minor releases may include breaking changes; patch releases do not.

## [Unreleased]

### Added

- Per-component stylesheet entries at `@workbench-kit/workbench/styles/shell.css`,
  `title-bar.css`, `menu-bar.css`, `icon-button.css`, `activity-bar.css`,
  `resizable-pane.css`, `sidebar.css`, `tab-strip.css`, `editor-area.css`,
  `panel.css`, `status-bar.css`, `quick-open.css`, `context-menu.css` and
  `notifications.css`. `workbench.css` remains the aggregate entry.
- `npm run check:styles` for component entry declarations, aggregate order,
  demo-selector isolation and example style subsets.
- Controlled region primitives at `@workbench-kit/workbench/react`:
  `ActivityBar`, `Sidebar`, `Panel`, `StatusBar`, `TitleBar`, `MenuBar` and
  `ContextMenu`.
- Consumer documentation covering the quickstart, concepts, recipes, reference
  and eject path, shipped in the package and hosted at
  <https://mode777.github.io/desktop-ui-template/docs/>.
- A generated `llms.txt` index, an app-level `AGENTS.md` guide and raw Markdown
  pages for coding agents.
- `LICENSE` and `THIRD_PARTY_NOTICES.md` in the public tarball.
- npm repository, homepage, issue tracker and public access metadata on the
  facade.

### Changed

- The preset region components are now thin adapters over the React primitives;
  the custom-shell example composes the same primitives with local state.
- The minimal and custom-shell examples import only the component stylesheets
  they render; the minimal CSS baseline dropped from 47,289 B raw / 8,579 B gzip
  to 19,261 B raw / 4,106 B gzip.
- The package README now links the hosted consumer documentation, the offline
  `docs/` copy and `llms.txt` by absolute URL.
- The package tarball now ships the consumer documentation and agent guide.

## [0.1.0] - 2026-11-12

The first prepared public release of `@workbench-kit/workbench`. Publishing is
gated on owner approval of the final npm scope and name.

### Added

- One public package exposing the five internal modules through subpath exports.
- The full VS Code-style preset at `@workbench-kit/workbench`, including the
  default layout store and generic workbench commands.
- Controlled composition primitives at `@workbench-kit/workbench/react`:
  `WorkbenchShell`, `ResizablePane`, `TabStrip` and `IconButton`.
- Headless layout, tab and versioned persistence helpers at
  `@workbench-kit/workbench/core`.
- Per-tag element registrations and JSX typings under
  `@workbench-kit/workbench/elements/*`.
- Token, base, shell/region and aggregate stylesheets under
  `@workbench-kit/workbench/styles/*`.
- Three adoption levels: preset, composition and primitives, validated by the
  template, minimal and custom-shell applications.
- A single packed-tarball check for export targets, runtime imports, consumer
  types and app/demo content.
- MIT license and third-party notices covering React, React DOM, Zustand,
  vscode-elements and Codicons.

[Unreleased]: https://github.com/mode777/desktop-ui-template/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/mode777/desktop-ui-template/releases/tag/v0.1.0
