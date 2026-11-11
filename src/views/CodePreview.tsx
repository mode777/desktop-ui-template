const TOKEN_PATTERN =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|<\/?[A-Za-z][\w.-]*|\b(?:import|export|from|default|const|let|var|function|return|if|else|for|of|in|new|interface|type|extends|implements|class|async|await|public|private|protected|readonly|true|false|null|undefined|this|typeof|as|enum|switch|case|break|continue|try|catch|finally|throw)\b|\b\d+(?:\.\d+)?\b)/g

const TOKEN_TEST = new RegExp(`^(?:${TOKEN_PATTERN.source})$`)

function tokenClass(token: string): string {
  if (token.startsWith('//') || token.startsWith('/*')) return 'tok-comment'
  if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) return 'tok-string'
  if (token.startsWith('<')) return 'tok-tag'
  if (/^\d/.test(token)) return 'tok-number'
  return 'tok-keyword'
}

function tokenize(line: string) {
  const parts = line.split(TOKEN_PATTERN)
  return parts.map((part, index) =>
    TOKEN_TEST.test(part) ? (
      <span className={tokenClass(part)} key={index}>
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    ),
  )
}

interface CodePreviewProps {
  content: string
  language: string
}

export function CodePreview({ content, language }: CodePreviewProps) {
  const lines = content.replace(/\n$/, '').split('\n')

  return (
    <div className={`code-preview language-${language}`}>
      {lines.map((line, index) => (
        <div className="code-line" key={index}>
          <span className="line-number" aria-hidden="true">
            {index + 1}
          </span>
          <span className="line-content">{tokenize(line)}</span>
        </div>
      ))}
    </div>
  )
}
