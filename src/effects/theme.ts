const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Whether the system asks for a dark page.
 *
 * @effects media query
 */
export const systemPrefersDark = (): boolean => window.matchMedia(DARK_QUERY).matches;

/**
 * The page shown dark or light.
 *
 * @effects DOM
 */
export function showDark(dark: boolean): void {
  document.documentElement.classList.toggle("dark", dark);
}

/**
 * The page in the classic look or the sticker chart.
 *
 * @effects DOM
 */
export function showClassic(classic: boolean): void {
  document.documentElement.classList.toggle("classic", classic);
}

/**
 * `listener` called each time the system's preference changes, until the returned function is called.
 *
 * @effects media query
 */
export function onSystemThemeChange(listener: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}
