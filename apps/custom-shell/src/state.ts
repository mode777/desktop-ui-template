import {
  activateTabIn,
  clampSize,
  closeTabIn,
  openTabIn,
  reorderTabIn,
  type TabCollection,
} from '@workbench-kit/core'
import { initialTabs, type ActivityId, type CustomShellTab, type PanelTabId } from './data'

export const PRIMARY_WIDTH = 280
export const PRIMARY_MIN = 200
export const PRIMARY_MAX = 420
export const SECONDARY_WIDTH = 280
export const SECONDARY_MIN = 220
export const SECONDARY_MAX = 420
export const PANEL_HEIGHT = 220
export const PANEL_MIN = 120
export const PANEL_MAX = 420

export interface CustomShellState extends TabCollection<CustomShellTab> {
  activityId: ActivityId
  primaryVisible: boolean
  secondaryVisible: boolean
  panelVisible: boolean
  panelMaximized: boolean
  primaryWidth: number
  secondaryWidth: number
  panelHeight: number
  panelTabId: PanelTabId
}

export type CustomShellAction =
  | { type: 'activity/select'; id: ActivityId }
  | { type: 'primary/toggle' }
  | { type: 'secondary/toggle' }
  | { type: 'panel/toggle' }
  | { type: 'panel/toggle-maximized' }
  | { type: 'panel/select-tab'; id: PanelTabId }
  | { type: 'panel/resize'; height: number }
  | { type: 'primary/resize'; width: number }
  | { type: 'secondary/resize'; width: number }
  | { type: 'tab/activate'; id: string }
  | { type: 'tab/close'; id: string }
  | { type: 'tab/open'; tab: CustomShellTab }
  | { type: 'tab/reorder'; sourceId: string; targetId: string }

export function createInitialState(): CustomShellState {
  return {
    activityId: 'workspace',
    primaryVisible: true,
    secondaryVisible: true,
    panelVisible: true,
    panelMaximized: false,
    primaryWidth: PRIMARY_WIDTH,
    secondaryWidth: SECONDARY_WIDTH,
    panelHeight: PANEL_HEIGHT,
    tabs: initialTabs.map((tab) => ({ ...tab, sections: [...tab.sections] })),
    activeTabId: initialTabs[0]?.id ?? null,
    panelTabId: 'console',
  }
}

/**
 * Local application state. It deliberately mirrors the shape the core tab
 * helpers expect while keeping region visibility and sizes beside it, so the
 * example never needs the preset store.
 */
export function customShellReducer(
  state: CustomShellState,
  action: CustomShellAction,
): CustomShellState {
  switch (action.type) {
    case 'activity/select':
      if (state.activityId === action.id) {
        return { ...state, primaryVisible: !state.primaryVisible }
      }
      return { ...state, activityId: action.id, primaryVisible: true }

    case 'primary/toggle':
      return { ...state, primaryVisible: !state.primaryVisible }

    case 'secondary/toggle':
      return { ...state, secondaryVisible: !state.secondaryVisible }

    case 'panel/toggle':
      return state.panelVisible
        ? { ...state, panelVisible: false, panelMaximized: false }
        : { ...state, panelVisible: true }

    case 'panel/toggle-maximized':
      if (!state.panelVisible) return { ...state, panelVisible: true, panelMaximized: true }
      return { ...state, panelMaximized: !state.panelMaximized }

    case 'panel/select-tab':
      return { ...state, panelTabId: action.id }

    case 'panel/resize':
      return { ...state, panelHeight: clampSize(action.height, PANEL_MIN, PANEL_MAX) }

    case 'primary/resize':
      return { ...state, primaryWidth: clampSize(action.width, PRIMARY_MIN, PRIMARY_MAX) }

    case 'secondary/resize':
      return { ...state, secondaryWidth: clampSize(action.width, SECONDARY_MIN, SECONDARY_MAX) }

    case 'tab/activate':
      return { ...state, ...activateTabIn(state, action.id) }

    case 'tab/close':
      return { ...state, ...closeTabIn(state, action.id) }

    case 'tab/open':
      return { ...state, ...openTabIn(state, action.tab) }

    case 'tab/reorder': {
      const next = reorderTabIn(state, action.sourceId, action.targetId)
      if (next === state) return state
      return { ...state, ...next }
    }
  }
}
