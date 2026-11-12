import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QuickOpen } from './QuickOpen'
import { useWorkbenchStore } from '../store/workbench-store'
import type { CommandRegistry, QuickOpenFile } from '../types'

afterEach(cleanup)

const files: QuickOpenFile[] = [
  { name: 'alpha.ts', path: 'src/alpha.ts' },
  { name: 'beta.ts', path: 'src/beta.ts' },
]

function registry() {
  const alphaRun = vi.fn()
  const commands: CommandRegistry = {
    list: () => [
      {
        id: 'test.alpha',
        title: 'Alpha Command',
        category: 'Test',
        keybinding: 'Ctrl+1',
        run: alphaRun,
      },
      { id: 'test.beta', title: 'Beta Command', category: 'Test', run: vi.fn() },
    ],
    run: vi.fn(() => true),
  }
  return { commands, alphaRun }
}

beforeEach(() => {
  Element.prototype.scrollIntoView = () => undefined
  Element.prototype.scrollTo = () => undefined
  useWorkbenchStore.setState({ quickOpenOpen: true, quickOpenMode: 'files' })
})

function typeQuery(container: HTMLElement, value: string) {
  const field = container.querySelector('vscode-textfield') as HTMLElement & { value: string }
  field.value = value
  fireEvent.input(field)
}

describe('QuickOpen', () => {
  it('lists supplied files and opens the chosen one through the handler', () => {
    const openFile = vi.fn()
    render(<QuickOpen files={files} openFile={openFile} commands={registry().commands} />)

    expect(screen.getByText('alpha.ts')).toBeInTheDocument()
    expect(screen.getByText('beta.ts')).toBeInTheDocument()

    fireEvent.click(screen.getByText('alpha.ts'))
    expect(openFile).toHaveBeenCalledWith('src/alpha.ts')
    expect(useWorkbenchStore.getState().quickOpenOpen).toBe(false)
  })

  it('filters files by the typed query', () => {
    const { container } = render(
      <QuickOpen files={files} openFile={() => undefined} commands={registry().commands} />,
    )

    typeQuery(container, 'beta')

    expect(screen.queryByText('alpha.ts')).not.toBeInTheDocument()
    expect(screen.getByText('beta.ts')).toBeInTheDocument()
  })

  it('lists and runs commands in command mode', () => {
    useWorkbenchStore.setState({ quickOpenOpen: true, quickOpenMode: 'commands' })
    const { commands, alphaRun } = registry()
    render(<QuickOpen files={files} openFile={() => undefined} commands={commands} />)

    fireEvent.click(screen.getByText('Alpha Command'))
    expect(alphaRun).toHaveBeenCalled()
  })

  it('shows an empty state when nothing matches', () => {
    const { container } = render(
      <QuickOpen files={files} openFile={() => undefined} commands={registry().commands} />,
    )

    typeQuery(container, 'zzz')

    expect(screen.getByText('No matching files.')).toBeInTheDocument()
  })
})
