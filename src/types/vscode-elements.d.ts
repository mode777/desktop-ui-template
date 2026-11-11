import type { CSSProperties, HTMLAttributes, Key, ReactNode, Ref } from 'react'
import type { VscodeContextMenu, VscodeTabs } from '@vscode-elements/elements'

/**
 * Loose but useful typings for the vscode-elements custom elements used by the
 * template. The upstream package ships rich class typings, but React's JSX
 * needs an intrinsic element declaration for each tag.
 */
type VscElementProps<T extends HTMLElement = HTMLElement> = Omit<HTMLAttributes<T>, 'color'> & {
  ref?: Ref<T>
  key?: Key
  children?: ReactNode
  className?: string
  style?: CSSProperties
  [key: `data-${string}`]: string | number | boolean | undefined
}

type IconProps = VscElementProps & {
  name?: string
  label?: string
  size?: number | string
  spin?: boolean
  'spin-duration'?: number
  'action-icon'?: boolean
}

type ButtonProps = VscElementProps & {
  secondary?: boolean
  block?: boolean
  disabled?: boolean
  icon?: string
  type?: 'button' | 'submit' | 'reset'
}

type TabHeaderProps = VscElementProps & {
  active?: boolean
  panel?: boolean
  slot?: string
}

type TabsProps = Omit<VscElementProps, 'ref'> & {
  ref?: Ref<VscodeTabs>
  'selected-index'?: number
  panel?: boolean
}

type TabPanelProps = VscElementProps & {
  hidden?: boolean
  panel?: boolean
}

type TreeProps = VscElementProps & {
  'expand-mode'?: 'singleClick' | 'doubleClick'
  'hide-arrows'?: boolean
  indent?: number
  'indent-guides'?: 'none' | 'onHover' | 'always'
  'multi-select'?: boolean
}

type TreeItemProps = VscElementProps & {
  open?: boolean
  branch?: boolean
  selected?: boolean
  active?: boolean
  level?: number
}

type CollapsibleProps = VscElementProps & {
  heading?: string
  description?: string
  open?: boolean
  'always-show-header-actions'?: boolean
}

type TextfieldProps = VscElementProps & {
  value?: string
  placeholder?: string
  disabled?: boolean
  autofocus?: boolean
  label?: string
  type?: string
}

type TextareaProps = VscElementProps & {
  value?: string
  rows?: number
  placeholder?: string
  resize?: 'both' | 'horizontal' | 'vertical' | 'none'
}

type ContextMenuProps = Omit<VscElementProps, 'ref'> & {
  ref?: Ref<VscodeContextMenu>
  show?: boolean
  'prevent-close'?: boolean
}

type CheckboxProps = VscElementProps & {
  checked?: boolean
  label?: string
  value?: string
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'vscode-badge': VscElementProps & { variant?: 'counter' | 'default' }
      'vscode-button': ButtonProps
      'vscode-checkbox': CheckboxProps
      'vscode-collapsible': CollapsibleProps
      'vscode-context-menu': ContextMenuProps
      'vscode-divider': VscElementProps
      'vscode-icon': IconProps
      'vscode-scrollable': VscElementProps & { 'always-visible'?: boolean }
      'vscode-tab-header': TabHeaderProps
      'vscode-tab-panel': TabPanelProps
      'vscode-tabs': TabsProps
      'vscode-textarea': TextareaProps
      'vscode-textfield': TextfieldProps
      'vscode-tree': TreeProps
      'vscode-tree-item': TreeItemProps
    }
  }
}
