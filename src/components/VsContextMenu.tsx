import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { VscodeContextMenu } from '@vscode-elements/elements'

export interface ContextMenuItem {
  label?: string
  value?: string
  keybinding?: string
  separator?: boolean
}

interface VsContextMenuProps {
  open: boolean
  x: number
  y: number
  items: ContextMenuItem[]
  onSelect: (value: string) => void
  onClose: () => void
  /** Clicks inside this selector should not close the menu (e.g. the menu bar). */
  ignoreSelector?: string
}

const VIEWPORT_MARGIN = 8
const APPROX_MENU_WIDTH = 290
const APPROX_MENU_HEIGHT = 360

export function VsContextMenu({
  open,
  x,
  y,
  items,
  onSelect,
  onClose,
  ignoreSelector,
}: VsContextMenuProps) {
  const menuRef = useRef<VscodeContextMenu | null>(null)

  useEffect(() => {
    const menu = menuRef.current
    if (!menu) return
    if (!open) {
      menu.show = false
      return
    }

    menu.data = items
    menu.show = true
  }, [open, items])

  useEffect(() => {
    const menu = menuRef.current
    if (!menu || !open) return

    const handleSelect = (event: Event) => {
      const detail = (event as CustomEvent<{ value?: string }>).detail
      if (detail?.value) onSelect(detail.value)
      onClose()
    }

    menu.addEventListener('vsc-context-menu-select', handleSelect)
    return () => menu.removeEventListener('vsc-context-menu-select', handleSelect)
  }, [open, onSelect, onClose])

  useEffect(() => {
    if (!open) return

    const handleOutside = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (menuRef.current?.contains(target)) return
      if (ignoreSelector && target.closest(ignoreSelector)) return
      onClose()
    }

    document.addEventListener('mousedown', handleOutside, true)
    return () => document.removeEventListener('mousedown', handleOutside, true)
  }, [open, onClose, ignoreSelector])

  if (!open) return null

  const left = Math.max(VIEWPORT_MARGIN, Math.min(x, window.innerWidth - APPROX_MENU_WIDTH))
  const top = Math.max(VIEWPORT_MARGIN, Math.min(y, window.innerHeight - APPROX_MENU_HEIGHT))

  return createPortal(
    <div className="context-menu-positioner" style={{ left, top }}>
      <vscode-context-menu ref={menuRef} />
    </div>,
    document.body,
  )
}
