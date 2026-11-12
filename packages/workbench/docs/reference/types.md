# Public types

Types are imported from the same public subpaths as their values. They have no
runtime cost.

```ts
import type { WorkbenchConfig, WorkbenchViewRegistry, WorkbenchTab } from '@workbench-kit/workbench'
import type { TabStripItem, ResizablePaneProps } from '@workbench-kit/workbench/react'
import type { StorageAdapter, TabCollection } from '@workbench-kit/workbench/core'
```

## Preset types

`VSCodeWorkbenchProps`, `WorkbenchConfig`, `WorkbenchViewRegistry`,
`ViewDefinition`, `ViewAction`, `ActivityItem`, `ActivityAction`,
`CommandRunner`, `CommandListItem`, `CommandRegistry`, `WorkbenchCommand`,
`WorkbenchCommandRegistry`, `MenuDefinition`, `MenuEntryDefinition`,
`QuickOpenProvider`, `QuickOpenFile`, `FileIconResolver`, `WorkbenchBranding`,
`WorkbenchTab`, `WorkbenchData`, `WorkbenchNotification`, `NotificationKind`,
`QuickOpenMode`, `TabKind`, `Theme`, `InitialWorkbenchSession`.

## React primitive types

`WorkbenchShellProps`, `ActivityBarProps`, `ActivityBarItem`,
`ActivityBarAction`, `SidebarProps`, `SidebarAction`, `PanelProps`, `PanelTab`,
`StatusBarProps`, `TitleBarProps`, `MenuBarProps`, `MenuBarMenu`,
`MenuBarEntry`, `ContextMenuProps`, `ContextMenuItem`, `ResizablePaneProps`,
`ResizablePaneSide`, `TabStripProps`, `TabStripItem`, `IconButtonProps`.

## Core types

`PointerResizeInput`, `KeyResizeInput`, `ResizeSide`, `ResizeOrientation`,
`TabLike`, `TabCollection`, `TabCloseResult`, `TabReopenResult`,
`TabCycleDirection`, `StorageAdapter`, `StoredEnvelope`, `ReadVersionedOptions`.

## Element types

`@workbench-kit/workbench/elements/types` declares the registered custom
elements for JSX. It is a type-only import with no runtime side effect.

See the [API reference](./api.md) for the props and callbacks behind these types.
