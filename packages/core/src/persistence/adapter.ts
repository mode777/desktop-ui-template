/**
 * The storage seam for versioned persistence.
 *
 * Core never touches `localStorage`, `sessionStorage` or any other concrete
 * store; callers inject an adapter so the same helpers work in the browser, in
 * tests and on a server.
 */

export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem?(key: string): void
}
