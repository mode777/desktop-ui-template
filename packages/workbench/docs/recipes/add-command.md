# Add a command

This recipe adds an application command and exposes it in the command palette, a
title-bar menu and a keyboard shortcut.

## Prerequisites

- A preset application renders `VSCodeWorkbench` with a `commands` registry and
  `menus`.
- The command does not already exist in `defaultCommands`. If it does, give your
  command a different id.

## Files

```text
src/
  App.tsx
  commands.ts
  menus.ts
  use-hotkeys.ts
```

## 1. Create the command

```ts
// src/commands.ts
import {
  createCommandRegistry,
  defaultCommands,
  useWorkbenchStore,
  type WorkbenchCommand,
} from '@workbench-kit/workbench'

const openInspector: WorkbenchCommand = {
  id: 'inspector.open',
  title: 'Open Inspector',
  category: 'View',
  keybinding: 'Ctrl+Alt+I',
  run: () => {
    useWorkbenchStore.getState().showPrimaryView('inspector')
  },
}

export const commands = createCommandRegistry([...defaultCommands, openInspector])
```

The command palette lists the registry in the order supplied. `defaultCommands`
contains only generic workbench commands.

## 2. Add a menu entry

```ts
// src/menus.ts
import type { MenuDefinition } from '@workbench-kit/workbench'

export const menus: MenuDefinition[] = [
  {
    id: 'view',
    label: 'View',
    entries: [
      { label: 'Open Inspector', commandId: 'inspector.open', keybinding: 'Ctrl+Alt+I' },
      { separator: true },
      { label: 'Command Palette…', commandId: 'view.commandPalette', keybinding: 'Ctrl+Shift+P' },
    ],
  },
]
```

A menu entry references the command id. It does not call the function directly.

## 3. Handle the shortcut

`keybinding` in the command and menu is display metadata. The preset does not
install global shortcuts for application commands, so add the handler in your
application:

```ts
// src/use-hotkeys.ts
import { useEffect } from 'react'
import { commands } from './commands'

export function useHotkeys() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isEditable =
        target instanceof HTMLElement &&
        (target.matches('input, textarea, select') || target.isContentEditable)
      if (isEditable) return

      const mod = event.metaKey || event.ctrlKey
      if (mod && event.altKey && event.key.toLowerCase() === 'i') {
        event.preventDefault()
        commands.run('inspector.open')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
```

## 4. Wire the preset

```tsx
// src/App.tsx
import { VSCodeWorkbench } from '@workbench-kit/workbench'
import { commands } from './commands'
import { menus } from './menus'
import { useHotkeys } from './use-hotkeys'
import { config } from './workbench.config'
import { views } from './views'

export function App() {
  useHotkeys()
  return <VSCodeWorkbench config={config} views={views} commands={commands} menus={menus} />
}
```

## Verify

```bash
npm run build
```

Then confirm:

- The command appears in the command palette with its category and keybinding.
- The View menu entry runs the command.
- `Ctrl+Alt+I` runs the command when focus is not in an editable field.
- The build and TypeScript check pass.

## Common failures

| Symptom                                | Cause                                                                            | Fix                                                       |
| -------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Command missing from the palette       | The registry was not passed to `VSCodeWorkbench` or the command id is duplicated | Pass `commands` and use a unique id                       |
| Menu entry does nothing                | `commandId` does not match a registered id                                       | Make the ids identical                                    |
| Shortcut is displayed but does nothing | `keybinding` is display-only                                                     | Add the app keydown handler                               |
| Shortcut fires while typing            | The handler does not ignore editable targets                                     | Check `input`, `textarea`, `select` and `contentEditable` |

See [Concepts](../concepts.md#commands) for the command registry and default
command ids.
