import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './elements'
import '@workbench-kit/styles-vscode/tokens.css'
import '@workbench-kit/styles-vscode/global.css'
import '@workbench-kit/styles-vscode/shell.css'
import '@workbench-kit/styles-vscode/resizable-pane.css'
import '@workbench-kit/styles-vscode/tab-strip.css'
import '@workbench-kit/styles-vscode/status-bar.css'
import './minimal.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
