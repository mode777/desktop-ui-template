import { useEffect } from 'react'
import { runWorkbenchCommand } from '../demo/commands/registry'
import { useWorkbenchStore } from '@workbench-kit/preset-vscode'

/**
 * Global keyboard map. Keep this in one place so the menu, command palette and
 * actual key handling cannot drift apart.
 */
export function useWorkbenchHotkeys() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isEditable =
        target instanceof HTMLElement &&
        (target.matches('input, textarea, select') || target.isContentEditable)

      const mod = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()

      if (!mod) {
        if (event.key === 'F5') {
          event.preventDefault()
          runWorkbenchCommand(event.shiftKey ? 'run.stop' : 'run.start')
          return
        }
        if (event.key === 'Escape' && isEditable) {
          target?.blur()
        }
        return
      }

      if (key === 'p' && event.shiftKey) {
        event.preventDefault()
        runWorkbenchCommand('view.commandPalette')
        return
      }
      if (key === 'p') {
        event.preventDefault()
        runWorkbenchCommand('view.quickOpen')
        return
      }
      if (key === 'b' && event.altKey) {
        event.preventDefault()
        runWorkbenchCommand('view.toggleSecondary')
        return
      }
      if (key === 'b') {
        event.preventDefault()
        runWorkbenchCommand('view.togglePrimary')
        return
      }
      if (key === 'j') {
        event.preventDefault()
        runWorkbenchCommand('view.togglePanel')
        return
      }
      if (key === '`') {
        event.preventDefault()
        runWorkbenchCommand('run.toggleTerminal')
        return
      }
      if (key === 's') {
        event.preventDefault()
        runWorkbenchCommand(event.shiftKey ? 'file.saveAll' : 'file.save')
        return
      }
      if (key === 'w') {
        event.preventDefault()
        runWorkbenchCommand(event.shiftKey ? 'file.closeAll' : 'file.close')
        return
      }
      if (key === 'tab') {
        event.preventDefault()
        useWorkbenchStore.getState().activateNextTab(event.shiftKey ? -1 : 1)
        return
      }
      if (event.shiftKey && key === 'e') {
        event.preventDefault()
        runWorkbenchCommand('view.explorer')
        return
      }
      if (event.shiftKey && key === 'f') {
        event.preventDefault()
        runWorkbenchCommand('view.search')
        return
      }
      if (event.shiftKey && key === 'g') {
        event.preventDefault()
        runWorkbenchCommand('view.sourceControl')
        return
      }
      if (event.shiftKey && key === 'd') {
        event.preventDefault()
        runWorkbenchCommand('view.run')
        return
      }
      if (event.shiftKey && key === 'x') {
        event.preventDefault()
        runWorkbenchCommand('view.extensions')
        return
      }
      if (event.shiftKey && key === 'm') {
        event.preventDefault()
        runWorkbenchCommand('view.problems')
        return
      }
      if (event.shiftKey && key === 'h') {
        event.preventDefault()
        runWorkbenchCommand('go.readme')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
