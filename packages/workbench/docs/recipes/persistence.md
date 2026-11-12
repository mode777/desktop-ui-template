# Control persistence

The preset persists layout and tab state to `localStorage`. This recipe explains
what survives reloads, how to clear it, and how to replace it with your own
versioned adapter when you leave the preset.

## Prerequisites

- You know whether you are keeping the preset or composing the shell yourself.
- Browser storage is available. The package is browser-only.

## What the preset persists

The key is fixed at `desktop-ui-template:v1` with schema version `1`.

It persists:

- theme;
- title bar, activity bar, primary sidebar, secondary sidebar, bottom panel and
  status bar visibility;
- panel maximized state;
- primary and secondary sidebar widths and bottom panel height;
- active primary, secondary and panel views;
- open tabs, the active tab and the closed-tab history;
- quick-open mode, output lines and notifications.

It does not persist application data, document contents, editor instances or
commands.

Two preset workbenches on the same origin share the key and therefore share
state. In `0.1.0` the key is not configurable. If you need a different key or
isolated instances, use composition and own persistence.

## Clear the preset state

```ts
localStorage.removeItem('desktop-ui-template:v1')
```

Clear it when testing first-run behavior, when a stored layout is corrupt, or
when a user asks to reset the workbench. The store also exposes `resetLayout`,
which resets layout slices without removing the whole key.

## Replace persistence with the core helpers

When you own the shell state, use the injected storage seam. It never touches
`localStorage` directly, so the same code works in tests and in a server-backed
adapter.

```ts
// src/persistence.ts
import { readVersioned, writeVersioned, type StorageAdapter } from '@workbench-kit/workbench/core'

export interface AppLayout {
  sidebarWidth: number
  activeView: string
}

export const fallback: AppLayout = {
  sidebarWidth: 280,
  activeView: 'explorer',
}

const storage: StorageAdapter = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key),
}

export function loadLayout(): AppLayout {
  return readVersioned(storage, 'my-app:layout', {
    version: 1,
    fallback,
    migrate: (stored) => ({
      ...fallback,
      ...(stored.state as Partial<AppLayout>),
    }),
  })
}

export function saveLayout(layout: AppLayout): boolean {
  return writeVersioned(storage, 'my-app:layout', 1, layout)
}
```

`readVersioned` returns the fallback for a missing key, an unreadable payload, an
adapter failure or a version it cannot migrate. `writeVersioned` returns `false`
when the adapter throws. The preset key is not used unless you pass it.

## Use a server or memory adapter

```ts
import type { StorageAdapter } from '@workbench-kit/workbench/core'

export function createMemoryStorage(initial: Record<string, string> = {}): StorageAdapter {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
    removeItem: (key) => {
      values.delete(key)
    },
  }
}
```

Pass the same adapter to `readVersioned` and `writeVersioned`. Use a memory adapter
in tests and a server adapter in your application.

## Verify

1. Change a layout value, reload, and confirm the preset restores it.
2. Clear `desktop-ui-template:v1`, reload, and confirm the initial session
   applies.
3. Store malformed JSON and confirm `readVersioned` returns the fallback.
4. Bump the schema version and confirm the migration runs once.
5. Make the adapter throw and confirm the app still renders with the fallback.

## Common failures

| Symptom                      | Cause                                            | Fix                                     |
| ---------------------------- | ------------------------------------------------ | --------------------------------------- |
| Two workbenches share layout | They use the same fixed preset key               | Use composition and a per-app key       |
| State never restores         | The adapter is not passed to both read and write | Use the same adapter instance           |
| App crashes on first load    | You read `state` without unwrapping the envelope | Use `readVersioned`                     |
| `localStorage` is undefined  | The code runs on the server                      | Guard the adapter or render client-only |

See the [API reference](../reference/api.md#versioned-persistence) for the helper
signatures.
