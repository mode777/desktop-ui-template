import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { useWorkbenchStore } from '@workbench-kit/preset-vscode'

beforeEach(() => {
  Element.prototype.scrollTo = () => undefined
  Element.prototype.scrollIntoView = () => undefined
})

describe('template application', () => {
  it('seeds and renders the initial session', () => {
    render(<App />)

    const state = useWorkbenchStore.getState()
    expect(state.tabs.length).toBeGreaterThan(0)
    expect(state.activeTabId).toBe('welcome')
    expect(screen.getByLabelText('Open editors')).toBeInTheDocument()
  })
})
