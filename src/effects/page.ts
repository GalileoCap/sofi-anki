/**
 * The page's origin and path, which a share link starts with.
 *
 * @effects location
 */
export const pageBase = (): string => `${location.origin}${location.pathname}`;

/**
 * The page's hash, where a share link carries its deck.
 *
 * @effects location
 */
export const pageHash = (): string => location.hash;

/**
 * The hash removed from the address, without a new history entry.
 *
 * @effects location, history
 */
export function clearHash(): void {
  history.replaceState(null, "", `${location.pathname}${location.search}`);
}

/**
 * Calls `listener` each time the page's hash changes, as when a share link is pasted into a tab
 * that has the app open. Returns the function that stops it.
 *
 * @effects window event listener
 */
export function onHashChange(listener: () => void): () => void {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}
