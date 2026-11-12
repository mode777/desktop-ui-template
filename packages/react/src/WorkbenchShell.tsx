import type { ReactNode } from 'react'

export interface WorkbenchShellProps {
  /** Optional title bar region, rendered above the body. */
  titleBar?: ReactNode
  /** Optional activity bar region, rendered at the start of the body. */
  activityBar?: ReactNode
  /** Optional primary side bar region, rendered after the activity bar. */
  primarySideBar?: ReactNode
  /** Optional secondary side bar region, rendered at the end of the body. */
  secondarySideBar?: ReactNode
  /** Optional bottom panel region, rendered below the center content. */
  panel?: ReactNode
  /** Optional status bar region, rendered after the body. */
  statusBar?: ReactNode
  /** Optional overlay region, rendered last inside the root. */
  overlays?: ReactNode
  /**
   * Layout flag for a maximized panel: marks the root, hides the center
   * content and lets the panel occupy the center area. The panel's own
   * `maximized` sizing stays with the consumer.
   */
  panelMaximized?: boolean
  /** Appended to the structural root classes. */
  className?: string
  /** Center content, rendered above the panel. */
  children?: ReactNode
}

/**
 * Layout-only workbench shell.
 *
 * Owns the root/body/center structure and places consumer-supplied regions.
 * Visibility is expressed by omitting a slot; the shell keeps no region state
 * and imports no application modules.
 */
export function WorkbenchShell({
  titleBar,
  activityBar,
  primarySideBar,
  secondarySideBar,
  panel,
  statusBar,
  overlays,
  panelMaximized = false,
  className,
  children,
}: WorkbenchShellProps) {
  const rootClassName = ['workbench', panelMaximized ? 'panel-is-maximized' : '', className ?? '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClassName}>
      {titleBar}
      <div className="workbench-body">
        {activityBar}
        {primarySideBar}
        <div className="workbench-center">
          {panelMaximized ? null : children}
          {panel}
        </div>
        {secondarySideBar}
      </div>
      {statusBar}
      {overlays}
    </div>
  )
}
