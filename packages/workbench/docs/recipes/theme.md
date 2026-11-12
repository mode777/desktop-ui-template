# Theme the workbench

Themes are token overrides. Do not hard-code colors in components or application
views; override the `--vscode-*` and `--app-*` custom properties instead.

## Prerequisites

- The application imports `tokens.css`.
- The document element carries `data-theme="dark"` or `data-theme="light"`.
  The preset sets and persists it for you.

## Files

```text
src/
  main.tsx
  theme.css
```

## 1. Add a theme override file

```css
/* src/theme.css */
:root[data-theme='dark'] {
  --vscode-activityBar-background: #0f1720;
  --vscode-titleBar-activeBackground: #0f1720;
  --vscode-statusBar-background: #0f1720;
  --vscode-editor-background: #111827;
  --vscode-sideBar-background: #0f1720;
  --vscode-focusBorder: #38bdf8;
  --vscode-tab-activeBorderTop: #38bdf8;
  --vscode-activityBarBadge-background: #38bdf8;
}

:root[data-theme='light'] {
  --vscode-activityBar-background: #f1f5f9;
  --vscode-titleBar-activeBackground: #f1f5f9;
  --vscode-statusBar-background: #f1f5f9;
  --vscode-editor-background: #ffffff;
  --vscode-sideBar-background: #f8fafc;
  --vscode-focusBorder: #0284c7;
  --vscode-tab-activeBorderTop: #0284c7;
  --vscode-activityBarBadge-background: #0284c7;
}
```

Only override the tokens you want to change. Every other value continues to come
from the package.

## 2. Import the override after tokens

```ts
// src/main.tsx
import 'vscode-workbench/styles/tokens.css'
import './theme.css'
import 'vscode-workbench/styles/global.css'
import 'vscode-workbench/styles/workbench.css'
```

The order matters: tokens define the defaults, your file overrides them, and the
base and component styles consume the result.

## 3. Use the preset theme state

```tsx
import { useWorkbenchStore } from 'vscode-workbench'

export function ThemeToggle() {
  const theme = useWorkbenchStore((state) => state.theme)
  const toggleTheme = useWorkbenchStore((state) => state.toggleTheme)

  return (
    <button type="button" onClick={toggleTheme}>
      Theme: {theme}
    </button>
  )
}
```

The preset writes `data-theme` to the document element and persists the chosen
theme under `desktop-ui-template:v1`. Reloading keeps the choice.

## 4. Add a third theme

The preset's `Theme` type is `'dark' | 'light'`. To add a third theme, own the
theme state at the composition level and set the attribute yourself:

```ts
document.documentElement.dataset.theme = 'ocean'
```

Then add a matching `:root[data-theme='ocean']` block to `theme.css`. You also own
persisting that value. Do not pass an unknown string to the preset store.

## Verify

```bash
npm run build
```

Then confirm:

- Both themes render with the intended colors.
- Toggling the theme updates the whole shell, including custom-element shadow
  roots.
- Reloading keeps the chosen theme.
- No component or view contains a raw color value introduced by this change.

## Common failures

| Symptom                          | Cause                                          | Fix                                             |
| -------------------------------- | ---------------------------------------------- | ----------------------------------------------- |
| Overrides do nothing             | `theme.css` is imported before `tokens.css`    | Import tokens first, then the override          |
| Only some regions change         | The component uses a different token           | Override the token the component actually reads |
| Theme resets on reload           | You set `data-theme` without persisting it     | Use the preset store or persist your own value  |
| A custom theme name does nothing | The preset only understands `dark` and `light` | Own the theme state at composition level        |

See the [style entries](../reference/styles.md) for the token and component
stylesheet list.
