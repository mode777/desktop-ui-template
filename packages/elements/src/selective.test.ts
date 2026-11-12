// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import './icon'
import './tab-header'

describe('selective element registration', () => {
  it('registers only the imported tags', () => {
    expect(customElements.get('vscode-icon')).toBeDefined()
    expect(customElements.get('vscode-tab-header')).toBeDefined()
    expect(customElements.get('vscode-tree')).toBeUndefined()
    expect(customElements.get('vscode-tabs')).toBeUndefined()
    expect(customElements.get('vscode-textfield')).toBeUndefined()
  })
})
