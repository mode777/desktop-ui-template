// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import './all'

const supportedTags = [
  'vscode-badge',
  'vscode-button',
  'vscode-collapsible',
  'vscode-context-menu',
  'vscode-icon',
  'vscode-tab-header',
  'vscode-tab-panel',
  'vscode-tabs',
  'vscode-textarea',
  'vscode-textfield',
  'vscode-tree',
  'vscode-tree-item',
]

describe('aggregate element registration', () => {
  it('registers every supported tag', () => {
    for (const tag of supportedTags) {
      expect(customElements.get(tag)).toBeDefined()
    }
  })
})
