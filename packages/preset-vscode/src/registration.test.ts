// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import './index'

describe('preset element registration', () => {
  it('registers the tags the preset renders', () => {
    const presetTags = [
      'vscode-badge',
      'vscode-button',
      'vscode-context-menu',
      'vscode-icon',
      'vscode-tab-header',
      'vscode-tab-panel',
      'vscode-tabs',
      'vscode-textfield',
    ]

    for (const tag of presetTags) {
      expect(customElements.get(tag)).toBeDefined()
    }
  })

  it('leaves app-only tags unregistered', () => {
    const appOnlyTags = ['vscode-collapsible', 'vscode-textarea', 'vscode-tree', 'vscode-tree-item']

    for (const tag of appOnlyTags) {
      expect(customElements.get(tag)).toBeUndefined()
    }
  })
})
