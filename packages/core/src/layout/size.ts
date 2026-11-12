/**
 * Size math for resizable workbench regions.
 *
 * Pure functions with no configuration of their own: the caller supplies the
 * bounds. This module must stay free of React, the DOM, application config and
 * module-level state so it can be used headlessly.
 */

export function clampSize(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
