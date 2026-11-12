/**
 * Pure tab-collection transitions.
 *
 * Every helper reads a `{ tabs, activeTabId }` slice and returns the next one
 * without mutating its input or touching the store. History caps (how many
 * closed tabs to keep) stay with the caller; these helpers only report what
 * they removed.
 */

import type {
  TabCloseResult,
  TabCollection,
  TabCycleDirection,
  TabLike,
  TabReopenResult,
} from './types'

/** Adds the tab when its id is unused, then activates it. */
export function openTabIn<T extends TabLike>(
  collection: TabCollection<T>,
  tab: T,
): TabCollection<T> {
  const exists = collection.tabs.some((entry) => entry.id === tab.id)
  return {
    tabs: exists ? collection.tabs : [...collection.tabs, tab],
    activeTabId: tab.id,
  }
}

/** Activates the tab when it exists; otherwise returns the collection unchanged. */
export function activateTabIn<T extends TabLike>(
  collection: TabCollection<T>,
  id: string,
): TabCollection<T> {
  if (!collection.tabs.some((tab) => tab.id === id)) return collection
  return { tabs: collection.tabs, activeTabId: id }
}

/**
 * Removes the tab and, when it was active, activates the nearest surviving tab
 * to its right, else to its left, else nothing.
 */
export function closeTabIn<T extends TabLike>(
  collection: TabCollection<T>,
  id: string,
): TabCloseResult<T> {
  const index = collection.tabs.findIndex((tab) => tab.id === id)
  if (index === -1) return { ...collection, removed: [] }

  const removedTab = collection.tabs[index]
  const tabs = collection.tabs.filter((tab) => tab.id !== id)
  const activeTabId =
    collection.activeTabId === id
      ? ((tabs[index] ?? tabs[index - 1] ?? null)?.id ?? null)
      : collection.activeTabId

  return { tabs, activeTabId, removed: removedTab ? [removedTab] : [] }
}

/** Keeps only the given tab and reports the rest, most recently closed first. */
export function closeOthersIn<T extends TabLike>(
  collection: TabCollection<T>,
  id: string,
): TabCloseResult<T> {
  const kept = collection.tabs.filter((tab) => tab.id === id)
  const removed = collection.tabs.filter((tab) => tab.id !== id).reverse()
  return { tabs: kept, activeTabId: kept[0]?.id ?? null, removed }
}

/** Closes every tab and reports them, most recently closed first. */
export function closeAllIn<T extends TabLike>(collection: TabCollection<T>): TabCloseResult<T> {
  return { tabs: [], activeTabId: null, removed: [...collection.tabs].reverse() }
}

/**
 * Reopens the most recent entry in the supplied history. Returns the remaining
 * history unchanged when there is nothing to reopen, and does not duplicate a
 * tab that is already open.
 */
export function reopenTabIn<T extends TabLike>(
  collection: TabCollection<T>,
  closedTabs: T[],
): TabReopenResult<T> {
  const [tab, ...rest] = closedTabs
  if (!tab) return { ...collection, closedTabs }

  const exists = collection.tabs.some((entry) => entry.id === tab.id)
  return {
    tabs: exists ? collection.tabs : [...collection.tabs, tab],
    activeTabId: tab.id,
    closedTabs: rest,
  }
}

/**
 * Moves the source tab to the target's index: toward-start moves land before
 * the target, toward-end moves land after it. Unknown or identical ids are a
 * no-op.
 */
export function reorderTabIn<T extends TabLike>(
  collection: TabCollection<T>,
  sourceId: string,
  targetId: string,
): TabCollection<T> {
  if (sourceId === targetId) return collection

  const sourceIndex = collection.tabs.findIndex((tab) => tab.id === sourceId)
  const targetIndex = collection.tabs.findIndex((tab) => tab.id === targetId)
  if (sourceIndex === -1 || targetIndex === -1) return collection

  const tabs = [...collection.tabs]
  const [moved] = tabs.splice(sourceIndex, 1)
  tabs.splice(targetIndex, 0, moved)
  return { tabs, activeTabId: collection.activeTabId }
}

/**
 * Activates the adjacent tab, wrapping at both ends. With no active tab,
 * forward selects the first tab and backward selects the last.
 */
export function cycleTab<T extends TabLike>(
  collection: TabCollection<T>,
  direction: TabCycleDirection,
): TabCollection<T> {
  const { tabs } = collection
  if (tabs.length === 0) return collection

  const current = tabs.findIndex((tab) => tab.id === collection.activeTabId)
  if (current === -1) {
    return { tabs, activeTabId: tabs[direction === 1 ? 0 : tabs.length - 1].id }
  }
  const next = (current + direction + tabs.length) % tabs.length
  return { tabs, activeTabId: tabs[next].id }
}
