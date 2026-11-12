export type ActivityId = 'workspace' | 'outline' | 'settings'
export type PanelTabId = 'console' | 'details'

export interface ActivityItem {
  id: ActivityId
  title: string
  icon: string
}

export interface PanelTab {
  id: PanelTabId
  title: string
  icon: string
}

export interface DocumentSection {
  title: string
  body: string
  items?: string[]
}

export interface CustomShellTab {
  id: string
  title: string
  icon: string
  language: string
  eyebrow: string
  heading: string
  summary: string
  sections: DocumentSection[]
}

export const activities: ActivityItem[] = [
  { id: 'workspace', title: 'Workspace', icon: 'files' },
  { id: 'outline', title: 'Outline', icon: 'list-unordered' },
  { id: 'settings', title: 'Settings', icon: 'settings-gear' },
]

export const panelTabs: PanelTab[] = [
  { id: 'console', title: 'Console', icon: 'terminal' },
  { id: 'details', title: 'Details', icon: 'info' },
]

export const initialTabs: CustomShellTab[] = [
  {
    id: 'overview',
    title: 'Overview',
    icon: 'book',
    language: 'Markdown',
    eyebrow: 'Composition example',
    heading: 'A custom shell without the preset',
    summary:
      'This application composes the workbench shell from controlled primitives and supplies every region itself. There is no preset store, command registry or demo data.',
    sections: [
      {
        title: 'What is composed',
        body: 'The shell owns layout only. This app owns the title bar, activity rail, both sidebars, the editor surface, the bottom panel and the status bar.',
        items: [
          'WorkbenchShell receives every region through a slot.',
          'ResizablePane owns the sash interaction for both sidebars and the panel.',
          'TabStrip reports activation, close and reorder requests.',
          'IconButton drives the activity rail and layout controls.',
        ],
      },
      {
        title: 'What stays local',
        body: 'Region visibility, sizes, the tab collection and the panel selection are ordinary React state in this application.',
      },
    ],
  },
  {
    id: 'app',
    title: 'App.tsx',
    icon: 'code',
    language: 'TypeScript React',
    eyebrow: 'Composition root',
    heading: 'Compose the shell from slots',
    summary:
      'The root component reads one local reducer and passes the resulting values and callbacks down to the region components.',
    sections: [
      {
        title: 'Slot visibility',
        body: 'A hidden region is passed as null instead of being hidden with CSS. The shell never keeps visibility state of its own.',
      },
      {
        title: 'Controlled updates',
        body: 'Every primitive reports a request. The reducer decides whether to accept it, which keeps the application in charge of its behavior.',
      },
    ],
  },
  {
    id: 'styles',
    title: 'custom-shell.css',
    icon: 'symbol-color',
    language: 'CSS',
    eyebrow: 'App styling',
    heading: 'Reuse the structural contract',
    summary:
      'The example imports the shared tokens, base and workbench styles, then adds only the selectors it needs for its own region content.',
    sections: [
      {
        title: 'Shared classes',
        body: 'The workbench, title bar, activity bar, sidebar, editor, panel and status bar class names are the styling contract shared with the kit.',
      },
      {
        title: 'Local selectors',
        body: 'Example-only content uses the custom-shell- prefix so it cannot collide with kit styles or pretend to be a kit component.',
      },
    ],
  },
  {
    id: 'notes',
    title: 'Notes.md',
    icon: 'note',
    language: 'Markdown',
    eyebrow: 'Verification',
    heading: 'Why this example exists',
    summary:
      'The custom shell proves that the composition level is a real adoption path, not just a smaller copy of the preset.',
    sections: [
      {
        title: 'Boundary proof',
        body: 'The dependency check rejects preset, template and demo imports, and the bundle check proves none of those modules reached the production output.',
      },
      {
        title: 'Tree-shaking proof',
        body: 'Only the icon, tab header, tabs and tab panel elements are registered. The aggregate element entry is never imported.',
      },
    ],
  },
]

export const consoleLines = [
  '[custom-shell] local reducer initialized',
  '[custom-shell] 4 editor tabs, 1 panel tab selected',
  '[custom-shell] no preset store, no command registry',
  '[custom-shell] region visibility is owned by the application',
]

export const detailsRows = [
  { label: 'Shell', value: 'WorkbenchShell slots' },
  { label: 'State', value: 'useReducer in App.tsx' },
  { label: 'Persistence', value: 'None' },
  { label: 'Preset', value: 'Not imported' },
  { label: 'Elements', value: 'icon, tab-header, tabs, tab-panel' },
]
