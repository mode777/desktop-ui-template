import { useEffect, useRef } from 'react'
import { useWorkbenchStore } from '@workbench-kit/preset-vscode'

export function OutputView() {
  const outputLines = useWorkbenchStore((state) => state.outputLines)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [outputLines])

  return (
    <div className="output-view">
      <div className="output-toolbar">
        <select className="output-channel" aria-label="Output channel" defaultValue="workbench">
          <option value="workbench">Workbench</option>
          <option value="tasks">Tasks</option>
          <option value="debug">Debug Console</option>
        </select>
        <button
          type="button"
          className="text-button"
          onClick={() => scrollRef.current?.scrollTo({ top: 0 })}
        >
          Scroll to top
        </button>
      </div>
      <div className="output-lines" ref={scrollRef} role="log" aria-label="Output log">
        {outputLines.map((line, index) => (
          <div className="output-line" key={`${index}-${line}`}>
            <span className="output-line-index">{index + 1}</span>
            <span>{line}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
