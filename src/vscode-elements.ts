// Register only the vscode-elements used by the template. Importing the
// package root would pull in every control; these deep imports keep the
// production bundle smaller.
import '@vscode-elements/elements/dist/vscode-badge'
import '@vscode-elements/elements/dist/vscode-button'
import '@vscode-elements/elements/dist/vscode-collapsible'
import '@vscode-elements/elements/dist/vscode-context-menu'
import '@vscode-elements/elements/dist/vscode-icon'
import '@vscode-elements/elements/dist/vscode-tab-header'
import '@vscode-elements/elements/dist/vscode-tab-panel'
import '@vscode-elements/elements/dist/vscode-tabs'
import '@vscode-elements/elements/dist/vscode-textarea'
import '@vscode-elements/elements/dist/vscode-textfield'
import '@vscode-elements/elements/dist/vscode-tree'
import '@vscode-elements/elements/dist/vscode-tree-item'
