import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './vscode-elements'
import './styles/tokens.css'
import './styles/global.css'
import './styles/workbench.css'
import { App } from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
