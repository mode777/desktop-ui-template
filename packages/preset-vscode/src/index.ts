import './elements'

export { VSCodeWorkbench } from './VSCodeWorkbench'
export type { VSCodeWorkbenchProps } from './VSCodeWorkbench'

export { defaultCommands, createCommandRegistry } from './commands/default-commands'
export type { WorkbenchCommand, WorkbenchCommandRegistry } from './commands/default-commands'

export {
  DEFAULT_BOTTOM_PANEL_HEIGHT,
  DEFAULT_PRIMARY_SIDE_BAR_WIDTH,
  DEFAULT_SECONDARY_SIDE_BAR_WIDTH,
  createInitialData,
  createLayoutDefaults,
  seedInitialSession,
  useWorkbenchStore,
} from './store/workbench-store'
export type { InitialWorkbenchSession } from './store/workbench-store'
export type {
  NotificationKind,
  QuickOpenMode,
  TabKind,
  WorkbenchData,
  WorkbenchNotification,
  WorkbenchTab,
} from './store/workbench-types'
export type {
  ActivityAction,
  ActivityItem,
  CommandListItem,
  CommandRegistry,
  CommandRunner,
  FileIconResolver,
  MenuDefinition,
  MenuEntryDefinition,
  QuickOpenFile,
  QuickOpenProvider,
  Theme,
  ViewAction,
  ViewDefinition,
  WorkbenchBranding,
  WorkbenchConfig,
  WorkbenchViewRegistry,
} from './types'
