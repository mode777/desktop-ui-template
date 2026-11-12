/**
 * Structural tab contracts shared by the headless helpers.
 *
 * Deliberately minimal: the kit knows about tabs, not about the application's
 * tab model. `WorkbenchTab` satisfies `TabLike`, so app types flow through
 * without core importing them.
 */

export interface TabLike {
  id: string
}

/** The part of a tab collection the helpers read and write. */
export interface TabCollection<T extends TabLike> {
  tabs: T[]
  activeTabId: string | null
}

/** Result of a close operation: the next collection plus what was removed. */
export interface TabCloseResult<T extends TabLike> extends TabCollection<T> {
  /** Removed tabs, most recently closed first. */
  removed: T[]
}

/** Result of reopening: the next collection plus the remaining closed-tab history. */
export interface TabReopenResult<T extends TabLike> extends TabCollection<T> {
  closedTabs: T[]
}

export type TabCycleDirection = 1 | -1
