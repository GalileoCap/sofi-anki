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

/** The address of the page with `hash` in place of its own. */
const withHash = (hash: string): string => `${location.pathname}${location.search}${hash}`;

/**
 * A new history entry at `hash`, which remembers the hash it was opened from, scrolled to the top.
 * The browser keeps the entry left behind at its scroll, for the back button. Nothing when the page is already there.
 *
 * @effects location, history, scroll
 */
export function openHash(hash: string): void {
  if (hash === location.hash) return;
  history.pushState({ from: location.hash }, "", withHash(hash));
  window.scrollTo(0, 0);
}

/**
 * The current history entry moved to `hash`, without a new one.
 *
 * @effects location, history
 */
export function replaceHash(hash: string): void {
  history.replaceState(history.state, "", withHash(hash));
}

/**
 * Goes back to `hash`: through history when this entry was opened from there, so the browser's
 * back and forward stay in step with the app's, else by moving this entry there.
 *
 * @effects location, history
 */
export function backTo(hash: string): void {
  const state: unknown = history.state;
  const from = typeof state === "object" && state !== null && "from" in state ? state.from : null;
  if (from === hash) history.back();
  else replaceHash(hash);
}

/**
 * Calls `listener` each time the page's hash changes: back, forward, an address typed in, or a
 * share link pasted into a tab that has the app open. Returns the function that stops it.
 *
 * @effects window event listener
 */
export function onHashChange(listener: () => void): () => void {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}

/**
 * The page's language, so a screen reader speaks its text in that language.
 *
 * @effects DOM
 */
export function showLang(lang: string): void {
  document.documentElement.lang = lang;
}

/**
 * The tab's title, which a bookmark takes as its name.
 *
 * @effects DOM
 */
export function showTitle(title: string): void {
  document.title = title;
}
