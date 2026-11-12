import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EditorArea } from './EditorArea'
import { useWorkbenchStore } from '../store/workbench-store'
import type { WorkbenchTab } from '../store/workbench-types'

afterEach(cleanup)

const fileTab: WorkbenchTab = {
  id: 'file:src/example.ts',
  title: 'example.ts',
  kind: 'file',
  path: 'src/example.ts',
  language: 'typescript',
}

const activeTab = (tab: WorkbenchTab) => {
  useWorkbenchStore.setState({ tabs: [tab], activeTabId: tab.id })
}

beforeEach(() => {
  activeTab(fileTab)
})

describe('EditorArea', () => {
  it("renders the active tab's document through the supplied renderer", () => {
    render(
      <EditorArea
        run={{ run: () => true }}
        renderDocument={(tab) => <div>{`document:${tab.title}`}</div>}
        fileIcons={{ icon: () => 'file-code', iconClass: () => 'file-icon file-icon--ts' }}
      />,
    )

    expect(screen.getByText('document:example.ts')).toBeInTheDocument()
    expect(screen.getAllByText('example.ts').length).toBeGreaterThan(0)
  })

  it('uses the supplied icon resolver for tab icons', () => {
    const { container } = render(
      <EditorArea
        run={{ run: () => true }}
        renderDocument={() => null}
        fileIcons={{ icon: () => 'symbol-color' }}
      />,
    )

    const icon = container.querySelector('vscode-icon[slot="content-before"]')
    expect(icon?.getAttribute('name')).toBe('symbol-color')
  })

  it('renders the generic empty state when no tab is open', () => {
    useWorkbenchStore.setState({ tabs: [], activeTabId: null })
    const run = { run: vi.fn(() => true) }
    render(<EditorArea run={run} />)

    expect(screen.getByText('No editors are open')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Open File…'))
    expect(run.run).toHaveBeenCalledWith('view.quickOpen')
  })

  it('prefers the consumer-supplied empty state', () => {
    useWorkbenchStore.setState({ tabs: [], activeTabId: null })
    render(<EditorArea run={{ run: () => true }} emptyEditor={<div>nothing open</div>} />)

    expect(screen.getByText('nothing open')).toBeInTheDocument()
    expect(screen.queryByText('No editors are open')).not.toBeInTheDocument()
  })
})
