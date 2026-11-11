import { useEffect } from 'react'
import { Workbench } from '../layout/Workbench'
import { useWorkbenchStore } from '../store/workbench-store'

export function App() {
  const theme = useWorkbenchStore((state) => state.theme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#181818' : '#f8f8f8')
  }, [theme])

  return <Workbench />
}
