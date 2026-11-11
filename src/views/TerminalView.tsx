import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

type LineKind = 'command' | 'output' | 'muted' | 'success'

interface TerminalLine {
  id: number
  kind: LineKind
  text: string
}

const banner = ['Desktop UI Template — mock terminal', 'Type "help" to see the available commands.']

let lineSequence = 0
const nextId = () => ++lineSequence

const welcome: TerminalLine[] = banner.map((text) => ({
  id: nextId(),
  kind: 'muted',
  text,
}))

export function TerminalView() {
  const [lines, setLines] = useState<TerminalLine[]>(welcome)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [lines])

  const print = (text: string, kind: LineKind = 'output') => {
    setLines((current) => [...current, { id: nextId(), kind, text }])
  }

  const runCommand = (raw: string) => {
    const command = raw.trim()
    if (!command) return

    print(`➜ desktop-ui-template git:(main) ${command}`, 'command')
    setHistory((current) => [command, ...current].slice(0, 30))
    setHistoryIndex(-1)

    const [name, ...args] = command.split(/\s+/)

    switch (name) {
      case 'help':
        print('Available commands: help, ls, pwd, clear, npm run dev, git status, whoami, echo')
        break
      case 'ls':
        print('AGENTS.md   README.md   index.html   package.json   public/   src/   vite.config.ts')
        break
      case 'pwd':
        print('/home/agent/workspace/desktop-ui-template')
        break
      case 'whoami':
        print('agent')
        break
      case 'clear':
        setLines([])
        break
      case 'echo':
        print(args.join(' '))
        break
      case 'git':
        if (args[0] === 'status') {
          print('On branch main')
          print('Your branch is up to date with "origin/main".')
          print('')
          print('Changes not staged for commit:')
          print('  modified:   src/layout/Workbench.tsx')
          print('  modified:   src/views/registry.tsx')
          print('  new file:   .github/workflows/deploy-pages.yml', 'success')
        } else {
          print(`git: '${args.join(' ')}' is not simulated. Try "git status".`)
        }
        break
      case 'npm':
        if (args[0] === 'run' && args[1] === 'dev') {
          print('')
          print('  VITE v8.3.6  ready in 214 ms', 'success')
          print('')
          print('  ➜  Local:   http://localhost:5173/')
          print('  ➜  Network: use --host to expose')
        } else {
          print(`npm run ${args.slice(1).join(' ') || ''} — mock command`)
        }
        break
      default:
        print(`zsh: command not found: ${name}`)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      runCommand(input)
      setInput('')
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      const nextIndex = Math.min(historyIndex + 1, history.length - 1)
      if (nextIndex >= 0) {
        setHistoryIndex(nextIndex)
        setInput(history[nextIndex] ?? '')
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      const nextIndex = historyIndex - 1
      setHistoryIndex(nextIndex)
      setInput(nextIndex >= 0 ? (history[nextIndex] ?? '') : '')
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault()
      setLines([])
    }
  }

  return (
    <div
      className="terminal-view"
      onClick={() => inputRef.current?.focus()}
      role="application"
      aria-label="Mock terminal"
    >
      <div className="terminal-output" ref={scrollRef}>
        {lines.map((line) => (
          <div className={`terminal-line terminal-line--${line.kind}`} key={line.id}>
            {line.text || '\u00a0'}
          </div>
        ))}
      </div>
      <div className="terminal-prompt">
        <span className="terminal-prompt-path">➜ desktop-ui-template</span>
        <span className="terminal-prompt-branch">git:(main)</span>
        <input
          ref={inputRef}
          className="terminal-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          aria-label="Terminal command"
        />
      </div>
    </div>
  )
}
