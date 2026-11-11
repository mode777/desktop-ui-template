import { useEffect, useRef, useState } from 'react'
import { useWorkbenchStore } from '../store/workbench-store'

type ChatRole = 'user' | 'assistant'

interface ChatMessage {
  id: number
  role: ChatRole
  text: string
}

const sessions = [
  { title: 'Workbench layout', detail: 'Today · 4 messages' },
  { title: 'Theming tokens', detail: 'Yesterday · 9 messages' },
  { title: 'GitHub Pages setup', detail: 'Mon · 6 messages' },
]

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    role: 'assistant',
    text: 'Welcome to the mock chat surface. This panel is part of the template — replace it with your own agent, inspector, or collaboration UI.',
  },
  {
    id: 2,
    role: 'user',
    text: 'Can I resize and close this sidebar?',
  },
  {
    id: 3,
    role: 'assistant',
    text: 'Yes. Drag the sash on its left edge, press Ctrl+Alt+B to toggle it, or use the title bar layout controls. The width is persisted to localStorage.',
  },
]

let messageSequence = 100

export function ChatView() {
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const replyTimer = useRef<number | null>(null)
  const notify = useWorkbenchStore((state) => state.notify)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  useEffect(
    () => () => {
      if (replyTimer.current) window.clearTimeout(replyTimer.current)
    },
    [],
  )

  const send = () => {
    const text = draft.trim()
    if (!text || busy) return

    setMessages((current) => [...current, { id: ++messageSequence, role: 'user', text }])
    setDraft('')
    setBusy(true)

    replyTimer.current = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: ++messageSequence,
          role: 'assistant',
          text: 'This is a canned reply from the template. Hook ChatView up to your model provider, or use this sidebar for a properties inspector instead.',
        },
      ])
      setBusy(false)
      notify('Mock assistant replied', 'info')
    }, 900)
  }

  return (
    <div className="chat-view">
      <section className="chat-sessions">
        <div className="chat-sessions-header">
          <span>Sessions</span>
          <div>
            <button
              type="button"
              className="icon-text-button"
              onClick={() => notify('Session search is a mock action')}
            >
              <vscode-icon name="search" size={13} />
            </button>
            <button
              type="button"
              className="icon-text-button"
              onClick={() => notify('Session filter is a mock action')}
            >
              <vscode-icon name="filter" size={13} />
            </button>
            <button
              type="button"
              className="icon-text-button"
              onClick={() => notify('Session list is a mock action')}
            >
              <vscode-icon name="list-flat" size={13} />
            </button>
          </div>
        </div>
        <div className="chat-session-list">
          {sessions.map((session, index) => (
            <button
              type="button"
              className={`chat-session ${index === 0 ? 'is-active' : ''}`}
              key={session.title}
              onClick={() => notify(`Opened “${session.title}” (mock)`)}
            >
              <span>{session.title}</span>
              <small>{session.detail}</small>
            </button>
          ))}
        </div>
      </section>

      <div className="chat-messages" ref={listRef}>
        {messages.map((message) => (
          <article className={`chat-message chat-message--${message.role}`} key={message.id}>
            <div className="chat-avatar">
              <vscode-icon name={message.role === 'assistant' ? 'sparkle' : 'account'} size={16} />
            </div>
            <div className="chat-bubble">
              <div className="chat-message-role">
                {message.role === 'assistant' ? 'Template Assistant' : 'You'}
              </div>
              <p>{message.text}</p>
            </div>
          </article>
        ))}
        {busy ? (
          <div className="chat-typing">
            <span />
            <span />
            <span />
          </div>
        ) : null}
        <div className="chat-tip">
          <vscode-icon name="lightbulb" size={16} />
          <span>
            <strong>Tip:</strong> Have another task? Start a new session to run multiple agents at
            once.
          </span>
        </div>
      </div>

      <div className="chat-composer">
        <textarea
          className="chat-input"
          rows={2}
          placeholder="Chat with the template…"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              send()
            }
          }}
          aria-label="Chat message"
        />
        <div className="chat-composer-footer">
          <div className="chat-composer-tools">
            <button
              type="button"
              className="icon-text-button"
              onClick={() => notify('Attach context is a mock action')}
            >
              <vscode-icon name="add" size={14} />
            </button>
            <button
              type="button"
              className="icon-text-button"
              onClick={() => notify('Agent picker is a mock action')}
            >
              <vscode-icon name="sparkle" size={14} />
              <span>Agent</span>
            </button>
            <button
              type="button"
              className="icon-text-button"
              onClick={() => notify('Model picker is a mock action')}
            >
              <span>Models</span>
            </button>
          </div>
          <div className="chat-composer-tools">
            <button
              type="button"
              className="icon-text-button"
              onClick={() => notify('Voice input is a mock action')}
            >
              <vscode-icon name="mic" size={14} />
            </button>
            <button
              type="button"
              className={`chat-send ${draft.trim() ? 'is-ready' : ''}`}
              disabled={!draft.trim() || busy}
              onClick={send}
              aria-label="Send message"
            >
              <vscode-icon name="send" size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
