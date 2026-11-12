import type { ViewDefinition } from '../types'

/** All configured ids that the registry knows, in configuration order. */
export function configuredViews(
  views: Record<string, ViewDefinition>,
  configuredIds: string[],
): ViewDefinition[] {
  return configuredIds
    .map((id) => views[id])
    .filter((definition): definition is ViewDefinition => Boolean(definition))
}

/** The active view, falling back to the first configured view that exists. */
export function resolveActiveView(
  views: Record<string, ViewDefinition>,
  configuredIds: string[],
  activeId: string,
): ViewDefinition | undefined {
  return views[activeId] ?? configuredViews(views, configuredIds)[0]
}
