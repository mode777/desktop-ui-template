import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './vscode-elements'
import '@workbench-kit/styles-vscode/tokens.css'
import '@workbench-kit/styles-vscode/global.css'
import '@workbench-kit/styles-vscode/workbench.css'
import './demo/styles/demo-views.css'
import { App } from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
