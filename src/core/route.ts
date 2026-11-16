import { Result } from "neverthrow";

import { SHARE_PREFIX } from "@/core/share";

/** A screen a person can return to by its address. A run's cards live in memory, so its address names only where it began. */
export type Route =
  | { readonly kind: "home" }
  | { readonly kind: "stats" }
  | { readonly kind: "deck"; readonly deckId: string }
  | { readonly kind: "deckStats"; readonly deckId: string }
  | { readonly kind: "study"; readonly deckId: string | null }
  | { readonly kind: "share"; readonly encoded: string };

const HOME: Route = { kind: "home" };

const decodePart = Result.fromThrowable(decodeURIComponent, () => null);

/** The hash that opens `route`: empty for home, else `#/` and its parts. */
export function routeHash(route: Route): string {
  switch (route.kind) {
    case "home":
      return "";
    case "stats":
      return "#/stats";
    case "deck":
      return `#/deck/${encodeURIComponent(route.deckId)}`;
    case "deckStats":
      return `#/deck/${encodeURIComponent(route.deckId)}/stats`;
    case "study":
      return route.deckId === null ? "#/study" : `#/deck/${encodeURIComponent(route.deckId)}/study`;
    case "share":
      return `${SHARE_PREFIX}${route.encoded}`;
  }
}

/** The screen a page's hash opens. A hash the app does not know opens home. */
export function parseRoute(hash: string): Route {
  if (hash.startsWith(SHARE_PREFIX)) {
    const encoded = hash.slice(SHARE_PREFIX.length);
    return encoded === "" ? HOME : { kind: "share", encoded };
  }
  const parts = hash.replace(/^#\/?/, "").split("/");
  if (parts.length === 1 && parts[0] === "stats") return { kind: "stats" };
  if (parts.length === 1 && parts[0] === "study") return { kind: "study", deckId: null };
  if (parts[0] !== "deck" || parts.length < 2 || parts.length > 3 || parts[1] === "") return HOME;
  const deckId = decodePart(parts[1]).unwrapOr(null);
  if (deckId === null) return HOME;
  if (parts.length === 2) return { kind: "deck", deckId };
  if (parts[2] === "stats") return { kind: "deckStats", deckId };
  if (parts[2] === "study") return { kind: "study", deckId };
  return HOME;
}
